/**
 * ENOQ S5 VERIFY
 * 
 * Constitutional enforcement layer.
 * Validates every output before delivery.
 * Implements fallback ladder.
 * Produces audit trail.
 */

import { FieldState, ProtocolSelection, SupportedLanguage } from './types';
import * as crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface GeneratedOutput {
  text: string;
  language: SupportedLanguage | 'mixed';
  word_count: number;
  generation_method: 'template' | 'llm' | 'hybrid';
}

export interface Violation {
  check: string;
  category: 'constraint' | 'constitutional' | 'ownership' | 'safety';
  severity: 'minor' | 'moderate' | 'critical';
  pattern: string;
  detail: string;
}

export type FallbackLevel = 'REGENERATE' | 'MEDIUM' | 'SURFACE' | 'PRESENCE' | 'STOP';

export interface AuditEntry {
  timestamp: string;
  session_id: string;
  turn_number: number;
  input_hash: string;
  field_summary: {
    domains: string[];
    arousal: string;
    flags: string[];
  };
  selection_summary: {
    atmosphere: string;
    mode: string;
    primitive: string;
    forbidden: string[];
    required: string[];
  };
  verification: {
    passed: boolean;
    checks_run: string[];
    violations: {
      check: string;
      severity: string;
      detail: string;
    }[];
  };
  action: {
    type: 'DELIVER' | 'FALLBACK' | 'STOP';
    fallback_level?: string;
    fallback_reason?: string;
  };
  entry_hash: string;
  previous_hash: string;
}

export interface S5Input {
  field: FieldState;
  selection: ProtocolSelection;
  output: GeneratedOutput;
  session_id: string;
  turn_number: number;
  previous_hash: string;
}

export interface S5Result {
  passed: boolean;
  violations: Violation[];
  fallback_required: boolean;
  fallback_level: FallbackLevel | null;
  audit_entry: AuditEntry;
}

// ============================================
// FORBIDDEN PATTERNS
// ============================================

