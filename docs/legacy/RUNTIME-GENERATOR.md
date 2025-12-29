# ENOQ RUNTIME GENERATOR SPECIFICATION v1.0

**Document ID:** ENOQ-RUNTIME-GENERATOR  
**Status:** Core Architecture  
**Date:** 2025-12-25  
**Depends On:** AXIS/INVARIANTS.md, OS-SPEC.md  

---

## EXECUTIVE SUMMARY

ENOQ can do **everything operationally delegable** by a human.

This is possible because runtimes are not pre-defined. They are **generated on-demand** within Constitutional constraints.

The Runtime Generator creates valid runtimes for any task, validated against the Constitution before execution.

---

## PART I: THE CORE INSIGHT

### The Problem

Pre-defined runtimes are limiting:
- EMAIL_RUNTIME ✓
- CODE_RUNTIME ✓
- DECISION_RUNTIME ✓
- ... and then?
- NEGOTIATION_PREP_RUNTIME?
- GRIEF_SPEECH_RUNTIME?
- RITUAL_DESIGN_RUNTIME?

**Infinite possible tasks. Cannot pre-define all.**

### The Solution

The OS doesn't contain all runtimes. **The OS contains rules for generating valid runtimes.**

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSTITUTION                             │
│              (invariants, forbidden patterns)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  RUNTIME GENERATOR                          │
│                                                             │
│   Input: task + context + field_model                       │
│   Output: RuntimeSpec (compliant with Constitution)         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  RUNTIME VALIDATOR                          │
│                                                             │
│   Verify RuntimeSpec against Constitution                   │
│   If invalid → regenerate or reject                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    [Valid Runtime]
                           │
                           ▼
                      S4 ACT
```

---

## PART II: TWO TYPES OF RUNTIMES

| Type | Description | Examples |
|------|-------------|----------|
| **Core Runtime** | Pre-defined, tested, optimized | HUMAN_FIELD, DECISION, EMAIL, CODE |
| **Generated Runtime** | Created on-the-fly, validated | Any new task type |

Core runtimes are like **native apps** — optimized, tested, fast.

Generated runtimes are like **sandboxed apps** — flexible, validated, constrained.

Both respect the Constitution. Both are valid.

---

## PART III: RUNTIME GENERATION PROCESS

### Step 1: Task Analysis (in S3 PLAN)

```yaml
input:
  field_model: FieldModel
  user_request: string
  
analysis:
  task_type: operational | human_field | hybrid
  domain_primary: string
  domain_secondary: string[]
  complexity: low | medium | high
  existing_runtime_match: RuntimeID | null
```

### Step 2: Runtime Selection or Generation

```yaml
decision_tree:
  if existing_runtime_match:
    use: existing_runtime_match
    type: core
    
  else:
    generate: new_runtime
    type: generated
    validate: true
```

### Step 3: Runtime Generation (if needed)

The LLM generates a RuntimeSpec, constrained by:
- Constitution invariants
- Field model constraints
- Task requirements

```typescript
interface RuntimeGenerationPrompt {
  task_description: string;
  field_model: FieldModel;
  constitution: Constitution;  // full text
  
  instruction: `
    Generate a RuntimeSpec for this task.
    The runtime MUST comply with the Constitution.
    
    Required fields:
    - id: unique identifier
    - tools_allowed: what operations are permitted
    - tools_forbidden: what operations are prohibited
    - completion_criteria: when is this task "done"
    - verify_rules: what to check before output
    - max_iterations: safety limit
    
    Constitutional requirements:
    - No normative delegation
    - No pathological dependency
    - Explicit completion criteria
    - User confirmation for consequential outputs
    - Rubicon invariant respected
  `;
}
```

### Step 4: Runtime Validation

```typescript
function validateRuntime(spec: RuntimeSpec): ValidationResult {
  const errors: string[] = [];
  
  // Check INV-003: No normative delegation
  if (containsNormativeDelegation(spec.tools_allowed)) {
    errors.push("Contains normative delegation tools");
  }
  
  // Check INV-005: Explicit completion criteria
  if (!spec.completion_criteria || spec.completion_criteria.length === 0) {
    errors.push("Missing completion criteria");
  }
  
  // Check INV-006: User confirmation for consequential outputs
  if (isConsequential(spec) && !requiresUserConfirmation(spec)) {
    errors.push("Consequential output without user confirmation");
  }
  
  // Check INV-009: Rubicon respected
  if (crossesRubicon(spec)) {
    errors.push("Crosses Rubicon - decides for user");
  }
  
  // Check forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (matchesPattern(spec, pattern)) {
      errors.push(`Forbidden pattern: ${pattern.name}`);
    }
  }
  
  // Check max_iterations reasonable
  if (spec.max_iterations > 10) {
    errors.push("Max iterations too high");
  }
  
  return {
    valid: errors.length === 0,
    errors,
    correctable: errors.every(e => isAutoCorrectable(e))
  };
}
```

### Step 5: Correction or Rejection

```yaml
if validation.valid:
  proceed: S4 ACT with runtime
  
