# ENOQ RUNTIME VALIDATION v1.0

**Document ID:** ENOQ-RUNTIME-VALIDATION  
**Status:** Core Technical Reference  
**Date:** 2025-12-25  
**Purpose:** Define how generated runtimes are validated  

---

## The Problem

Runtime Generator creates RuntimeSpecs.
How do we ensure they don't violate the Constitution?

**The CTO critique is correct:** This is a potential arbitrary code execution risk.

---

## The Solution: Runtimes Are NOT Code

**Critical clarification:**

```yaml
runtime_is_not_code:
  wrong_model: "LLM generates executable code"
  correct_model: "LLM selects from pre-approved components"
  
  a_runtime_is:
    - A configuration object
    - Specifying which PRE-BUILT tools to use
    - With which parameters
    - In which sequence
    
  a_runtime_is_not:
    - Executable code
    - Arbitrary function calls
    - System commands
    - Unbounded behavior
```

---

## RuntimeSpec Structure

```yaml
runtime_spec:
  id: string                    # Auto-generated UUID
  name: string                  # Human-readable
  
  # What this runtime can do (from whitelist)
  tools_allowed: ToolID[]       # From TOOL_WHITELIST
  tools_forbidden: ToolID[]     # Explicit exclusions
  
  # Configuration
  mode: singular | dialectical | parallel | processual
  depth: surface | medium | deep
  pacing: slow | normal | responsive
  
  # Primitives (from primitive library)
  primitives_enabled: PrimitiveID[]  # From PRIMITIVE_LIBRARY
  
  # Completion criteria (structured, not freeform)
  completion_criteria:
    type: checklist | threshold | user_signal
    items: CompletionItem[]
    
  # Metadata
  generated_at: timestamp
  generator_version: string
  validation_status: pending | passed | failed
```

---

## The Validation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   LLM GENERATES RuntimeSpec                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STAGE 1: STRUCTURAL VALIDATION (Deterministic)                │
│                                                                 │
│   ✓ All fields present and typed correctly                      │
│   ✓ tools_allowed ⊆ TOOL_WHITELIST                             │
│   ✓ primitives_enabled ⊆ PRIMITIVE_LIBRARY                     │
│   ✓ mode ∈ {singular, dialectical, parallel, processual}       │
│   ✓ No unknown fields                                           │
│                                                                 │
│   FAIL → Reject immediately                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STAGE 2: CONSTITUTIONAL VALIDATION (Deterministic)            │
│                                                                 │
│   ✓ No forbidden tool combinations                              │
│   ✓ No tools that enable normative delegation                   │
│   ✓ Completion criteria are achievable                          │
│   ✓ Runtime does not create dependency patterns                 │
│                                                                 │
│   Rules (examples):                                             │
│   - If tool "recommend" in allowed → FAIL                       │
│   - If tool "decide_for_user" in allowed → FAIL                 │
│   - If completion requires user_returns → FAIL                  │
│                                                                 │
│   FAIL → Reject immediately                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STAGE 3: SEMANTIC VALIDATION (Classifier)                     │
│                                                                 │
│   Fine-tuned classifier checks:                                 │
│   - Does this runtime description suggest normative outputs?    │
│   - Does the combination of tools suggest boundary violation?   │
│                                                                 │
│   Score threshold: 0.8                                          │
│   Below threshold → Reject or downgrade                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STAGE 4: FALLBACK ASSIGNMENT                                  │
│                                                                 │
│   If validation fails but request is legitimate:                │
│   → Assign nearest safe pre-built runtime                       │
│   → Log the attempted generation for review                     │
│                                                                 │
│   Fallback order:                                               │
│   1. HUMAN_FIELD (safest)                                       │
│   2. V_MODE (no output risk)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   VALIDATED RUNTIME → Ready for execution in S4                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Whitelists

### TOOL_WHITELIST

```yaml
tool_whitelist:
  always_allowed:
    - map_options          # Show options without ranking
    - reflect_back         # Mirror user's words
    - ask_question         # Request clarification
    - visualize_field      # Show what's active
    - name_domain          # Identify domain
    - summarize            # Compress information
    - structure            # Organize user's thoughts
    - write_draft          # Create document draft
    - analyze              # Examine data/situation
    
  allowed_with_constraints:
    - compare:
        constraint: "No 'better' or 'worse' without explicit criteria"
    - project:
        constraint: "Show multiple futures, not recommended future"
    - somatic_inquiry:
        constraint: "Only if depth_accessible >= medium"
        
  never_allowed:
    - recommend            # Implies preference
    - decide               # Takes agency
    - rank_options         # Implies value judgment
    - predict_best         # Normative delegation
    - should               # Prescriptive
    - evaluate_choice      # Post-hoc judgment
```

