/**
 * ENOQ SDK - Client (P3.1)
 *
 * Thin wrapper over enoqCore. Three functions: mail, relation, decision.
 * No logic - just input/output packaging + type safety.
 *
 * Usage:
 *   import { mail, relation, decision } from '@enoq/sdk';
 *   const result = await mail({ recipient: '...', context: '...', intent: '...' });
 */

import { createCoreSession, permit } from '../../core/pipeline/orchestrator';
import { callLLM, checkLLMAvailability } from '../../operational/providers/llm_provider';
import { checkCompliance } from '../../gate/verification/content_compliance';
import {
  createAuditContext,
  auditPipelineStart,
  auditPipelineEnd,
  auditBoundaryBlocked,
  auditRubiconWithdraw,
} from './audit';

import {
  MailInput,
  MailOutput,
  MailDraft,
  MailResult,
  RelationInput,
  RelationOutput,
  RelationResult,
  DecisionInput,
  DecisionOutput,
  DecisionOption,
  DecisionResult,
  SDKOptions,
  PipelineSignal,
  ComplianceFlags,
  Language,
} from './types';

// ============================================
// INTERNAL HELPERS
// ============================================

function checkAvailability(): void {
  const status = checkLLMAvailability();
  if (!status.available) {
    throw new Error('No LLM available. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
  }
}

function buildComplianceFlags(text: string, lang: Language): ComplianceFlags {
  const result = checkCompliance(text, lang);
  return {
    passed: result.passed,
    hasNormative: result.violations.some(v => v.category === 'NORMATIVE'),
    hasRanking: result.violations.some(v => v.category === 'RANKING'),
    hasEngagement: result.violations.some(v => v.category === 'ENGAGEMENT'),
    hasPersuasion: result.violations.some(v => v.category === 'PERSUASION'),
  };
}

// ============================================
// MAIL
// ============================================

function buildMailPrompt(input: MailInput): string {
  let prompt = `Draft 2-3 alternative emails for this situation.

RECIPIENT: ${input.recipient}
CONTEXT: ${input.context}
INTENT: ${input.intent}`;

  if (input.constraints && input.constraints.length > 0) {
    prompt += `\nCONSTRAINTS: ${input.constraints.join('; ')}`;
  }

  prompt += `

RULES:
- Produce exactly 2-3 distinct draft options
- Each draft has a subject line and body
- Keep drafts concise (3-5 sentences each)
- No ranking or recommendation of which is "best"
- No persuasion or manipulation language
- Vary tone/approach across drafts (e.g., direct, warm, formal)

FORMAT your response EXACTLY like this:
---
DRAFT A
Subject: [subject]
Body: [body]

DRAFT B
Subject: [subject]
Body: [body]

DRAFT C (optional)
Subject: [subject]
Body: [body]

RATIONALE: [1-2 sentences explaining how the drafts differ, without recommending one]
---`;

  return prompt;
}

function parseMailOutput(output: string): { parsed: MailOutput; rationale: string } {
  const drafts: MailDraft[] = [];
  let rationale = '';

  const draftRegex = /DRAFT\s+([A-C])\s*\n\s*Subject:\s*(.+?)\s*\n\s*Body:\s*([\s\S]+?)(?=(?:DRAFT|RATIONALE|$))/gi;
  let match;

  while ((match = draftRegex.exec(output)) !== null) {
    drafts.push({
      id: match[1].toUpperCase(),
      subject: match[2].trim(),
      body: match[3].trim(),
    });
  }

  const rationaleMatch = output.match(/RATIONALE:\s*([\s\S]+?)(?:---|$)/i);
  if (rationaleMatch) {
    rationale = rationaleMatch[1].trim();
  }

  if (drafts.length === 0) {
    drafts.push({
      id: 'A',
      subject: '(parsing failed)',
      body: output,
    });
    rationale = 'Output did not match expected format.';
  }

  return { parsed: { drafts, rationale }, rationale };
}

/**
 * Draft 2-3 email options for a difficult situation.
 * No ranking. No recommendations. STOP after output.
 */
export async function mail(input: MailInput, opts: SDKOptions = {}): Promise<MailResult> {
  checkAvailability();

  const lang = opts.language ?? input.language ?? 'en';
  const prompt = buildMailPrompt(input);
  const session = createCoreSession();
  const signals: PipelineSignal[] = [];

  // Audit context
  const audit = createAuditContext('MAIL', session.session_id);
  await auditPipelineStart(audit, { input_length: prompt.length });

  try {
    // PERMIT
    signals.push('PERMIT');
    const boundaryDecision = permit(prompt, {
      session_id: session.session_id,
      turn_number: 0,
    });

    if (!boundaryDecision.permitted) {
      await auditBoundaryBlocked(audit, 'boundary_classification');
      throw new Error('Input blocked by boundary classification.');
    }

    // ACT
    signals.push('ACT');
    const llmResponse = await callLLM({
      messages: [
        {
          role: 'system',
          content: `You are an email drafting assistant. You produce 2-3 alternative email drafts.
Rules:
- No ranking or recommendation of which draft is "best"
- No persuasion or manipulation language
- Vary the tone across drafts (direct, warm, formal)
- Keep each draft concise (3-5 sentences)`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const raw = llmResponse.content;

    // VERIFY
    signals.push('VERIFY');
    if (!raw || raw.trim().length === 0) {
      await auditPipelineEnd(audit, 'ERROR', { reason: 'empty_output' });
      throw new Error('Empty output from LLM.');
    }

    const compliance = buildComplianceFlags(raw, lang);

    // STOP
    signals.push('STOP');

    const { parsed, rationale } = parseMailOutput(raw);

    // Audit success
    await auditPipelineEnd(audit, 'PASS', { output_length: raw.length });

    return {
      output: parsed,
      rationale,
      signals,
      stop: true,
      compliance,
      ...(opts.includeRaw ? { raw } : {}),
    };
  } catch (err) {
    // Audit error (if not already audited)
    if (err instanceof Error && !err.message.includes('blocked')) {
      await auditPipelineEnd(audit, 'ERROR', { error: err.message });
    }
    throw err;
  }
}

// ============================================
// RELATION
// ============================================

function buildRelationPrompt(input: RelationInput): string {
  return `Map this relationship. Descriptive only. No advice. No strategy.

PERSON A (self): ${input.personA}
PERSON B (other): ${input.personB}
CONTEXT: ${input.context}
CURRENT TENSION: ${input.tension}
BOUNDARY (must not cross): ${input.boundary}

RULES:
- Describe roles, not prescribe actions
- No coaching or therapy language
- No "you should" or "try to"
- No framing B as the problem
- No manipulation or persuasion framing
- If advice would cross boundary, OMIT it

OUTPUT FORMAT (use exactly):
---
ROLE MAP
A occupies: [descriptive role]
B occupies: [descriptive role]

TENSION AXES
- [axis 1]
- [axis 2]
- [axis 3 if relevant]

BOUNDARY LINES
A controls: [your choices/actions]
A does not control: [B's states/reactions]
Responsibility returns to: A (your agency)
B owns: [their feelings/reactions]

MINIMAL NEXT ACT (optional, omit if risks boundary)
[single descriptive act, not advice]

RATIONALE: [1-2 sentences explaining the map, without advice]
---`;
}

function parseRelationOutput(output: string): { parsed: RelationOutput; rationale: string } {
  const result: RelationOutput = {
    roleMap: { roleA: '', roleB: '' },
    tensionAxes: [],
    boundaryLines: {
      aControls: [],
      aDoesNotControl: [],
      responsibilityReturns: '',
      bOwns: '',
    },
  };

  const roleAMatch = output.match(/A occupies:\s*(.+)/i);
  const roleBMatch = output.match(/B occupies:\s*(.+)/i);
  if (roleAMatch) result.roleMap.roleA = roleAMatch[1].trim();
  if (roleBMatch) result.roleMap.roleB = roleBMatch[1].trim();

  const tensionSection = output.match(/TENSION AXES\s*([\s\S]*?)(?=BOUNDARY LINES|$)/i);
  if (tensionSection) {
    const axes = tensionSection[1].match(/[-•]\s*(.+)/g);
    if (axes) {
      result.tensionAxes = axes.map(a => a.replace(/^[-•]\s*/, '').trim());
    }
  }

  const controlsMatch = output.match(/A controls:\s*(.+)/i);
  const notControlsMatch = output.match(/A does not control:\s*(.+)/i);
  const responsibilityMatch = output.match(/Responsibility returns to:\s*(.+)/i);
  const bOwnsMatch = output.match(/B owns:\s*(.+)/i);

  if (controlsMatch) {
    result.boundaryLines.aControls = controlsMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }
  if (notControlsMatch) {
    result.boundaryLines.aDoesNotControl = notControlsMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }
  if (responsibilityMatch) {
    result.boundaryLines.responsibilityReturns = responsibilityMatch[1].trim();
  }
  if (bOwnsMatch) {
    result.boundaryLines.bOwns = bOwnsMatch[1].trim();
  }

  const nextActMatch = output.match(/MINIMAL NEXT ACT[^-\n]*\n([^-\n]+)/i);
  if (nextActMatch && nextActMatch[1].trim() && !nextActMatch[1].toLowerCase().includes('omit')) {
    result.minimalNextAct = nextActMatch[1].trim();
  }

  let rationale = '';
  const rationaleMatch = output.match(/RATIONALE:\s*([\s\S]+?)(?:---|$)/i);
  if (rationaleMatch) {
    rationale = rationaleMatch[1].trim();
  }

  return { parsed: result, rationale };
}

/**
 * Map a human relationship. No coaching. No advice.
 * Descriptive only. STOP after output.
 */
export async function relation(input: RelationInput, opts: SDKOptions = {}): Promise<RelationResult> {
  checkAvailability();

  const lang = opts.language ?? input.language ?? 'en';
  const prompt = buildRelationPrompt(input);
  const session = createCoreSession();
  const signals: PipelineSignal[] = [];

  // Audit context
  const audit = createAuditContext('RELATION', session.session_id);
  await auditPipelineStart(audit, { input_length: prompt.length });

  try {
    // PERMIT
    signals.push('PERMIT');
    const boundaryDecision = permit(prompt, {
      session_id: session.session_id,
      turn_number: 0,
    });

    if (!boundaryDecision.permitted) {
      await auditBoundaryBlocked(audit, 'boundary_classification');
      throw new Error('Input blocked by boundary classification.');
    }

    // ACT
    signals.push('ACT');
    const llmResponse = await callLLM({
      messages: [
        {
          role: 'system',
          content: `You map human relationships. Descriptive only.

RULES:
- No coaching, therapy, or advice
- No "you should" or "try to"
- No framing either person as problem
- No manipulation or strategy language
- Describe roles and tensions neutrally
- If next act risks boundary, OMIT it
- Keep output structured and brief`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const raw = llmResponse.content;

    // VERIFY
    signals.push('VERIFY');
    if (!raw || raw.trim().length === 0) {
      await auditPipelineEnd(audit, 'ERROR', { reason: 'empty_output' });
      throw new Error('Empty output from LLM.');
    }

    const compliance = buildComplianceFlags(raw, lang);

    // STOP
    signals.push('STOP');

    const { parsed, rationale } = parseRelationOutput(raw);

    // Audit success
    await auditPipelineEnd(audit, 'PASS', { output_length: raw.length });

    return {
      output: parsed,
      rationale,
      signals,
      stop: true,
      compliance,
      ...(opts.includeRaw ? { raw } : {}),
    };
  } catch (err) {
    if (err instanceof Error && !err.message.includes('blocked')) {
      await auditPipelineEnd(audit, 'ERROR', { error: err.message });
    }
    throw err;
  }
}

// ============================================
// DECISION
// ============================================

function buildDecisionPrompt(input: DecisionInput): string {
  let prompt = `Clarify this decision. Do NOT recommend, rank, or choose.

DECISION: ${input.statement}
CONTEXT: ${input.context}`;

  if (input.constraints && input.constraints.length > 0) {
    prompt += `\nNON-NEGOTIABLES: ${input.constraints.join('; ')}`;
  }
  if (input.timeHorizon) {
    prompt += `\nTIME HORIZON: ${input.timeHorizon}`;
  }
  if (input.riskTolerance) {
    prompt += `\nRISK TOLERANCE: ${input.riskTolerance}`;
  }

  prompt += `

RULES:
- Do NOT recommend any option
- Do NOT rank or score options
- Do NOT optimize outcomes
- Do NOT reduce uncertainty artificially
- Detect Rubicon conditions (irreversibility, value-laden threshold)
- If Rubicon detected: state it and withdraw from analysis
- Neutral language only

OUTPUT FORMAT (use exactly):
---
DECISION FRAME
Deciding: [what is being decided, 1-2 lines]
Not deciding: [what is NOT being decided]

OPTIONS SPACE
Option A: [neutral description]
Option B: [neutral description]
Option C: [if relevant, neutral description]

TRADEOFFS
Option A - Upside: [one upside] | Downside: [one downside]
Option B - Upside: [one upside] | Downside: [one downside]
Option C - Upside: [one upside] | Downside: [one downside]

RUBICON CHECK
[If irreversible or value-laden threshold detected:]
"This choice crosses a personal threshold. ENOQ withdraws from choosing."
[If reversible:]
"This remains a reversible decision."

OWNERSHIP
Decision ownership remains with you.

RATIONALE: [1-2 sentences explaining the frame, without recommendation]
---`;

  return prompt;
}

function parseDecisionOutput(output: string): { parsed: DecisionOutput; rationale: string } {
  const result: DecisionOutput = {
    frame: { deciding: '', notDeciding: '' },
    options: [],
    rubiconDetected: false,
    rubiconStatement: '',
  };

  const decidingMatch = output.match(/Deciding:\s*(.+)/i);
  const notDecidingMatch = output.match(/Not deciding:\s*(.+)/i);
  if (decidingMatch) result.frame.deciding = decidingMatch[1].trim();
  if (notDecidingMatch) result.frame.notDeciding = notDecidingMatch[1].trim();

  const optionMatches = output.matchAll(/Option\s+([A-C]):\s*(.+)/gi);
  for (const match of optionMatches) {
    const id = match[1].toUpperCase();
    const description = match[2].trim();

    const tradeoffMatch = output.match(
      new RegExp(`Option\\s+${id}\\s*[-–]\\s*Upside:\\s*(.+?)\\s*\\|\\s*Downside:\\s*(.+)`, 'i')
    );

    result.options.push({
      id,
      description,
      upside: tradeoffMatch ? tradeoffMatch[1].trim() : '',
      downside: tradeoffMatch ? tradeoffMatch[2].trim() : '',
    });
  }

  const rubiconSection = output.match(/RUBICON CHECK\s*([\s\S]*?)(?=OWNERSHIP|RATIONALE|$)/i);
  if (rubiconSection) {
    const rubiconText = rubiconSection[1].trim();
    result.rubiconDetected = rubiconText.toLowerCase().includes('crosses') ||
                             rubiconText.toLowerCase().includes('threshold') ||
                             rubiconText.toLowerCase().includes('withdraws');
    result.rubiconStatement = rubiconText.replace(/^["']|["']$/g, '').trim();
  }

  let rationale = '';
  const rationaleMatch = output.match(/RATIONALE:\s*([\s\S]+?)(?:---|$)/i);
  if (rationaleMatch) {
    rationale = rationaleMatch[1].trim();
  }

  return { parsed: result, rationale };
}

/**
 * Clarify a decision. No recommendations. No ranking.
 * If Rubicon detected, ENOQ withdraws. STOP after output.
 */
export async function decision(input: DecisionInput, opts: SDKOptions = {}): Promise<DecisionResult> {
  checkAvailability();

  const lang = opts.language ?? input.language ?? 'en';
  const prompt = buildDecisionPrompt(input);
  const session = createCoreSession();
  const signals: PipelineSignal[] = [];

  // Audit context
  const audit = createAuditContext('DECISION', session.session_id);
  await auditPipelineStart(audit, { input_length: prompt.length });

  try {
    // PERMIT
    signals.push('PERMIT');
    const boundaryDecision = permit(prompt, {
      session_id: session.session_id,
      turn_number: 0,
    });

    if (!boundaryDecision.permitted) {
      await auditBoundaryBlocked(audit, 'boundary_classification');
      throw new Error('Input blocked by boundary classification.');
    }

    // ACT
    signals.push('ACT');
    const llmResponse = await callLLM({
      messages: [
        {
          role: 'system',
          content: `You clarify decisions. You do NOT recommend, rank, optimize, or choose.

RULES:
- No recommendations or rankings
- No optimization language
- No persuasion or nudging
- Neutral descriptions only
- Detect Rubicon (irreversibility, value threshold)
- If Rubicon: state it and withdraw
- Keep output structured`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 900,
    });

    const raw = llmResponse.content;

    // VERIFY
    signals.push('VERIFY');
    if (!raw || raw.trim().length === 0) {
      await auditPipelineEnd(audit, 'ERROR', { reason: 'empty_output' });
      throw new Error('Empty output from LLM.');
    }

    const compliance = buildComplianceFlags(raw, lang);

    // STOP
    signals.push('STOP');

    const { parsed, rationale } = parseDecisionOutput(raw);

    // Audit Rubicon if detected
    if (parsed.rubiconDetected) {
      await auditRubiconWithdraw(audit, 'decision');
      await auditPipelineEnd(audit, 'WITHDRAW', { rubicon: true });
    } else {
      await auditPipelineEnd(audit, 'PASS', { output_length: raw.length });
    }

    return {
      output: parsed,
      rationale,
      signals,
      stop: true,
      compliance,
      ...(opts.includeRaw ? { raw } : {}),
    };
  } catch (err) {
    if (err instanceof Error && !err.message.includes('blocked')) {
      await auditPipelineEnd(audit, 'ERROR', { error: err.message });
    }
    throw err;
  }
}
