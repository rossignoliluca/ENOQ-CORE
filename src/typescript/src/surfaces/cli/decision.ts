#!/usr/bin/env npx ts-node

/**
 * ENOQ DECISION - Third Traversal
 *
 * Clarifies a decision. No recommendation. No optimization. No choosing.
 * If Rubicon detected, ENOQ withdraws.
 *
 * Usage:
 *   npx ts-node src/surfaces/cli/decision.ts
 *
 * This is NOT advice. NOT optimization. NOT persuasion.
 */

import {
  createCoreSession,
  permit,
} from '../../core/pipeline/orchestrator';
import { callLLM, checkLLMAvailability } from '../../operational/providers/llm_provider';
import * as readline from 'readline';

// ============================================
// TYPES
// ============================================

interface DecisionInput {
  statement: string;
  context: string;
  constraints: string[];
  timeHorizon?: string;
  riskTolerance?: string;
}

interface DecisionOption {
  id: string;
  description: string;
  upside: string;
  downside: string;
}

interface DecisionOutput {
  frame: {
    deciding: string;
    notDeciding: string;
  };
  options: DecisionOption[];
  rubiconDetected: boolean;
  rubiconStatement: string;
}

// ============================================
// INPUT COLLECTION
// ============================================

async function collectInput(): Promise<DecisionInput> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  };

  console.log('\n');
  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│                     ENOQ DECISION                          │');
  console.log('│                                                            │');
  console.log('│  Clarify a decision. No recommendations. No choosing.     │');
  console.log('│  If Rubicon detected, ENOQ withdraws. STOP after output.   │');
  console.log('└────────────────────────────────────────────────────────────┘');
  console.log('');

  const statement = await question('  Decision to clarify: ');
  if (!statement) {
    console.log('\n  STOP: No decision provided.\n');
    rl.close();
    process.exit(0);
  }

  const context = await question('  Context (work/personal/other): ');
  if (!context) {
    console.log('\n  STOP: No context provided.\n');
    rl.close();
    process.exit(0);
  }

  const constraintsRaw = await question('  Non-negotiables (comma-separated): ');
  const constraints = constraintsRaw
    ? constraintsRaw.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  const timeHorizon = await question('  Time horizon (optional): ');
  const riskTolerance = await question('  Risk tolerance (optional, descriptive): ');

  rl.close();

  return {
    statement,
    context,
    constraints,
    timeHorizon: timeHorizon || undefined,
    riskTolerance: riskTolerance || undefined,
  };
}

// ============================================
// DECISION PROMPT BUILDER
// ============================================