const FORBIDDEN_PATTERNS: Record<string, RegExp[]> = {
  'recommend': [
    /\bi recommend\b/i,
    /\bti consiglio\b/i,
    /\byou should\b/i,
    /\bdovresti\b/i,
    /\bthe best (choice|option|thing)\b/i,
    /\bla scelta migliore\b/i,
    /\bmy advice\b/i,
    /\bil mio consiglio\b/i,
  ],
  'decide_for_user': [
    /\bthe right (choice|decision|thing to do)\b/i,
    /\bla cosa giusta\b/i,
    /\byou need to\b/i,
    /\bdevi\b/i,
    /\bwhat you should do is\b/i,
    /\bquello che devi fare\b/i,
  ],
  'diagnose': [
    /\byou (have|are experiencing|suffer from)\b/i,
    /\bhai (un|una|il|la)\b.*\b(disturbo|sindrome|patologia)\b/i,
    /\bthis (sounds|looks|seems) like\b/i,
    /\bsembra (un caso di|che tu abbia)\b/i,
  ],
  'label': [
    /\byou are (a|an) (narcissist|borderline|depressed|anxious)\b/i,
    /\bsei (un|una) \w+(ista|ico|oso)\b/i,
    /\bthat's (just )?(anxiety|depression|trauma|OCD)\b/i,
  ],
  'give_advice': [
    /\bhere'?s what (you should|to) do\b/i,
    /\becco cosa (devi|dovresti) fare\b/i,
    /\bmy suggestion is\b/i,
  ],
  'answer_what_should': [
    /\bwhat you should do is\b/i,
    /\bdovresti fare così\b/i,
  ],
  'pick_option': [
    /\bgo with (option )?(A|B|the first|the second)\b/i,
    /\bscegli (la prima|la seconda|l'opzione)\b/i,
    /\bi('d| would) (choose|pick|go with)\b/i,
  ],
  'implicit_recommendation': [
    /\bif i were you\b/i,
    /\bse fossi in te\b/i,
    /\bthe obvious choice\b/i,
    /\bchiaramente (dovresti|la cosa)\b/i,
  ],
};

// ============================================
// REQUIRED PATTERNS
// ============================================

const REQUIRED_PATTERNS: Record<string, RegExp[]> = {
  'return_ownership': [
    /\bwhat do you (think|feel|want|choose)\b/i,
    /\bcosa (pensi|senti|vuoi|scegli)\b/i,
    /\byour (choice|decision)\b/i,
    /\btua (scelta|decisione)\b/i,
    /\bthis is yours\b/i,
    /\bquesta è tua\b/i,
    /\bwhat are you (leaning|drawn|inclined)\b/i,
  ],
  'validate_feeling': [
    /\bthat (makes sense|sounds hard|feels)\b/i,
    /\bha senso\b/i,
    /\bi (hear|understand|see) (you|that|what)\b/i,
    /\b(capisco|sento|vedo)\b/i,
    /\bit'?s (understandable|natural|okay)\b/i,
  ],
  'acknowledge_distress': [
    /\bi('m| am) (here|with you)\b/i,
    /\bsono qui\b/i,
    /\bthis is (hard|difficult|painful)\b/i,
    /\bè (difficile|duro|doloroso)\b/i,
  ],
  'offer_grounding': [
    /\b(breathe|breath|breathing)\b/i,
    /\b(respira|respiro)\b/i,
    /\bfeel your (feet|hands|body)\b/i,
    /\bsenti (i piedi|le mani|il corpo)\b/i,
    /\bwhat do you notice\b/i,
    /\bcosa noti\b/i,
  ],
};

// ============================================
// CONSTITUTIONAL INVARIANTS
// ============================================

interface InvariantCheck {
  id: string;
  description: string;
  patterns: RegExp[];
  severity: 'moderate' | 'critical';
}

const CONSTITUTIONAL_INVARIANTS: InvariantCheck[] = [
  {
    id: 'INV-003',
    description: 'No normative delegation',
    patterns: [
      /\bthe right (thing|choice|decision) (is|would be)\b/i,
      /\bla cosa giusta (è|sarebbe)\b/i,
      /\byou should (definitely|clearly|obviously)\b/i,
      /\bdovresti (sicuramente|chiaramente)\b/i,
      /\bthe right thing to do is\b/i,
      /\bwhat you should do is\b/i,
      /\bthe best (choice|option|decision) is\b/i,
      /\byou need to\b/i,
      /\byou must\b/i,
      /\bdevi\b/i,
    ],
    severity: 'critical',
  },
  {
    id: 'INV-009',
    description: 'Rubicon - cannot cross meaning/identity threshold for user',
    patterns: [
      /\byour (purpose|meaning|identity) is\b/i,
      /\bil tuo (scopo|significato|identità) è\b/i,
      /\byou are (meant|destined) to\b/i,
      /\bsei (destinato|fatto) per\b/i,
      /\bwho you (really|truly) are is\b/i,
    ],
    severity: 'critical',
  },
  {
    id: 'INV-011',
    description: 'No diagnosis',
    patterns: [
      /\byou (have|suffer from|are diagnosed with)\b/i,
      /\b(hai|soffri di)\b.*\b(disturbo|sindrome)\b/i,
      /\bthis is (clearly|definitely) (depression|anxiety|PTSD|BPD)\b/i,
    ],
    severity: 'critical',
  },
];

// ============================================
// VERIFICATION FUNCTIONS
// ============================================

function checkForbiddenActions(
  output: string,
  forbidden: string[]
): Violation[] {
  const violations: Violation[] = [];
  
  for (const action of forbidden) {
    const patterns = FORBIDDEN_PATTERNS[action];
    if (!patterns) continue;
    
    for (const pattern of patterns) {
      if (pattern.test(output)) {
        violations.push({
          check: 'forbidden_action',
          category: 'constraint',
          severity: 'moderate',
          pattern: action,
          detail: `Output contains forbidden pattern: ${action}`,
        });
        break; // One violation per action is enough
      }
    }
  }
  
  return violations;
}

function checkRequiredActions(
  output: string,
  required: string[]
): Violation[] {
  const violations: Violation[] = [];
  
  for (const action of required) {
    const patterns = REQUIRED_PATTERNS[action];
    if (!patterns) continue;
    
    const found = patterns.some(pattern => pattern.test(output));
    if (!found) {
      violations.push({
        check: 'required_action',
        category: 'constraint',
        severity: 'moderate',
        pattern: action,
        detail: `Output missing required element: ${action}`,
      });
    }
  }
  
  return violations;
}

function checkConstitutionalInvariants(output: string): Violation[] {
  const violations: Violation[] = [];
  
  for (const invariant of CONSTITUTIONAL_INVARIANTS) {
    for (const pattern of invariant.patterns) {
      if (pattern.test(output)) {
        violations.push({
          check: invariant.id,
          category: 'constitutional',
          severity: invariant.severity,
          pattern: pattern.toString(),
          detail: invariant.description,
        });
        break;
      }
    }
  }
  
  return violations;
}

function checkOwnership(
  output: string,
  field: FieldState,
  selection: ProtocolSelection
): Violation[] {
  const violations: Violation[] = [];
  
  // If delegation was attempted, ownership must be returned
  if (field.flags.includes('delegation_attempt')) {
    const ownershipPatterns = REQUIRED_PATTERNS['return_ownership'];
    const hasOwnershipReturn = ownershipPatterns.some(p => p.test(output));
    
    if (!hasOwnershipReturn) {
      violations.push({
        check: 'ownership_return',
        category: 'ownership',
        severity: 'critical',
        pattern: 'delegation_attempt',
        detail: 'Delegation was attempted but ownership not returned',
      });
    }
  }
  
  // V_MODE must not contain implicit decisions
  if (selection.atmosphere === 'V_MODE') {
    const implicitPatterns = FORBIDDEN_PATTERNS['implicit_recommendation'];
    for (const pattern of implicitPatterns) {
      if (pattern.test(output)) {
        violations.push({
          check: 'v_mode_implicit',
          category: 'ownership',
          severity: 'critical',
          pattern: 'implicit_recommendation',
          detail: 'V_MODE response contains implicit recommendation',
        });
        break;
      }
    }
  }
  
  return violations;
}

function checkSafety(
  output: string,
  field: FieldState,
  selection: ProtocolSelection
): Violation[] {
  const violations: Violation[] = [];
  
  // Emergency must have grounding, not exploration
  if (selection.atmosphere === 'EMERGENCY') {
    const groundingPatterns = REQUIRED_PATTERNS['offer_grounding'];
    const hasGrounding = groundingPatterns.some(p => p.test(output));
    
    if (!hasGrounding) {
      violations.push({
        check: 'emergency_grounding',
        category: 'safety',
        severity: 'moderate',
        pattern: 'missing_grounding',
        detail: 'Emergency response missing grounding element',
      });
    }
    
    // Check for opening new material (forbidden in emergency)
    const exploratoryPatterns = [
      /\bhave you considered\b/i,
      /\bwhat about\b/i,
      /\banother perspective\b/i,
      /\blet'?s explore\b/i,
    ];
    
    for (const pattern of exploratoryPatterns) {
      if (pattern.test(output)) {
        violations.push({
          check: 'emergency_exploration',
          category: 'safety',
          severity: 'moderate',
          pattern: 'opens_new_material',
          detail: 'Emergency response opens new material instead of grounding',
        });
        break;
      }
    }
  }
  
  // High arousal must be brief
  if (field.arousal === 'high' && selection.length === 'minimal') {
    const words = output.split(/\s+/).length;
    if (words > 50) {
      violations.push({
        check: 'high_arousal_length',
        category: 'safety',
        severity: 'minor',
        pattern: 'too_long',
        detail: `High arousal response too long: ${words} words (max 50)`,
      });
    }
  }
  
  return violations;
}

// ============================================
// FALLBACK SELECTION
// ============================================

function selectFallback(
  violations: Violation[],
  attemptCount: number
): FallbackLevel {
  // Critical constitutional violations → immediate SURFACE (no generation)
  const hasConstitutionalCritical = violations.some(
    v => v.severity === 'critical' && v.category === 'constitutional'
  );
  if (hasConstitutionalCritical) {
    return 'SURFACE';
  }
  
  // Critical ownership violations → SURFACE
  const hasOwnershipCritical = violations.some(
    v => v.severity === 'critical' && v.category === 'ownership'
  );
  if (hasOwnershipCritical) {
    return 'SURFACE';
  }
  
  // Safety violations after 2 attempts → PRESENCE
  const hasSafety = violations.some(v => v.category === 'safety');
  if (hasSafety && attemptCount >= 2) {
    return 'PRESENCE';
  }
  
  // Progressive degradation for constraint violations
  if (attemptCount < 2) {
    return 'REGENERATE';
  } else if (attemptCount < 3) {
    return 'MEDIUM';
  } else if (attemptCount < 4) {
    return 'SURFACE';
  } else {
    return 'PRESENCE';
  }
}

// ============================================
// AUDIT TRAIL
// ============================================

function createAuditEntry(
  input: S5Input,
  violations: Violation[],
  passed: boolean,
  fallbackLevel: FallbackLevel | null
): AuditEntry {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    session_id: input.session_id,
    turn_number: input.turn_number,
    input_hash: hash(input.output.text),
    field_summary: {
      domains: input.field.domains.map(d => d.domain),
      arousal: input.field.arousal,
      flags: input.field.flags,
    },
    selection_summary: {
      atmosphere: input.selection.atmosphere,
      mode: input.selection.mode,
      primitive: input.selection.primitive,
      forbidden: input.selection.forbidden,
      required: input.selection.required,
    },
    verification: {
      passed,
      checks_run: [
        'forbidden_actions',
        'required_actions',
        'constitutional_invariants',
        'ownership',
        'safety',
      ],
      violations: violations.map(v => ({
        check: v.check,
        severity: v.severity,
        detail: v.detail,
      })),
    },
    action: passed
      ? { type: 'DELIVER' }
      : {
          type: fallbackLevel === 'STOP' ? 'STOP' : 'FALLBACK',
          fallback_level: fallbackLevel || undefined,
          fallback_reason: violations[0]?.detail,
        },
    previous_hash: input.previous_hash,
    entry_hash: '', // Will be computed
  };
  
  // Compute entry hash (excluding entry_hash itself)
  const hashInput = JSON.stringify({ ...entry, entry_hash: undefined });
  entry.entry_hash = hash(hashInput);
  
  return entry;
}

function hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// ============================================
// MAIN VERIFY FUNCTION
// ============================================

export function verify(input: S5Input, attemptCount: number = 0): S5Result {
  const violations: Violation[] = [];
  
  // Run all checks
  violations.push(
    ...checkForbiddenActions(input.output.text, input.selection.forbidden)
  );
  violations.push(
    ...checkRequiredActions(input.output.text, input.selection.required)
  );
  violations.push(
    ...checkConstitutionalInvariants(input.output.text)
  );
  violations.push(
    ...checkOwnership(input.output.text, input.field, input.selection)
  );
  violations.push(
    ...checkSafety(input.output.text, input.field, input.selection)
  );
  
  // Determine result
  const passed = violations.length === 0;
  const fallbackLevel = passed ? null : selectFallback(violations, attemptCount);
  
  // Create audit entry
  const audit_entry = createAuditEntry(input, violations, passed, fallbackLevel);
  
  return {
    passed,
    violations,
    fallback_required: !passed,
    fallback_level: fallbackLevel,
    audit_entry,
  };
}

// ============================================
// FALLBACK OUTPUTS
// ============================================

export const FALLBACK_TEMPLATES: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  PRESENCE: {
    en: "I'm here with you.",
    zh: "我在这里陪着你。",
    hi: "मैं यहाँ आपके साथ हूँ।",
    es: "Estoy aquí contigo.",
    fr: "Je suis là avec vous.",
    ar: "أنا هنا معك.",
    bn: "আমি আপনার সাথে আছি।",
    ru: "Я здесь с вами.",
    pt: "Estou aqui com você.",
    id: "Saya di sini bersamamu.",
    ur: "میں یہاں آپ کے ساتھ ہوں۔",
    de: "Ich bin hier bei Ihnen.",
    ja: "私はあなたと一緒にいます。",
    sw: "Niko hapa nawe.",
    mr: "मी तुमच्यासोबत आहे.",
    it: "Sono qui con te.",
  },
  SURFACE_GROUND: {
    en: "Let's pause for a moment. What do you notice right now?",
    zh: "让我们暂停一下。你现在注意到什么？",
    hi: "एक पल के लिए रुकें। अभी आप क्या महसूस कर रहे हैं?",
    es: "Hagamos una pausa. ¿Qué notas ahora mismo?",
    fr: "Faisons une pause. Que remarquez-vous en ce moment?",
    ar: "دعنا نتوقف للحظة. ماذا تلاحظ الآن؟",
    bn: "একটু থামি। এখন আপনি কী লক্ষ্য করছেন?",
    ru: "Давайте остановимся на мгновение. Что вы замечаете сейчас?",
    pt: "Vamos fazer uma pausa. O que você percebe agora?",
    id: "Mari berhenti sejenak. Apa yang kamu perhatikan sekarang?",
    ur: "ایک لمحے کے لیے رکیں۔ ابھی آپ کیا محسوس کر رہے ہیں؟",
    de: "Lassen Sie uns einen Moment innehalten. Was bemerken Sie gerade?",
    ja: "少し立ち止まりましょう。今、何を感じていますか？",
    sw: "Tusimame kwa muda. Unaona nini sasa hivi?",
    mr: "एक क्षण थांबू या. तुम्हाला आत्ता काय जाणवतंय?",
    it: "Fermiamoci un momento. Cosa noti adesso?",
  },
  SURFACE_RETURN: {
    en: "This is yours to decide. What feels true to you?",
    zh: "这是你的决定。什么对你来说是真实的？",
    hi: "यह निर्णय आपका है। आपको क्या सच लगता है?",
    es: "Esta decisión es tuya. ¿Qué sientes verdadero?",
    fr: "C'est à vous de décider. Qu'est-ce qui vous semble vrai?",
    ar: "هذا قرارك. ما الذي يبدو حقيقياً لك؟",
    bn: "এই সিদ্ধান্ত আপনার। আপনার কাছে কী সত্য মনে হয়?",
    ru: "Это ваше решение. Что кажется вам истинным?",
    pt: "Esta decisão é sua. O que parece verdadeiro para você?",
    id: "Ini keputusanmu. Apa yang terasa benar untukmu?",
    ur: "یہ فیصلہ آپ کا ہے۔ آپ کو کیا سچ لگتا ہے؟",
    de: "Das ist Ihre Entscheidung. Was fühlt sich für Sie wahr an?",
    ja: "これはあなたが決めることです。何があなたにとって真実ですか？",
    sw: "Hii ni yako kuamua. Nini kinakuonekana kweli kwako?",
    mr: "हा निर्णय तुमचा आहे. तुम्हाला काय खरं वाटतं?",
    it: "Questa decisione è tua. Cosa senti vero?",
  },
  SURFACE_VALIDATE: {
    en: "I hear you. That makes sense.",
    zh: "我听到了。这很有道理。",
    hi: "मैं समझता/समझती हूँ। यह समझ में आता है।",
    es: "Te escucho. Tiene sentido.",
    fr: "Je vous entends. Cela a du sens.",
    ar: "أسمعك. هذا منطقي.",
    bn: "আমি শুনছি। এটা বোধগম্য।",
    ru: "Я слышу вас. Это имеет смысл.",
    pt: "Eu ouço você. Faz sentido.",
    id: "Aku mendengarmu. Itu masuk akal.",
    ur: "میں سمجھتا/سمجھتی ہوں۔ یہ سمجھ میں آتا ہے۔",
    de: "Ich höre Sie. Das macht Sinn.",
    ja: "聞いています。それは理解できます。",
    sw: "Ninakusikia. Hiyo ina maana.",
    mr: "मी ऐकतोय. ते समजण्यासारखे आहे.",
    it: "Ti sento. Ha senso.",
  },
};

export function getFallbackOutput(
  level: FallbackLevel,
  selection: ProtocolSelection,
  language: SupportedLanguage
): string | null {
  if (level === 'STOP') {
    return null;
  }

  if (level === 'PRESENCE') {
    return FALLBACK_TEMPLATES.PRESENCE[language] || FALLBACK_TEMPLATES.PRESENCE.en || "I'm here with you.";
  }

  if (level === 'SURFACE') {
    // Select appropriate surface template based on context
    if (selection.atmosphere === 'EMERGENCY') {
      return FALLBACK_TEMPLATES.SURFACE_GROUND[language] || FALLBACK_TEMPLATES.SURFACE_GROUND.en || "Let's pause for a moment.";
    }
    if (selection.atmosphere === 'V_MODE') {
      return FALLBACK_TEMPLATES.SURFACE_RETURN[language] || FALLBACK_TEMPLATES.SURFACE_RETURN.en || "This is yours to decide.";
    }
    return FALLBACK_TEMPLATES.SURFACE_VALIDATE[language] || FALLBACK_TEMPLATES.SURFACE_VALIDATE.en || "I hear you.";
  }
  
  // REGENERATE and MEDIUM don't have fixed outputs
  return null;
}

// ============================================
// EXPORTS
// ============================================

export default verify;
