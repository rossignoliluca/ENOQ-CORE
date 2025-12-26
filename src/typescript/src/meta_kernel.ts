/**
 * ENOQ META KERNEL (L0.5)
 * 
 * Power governor. Content-blind.
 * Reads telemetry, controls knobs.
 * Ensures power is permissioned, not automatic.
 */

import { Depth, Pacing, SupportedLanguage } from './types';

// ============================================
// TYPES
// ============================================

export type Dimension = 'somatic' | 'emotional' | 'relational' | 'existential' | 'systemic';
export type ContinuationPolicy = 'atomic' | 'checkpointed' | 'processual';
export type Coherence = 'low' | 'medium' | 'high';

export interface TurnTelemetry {
  timestamp: Date;
  turn_number: number;
  input_length: number;
  input_question_count: number;
  input_has_delegation_markers: boolean;
  output_depth: Depth;
  output_domains: string[];
  elapsed_time: number;
}

export interface SessionTelemetry {
  total_turns: number;
  avg_depth: number;
  max_depth_reached: Depth;
  delegation_rate: number;
  reassurance_rate: number;
  passive_turns_rate: number;
  loop_count: number;
  theme_repetition_rate: number;
  user_made_decision: boolean;
  user_asked_clarifying: boolean;
  user_disagreed: boolean;
}

export interface ComputedTelemetry {
  depth_velocity: number;      // -1.0 to +1.0
  domain_spread: number;       // 1-17
  continuity_pressure: number; // 0.0 to 1.0
  delegation_attempts_rate: number; // 0.0 to 1.0
  loop_tendency: number;       // 0.0 to 1.0
  turns_budget: number;        // 0 to max
  time_budget: number;         // seconds
  agency_signal: number;       // 0.0 to 1.0
}

export interface KnobSettings {
  max_depth_allowed: Depth;
  dimensions_enabled: Dimension[];
  continuation_policy: ContinuationPolicy;
  field_narrowing: number;     // 0.0 to 1.0
  deep_mode_handshake: boolean;
  max_turns_remaining: number;
  power_level: number;         // 0.0 to 1.0
}

export interface MetaKernelState {
  telemetry_history: TurnTelemetry[];
  knobs: KnobSettings;
  session_start: Date;
  turns_elapsed: number;
  deep_mode_active: boolean;
  handshake_pending: boolean;
  recovery_mode: boolean;
  recovery_turns_remaining: number;
  coherence: Coherence;
  previous_depth: Depth;
}

export interface PowerEnvelope {
  depth_ceiling: Depth;
  dimensions_allowed: Dimension[];
  pacing: Pacing;
  l2_mode: 'SURFACE' | 'MEDIUM' | 'DEEP';
  time_remaining: number;
  turns_remaining: number;
}

export interface MetaKernelResult {
  rules_applied: string[];
  knob_changes: { knob: string; from: any; to: any }[];
  power_envelope: PowerEnvelope;
  prompt_handshake: boolean;
  handshake_message?: string;
  new_state: MetaKernelState;
}

// ============================================
// CONSTANTS
// ============================================

const ALL_DIMENSIONS: Dimension[] = ['somatic', 'emotional', 'relational', 'existential', 'systemic'];
const DEFAULT_MAX_TURNS = 100;
const DEFAULT_MAX_TIME = 3600; // 1 hour
const RECOVERY_TURNS = 3;

