# L2 EXECUTION CONTEXT SPECIFICATION

**Document ID:** ENOQ-L2-EXEC-CONTEXT  
**Status:** Constitutional Contract  
**Version:** 1.0  
**Date:** 2025-12-26

---

## Purpose

L2 is the **multi-domain execution engine**.

L2 is:
- **Powerful** — can do anything operationally
- **Blind** — cannot see FieldModel
- **Constrained** — operates within ExecutionContext
- **Returning** — ownership flows back to user

This document defines the **contract** between L1 (Field Compiler) and L2 (Execution Engine).

---

## The Paradox Implemented

> **L2 can do everything, but knows nothing about what matters.**

L2 receives an ExecutionContext, not a FieldModel.
L2 executes within constraints, not with awareness.

This is how ENOQ achieves:
- Maximum operational power
- Zero normative sovereignty

---

## ExecutionContext Structure

```typescript
interface ExecutionContext {
  // === IDENTITY ===
  context_id: string;           // Unique identifier
  timestamp: string;            // ISO 8601
  
  // === RUNTIME SELECTION ===
  runtime: RuntimeClass;        // Which execution mode
  
  // === GOAL ===
  goal: ExecutionGoal;          // What to achieve
  
  // === CONSTRAINTS ===
  constraints: ExecutionConstraints;
  
  // === RESOURCES ===
  resources: ResourceEnvelope;
  
  // === OUTPUT SPEC ===
  output_spec: OutputSpec;
  
  // === VALIDATION ===
  validators: ValidatorSpec[];
  
  // === FALLBACK ===
  fallback: FallbackSpec;
  
  // === AUDIT ===
  audit: AuditSpec;
}
```

---

## Runtime Classes

L2 operates in one of three modes:

```typescript
type RuntimeClass = 
  | 'L2_SURFACE'    // 0 LLM calls - pure template
  | 'L2_MEDIUM'     // 1 LLM call - constrained slot-fill
  | 'L2_DEEP';      // 1 LLM call + validation + fallback
```

### L2_SURFACE

```yaml
L2_SURFACE:
  description: "Pure template assembly, no generation"
  llm_calls: 0
  latency: "< 10ms"
  deterministic: true
  
  capabilities:
    - Template selection
    - Variable interpolation
    - Language adaptation
    
  use_when:
    - EMERGENCY atmosphere
    - High arousal
    - Fallback from MEDIUM/DEEP
    - Simple acknowledgments
    
  cannot:
    - Generate novel content
    - Reason about context
    - Adapt beyond templates
```

### L2_MEDIUM

```yaml
L2_MEDIUM:
  description: "Constrained generation with structure"
  llm_calls: 1
  latency: "< 500ms"
  deterministic: false
  
  capabilities:
    - Slot-fill within structure
    - Tone adaptation
    - Length adjustment
    - Context incorporation
    
  use_when:
    - Stable field state
    - Clear constraints
    - Moderate complexity
    
  cannot:
    - Free-form generation
    - Deep exploration
    - Multi-turn reasoning
```

### L2_DEEP

```yaml
L2_DEEP:
  description: "Full generation with validation and fallback"
  llm_calls: 1 + validation
  latency: "< 2000ms"
  deterministic: false
  
  capabilities:
    - Full response generation
    - Complex reasoning
    - Nuanced tone
    - Deep exploration
    
  use_when:
    - V_MODE atmosphere
    - Complex decisions
    - Relational depth
    - User has high agency
    
  must:
    - Pass S5 validation
    - Respect all constraints
    - Fallback on violation
```

---

## Execution Goal

```typescript
interface ExecutionGoal {
  // Primary objective
  primary: GoalType;
  
  // What primitive to execute
  primitive: Primitive;
  
  // Natural language intent (for LLM)
  intent: string;
  
  // Success criteria
  success_criteria: string[];
}

type GoalType =
  | 'RESPOND'       // Generate response
  | 'REFLECT'       // Mirror back
  | 'GROUND'        // Stabilize
  | 'OPEN'          // Expand perspective
  | 'CRYSTALLIZE'   // Focus/contract
  | 'RETURN'        // Return ownership
  | 'INFORM'        // Provide information
  | 'COMPLETE';     // Execute task
```

---

## Execution Constraints

