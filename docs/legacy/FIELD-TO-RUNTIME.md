# ENOQ FIELD TO RUNTIME MAPPING v1.0

**Document ID:** ENOQ-FIELD-TO-RUNTIME  
**Status:** Core Protocol  
**Date:** 2025-12-25  
**Resolves:** Gap #3 (FieldModel → Runtime Selection)  

---

## Purpose

This document defines the **explicit mapping** from FieldModel to Runtime.

No ambiguity. No "rule-based" handwaving. Actual rules.

---

## Input: FieldModel

```yaml
field_model:
  # From S0 RequestIntent
  request_intent:
    category: operational | normative | mixed | crisis
    delegation_attempt: boolean
    threshold_proximity: float  # 0.0-1.0
  
  # From S1 SENSE
  primary_domain: DomainID
  secondary_domains: DomainID[]
  arousal: high | medium | low
  depth_accessible: surface | medium | deep
  
  # Complexity signals (replaces kegan_stage)
  complexity_signals:
    framing: simple | compound | paradox
    perspective: self | other | system | meta
    ambiguity_tolerance: binary | spectrum | paradox
  
  # Task detection
  has_deliverable: boolean
  deliverable_type: email | code | document | analysis | plan | none
```

---

## Output: RuntimeSelection

```yaml
runtime_selection:
  runtime_id: HUMAN_FIELD | DECISION | V_MODE | OPERATIONAL | GENERATED
  mode: singular | dialectical | parallel | processual
  depth: surface | medium | deep
  pacing: slow | normal | responsive
  primitives_enabled: PrimitiveID[]
  primitives_disabled: PrimitiveID[]
```

---

## The Master Mapping

### Level 0: Crisis Override

```yaml
rule_crisis:
  if:
    request_intent.category == crisis
  then:
    runtime: EMERGENCY
    mode: singular
    depth: surface
    pacing: slow
    note: "All other rules bypassed"
```

### Level 1: Normative Delegation → V-MODE

```yaml
rule_normative:
  if:
    request_intent.category == normative
    OR request_intent.delegation_attempt == true
  then:
    runtime: V_MODE
    mode: singular
    depth: medium
    pacing: slow
```

### Level 2: Pure Operational → OPERATIONAL Runtime

```yaml
rule_operational:
  if:
    request_intent.category == operational
    AND has_deliverable == true
  then:
    runtime: OPERATIONAL
    sub_runtime: based on deliverable_type
      email → EMAIL_RUNTIME
      code → CODE_RUNTIME
      document → DOCUMENT_RUNTIME
      analysis → ANALYSIS_RUNTIME
      plan → PLANNING_RUNTIME
    mode: singular
    depth: surface
    pacing: responsive
```

### Level 3: Human Field Selection

```yaml
rule_human_field:
  if:
    request_intent.category == operational
    AND has_deliverable == false
    AND primary_domain IN [H01-H17 human domains]
  then:
    runtime: HUMAN_FIELD
    mode: determined by sub-rules
    depth: determined by arousal + accessibility
    pacing: determined by arousal
```

### Level 4: Decision Support

```yaml
rule_decision:
  if:
    primary_domain == H05_COGNITION
    AND secondary_domains CONTAINS [H06_MEANING OR H07_IDENTITY]
    AND request_intent.threshold_proximity > 0.3
    AND request_intent.delegation_attempt == false
  then:
    runtime: DECISION
    mode: parallel OR dialectical
    depth: medium OR deep
    pacing: slow
```

---

## Detailed Sub-Rules

### HUMAN_FIELD Mode Selection

```yaml
human_field_mode:
  singular:
    when:
      - arousal == high
      - coherence == low
      - kegan_stage <= 3
      - depth_accessible == surface
    what: "One clear response"
    
  dialectical:
    when:
      - primary_domain IN [H06_MEANING, H07_IDENTITY]
      - kegan_stage >= 4
      - paradox_detected == true
    what: "Hold opposites without resolving"
    
  parallel:
    when:
      - primary_domain IN [H05_COGNITION, H10_COORDINATION, H12_POWER]
      - multiple_perspectives_needed == true
    what: "Multiple frames simultaneously"
    
  processual:
    when:
      - arousal == low OR medium
      - depth_accessible == deep
      - time_available == true
    what: "Unfold over multiple exchanges"
```

### HUMAN_FIELD Depth Selection

```yaml
human_field_depth:
  surface:
    when:
      - arousal == high
      - user_defended == true
      - depth_accessible == surface
    primitives: [P01_ground, P02_co_regulate, P03_validate]
    
  medium:
    when:
      - arousal == medium
      - depth_accessible >= medium
    primitives: [P03_validate, P04_name, P06_explore, P08_somatic]
    
  deep:
    when:
      - arousal == low OR medium
      - depth_accessible == deep
      - kegan_stage >= 4
    primitives: [P06_explore, P13_invite_meaning, P14_witness_paradox]
```