function buildDecisionPrompt(input: DecisionInput): string {
  let prompt = `Clarify this decision. Do NOT recommend, rank, or choose.

DECISION: ${input.statement}
CONTEXT: ${input.context}`;

  if (input.constraints.length > 0) {
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
---`;

  return prompt;
}

// ============================================
// OUTPUT PARSER
// ============================================

function parseDecisionOutput(output: string): DecisionOutput {
  const result: DecisionOutput = {
    frame: { deciding: '', notDeciding: '' },
    options: [],
    rubiconDetected: false,
    rubiconStatement: '',
  };

  // Parse Decision Frame
  const decidingMatch = output.match(/Deciding:\s*(.+)/i);
  const notDecidingMatch = output.match(/Not deciding:\s*(.+)/i);
  if (decidingMatch) result.frame.deciding = decidingMatch[1].trim();
  if (notDecidingMatch) result.frame.notDeciding = notDecidingMatch[1].trim();

  // Parse Options
  const optionMatches = output.matchAll(/Option\s+([A-C]):\s*(.+)/gi);
  for (const match of optionMatches) {
    const id = match[1].toUpperCase();
    const description = match[2].trim();

    // Find corresponding tradeoff
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

  // Parse Rubicon Check
  const rubiconSection = output.match(/RUBICON CHECK\s*([\s\S]*?)(?=OWNERSHIP|$)/i);
  if (rubiconSection) {
    const rubiconText = rubiconSection[1].trim();
    result.rubiconDetected = rubiconText.toLowerCase().includes('crosses') ||
                             rubiconText.toLowerCase().includes('threshold') ||
                             rubiconText.toLowerCase().includes('withdraws');
    result.rubiconStatement = rubiconText.replace(/^["']|["']$/g, '').trim();
  }

  return result;
}

// ============================================
// OUTPUT DISPLAY
// ============================================

function displayOutput(parsed: DecisionOutput, signals: string[]) {
  console.log('\n');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('                     DECISION CLARITY                            ');
  console.log('════════════════════════════════════════════════════════════════');

  // Decision Frame
  console.log('');
  console.log('┌─── DECISION FRAME ─────────────────────────────────────────────┐');
  console.log(`│ Deciding: ${parsed.frame.deciding || '(not parsed)'}`);
  console.log(`│ Not deciding: ${parsed.frame.notDeciding || '(not parsed)'}`);
  console.log('└────────────────────────────────────────────────────────────────┘');

  // Options Space
  console.log('');
  console.log('┌─── OPTIONS SPACE ──────────────────────────────────────────────┐');
  if (parsed.options.length > 0) {
    for (const opt of parsed.options) {
      console.log(`│ ${opt.id}: ${opt.description}`);
    }
  } else {
    console.log('│ (no options parsed)');
  }
  console.log('└────────────────────────────────────────────────────────────────┘');

  // Tradeoffs
  console.log('');
  console.log('┌─── TRADEOFFS ──────────────────────────────────────────────────┐');
  if (parsed.options.length > 0) {
    for (const opt of parsed.options) {
      console.log(`│ ${opt.id} ↑ ${opt.upside || '(none)'}`);
      console.log(`│ ${opt.id} ↓ ${opt.downside || '(none)'}`);
    }
  } else {
    console.log('│ (no tradeoffs parsed)');
  }
  console.log('└────────────────────────────────────────────────────────────────┘');

  // Rubicon Check
  console.log('');
  if (parsed.rubiconDetected) {
    console.log('┌─── RUBICON ══════════════════════════════════════════════════┐');
    console.log('│ ⚠ This choice crosses a personal threshold.');
    console.log('│ ENOQ WITHDRAWS from choosing.');
    console.log('└══════════════════════════════════════════════════════════════┘');
  } else {
    console.log('┌─── RUBICON CHECK ─────────────────────────────────────────────┐');
    console.log('│ This remains a reversible decision.');
    console.log('└────────────────────────────────────────────────────────────────┘');
  }

  // Ownership
  console.log('');
  console.log('┌─── OWNERSHIP ──────────────────────────────────────────────────┐');
  console.log('│ Decision ownership remains with you.');
  console.log('└────────────────────────────────────────────────────────────────┘');

  console.log('');
  console.log('────────────────────────────────────────────────────────────────');
  console.log('PIPELINE: ' + signals.join(' → '));
  console.log('────────────────────────────────────────────────────────────────');
}

// ============================================
// MAIN
// ============================================

async function main() {
  // Check LLM availability
  const llmStatus = checkLLMAvailability();
  if (!llmStatus.available) {
    console.log('\n  ERROR: No LLM available.');
    console.log('  Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    console.log('  STOP.\n');
    process.exit(1);
  }

  // Collect input
  const input = await collectInput();

  console.log('\n  Clarifying through ENOQ geometry...\n');

  // Build decision prompt
  const prompt = buildDecisionPrompt(input);

  // Create session for context
  const session = createCoreSession();
  const pipelineStates: string[] = [];

  try {
    // ========================================
    // PERMIT - Boundary classification
    // ========================================
    pipelineStates.push('PERMIT');
    const boundaryDecision = permit(prompt, {
      session_id: session.session_id,
      turn_number: 0,
    });

    if (!boundaryDecision.permitted) {
      console.log('  BLOCKED by boundary. STOP.\n');
      process.exit(1);
    }

    // ========================================
    // ACT - Direct LLM call (FAST PATH)
    // ========================================
    pipelineStates.push('ACT');
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
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 900,
    });

    const output = llmResponse.content;

    // ========================================
    // VERIFY - Output exists
    // ========================================
    pipelineStates.push('VERIFY');
    if (!output || output.trim().length === 0) {
      console.log('  EMPTY output. STOP.\n');
      process.exit(1);
    }

    // ========================================
    // STOP
    // ========================================
    pipelineStates.push('STOP');

    // Parse and display
    const parsed = parseDecisionOutput(output);
    displayOutput(parsed, pipelineStates);

  } catch (error) {
    console.error('\n  ERROR:', error);
    console.log('  STOP.\n');
    process.exit(1);
  }

  // STOP - mandatory, no follow-up
  console.log('════════════════════════════════════════════════════════════════');
  console.log('                            STOP                                 ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  The options are clear. The choice is yours.');
  console.log('  This program does not continue.');
  console.log('');
  process.exit(0);
}

// ============================================
// RUN
// ============================================

main().catch((err) => {
  console.error('\n  FATAL:', err);
  process.exit(1);
});