```typescript
interface ExecutionConstraints {
  // === HARD CONSTRAINTS (must obey) ===
  forbidden: string[];          // Actions that must NOT happen
  required: string[];           // Actions that MUST happen
  
  // === DEPTH ===
  depth_ceiling: Depth;         // Maximum exploration depth
  dimensions_allowed: Dimension[]; // Which dimensions can be touched
  
  // === LENGTH ===
  max_tokens: number;           // Hard token limit
  target_length: Length;        // Soft length target
  
  // === TONE ===
  tone: ToneSpec;
  pacing: Pacing;
  
  // === LANGUAGE ===
  language: 'en' | 'it' | 'auto';
  
  // === CONSTITUTIONAL ===
  invariants_active: string[];  // Which INV-* to check
}
```

### Forbidden Actions (Examples)

```typescript
const FORBIDDEN_REGISTRY: Record<string, string> = {
  // Constitutional
  'recommend': 'Cannot recommend actions',
  'advise': 'Cannot give advice',
  'decide_for_user': 'Cannot make decisions for user',
  'diagnose': 'Cannot diagnose conditions',
  'label': 'Cannot label user',
  'define_identity': 'Cannot define user identity',
  'assign_purpose': 'Cannot assign purpose to user',
  
  // Mode-specific
  'explore': 'Cannot explore (REGULATE mode)',
  'expand': 'Cannot expand (CONTRACT mode)',
  'challenge': 'Cannot challenge (SAFETY active)',
  'analyze': 'Cannot analyze (HIGH AROUSAL)',
  'commit': 'Cannot commit (HIGH EMOTION)',
  'open_new_material': 'Cannot open new material (EMERGENCY)',
  
  // Safety
  'long_response': 'Cannot generate long response',
  'multiple_questions': 'Cannot ask multiple questions',
  'cognitive_reframe': 'Cannot do cognitive reframe (HIGH AROUSAL)',
};
```

### Required Actions (Examples)

```typescript
const REQUIRED_REGISTRY: Record<string, string> = {
  // Ownership
  'return_ownership': 'Must return ownership to user',
  
  // Validation
  'validate_feeling': 'Must validate user feeling',
  'acknowledge_distress': 'Must acknowledge distress',
  
  // Safety
  'ground': 'Must include grounding element',
  'presence': 'Must convey presence',
  'offer_grounding': 'Must offer grounding technique',
  
  // Legal
  'disclaim_not_lawyer': 'Must disclaim legal expertise',
  'disclaim_not_doctor': 'Must disclaim medical expertise',
  
  // Procedural
  'suggest_professional': 'Must suggest professional help',
};
```

---

## Resource Envelope

```typescript
interface ResourceEnvelope {
  // Time budget
  max_latency_ms: number;
  
  // LLM budget
  max_llm_calls: number;
  max_tokens_input: number;
  max_tokens_output: number;
  
  // Tools available
  tools_allowed: Tool[];
  
  // External access
  web_access: boolean;
  file_access: boolean;
}

type Tool =
  | 'TEMPLATE_LIBRARY'   // Access to templates
  | 'PRIMITIVE_LIBRARY'  // Access to primitives
  | 'LANGUAGE_DETECT'    // Language detection
  | 'CALCULATOR'         // Basic math
  | 'FORMATTER';         // Text formatting
```

---

## Output Specification

```typescript
interface OutputSpec {
  // Format
  format: 'text' | 'structured' | 'template';
  
  // Structure (if structured)
  structure?: {
    sections: string[];
    required_fields: string[];
  };
  
  // Template (if template)
  template_id?: string;
  template_variables?: Record<string, string>;
}
```

---

## Validator Specification

```typescript
interface ValidatorSpec {
  validator_id: string;
  type: 'pattern' | 'semantic' | 'structural' | 'constitutional';
  config: Record<string, any>;
  on_fail: 'reject' | 'warn' | 'fallback';
}
```

### Built-in Validators

```yaml
validators:
  V001_forbidden_patterns:
    type: pattern
    description: "Check for forbidden action patterns"
    on_fail: reject
    
  V002_required_patterns:
    type: pattern
    description: "Check for required action patterns"
    on_fail: reject
    
  V003_length_limit:
    type: structural
    description: "Check token/word count"
    on_fail: warn
    
  V004_constitutional:
    type: constitutional
    description: "Check INV-* invariants"
    on_fail: reject
    
  V005_ownership_return:
    type: semantic
    description: "Check if ownership was returned"
    on_fail: reject
```

---

## Fallback Specification