### HUMAN_FIELD Pacing Selection

```yaml
human_field_pacing:
  slow:
    when: arousal == high
    behavior: longer pauses, shorter sentences, grounding first
    
  normal:
    when: arousal == medium
    behavior: matched rhythm, responsive
    
  responsive:
    when: arousal == low AND operational_task == true
    behavior: efficient, task-focused
```

---

## Decision Runtime Configuration

```yaml
decision_mode:
  parallel:
    when:
      - multiple_stakeholders == true
      - complexity == high
    what: "Show multiple perspectives simultaneously"
    
  dialectical:
    when:
      - values_conflict == true
      - kegan_stage >= 4
    what: "Hold the tension without forcing resolution"
```

---

## Complete Decision Table

| Category | Delegation | Deliverable | Primary Domain | Threshold | → Runtime | Mode |
|----------|------------|-------------|----------------|-----------|-----------|------|
| crisis | * | * | * | * | EMERGENCY | singular |
| normative | true | * | * | * | V_MODE | singular |
| operational | false | email | * | * | EMAIL | singular |
| operational | false | code | * | * | CODE | singular |
| operational | false | document | * | * | DOCUMENT | singular |
| operational | false | none | H04_EMOTION | * | HUMAN_FIELD | by arousal |
| operational | false | none | H05_COGNITION | >0.3 | DECISION | parallel |
| operational | false | none | H06_MEANING | * | HUMAN_FIELD | processual |
| operational | false | none | H07_IDENTITY | * | HUMAN_FIELD | dialectical |
| mixed | unclear | * | * | * | CLARIFY → reprocess |

---

## Fallback Rules

```yaml
fallbacks:
  no_match:
    action: "Default to HUMAN_FIELD with medium depth"
    rationale: "Safe, exploratory, non-committal"
    
  uncertain_domain:
    action: "S2 CLARIFY before runtime selection"
    question: "Ask one clarifying question"
    
  conflicting_signals:
    action: "Prefer safer option"
    order: [V_MODE, HUMAN_FIELD, DECISION, OPERATIONAL]
```

---

## Examples

### Example 1

```yaml
input:
  request: "I feel stuck in my career"
  
field_model:
  request_intent:
    category: operational
    delegation_attempt: false
    threshold_proximity: 0.4
  primary_domain: H06_MEANING
  secondary_domains: [H07_IDENTITY, H05_COGNITION]
  arousal: medium
  depth_accessible: medium
  has_deliverable: false

output:
  runtime: HUMAN_FIELD
  mode: processual
  depth: medium
  pacing: normal
  primitives_enabled: [P03, P04, P06, P08, P13]
```

### Example 2

```yaml
input:
  request: "Should I accept the job offer?"
  
field_model:
  request_intent:
    category: normative
    delegation_attempt: true
    threshold_proximity: 0.7
  primary_domain: H05_COGNITION
  has_deliverable: false

output:
  runtime: V_MODE  # Delegation attempt detected
  mode: singular
  depth: medium
  pacing: slow
```

### Example 3

```yaml
input:
  request: "Help me think through this job decision"
  
field_model:
  request_intent:
    category: operational
    delegation_attempt: false  # "help me think" ≠ "decide for me"
    threshold_proximity: 0.6
  primary_domain: H05_COGNITION
  secondary_domains: [H06_MEANING, H07_IDENTITY]
  arousal: medium
  has_deliverable: false

output:
  runtime: DECISION
  mode: parallel
  depth: medium
  pacing: slow
```

### Example 4

```yaml
input:
  request: "Write an email to my team about the delay"
  
field_model:
  request_intent:
    category: operational
    delegation_attempt: false
    threshold_proximity: 0.0
  primary_domain: H10_COORDINATION
  has_deliverable: true
  deliverable_type: email

output:
  runtime: EMAIL
  mode: singular
  depth: surface
  pacing: responsive
```

---

## Integration Point

This mapping is executed in **S3 PLAN**.

```python
def select_runtime(field_model: FieldModel) -> RuntimeSelection:
    # Level 0: Crisis
    if field_model.request_intent.category == "crisis":
        return RuntimeSelection(runtime="EMERGENCY", mode="singular", ...)
    
    # Level 1: Normative
    if field_model.request_intent.category == "normative" \
       or field_model.request_intent.delegation_attempt:
        return RuntimeSelection(runtime="V_MODE", mode="singular", ...)
    
    # Level 2: Operational with deliverable
    if field_model.has_deliverable:
        return select_operational_runtime(field_model.deliverable_type)
    
    # Level 3: Human field or Decision
    if field_model.request_intent.threshold_proximity > 0.3 \
       and field_model.primary_domain == "H05_COGNITION":
        return RuntimeSelection(runtime="DECISION", ...)
    
    # Level 4: Default to Human Field
    return configure_human_field_runtime(field_model)
```

---

*"Ambiguity in routing is failure in design."*
