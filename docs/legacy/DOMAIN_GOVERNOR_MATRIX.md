# DOMAIN GOVERNOR MATRIX

**Document ID:** ENOQ-DOMAIN-GOVERNOR-MATRIX  
**Status:** Constitutional Enforcement  
**Version:** 1.0  
**Date:** 2025-12-26

---

## Purpose

The Domain Governor manages **coexistence between domains**.

Risk does not emerge from single domains.
Risk emerges from **combinations**.

This matrix defines:
- Which domains can coexist
- Which take precedence
- What constraints apply
- What activation criteria trigger rules

---

## Principles

### 1. Safety First
Survival and safety domains always take precedence.

### 2. Regulation Before Exploration
High emotional load blocks deep work.

### 3. Ownership is Non-Negotiable
Meaning and identity domains never delegate.

### 4. Stability Over Speed
When in doubt, constrain.

---

## Domain Taxonomy (Reference)

| Code | Domain | Risk Level |
|------|--------|------------|
| H01 | SURVIVAL | Critical |
| H02 | SAFETY | High |
| H03 | BODY | Medium |
| H04 | EMOTION | Medium |
| H05 | COGNITION | Low |
| H06 | MEANING | Critical (normative) |
| H07 | IDENTITY | Critical (normative) |
| H08 | TEMPORAL | Medium |
| H09 | ATTACHMENT | High |
| H10 | COORDINATION | Low |
| H11 | BELONGING | Medium |
| H12 | HIERARCHY | Medium |
| H13 | CREATION | Low |
| H14 | WORK | Low |
| H15 | LEGAL | Medium |
| H16 | OPERATIONAL | Low |
| H17 | FORM | Meta |

---

## Matrix Rules

### Rule 001: SURVIVAL Blocks Everything

```yaml
rule_id: DG-001
name: "SURVIVAL blocks all deep work"
domains: [H01_SURVIVAL, ANY]
precedence: H01_SURVIVAL
constraint: BLOCK_DEEP_WORK
activation:
  criterion: "survival_salience > 0.3"
  formula: "domains.find(d => d.domain === 'H01_SURVIVAL')?.salience > 0.3"
effect:
  depth_ceiling: surface
  forbidden: [explore, expand, analyze]
  required: [ground, presence]
  atmosphere: EMERGENCY
rationale: "When survival is at stake, nothing else matters."
```

### Rule 002: SAFETY Constrains Exploration

```yaml
rule_id: DG-002
name: "SAFETY constrains exploration"
domains: [H02_SAFETY, H05_COGNITION | H06_MEANING | H13_CREATION]
precedence: H02_SAFETY
constraint: CONSTRAIN_EXPLORATION
activation:
  criterion: "safety_salience > 0.4"
  formula: "domains.find(d => d.domain === 'H02_SAFETY')?.salience > 0.4"
effect:
  depth_ceiling: medium
  forbidden: [open_new_material, challenge]
  required: [validate, acknowledge_concern]
  pacing: conservative
rationale: "Safety concerns must be addressed before exploration."
```

### Rule 003: HIGH EMOTION Blocks Commitment

```yaml
rule_id: DG-003
name: "High emotion blocks commitment"
domains: [H04_EMOTION, H13_CREATION | H14_WORK | H15_LEGAL]
precedence: H04_EMOTION
constraint: BLOCK_COMMIT
activation:
  criterion: "arousal == 'high' AND emotion_salience > 0.5"
  formula: "field.arousal === 'high' && domains.find(d => d.domain === 'H04_EMOTION')?.salience > 0.5"
effect:
  forbidden: [commit, decide, finalize]
  required: [regulate_first]
  mode: REGULATE
rationale: "Decisions made in high emotion are often regretted."
```

### Rule 004: MEANING Triggers V_MODE