```typescript
interface FallbackSpec {
  // Fallback ladder
  ladder: FallbackLevel[];
  
  // Max attempts per level
  max_attempts_per_level: number;
  
  // Final fallback
  final_fallback: {
    type: 'template' | 'presence' | 'stop';
    template_id?: string;
  };
}

type FallbackLevel = 'REGENERATE' | 'MEDIUM' | 'SURFACE' | 'PRESENCE' | 'STOP';
```

---

## Audit Specification

```typescript
interface AuditSpec {
  // What to log
  log_input_hash: boolean;
  log_output_hash: boolean;
  log_constraints: boolean;
  log_validators: boolean;
  log_latency: boolean;
  
  // Retention
  retention: 'session' | 'none';
  
  // Chain
  chain_to_previous: boolean;
}

interface ExecutionAuditEntry {
  context_id: string;
  timestamp: string;
  runtime: RuntimeClass;
  context_hash: string;        // SHA-256 of full ExecutionContext (IMMUTABILITY PROOF)
  constraints_hash: string;
  output_hash: string;
  latency_ms: number;
  validators_result: Record<string, boolean>;
  fallback_used: boolean;
}
```

**Context Hash guarantees:**
- Any modification to ExecutionContext produces different hash
- Audit trail can prove context was not tampered
- Enables compliance verification

---

## Runtime Capability Map (Compliance)

Each runtime has defined capabilities for compliance auditing:

```typescript
interface RuntimeCapability {
  llm_calls: number;
  max_latency_ms: number;
  deterministic: boolean;
  can_generate: boolean;
  can_reason: boolean;
  can_explore: boolean;
  templates_only: boolean;
}

const RUNTIME_CAPABILITIES = {
  'L2_SURFACE': {
    llm_calls: 0,
    max_latency_ms: 100,
    deterministic: true,
    can_generate: false,
    can_reason: false,
    can_explore: false,
    templates_only: true,
  },
  'L2_MEDIUM': {
    llm_calls: 1,
    max_latency_ms: 500,
    deterministic: false,
    can_generate: true,
    can_reason: false,
    can_explore: false,
    templates_only: false,
  },
  'L2_DEEP': {
    llm_calls: 2,
    max_latency_ms: 2000,
    deterministic: false,
    can_generate: true,
    can_reason: true,
    can_explore: true,
    templates_only: false,
  },
};
```

**Compliance guarantees:**
- SURFACE: Fully deterministic, no LLM calls
- MEDIUM: Single LLM call, structured output
- DEEP: Full capability, requires validation

---

## Typed Constraints (Enum-based)

Forbidden and Required actions are now typed enums, not free strings:

```typescript
type ForbiddenAction =
  // Constitutional
  | 'recommend' | 'advise' | 'decide_for_user' | 'diagnose'
  | 'label' | 'define_identity' | 'assign_purpose' | 'prescribe'
  // Mode-specific
  | 'explore' | 'expand' | 'challenge' | 'analyze'
  | 'commit' | 'decide' | 'finalize' | 'open_new_material'
  // Safety
  | 'long_response' | 'multiple_questions' | 'cognitive_reframe';

type RequiredAction =
  // Ownership
  | 'return_ownership' | 'visualize_options' | 'mirror_only'
  // Validation
  | 'validate' | 'validate_feeling' | 'acknowledge_distress'
  // Safety
  | 'ground' | 'presence' | 'offer_grounding' | 'slow_down'
  // Professional
  | 'suggest_professional' | 'disclaim_not_lawyer' | 'disclaim_not_doctor';
```

**Type safety guarantees:**
- Compile-time validation of constraints
- No typos in constraint names
- IDE autocomplete support
- Refactoring safety

---

## L1 → L2 Translation

L1 (Field Compiler) produces FieldState + ProtocolSelection.
This must be translated to ExecutionContext.