### PRIMITIVE_LIBRARY

```yaml
primitive_library:
  grounding:
    - P01_ground
    - P02_co_regulate
    - P03_validate
    
  exploration:
    - P04_name
    - P05_normalize
    - P06_explore
    - P07_track
    
  deepening:
    - P08_somatic_inquiry
    - P09_mirror
    - P10_synthesize
    
  holding:
    - P11_hold
    - P12_silence
    - P13_invite_meaning
    - P14_witness_paradox
    
  returning:
    - P15_return_agency
    - P16_visualize_threshold
    - P17_name_weight
```

---

## Validation Rules (Deterministic)

```python
def validate_runtime(spec: RuntimeSpec) -> ValidationResult:
    
    # Stage 1: Structural
    if not all_fields_present(spec):
        return ValidationResult(status="FAIL", reason="missing_fields")
    
    if not spec.tools_allowed.issubset(TOOL_WHITELIST):
        return ValidationResult(status="FAIL", reason="unknown_tools")
    
    if not spec.primitives_enabled.issubset(PRIMITIVE_LIBRARY):
        return ValidationResult(status="FAIL", reason="unknown_primitives")
    
    # Stage 2: Constitutional
    for tool in spec.tools_allowed:
        if tool in NEVER_ALLOWED_TOOLS:
            return ValidationResult(status="FAIL", reason="forbidden_tool")
    
    for combo in FORBIDDEN_COMBINATIONS:
        if combo.issubset(spec.tools_allowed):
            return ValidationResult(status="FAIL", reason="forbidden_combo")
    
    if creates_dependency_pattern(spec.completion_criteria):
        return ValidationResult(status="FAIL", reason="dependency_risk")
    
    # Stage 3: Semantic (classifier)
    semantic_score = classifier.score(spec)
    if semantic_score < 0.8:
        return ValidationResult(status="FAIL", reason="semantic_risk", score=semantic_score)
    
    return ValidationResult(status="PASS")
```

---

## Forbidden Combinations

```yaml
forbidden_combinations:
  - [compare, evaluate_choice]      # Becomes implicit ranking
  - [project, recommend]            # Becomes prediction of "best"
  - [somatic_inquiry, decide]       # Uses body to justify decision
  - [synthesize, should]            # Synthesis becomes prescription
```

---

## Fallback Behavior

```yaml
fallback_behavior:
  on_validation_fail:
    step_1: "Log full RuntimeSpec for review"
    step_2: "Identify closest valid runtime"
    step_3: "Assign fallback runtime"
    step_4: "Continue with fallback"
    
  fallback_priority:
    1: HUMAN_FIELD (mode: singular, depth: surface)
    2: V_MODE
    3: CLARIFY (ask user for more context)
    
  never_fail_silently:
    - Always respond to user
    - May acknowledge: "Let me approach this more simply"
    - Never expose validation internals
```

---

## Why This Eliminates ACE Risk

```yaml
ace_prevention:
  1_no_code_execution:
    - RuntimeSpec is data, not code
    - No eval(), no exec(), no subprocess
    
  2_whitelist_only:
    - Only pre-approved tools can be used
    - Tools are implemented by ENOQ developers
    - LLM cannot create new tools
    
  3_parameter_bounds:
    - Parameters have type constraints
    - Out-of-bounds → validation fails
    
  4_semantic_check:
    - Even valid combinations are checked for intent
    - Classifier catches "technically valid but ethically wrong"
    
  5_fallback_exists:
    - Worst case: use safest runtime
    - Never arbitrary behavior
```

---

## Validation Performance

```yaml
performance:
  stage_1_structural: O(n) where n = fields
  stage_2_constitutional: O(t * c) where t = tools, c = combinations
  stage_3_semantic: ~10-50ms (classifier inference)
  
  total: < 100ms for typical RuntimeSpec
  
  caching:
    - Cache validated RuntimeSpecs by hash
    - Same spec = instant validation
```

---

*"The LLM proposes. The validator disposes."*