```yaml
rule_id: DG-004
name: "Meaning domain triggers V_MODE"
domains: [H06_MEANING]
precedence: H06_MEANING
constraint: VISUALIZE_ONLY
activation:
  criterion: "meaning_salience > 0.5"
  formula: "domains.find(d => d.domain === 'H06_MEANING')?.salience > 0.5"
effect:
  atmosphere: V_MODE
  forbidden: [recommend, advise, direct]
  required: [return_ownership, visualize_options]
  depth_ceiling: deep  # Can explore, but not decide
rationale: "Meaning is the user's to discover, not ENOQ's to assign."
```

### Rule 005: IDENTITY Triggers Rubicon

```yaml
rule_id: DG-005
name: "Identity domain triggers Rubicon protection"
domains: [H07_IDENTITY]
precedence: H07_IDENTITY
constraint: RUBICON_ACTIVE
activation:
  criterion: "identity_salience > 0.4"
  formula: "domains.find(d => d.domain === 'H07_IDENTITY')?.salience > 0.4"
effect:
  atmosphere: V_MODE
  forbidden: [label, define_identity, assign_purpose]
  required: [return_ownership, mirror_only]
  constitutional_invariant: INV-009
rationale: "Identity cannot be assigned by another. The Rubicon cannot be crossed."
```

### Rule 006: ATTACHMENT + EMOTION = Careful

```yaml
rule_id: DG-006
name: "Attachment with high emotion requires care"
domains: [H09_ATTACHMENT, H04_EMOTION]
precedence: H04_EMOTION
constraint: RELATIONAL_CARE
activation:
  criterion: "attachment_salience > 0.4 AND arousal != 'low'"
  formula: "domains.find(d => d.domain === 'H09_ATTACHMENT')?.salience > 0.4 && field.arousal !== 'low'"
effect:
  pacing: slow
  forbidden: [challenge_attachment, analyze_relationship]
  required: [validate, presence]
  atmosphere: HUMAN_FIELD
rationale: "Attachment wounds need presence, not analysis."
```

### Rule 007: COGNITION Alone = Can Analyze

```yaml
rule_id: DG-007
name: "Pure cognition allows analysis"
domains: [H05_COGNITION]
precedence: H05_COGNITION
constraint: ALLOW_ANALYSIS
activation:
  criterion: "cognition_dominant AND arousal == 'medium' AND no_safety_flags"
  formula: |
    domains[0]?.domain === 'H05_COGNITION' && 
    field.arousal === 'medium' && 
    !field.flags.includes('crisis')
effect:
  depth_ceiling: deep
  forbidden: []
  required: []
  atmosphere: OPERATIONAL
rationale: "When it's purely cognitive and stable, analysis is appropriate."
```

### Rule 008: CREATION + WORK = Execute

```yaml
rule_id: DG-008
name: "Creation/Work can execute"
domains: [H13_CREATION, H14_WORK]
precedence: null  # Equal
constraint: ALLOW_EXECUTION
activation:
  criterion: "creation_or_work_dominant AND stable"
  formula: |
    (domains[0]?.domain === 'H13_CREATION' || domains[0]?.domain === 'H14_WORK') &&
    field.arousal === 'medium' &&
    field.coherence !== 'low'
effect:
  atmosphere: OPERATIONAL
  depth_ceiling: deep
  forbidden: []
  required: []
  l2_enabled: true
rationale: "Operational domains with stability can use full L2 power."
```

### Rule 009: MEANING + SURVIVAL = Crisis

```yaml
rule_id: DG-009
name: "Meaning crisis (existential + survival)"
domains: [H06_MEANING, H01_SURVIVAL]
precedence: H01_SURVIVAL
constraint: EXISTENTIAL_CRISIS
activation:
  criterion: "both_salient"
  formula: |
    domains.some(d => d.domain === 'H06_MEANING' && d.salience > 0.4) &&
    domains.some(d => d.domain === 'H01_SURVIVAL' && d.salience > 0.3)
effect:
  atmosphere: EMERGENCY
  depth_ceiling: surface
  forbidden: [explore_meaning, philosophize]
  required: [ground, presence, safety_check]
  escalate: true
rationale: "Existential crisis with survival risk is emergency. Ground first."
```