const DEPTH_VALUES: Record<Depth, number> = {
  'surface': 0,
  'medium': 1,
  'deep': 2,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function createDefaultState(): MetaKernelState {
  return {
    telemetry_history: [],
    knobs: {
      max_depth_allowed: 'deep',
      dimensions_enabled: [...ALL_DIMENSIONS],
      continuation_policy: 'atomic',
      field_narrowing: 0.0,
      deep_mode_handshake: false,
      max_turns_remaining: DEFAULT_MAX_TURNS,
      power_level: 0.5,
    },
    session_start: new Date(),
    turns_elapsed: 0,
    deep_mode_active: false,
    handshake_pending: false,
    recovery_mode: false,
    recovery_turns_remaining: 0,
    coherence: 'medium',
    previous_depth: 'surface',
  };
}

function calculateAgencySignal(session: SessionTelemetry): number {
  const factors = {
    user_decisions: session.user_made_decision ? 0.2 : 0,
    user_questions: session.user_asked_clarifying ? 0.1 : 0,
    user_pushback: session.user_disagreed ? 0.15 : 0,
    delegation_attempts: -0.3 * session.delegation_rate,
    seeking_reassurance: -0.2 * session.reassurance_rate,
    passivity: -0.25 * session.passive_turns_rate,
  };
  
  const raw = Object.values(factors).reduce((a, b) => a + b, 0) + 0.5;
  return Math.max(0, Math.min(1, raw));
}

function calculatePowerLevel(
  telemetry: ComputedTelemetry,
  state: MetaKernelState
): number {
  let power = 0.5;
  
  power += 0.3 * telemetry.agency_signal;
  power -= 0.4 * telemetry.delegation_attempts_rate;
  
  if (state.coherence === 'high') power += 0.15;
  if (state.coherence === 'low') power -= 0.25;
  
  if (state.recovery_mode) power -= 0.3;
  if (state.deep_mode_active) power += 0.2;
  
  return Math.max(0, Math.min(1, power));
}

function powerLevelToL2Mode(power: number): 'SURFACE' | 'MEDIUM' | 'DEEP' {
  if (power < 0.4) return 'SURFACE';
  if (power < 0.8) return 'MEDIUM';
  return 'DEEP';
}

function powerLevelToDepth(power: number): Depth {
  if (power < 0.4) return 'surface';
  if (power < 0.6) return 'medium';
  return 'deep';
}

function powerLevelToDimensions(power: number): Dimension[] {
  if (power < 0.2) return ['somatic'];
  if (power < 0.4) return ['somatic', 'emotional'];
  if (power < 0.6) return ['somatic', 'emotional', 'relational'];
  if (power < 0.8) return ['somatic', 'emotional', 'relational', 'systemic'];
  return ALL_DIMENSIONS;
}

function mostRestrictiveDepth(a: Depth, b: Depth): Depth {
  return DEPTH_VALUES[a] <= DEPTH_VALUES[b] ? a : b;
}

// ============================================
// RULES
// ============================================

interface MetaKernelRule {
  id: string;
  condition: (t: ComputedTelemetry, s: MetaKernelState) => boolean;
  apply: (knobs: KnobSettings, t: ComputedTelemetry, s: MetaKernelState) => Partial<KnobSettings>;
}

const METAKERNEL_RULES: MetaKernelRule[] = [
  // MK-001: High Delegation Rate → Constrain Depth
  {
    id: 'MK-001',
    condition: (t) => t.delegation_attempts_rate > 0.3,
    apply: (knobs) => ({
      max_depth_allowed: 'medium',
      deep_mode_handshake: true,
    }),
  },
  
  // MK-002: Low Agency → Narrow Focus
  {
    id: 'MK-002',
    condition: (t) => t.agency_signal < 0.4,
    apply: (knobs) => ({
      field_narrowing: Math.max(knobs.field_narrowing, 0.5),
      dimensions_enabled: ['somatic', 'emotional'],
    }),
  },
  
  // MK-003: Fast Depth Velocity → Slow Down
  {
    id: 'MK-003',
    condition: (t) => t.depth_velocity > 0.5,
    apply: (knobs, t, s) => ({
      max_depth_allowed: s.previous_depth,
      continuation_policy: 'checkpointed' as ContinuationPolicy,
    }),
  },
  
  // MK-004: High Domain Spread → Focus
  {
    id: 'MK-004',
    condition: (t) => t.domain_spread > 4,
    apply: (knobs) => ({
      field_narrowing: Math.max(knobs.field_narrowing, 0.7),
      max_depth_allowed: mostRestrictiveDepth(knobs.max_depth_allowed, 'medium'),
    }),
  },
  
  // MK-005: Loop Detected → Contract
  {
    id: 'MK-005',
    condition: (t) => t.loop_tendency > 0.5,
    apply: () => ({
      field_narrowing: 0.8,
      dimensions_enabled: ['emotional'] as Dimension[],
      max_depth_allowed: 'surface' as Depth,
    }),
  },
  
  // MK-006: Budget Low → Prepare Closure
  {
    id: 'MK-006',
    condition: (t) => t.turns_budget < 3 || t.time_budget < 60,
    apply: () => ({
      continuation_policy: 'atomic' as ContinuationPolicy,
      max_depth_allowed: 'surface' as Depth,
      field_narrowing: 0.9,
    }),
  },
  
  // MK-008: Agency High + Coherence High → Allow Full Power
  {
    id: 'MK-008',
    condition: (t, s) => t.agency_signal > 0.7 && s.coherence === 'high',
    apply: () => ({
      max_depth_allowed: 'deep' as Depth,
      dimensions_enabled: [...ALL_DIMENSIONS],
      power_level: 1.0,
    }),
  },
  
  // MK-009: Continuity Pressure High → Don't Open New Material
  {
    id: 'MK-009',
    condition: (t) => t.continuity_pressure > 0.8,
    apply: (knobs) => ({
      field_narrowing: Math.min(1, knobs.field_narrowing + 0.2),
    }),
  },
  
  // MK-010: Recovery After Crisis
  {
    id: 'MK-010',
    condition: (t, s) => s.recovery_mode && s.recovery_turns_remaining > 0,
    apply: () => ({
      max_depth_allowed: 'surface' as Depth,
      continuation_policy: 'checkpointed' as ContinuationPolicy,
    }),
  },
];

// ============================================
// HANDSHAKE
// ============================================

const HANDSHAKE_MESSAGES: Partial<Record<SupportedLanguage, string>> = {
  en: `You're moving into deeper territory—exploring meaning, identity, or core patterns. This kind of work can be valuable but also intense.

Would you like to continue into this space?`,

  zh: `你正在进入更深的领域——探索意义、身份或核心模式。这种工作可能很有价值，但也很强烈。

你想继续进入这个空间吗？`,

  hi: `आप गहरे क्षेत्र में जा रहे हैं—अर्थ, पहचान, या मूल पैटर्न का अन्वेषण कर रहे हैं। इस तरह का काम मूल्यवान हो सकता है लेकिन तीव्र भी।

क्या आप इस स्थान में जारी रखना चाहते हैं?`,

  es: `Estás entrando en territorio más profundo—explorando significado, identidad o patrones fundamentales. Este tipo de trabajo puede ser valioso pero también intenso.

¿Te gustaría continuar en este espacio?`,

  fr: `Vous entrez dans un territoire plus profond—explorant le sens, l'identité ou les schémas fondamentaux. Ce type de travail peut être précieux mais aussi intense.

Souhaitez-vous continuer dans cet espace?`,

  ar: `أنت تتحرك نحو منطقة أعمق—تستكشف المعنى والهوية والأنماط الأساسية. هذا النوع من العمل يمكن أن يكون قيماً ولكنه أيضاً مكثف.

هل تريد الاستمرار في هذا المجال؟`,

  bn: `আপনি গভীর অঞ্চলে যাচ্ছেন—অর্থ, পরিচয়, বা মূল প্যাটার্ন অন্বেষণ করছেন। এই ধরনের কাজ মূল্যবান হতে পারে কিন্তু তীব্রও।

আপনি কি এই স্থানে চালিয়ে যেতে চান?`,

  ru: `Вы входите в более глубокую территорию—исследуя смысл, идентичность или основные паттерны. Такая работа может быть ценной, но также интенсивной.

Хотите продолжить в этом пространстве?`,

  pt: `Você está entrando em território mais profundo—explorando significado, identidade ou padrões fundamentais. Este tipo de trabalho pode ser valioso, mas também intenso.

Gostaria de continuar neste espaço?`,

  id: `Anda bergerak ke wilayah yang lebih dalam—mengeksplorasi makna, identitas, atau pola inti. Jenis pekerjaan ini bisa berharga tetapi juga intens.

Apakah Anda ingin melanjutkan ke ruang ini?`,

  ur: `آپ گہرے علاقے میں جا رہے ہیں—معنی، شناخت، یا بنیادی نمونوں کی تلاش کر رہے ہیں۔ اس قسم کا کام قیمتی ہو سکتا ہے لیکن شدید بھی۔

کیا آپ اس جگہ میں جاری رکھنا چاہیں گے؟`,

  de: `Sie betreten tieferes Terrain—erkunden Bedeutung, Identität oder grundlegende Muster. Diese Art von Arbeit kann wertvoll, aber auch intensiv sein.

Möchten Sie in diesem Raum fortfahren?`,

  ja: `あなたはより深い領域に入ろうとしています—意味、アイデンティティ、または核心的なパターンを探求しています。この種の作業は価値がありますが、強烈でもあります。

この空間に進みますか？`,

  sw: `Unaingia eneo la kina zaidi—kuchunguza maana, utambulisho, au mifumo ya msingi. Aina hii ya kazi inaweza kuwa ya thamani lakini pia yenye nguvu.

Je, ungependa kuendelea katika nafasi hii?`,

  mr: `तुम्ही अधिक खोल प्रदेशात जात आहात—अर्थ, ओळख किंवा मूळ नमुने शोधत आहात. या प्रकारचे काम मौल्यवान असू शकते पण तीव्र देखील।

तुम्हाला या जागेत पुढे जायचे आहे का?`,

  it: `Stai entrando in territorio più profondo—esplorando significato, identità, o pattern fondamentali. Questo tipo di lavoro può essere prezioso ma anche intenso.

Vuoi continuare in questo spazio?`,
};

function checkHandshakeRequired(
  requestedDepth: Depth,
  state: MetaKernelState,
  telemetry: ComputedTelemetry
): boolean {
  // Deep mode already active or not requested
  if (state.deep_mode_active || requestedDepth !== 'deep') {
    return false;
  }
  
  // Handshake required if:
  // - Existential dimension would activate
  // - OR delegation rate is significant
  // - OR agency is low
  return (
    telemetry.delegation_attempts_rate > 0.2 ||
    telemetry.agency_signal < 0.5
  );
}

// ============================================
// MAIN FUNCTION
// ============================================

export function applyMetaKernel(
  sessionTelemetry: SessionTelemetry,
  turnTelemetry: TurnTelemetry | null,
  currentState: MetaKernelState | null,
  language: SupportedLanguage = 'en'
): MetaKernelResult {
  // Initialize state if needed
  const state = currentState || createDefaultState();
  
  // Update telemetry history
  if (turnTelemetry) {
    state.telemetry_history.push(turnTelemetry);
  }
  state.turns_elapsed++;
  
  // Compute telemetry
  const computed: ComputedTelemetry = {
    depth_velocity: turnTelemetry 
      ? (DEPTH_VALUES[turnTelemetry.output_depth] - DEPTH_VALUES[state.previous_depth]) / 1
      : 0,
    domain_spread: turnTelemetry?.output_domains.length || 1,
    continuity_pressure: 0.5, // Would be calculated from time since last message
    delegation_attempts_rate: sessionTelemetry.delegation_rate,
    loop_tendency: sessionTelemetry.theme_repetition_rate,
    turns_budget: state.knobs.max_turns_remaining - state.turns_elapsed,
    time_budget: DEFAULT_MAX_TIME - ((Date.now() - state.session_start.getTime()) / 1000),
    agency_signal: calculateAgencySignal(sessionTelemetry),
  };
  
  // Calculate power level
  const power_level = calculatePowerLevel(computed, state);
  
  // Apply rules
  const rules_applied: string[] = [];
  const knob_changes: { knob: string; from: any; to: any }[] = [];
  let newKnobs = { ...state.knobs };
  
  for (const rule of METAKERNEL_RULES) {
    if (rule.condition(computed, state)) {
      rules_applied.push(rule.id);
      const changes = rule.apply(newKnobs, computed, state);
      
      for (const [key, value] of Object.entries(changes)) {
        if (JSON.stringify(newKnobs[key as keyof KnobSettings]) !== JSON.stringify(value)) {
          knob_changes.push({
            knob: key,
            from: newKnobs[key as keyof KnobSettings],
            to: value,
          });
          (newKnobs as any)[key] = value;
        }
      }
    }
  }
  
  // Update power level in knobs
  if (newKnobs.power_level !== power_level) {
    knob_changes.push({
      knob: 'power_level',
      from: newKnobs.power_level,
      to: power_level,
    });
    newKnobs.power_level = power_level;
  }
  
  // Check if handshake is required
  const requestedDepth = turnTelemetry?.output_depth || 'surface';
  const needsHandshake = checkHandshakeRequired(requestedDepth, state, computed);
  
  // Build power envelope
  const depthFromPower = powerLevelToDepth(power_level);
  const power_envelope: PowerEnvelope = {
    depth_ceiling: mostRestrictiveDepth(newKnobs.max_depth_allowed, depthFromPower),
    dimensions_allowed: newKnobs.dimensions_enabled.filter(d => 
      powerLevelToDimensions(power_level).includes(d)
    ),
    pacing: power_level < 0.4 ? 'slow' : power_level < 0.7 ? 'conservative' : 'normal',
    l2_mode: powerLevelToL2Mode(power_level),
    time_remaining: computed.time_budget,
    turns_remaining: computed.turns_budget,
  };
  
  // Update state
  const new_state: MetaKernelState = {
    ...state,
    knobs: newKnobs,
    previous_depth: turnTelemetry?.output_depth || state.previous_depth,
    handshake_pending: needsHandshake,
    recovery_turns_remaining: state.recovery_mode 
      ? Math.max(0, state.recovery_turns_remaining - 1) 
      : 0,
    recovery_mode: state.recovery_turns_remaining > 1,
  };
  
  return {
    rules_applied,
    knob_changes,
    power_envelope,
    prompt_handshake: needsHandshake,
    handshake_message: needsHandshake ? (HANDSHAKE_MESSAGES[language] || HANDSHAKE_MESSAGES.en) : undefined,
    new_state,
  };
}

// ============================================
// HANDSHAKE RESPONSE PROCESSING
// ============================================

const AFFIRMATIVE_RESPONSES = ['yes', 'sì', 'si', 'continue', 'continua', 'go ahead', 'vai avanti', 'ok', 'okay'];
const NEGATIVE_RESPONSES = ['no', 'not now', 'non ora', 'stay here', 'restiamo qui', 'stop'];

export function processHandshakeResponse(
  response: string,
  state: MetaKernelState
): MetaKernelState {
  const normalized = response.toLowerCase().trim();
  
  if (AFFIRMATIVE_RESPONSES.some(r => normalized.includes(r))) {
    return {
      ...state,
      deep_mode_active: true,
      handshake_pending: false,
      knobs: {
        ...state.knobs,
        max_depth_allowed: 'deep',
        dimensions_enabled: [...ALL_DIMENSIONS],
      },
    };
  }
  
  if (NEGATIVE_RESPONSES.some(r => normalized.includes(r))) {
    return {
      ...state,
      deep_mode_active: false,
      handshake_pending: false,
      knobs: {
        ...state.knobs,
        max_depth_allowed: 'medium',
        dimensions_enabled: ['somatic', 'emotional', 'relational'],
      },
    };
  }
  
  // Unclear response - keep pending
  return state;
}

// ============================================
// CRISIS RECOVERY
// ============================================

export function enterRecoveryMode(state: MetaKernelState): MetaKernelState {
  return {
    ...state,
    recovery_mode: true,
    recovery_turns_remaining: RECOVERY_TURNS,
    knobs: {
      ...state.knobs,
      max_depth_allowed: 'surface',
      continuation_policy: 'checkpointed',
    },
  };
}

// ============================================
// INVARIANT CHECKS
// ============================================

export interface InvariantCheckResult {
  passed: boolean;
  violations: string[];
}

export function checkMetaKernelInvariants(
  telemetry: ComputedTelemetry,
  state: MetaKernelState,
  result: MetaKernelResult
): InvariantCheckResult {
  const violations: string[] = [];
  
  // INV-1: Agency < 0.3 → Power ≤ 0.4
  if (telemetry.agency_signal < 0.3 && result.power_envelope.l2_mode === 'DEEP') {
    violations.push('INV-1: Low agency but deep mode allowed');
  }
  
  // INV-2: Delegation > 0.5 → No Deep
  if (telemetry.delegation_attempts_rate > 0.5 && result.power_envelope.depth_ceiling === 'deep') {
    violations.push('INV-2: High delegation but deep allowed');
  }
  
  // INV-3: Recovery → Surface Only
  if (state.recovery_mode && result.power_envelope.depth_ceiling !== 'surface') {
    violations.push('INV-3: Recovery mode but not surface');
  }
  
  // INV-4: No Handshake → No Existential
  if (!state.deep_mode_active && result.power_envelope.dimensions_allowed.includes('existential')) {
    violations.push('INV-4: No deep mode handshake but existential allowed');
  }
  
  // INV-5: Loop > 0.5 → Contract
  if (telemetry.loop_tendency > 0.5 && result.power_envelope.depth_ceiling !== 'surface') {
    violations.push('INV-5: High loop tendency but not contracted');
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

// ============================================
// EXPORTS
// ============================================

export { createDefaultState, METAKERNEL_RULES };
export default applyMetaKernel;