```typescript
function compileExecutionContext(
  field: FieldState,
  selection: ProtocolSelection,
  governor: GovernorResult,
  metaKernel: MetaKernelResult
): ExecutionContext {
  
  // Determine runtime class
  const runtime = selectRuntime(field, selection, metaKernel);
  
  // Build goal
  const goal: ExecutionGoal = {
    primary: mapGoal(selection.primitive),
    primitive: selection.primitive,
    intent: generateIntent(selection),
    success_criteria: generateSuccessCriteria(selection),
  };
  
  // Merge constraints from all sources
  const constraints: ExecutionConstraints = {
    forbidden: [
      ...selection.forbidden,
      ...governor.effect.forbidden,
    ],
    required: [
      ...selection.required,
      ...governor.effect.required,
    ],
    depth_ceiling: mostRestrictive(
      selection.depth,
      governor.effect.depth_ceiling,
      metaKernel.power_envelope.depth_ceiling
    ),
    dimensions_allowed: metaKernel.power_envelope.dimensions_allowed,
    max_tokens: lengthToTokens(selection.length),
    target_length: selection.length,
    tone: selection.tone,
    pacing: selection.pacing,
    language: field.language || 'auto',
    invariants_active: getActiveInvariants(selection.atmosphere),
  };
  
  // Resource envelope
  const resources: ResourceEnvelope = {
    max_latency_ms: runtimeToLatency(runtime),
    max_llm_calls: runtimeToLLMCalls(runtime),
    max_tokens_input: 2000,
    max_tokens_output: lengthToTokens(selection.length),
    tools_allowed: ['TEMPLATE_LIBRARY', 'PRIMITIVE_LIBRARY', 'LANGUAGE_DETECT'],
    web_access: false,
    file_access: false,
  };
  
  return {
    context_id: generateContextId(),
    timestamp: new Date().toISOString(),
    runtime,
    goal,
    constraints,
    resources,
    output_spec: generateOutputSpec(runtime, selection),
    validators: generateValidators(constraints),
    fallback: generateFallbackSpec(runtime),
    audit: {
      log_input_hash: true,
      log_output_hash: true,
      log_constraints: true,
      log_validators: true,
      log_latency: true,
      retention: 'session',
      chain_to_previous: true,
    },
  };
}
```

---

## Runtime Selection Logic

```typescript
function selectRuntime(
  field: FieldState,
  selection: ProtocolSelection,
  metaKernel: MetaKernelResult
): RuntimeClass {
  // EMERGENCY → always SURFACE
  if (selection.atmosphere === 'EMERGENCY') {
    return 'L2_SURFACE';
  }
  
  // High arousal → SURFACE
  if (field.arousal === 'high') {
    return 'L2_SURFACE';
  }
  
  // MetaKernel power level
  const l2Mode = metaKernel.power_envelope.l2_mode;
  
  // Map MetaKernel mode to runtime
  switch (l2Mode) {
    case 'SURFACE': return 'L2_SURFACE';
    case 'MEDIUM': return 'L2_MEDIUM';
    case 'DEEP': return 'L2_DEEP';
  }
}
```

---

## What L2 CANNOT See

**L2 is blind to:**

| L2 Cannot See | Why |
|---------------|-----|
| FieldModel | Would enable normative reasoning |
| Arousal level | Encoded in constraints, not visible |
| Coherence | Encoded in depth_ceiling |
| Domain activations | Only goal/primitive visible |
| User history | Only current context |
| MetaKernel state | Only power_envelope effects |
| Governor decisions | Only merged constraints |

**This blindness is constitutional.**

If L2 could see the field, it could reason about it.
If it could reason about it, it could form normative judgments.
If it could form normative judgments, it could decide for the user.

L2's blindness is its integrity.

---

## Execution Flow

```
L1 Field Compiler
    ↓
ProtocolSelection
    ↓
Domain Governor → constraints
    ↓
MetaKernel → power envelope
    ↓
ExecutionContext Compiler
    ↓
[ExecutionContext] ← L2 receives ONLY this
    ↓
L2 Runtime Selection
    ↓
L2_SURFACE | L2_MEDIUM | L2_DEEP
    ↓
Output Generation
    ↓
S5 Validation
    ↓
Pass → Deliver | Fail → Fallback Ladder
```

---

## Example ExecutionContext

### For V_MODE Response