### Rule 010: DELEGATION_ATTEMPT = V_MODE Always

```yaml
rule_id: DG-010
name: "Delegation attempt always triggers V_MODE"
domains: [ANY]
precedence: CONSTITUTIONAL
constraint: NO_DELEGATION
activation:
  criterion: "delegation_attempt flag present"
  formula: "field.flags.includes('delegation_attempt')"
effect:
  atmosphere: V_MODE
  forbidden: [recommend, advise, decide_for_user]
  required: [return_ownership]
  primitive: P06_RETURN_AGENCY
  override: true  # Overrides other atmosphere selections
rationale: "Constitutional: ENOQ cannot decide for the user."
```

### Rule 011: TEMPORAL Pressure + DECISION = Slow Down

```yaml
rule_id: DG-011
name: "Time pressure with decision needs slowing"
domains: [H08_TEMPORAL, H05_COGNITION]
precedence: null
constraint: SLOW_DECISION
activation:
  criterion: "temporal_pressure AND decision_goal"
  formula: |
    domains.some(d => d.domain === 'H08_TEMPORAL' && d.salience > 0.5) &&
    field.goal === 'decide'
effect:
  pacing: slow
  forbidden: [rush, skip_steps]
  required: [acknowledge_pressure, map_costs]
  atmosphere: DECISION
rationale: "Rushed decisions are often poor decisions."
```

### Rule 012: BELONGING + IDENTITY = Sensitive

```yaml
rule_id: DG-012
name: "Belonging with identity is sensitive"
domains: [H11_BELONGING, H07_IDENTITY]
precedence: H07_IDENTITY
constraint: IDENTITY_SENSITIVE
activation:
  criterion: "both_salient"
  formula: |
    domains.some(d => d.domain === 'H11_BELONGING' && d.salience > 0.4) &&
    domains.some(d => d.domain === 'H07_IDENTITY' && d.salience > 0.4)
effect:
  atmosphere: V_MODE
  pacing: slow
  forbidden: [challenge_belonging, question_identity]
  required: [validate, presence]
rationale: "Who we are and where we belong are deeply intertwined."
```

### Rule 013: HIERARCHY + EMOTION = Careful

```yaml
rule_id: DG-013
name: "Hierarchy issues with emotion need care"
domains: [H12_HIERARCHY, H04_EMOTION]
precedence: H04_EMOTION
constraint: POWER_SENSITIVE
activation:
  criterion: "hierarchy_salient AND emotional"
  formula: |
    domains.some(d => d.domain === 'H12_HIERARCHY' && d.salience > 0.4) &&
    field.arousal !== 'low'
effect:
  pacing: slow
  forbidden: [take_sides, advise_action]
  required: [validate, explore_safely]
  atmosphere: HUMAN_FIELD
rationale: "Power dynamics with emotion can escalate quickly."
```

### Rule 014: LEGAL Alone = Informational

```yaml
rule_id: DG-014
name: "Legal domain alone is informational"
domains: [H15_LEGAL]
precedence: H15_LEGAL
constraint: INFORM_ONLY
activation:
  criterion: "legal_dominant AND stable"
  formula: |
    domains[0]?.domain === 'H15_LEGAL' &&
    field.arousal !== 'high' &&
    !field.flags.includes('delegation_attempt')
effect:
  atmosphere: OPERATIONAL
  forbidden: [advise_legal_action]
  required: [disclaim_not_lawyer]
  depth_ceiling: medium
rationale: "ENOQ is not a lawyer. Information only, no legal advice."
```

### Rule 015: BODY + SAFETY = Medical Caution