elif validation.correctable:
  attempt: auto_correct
  revalidate: true
  max_correction_attempts: 2
  
else:
  reject: true
  response: |
    I cannot help with this task in the way requested.
    Here's why: [specific constitutional constraint]
    Here's what I can do instead: [alternative]
```

---

## PART IV: GENERATED RUNTIME SCHEMA

```typescript
interface GeneratedRuntime {
  // Identity
  id: string;                    // e.g., "NEGOTIATION_PREP_001"
  type: "generated";
  generated_at: string;          // ISO timestamp
  task_hash: string;             // hash of original task for audit
  
  // Scope
  domain: string;                // primary domain
  description: string;           // what this runtime does
  
  // Capabilities
  tools_allowed: ToolID[];
  tools_forbidden: ToolID[];
  
  // Completion
  completion_criteria: CompletionCriterion[];
  verify_rules: VerifyRule[];
  
  // Limits
  max_iterations: number;        // typically 3-5
  max_duration_minutes: number;  // typically 15-30
  
  // Constitutional compliance
  constitutional_check: {
    passed: true;                // must be true to execute
    checked_at: string;
    invariants_verified: string[];
  };
  
  // User-facing
  transparency: {
    description_for_user: string;  // "I'm going to help you prepare for negotiation by..."
    completion_signal: string;     // "We're done when..."
  };
}
```

---

## PART V: EXAMPLE — NEGOTIATION PREP

### User Request

```
"Aiutami a preparare la negoziazione con il fornitore X per il rinnovo del contratto"
```

### Generated Runtime

```yaml
id: NEGOTIATION_PREP_001
type: generated
generated_at: "2025-12-25T10:30:00Z"
task_hash: "a1b2c3..."

domain: negotiation_preparation
description: |
  Prepare user for supplier contract negotiation by:
  - Analyzing counterparty position
  - Identifying user's BATNA
  - Structuring talking points
  - Anticipating objections

tools_allowed:
  - research_counterparty_public_info
  - structure_arguments
  - identify_batna
  - draft_talking_points
  - anticipate_objections
  - role_play_scenarios

tools_forbidden:
  - decide_final_offer           # normative delegation
  - commit_to_terms              # normative delegation  
  - set_walk_away_price          # normative delegation
  - manipulate_framing           # ethical violation
  - recommend_specific_number    # normative delegation

completion_criteria:
  - id: counterparty_profile
    description: "Counterparty position and interests mapped"
    required: true
    
  - id: user_batna
    description: "User's BATNA articulated by user"
    required: true
    
  - id: talking_points
    description: "Talking points drafted"
    required: true
    
  - id: user_confirmation
    description: "User confirms they feel prepared"
    required: true

verify_rules:
  - id: no_commitment_language
    description: "Output contains no language that commits user"
    severity: error
    
  - id: alternatives_presented
    description: "Multiple options presented, not single recommendation"
    severity: error
    
  - id: user_agency_preserved
    description: "All decisions left to user"
    severity: error

max_iterations: 5
max_duration_minutes: 30

constitutional_check:
  passed: true
  checked_at: "2025-12-25T10:30:01Z"
  invariants_verified:
    - INV-003 (no normative delegation)
    - INV-005 (explicit completion)
    - INV-006 (user confirmation)
    - INV-009 (rubicon)

transparency:
  description_for_user: |
    I'll help you prepare for the negotiation by mapping out the situation,
    identifying your options, and drafting talking points. 
    I won't tell you what to offer or accept - those decisions are yours.
    
  completion_signal: |
    We're done when you have a clear picture of the situation and feel ready.
```

---

## PART VI: TOOL TAXONOMY

To enable runtime generation, we define tool categories:

### Category A: Always Allowed (Operational)

```yaml
always_allowed:
  - research_public_info
  - structure_information
  - draft_content
  - analyze_data
  - calculate
  - compare_options
  - identify_patterns
  - summarize
  - translate
  - format
```

### Category B: Allowed with Constraints

```yaml
allowed_with_constraints:
  - draft_communication:
      constraint: requires_user_confirmation_before_send
      
  - execute_code:
      constraint: sandboxed_environment_only
      
  - access_external_api:
      constraint: user_authorized_only