```json
{
  "context_id": "ctx_abc123",
  "timestamp": "2025-12-26T10:30:00Z",
  "runtime": "L2_DEEP",
  "goal": {
    "primary": "RETURN",
    "primitive": "P06_RETURN_AGENCY",
    "intent": "Help user see their decision clearly and return ownership",
    "success_criteria": [
      "User's question is acknowledged",
      "Decision space is mapped",
      "Ownership is returned with question"
    ]
  },
  "constraints": {
    "forbidden": [
      "recommend",
      "advise",
      "decide_for_user",
      "implicit_recommendation"
    ],
    "required": [
      "return_ownership",
      "visualize_options"
    ],
    "depth_ceiling": "deep",
    "dimensions_allowed": ["emotional", "relational", "existential"],
    "max_tokens": 300,
    "target_length": "moderate",
    "tone": { "warmth": 4, "directness": 3 },
    "pacing": "slow",
    "language": "en",
    "invariants_active": ["INV-003", "INV-009"]
  },
  "resources": {
    "max_latency_ms": 2000,
    "max_llm_calls": 2,
    "max_tokens_input": 2000,
    "max_tokens_output": 300,
    "tools_allowed": ["TEMPLATE_LIBRARY", "PRIMITIVE_LIBRARY"],
    "web_access": false,
    "file_access": false
  },
  "validators": [
    { "validator_id": "V001", "type": "pattern", "on_fail": "reject" },
    { "validator_id": "V004", "type": "constitutional", "on_fail": "reject" },
    { "validator_id": "V005", "type": "semantic", "on_fail": "reject" }
  ],
  "fallback": {
    "ladder": ["REGENERATE", "MEDIUM", "SURFACE", "PRESENCE"],
    "max_attempts_per_level": 2,
    "final_fallback": {
      "type": "template",
      "template_id": "SURFACE_RETURN"
    }
  }
}
```

### For EMERGENCY Response

```json
{
  "context_id": "ctx_def456",
  "timestamp": "2025-12-26T10:31:00Z",
  "runtime": "L2_SURFACE",
  "goal": {
    "primary": "GROUND",
    "primitive": "P01_GROUND",
    "intent": "Provide immediate grounding and presence",
    "success_criteria": [
      "Distress acknowledged",
      "Grounding offered",
      "Presence conveyed"
    ]
  },
  "constraints": {
    "forbidden": [
      "explore",
      "expand",
      "analyze",
      "open_new_material",
      "long_response"
    ],
    "required": [
      "acknowledge_distress",
      "offer_grounding",
      "presence"
    ],
    "depth_ceiling": "surface",
    "dimensions_allowed": ["somatic"],
    "max_tokens": 50,
    "target_length": "minimal",
    "tone": { "warmth": 5, "directness": 4 },
    "pacing": "slow",
    "language": "auto",
    "invariants_active": ["INV-003"]
  },
  "resources": {
    "max_latency_ms": 100,
    "max_llm_calls": 0,
    "max_tokens_input": 0,
    "max_tokens_output": 50,
    "tools_allowed": ["TEMPLATE_LIBRARY"],
    "web_access": false,
    "file_access": false
  },
  "fallback": {
    "ladder": ["PRESENCE"],
    "max_attempts_per_level": 1,
    "final_fallback": {
      "type": "presence"
    }
  }
}
```

---

## Invariants

These must always hold:

1. **L2 never sees FieldModel**: Only ExecutionContext
2. **Constraints are merged before L2**: L2 gets final constraints, not sources
3. **Forbidden is absolute**: L2 cannot override forbidden
4. **Required is mandatory**: Output must contain required elements
5. **Fallback is guaranteed**: Every execution has a fallback path

---

## Test Cases

### TC-L2-001: L2 Cannot See Field

```yaml
test: "ExecutionContext contains no FieldModel"
input:
  field: { domains: [...], arousal: 'high', ... }
output:
  execution_context: { ... }
assert:
  - execution_context.field == undefined
  - execution_context.domains == undefined
  - execution_context.arousal == undefined
```

### TC-L2-002: Emergency Uses SURFACE

```yaml
test: "EMERGENCY atmosphere uses L2_SURFACE"
input:
  selection: { atmosphere: 'EMERGENCY' }
output:
  execution_context: { runtime: 'L2_SURFACE' }
```

### TC-L2-003: Constraints Are Merged

```yaml
test: "Constraints from all sources are merged"
input:
  selection: { forbidden: ['recommend'] }
  governor: { forbidden: ['explore'] }
output:
  execution_context:
    constraints:
      forbidden: ['recommend', 'explore']
```

---

## Summary

L2 ExecutionContext is the **contract** that enables the paradox:

| L2 Receives | L2 Does Not Receive |
|-------------|---------------------|
| Runtime class | FieldModel |
| Goal/primitive | Domain activations |
| Constraints | Arousal/valence |
| Resources | MetaKernel state |
| Validators | Governor decisions |
| Fallback spec | Why constraints exist |

**L2 is powerful because it's blind.**
**L2 is safe because it's constrained.**
**L2 is constitutional because it cannot reason about what matters.**

---

*"The execution engine knows how, but never why."*