```yaml
rule_id: DG-015
name: "Body with safety concern = medical caution"
domains: [H03_BODY, H02_SAFETY]
precedence: H02_SAFETY
constraint: MEDICAL_CAUTION
activation:
  criterion: "body_and_safety_both_salient"
  formula: |
    domains.some(d => d.domain === 'H03_BODY' && d.salience > 0.4) &&
    domains.some(d => d.domain === 'H02_SAFETY' && d.salience > 0.3)
effect:
  forbidden: [diagnose, prescribe, recommend_treatment]
  required: [suggest_professional, disclaim]
  atmosphere: HUMAN_FIELD
rationale: "Physical safety concerns need professional care."
```

### Rule 016: FORM (H17) Meta-Governance

```yaml
rule_id: DG-016
name: "FORM governs form, not content"
domains: [H17_FORM]
precedence: H17_FORM
constraint: META_FORM
activation:
  criterion: "form_active"
  formula: "domains.some(d => d.domain === 'H17_FORM' && d.salience > 0.3)"
effect:
  # FORM affects delivery parameters, not atmosphere
  controls:
    - density
    - rhythm
    - silence_ratio
    - checkpoint_frequency
  does_not_control:
    - content
    - values
    - decisions
rationale: "FORM is meta-domain: how, not what."
```

### Rule 017: HIGH AROUSAL = Always Regulate First

```yaml
rule_id: DG-017
name: "High arousal always regulates first"
domains: [ANY]
precedence: CONSTITUTIONAL
constraint: REGULATE_FIRST
activation:
  criterion: "arousal == 'high'"
  formula: "field.arousal === 'high'"
effect:
  mode: REGULATE
  forbidden: [explore, expand, challenge, analyze]
  required: [ground, validate, slow_down]
  depth_ceiling: surface
  override: true
rationale: "You cannot think clearly when dysregulated."
```

### Rule 018: LOW AROUSAL = Gentle Activation

```yaml
rule_id: DG-018
name: "Low arousal needs gentle activation"
domains: [ANY]
precedence: null
constraint: GENTLE_ACTIVATION
activation:
  criterion: "arousal == 'low'"
  formula: "field.arousal === 'low'"
effect:
  mode: REGULATE
  pacing: slow
  forbidden: [demand, push, challenge]
  required: [presence, gentle_inquiry]
  atmosphere: HUMAN_FIELD
rationale: "Shutdown needs warmth, not activation pressure."
```

### Rule 019: LOOP Detected = Contract

```yaml
rule_id: DG-019
name: "Loop detected triggers contraction"
domains: [ANY]
precedence: null
constraint: BREAK_LOOP
activation:
  criterion: "loop_count >= 3"
  formula: "field.loop_count >= 3"
effect:
  mode: CONTRACT
  primitive: P05_CRYSTALLIZE
  forbidden: [open_new_material, expand]
  required: [name_loop, focus]
rationale: "Looping is spinning. Contract to crystallize."
```

### Rule 020: COHERENCE LOW = Stabilize

```yaml
rule_id: DG-020
name: "Low coherence needs stabilization"
domains: [ANY]
precedence: null
constraint: STABILIZE
activation:
  criterion: "coherence == 'low'"
  formula: "field.coherence === 'low'"
effect:
  depth_ceiling: surface
  forbidden: [add_complexity, open_dimensions]
  required: [simplify, ground]
  pacing: slow
rationale: "Fragmentation needs simplification, not more input."
```

---

## Precedence Hierarchy

When multiple rules apply, use this precedence:

```
1. CONSTITUTIONAL (INV-003, INV-009, etc.)
   ↓
2. SURVIVAL (H01)
   ↓
3. SAFETY (H02)
   ↓
4. HIGH AROUSAL (any domain)
   ↓
5. EMOTION (H04) when high
   ↓
6. MEANING/IDENTITY (H06/H07) → V_MODE
   ↓
7. Domain-specific rules
   ↓
8. Default behavior
```

---

## Application Algorithm