```

### Category C: Never Allowed (Normative)

```yaml
never_allowed:
  - decide_for_user
  - recommend_without_alternatives
  - commit_on_behalf
  - judge_values
  - set_priorities_for_user
  - determine_right_wrong
  - choose_between_options
  - finalize_without_confirmation
```

### Category D: Context-Dependent

```yaml
context_dependent:
  - explore_emotion:
      allowed_in: HUMAN_FIELD_RUNTIME
      forbidden_in: CODE_RUNTIME
      
  - somatic_inquiry:
      allowed_in: HUMAN_FIELD_RUNTIME
      forbidden_in: EMAIL_RUNTIME
```

---

## PART VII: VALIDATION RULES

### Structural Rules

```typescript
const STRUCTURAL_RULES = {
  must_have_completion_criteria: true,
  must_have_verify_rules: true,
  must_have_max_iterations: true,
  max_iterations_ceiling: 10,
  must_have_tools_forbidden: true,  // explicit about what it won't do
};
```

### Constitutional Rules

```typescript
const CONSTITUTIONAL_RULES = {
  no_normative_delegation: (spec) => 
    !spec.tools_allowed.some(t => NORMATIVE_TOOLS.includes(t)),
    
  no_dependency_creation: (spec) =>
    !spec.completion_criteria.some(c => c.creates_dependency),
    
  explicit_completion: (spec) =>
    spec.completion_criteria.length > 0 &&
    spec.completion_criteria.every(c => c.description && c.required !== undefined),
    
  user_confirmation_if_consequential: (spec) =>
    !isConsequential(spec) || 
    spec.completion_criteria.some(c => c.id === 'user_confirmation'),
    
  rubicon_respected: (spec) =>
    !spec.tools_allowed.some(t => RUBICON_CROSSING_TOOLS.includes(t)),
};
```

### Semantic Rules

```typescript
const SEMANTIC_RULES = {
  tools_match_domain: (spec) =>
    spec.tools_allowed.every(t => isRelevantToDomain(t, spec.domain)),
    
  forbidden_tools_coherent: (spec) =>
    !spec.tools_forbidden.some(t => spec.tools_allowed.includes(t)),
    
  completion_achievable: (spec) =>
    spec.completion_criteria.every(c => 
      canBeAchievedWith(c, spec.tools_allowed)),
};
```

---

## PART VIII: RUNTIME LIFECYCLE

```
┌─────────────┐
│   REQUEST   │
└─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  EXISTING   │────▶│    USE      │
│  RUNTIME?   │ yes │    CORE     │
└─────────────┘     └─────────────┘
       │ no
       ▼
┌─────────────┐
│  GENERATE   │
│   RUNTIME   │
└─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  VALIDATE   │────▶│   REJECT    │
│             │fail │  + EXPLAIN  │
└─────────────┘     └─────────────┘
       │ pass
       ▼
┌─────────────┐
│   EXECUTE   │
│  (S4 ACT)   │
└─────────────┘
       │
       ▼
┌─────────────┐
│   VERIFY    │
│  (S5)       │
└─────────────┘
       │
       ▼
┌─────────────┐
│    STOP     │
│   (S6)      │
└─────────────┘
       │
       ▼
┌─────────────┐
│   DISCARD   │  (generated runtimes are not stored)
│   RUNTIME   │  (can be regenerated if needed)
└─────────────┘
```

---

## PART IX: WHAT THIS ENABLES

### The Promise

ENOQ can help with **any operationally delegable task**.

- "Write a speech for my father's funeral" → GRIEF_SPEECH_RUNTIME (generated)
- "Prepare my investor pitch" → PITCH_PREP_RUNTIME (generated)
- "Design a team offsite" → EVENT_DESIGN_RUNTIME (generated)
- "Analyze this legal contract" → CONTRACT_ANALYSIS_RUNTIME (generated)
- "Help me process this diagnosis" → HEALTH_PROCESSING_RUNTIME (generated)

### The Limit

ENOQ cannot help with **normatively delegated tasks**.

- "Decide if I should take the job" → ❌ (normative delegation)
- "Tell me what's the right thing to do" → ❌ (normative delegation)
- "Choose the best option for me" → ❌ (normative delegation)

### The Boundary

The boundary is **structural**, not policy-based.

The Constitution makes it impossible to generate a runtime that crosses the Rubicon.

Not "we choose not to."

"We cannot."

---

*"A system that can do anything except what it shouldn't is more powerful than a system that can do anything."*