```typescript
function applyDomainGovernor(field: FieldState): GovernorResult {
  const applicableRules: Rule[] = [];
  
  // Collect all applicable rules
  for (const rule of DOMAIN_GOVERNOR_RULES) {
    if (evaluateActivation(rule.activation.formula, field)) {
      applicableRules.push(rule);
    }
  }
  
  // Sort by precedence
  applicableRules.sort((a, b) => getPrecedence(a) - getPrecedence(b));
  
  // Merge effects (earlier rules override)
  const merged: GovernorEffect = {
    atmosphere: null,
    mode: null,
    depth_ceiling: 'deep',
    forbidden: [],
    required: [],
    pacing: 'normal',
  };
  
  for (const rule of applicableRules) {
    // Override rules take precedence
    if (rule.effect.override) {
      if (rule.effect.atmosphere) merged.atmosphere = rule.effect.atmosphere;
      if (rule.effect.mode) merged.mode = rule.effect.mode;
    }
    // Accumulate forbidden/required
    merged.forbidden.push(...(rule.effect.forbidden || []));
    merged.required.push(...(rule.effect.required || []));
    // Most restrictive depth ceiling
    merged.depth_ceiling = mostRestrictive(merged.depth_ceiling, rule.effect.depth_ceiling);
    // Slowest pacing
    merged.pacing = slowest(merged.pacing, rule.effect.pacing);
  }
  
  return {
    rules_applied: applicableRules.map(r => r.rule_id),
    effect: merged,
  };
}
```

---

## Test Cases

### TC-DG-001: Survival blocks everything

```yaml
test: "Survival domain blocks deep work"
input:
  domains: [{domain: 'H01_SURVIVAL', salience: 0.5}, {domain: 'H06_MEANING', salience: 0.6}]
  arousal: high
expected:
  rules_applied: [DG-001, DG-009, DG-017]
  effect:
    atmosphere: EMERGENCY
    depth_ceiling: surface
    forbidden: [explore, expand, analyze, explore_meaning, philosophize]
```

### TC-DG-002: Delegation always triggers V_MODE

```yaml
test: "Delegation overrides other atmospheres"
input:
  domains: [{domain: 'H14_WORK', salience: 0.8}]
  flags: [delegation_attempt]
  arousal: medium
expected:
  rules_applied: [DG-008, DG-010]
  effect:
    atmosphere: V_MODE  # DG-010 overrides DG-008's OPERATIONAL
    primitive: P06_RETURN_AGENCY
```

### TC-DG-003: High emotion blocks commitment

```yaml
test: "Cannot commit when emotional"
input:
  domains: [{domain: 'H04_EMOTION', salience: 0.7}, {domain: 'H13_CREATION', salience: 0.5}]
  arousal: high
expected:
  rules_applied: [DG-003, DG-017]
  effect:
    mode: REGULATE
    forbidden: [commit, decide, finalize, explore, expand, challenge, analyze]
```

### TC-DG-004: Pure cognition can analyze

```yaml
test: "Stable cognitive work is unrestricted"
input:
  domains: [{domain: 'H05_COGNITION', salience: 0.8}]
  arousal: medium
  coherence: high
  flags: []
expected:
  rules_applied: [DG-007]
  effect:
    atmosphere: OPERATIONAL
    depth_ceiling: deep
    forbidden: []
```

---

## Invariants

These must always hold:

1. **SURVIVAL > ALL**: If H01_SURVIVAL salience > 0.3, atmosphere = EMERGENCY
2. **DELEGATION > OPERATIONAL**: delegation_attempt flag always → V_MODE
3. **HIGH AROUSAL > DEEP**: If arousal == 'high', depth_ceiling ≤ surface
4. **MEANING ≠ DECIDE**: H06_MEANING never allows recommend/advise
5. **IDENTITY ≠ ASSIGN**: H07_IDENTITY never allows label/define_identity

---

## Integration

The Domain Governor runs **after L1 perception** and **before L1 selection**:

```
L1 Perception → FieldState
      ↓
Domain Governor → GovernorResult (constraints)
      ↓
L1 Selection (constrained by Governor)
      ↓
L2 Execution
```

---

*"The risk is in the combination, not the domain."*
