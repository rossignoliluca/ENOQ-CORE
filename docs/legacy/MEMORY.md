# ENOQ MEMORY ARCHITECTURE v1.0

**Document ID:** ENOQ-MEMORY  
**Status:** Core Architecture  
**Date:** 2025-12-25  
**Depends On:** AXIS/INVARIANTS.md, OS-SPEC.md  

---

## EXECUTIVE SUMMARY

ENOQ has memory. But not the kind that knows your life.

The kind that knows how to help you better.

This document defines the four types of memory, what each can and cannot store, and how they integrate with the OS without violating the Constitution.

---

## PART I: THE FOUR MEMORIES

### Overview

| Memory Type | Persistence | Content | Default |
|-------------|-------------|---------|---------|
| **Working** | Request only | Everything needed for this turn | Always on |
| **Structural** | Cross-session | Patterns, no content | Always on |
| **Artifact** | Persistent | User's work products | Always on |
| **Content** | Persistent | Personal narrative | Opt-in only |

---

## PART II: WORKING MEMORY

### Definition

```yaml
working_memory:
  name: "Working Memory"
  analogy: "RAM"
  
  persistence: request_only
  lifetime: single_turn
  
  contains:
    - current user message
    - conversation context window
    - active runtime spec
    - current field model
    - current plan
    
  does_not_persist:
    - nothing survives beyond the request
    
  governance:
    - inevitable (required for operation)
    - no consent needed (fundamental to function)
    - no storage (ephemeral by design)
```

### In the OS

```yaml
working_memory_in_os:
  S0_PERMIT: reads input, holds gate decision
  S1_SENSE: builds field model in working memory
  S2_CLARIFY: holds question and response
  S3_PLAN: holds plan in working memory
  S4_ACT: holds artifact being built
  S5_VERIFY: holds verification state
  S6_STOP: releases all
```

---

## PART III: STRUCTURAL MEMORY

### Definition

```yaml
structural_memory:
  name: "Structural Memory"
  principle: "Memory without content"
  
  persistence: cross_session
  lifetime: configurable (session / user-lifetime / decay)
  
  contains:
    # Domain patterns
    - recurring_domains: { H05: 6, H06: 4, H04: 3 }
    - domain_sequences: ["H04 → H05 often", "H06 → H07 rare"]
    
    # Intervention patterns
    - primitives_effective: { P03: high, P06: medium }
    - primitives_rejected: { P19: 2_times }
    - depth_ceiling: medium  # user rarely goes to deep
    
    # Regulation patterns
    - regulation_trajectory: improving | stable | declining
    - arousal_baseline: medium
    - grounding_effectiveness: high
    
    # Behavioral patterns
    - delegation_attempts: 3  # "fai tu" on values
    - loop_count: 2  # A→B→A oscillations
    - avoidance_signals: ["topic X avoided 2x"]
    
    # Preferences (inferred)
    - pacing_preference: slow
    - depth_preference: medium
    - tone_preference: warm
    
  does_not_contain:
    - names
    - events
    - content of conversations
    - emotional details
    - narrative
    - anything that "tells the story"
```

### Why This Matters

```yaml
structural_value:
  example_1:
    without: "User says 'I feel stuck' → generic response"
    with: "User says 'I feel stuck' + structural shows H05→H06 loop 3x 
          → recognize pattern, respond differently"
    
  example_2:
    without: "User at threshold → standard threshold protocol"
    with: "User at threshold + structural shows 2 delegation attempts 
          → extra vigilance on returning agency"
    
  example_3:
    without: "Suggest deep exploration"
    with: "Structural shows depth_ceiling = medium → don't push past"
```

### Governance

```yaml
structural_governance:
  storage:
    format: counters, enums, small arrays
    size: < 1KB per user
    
  access:
    S1_SENSE: reads for calibration
    S3_PLAN: reads for selection
    S5_VERIFY: writes updates
    
  retention:
    default: cross_session
    option_1: session_only (resets daily)
    option_2: decaying (older patterns fade)
    option_3: persistent (until user clears)
    
  user_control:
    - can view structural summary
    - can clear at any time
    - cannot be used against user
```

### What Structural Memory Enables

```yaml
enabled_capabilities:
  pattern_visualization:
    what: "Show user their own patterns"
    example: "You've returned to this question 4 times."
    
  loop_detection:
    what: "Notice oscillation"
    example: "You're moving between A and B. What if neither?"
    
  progress_reflection:
    what: "Show trajectory"
    example: "You have more clarity than 3 sessions ago."
    
  calibration:
    what: "Adjust intervention style"
    example: "Slow pacing, medium depth, grounding works"
    
  threshold_support:
    what: "Enrich threshold visualization"
    example: "Here's what you've already explored..."
```

---

## PART IV: ARTIFACT MEMORY

### Definition

```yaml
artifact_memory:
  name: "Artifact Memory"
  principle: "Your work, stored"
  
  persistence: persistent
  lifetime: until user deletes
  
  contains:
    - emails drafted
    - code written
    - documents created
    - plans structured
    - decisions mapped
    - any output user explicitly creates
    
  does_not_contain:
    - conversation content
    - emotional processing
    - personal narrative
    
  format:
    - versioned (can see history)
    - exportable (user owns)
    - deletable (user controls)
```

### Governance

```yaml
artifact_governance:
  ownership: user (absolute)
  
  operations:
    create: during S4 ACT
    read: on user request
    update: on user request
    delete: on user request
    export: always available
    
  access_by_enoq:
    - can reference for continuity
    - cannot analyze for profiling
    - cannot use to infer personal patterns
    
  storage:
    location: user-controlled (cloud / local)
    encryption: at rest and in transit
    retention: user-defined
```

### Why Separate From Content

```yaml
artifact_distinction:
  artifact: "Email draft about Q3 budget"
  content: "User feels anxious about Q3 because of relationship with CFO"
  
  artifact: stored automatically
  content: stored only with explicit consent
  
  principle: |
    Artifact is WORK.
    Content is SELF.
    Different rules apply.
```

---

## PART V: CONTENT MEMORY

### Definition

```yaml
content_memory:
  name: "Content Memory"
  principle: "Your story, only if you ask"
  
  persistence: persistent
  lifetime: until user deletes
  default: OFF
  
  contains:
    - personal history shared
    - emotional content
    - relationship details
    - life narrative
    - "Remember that I..." statements
    
  activation:
    - explicit opt-in required
    - per-category consent possible
    - reversible at any time
```

### Risks

```yaml
content_risks:
  dependency:
    risk: "User relies on ENOQ to remember who they are"
    mitigation: never_reference_without_prompting
    
  invasion:
    risk: "ENOQ knows too much"
    mitigation: minimization + user control
    
  compliance:
    risk: "GDPR, CCPA, etc."
    mitigation: full audit trail, deletion rights, portability
    
  manipulation:
    risk: "Content used to influence user"
    mitigation: constitutional prohibition
```

### Governance

```yaml
content_governance:
  consent:
    type: explicit, informed, granular
    form: "ENOQ can remember: [categories]"
    revocable: yes, immediate effect
    
  access:
    by_enoq: only to enhance current response
    never: for profiling, prediction, retention
    
  storage:
    minimized: only what user explicitly asks to remember
    encrypted: always
    portable: user can export
    deletable: user can delete any time
    
  ui:
    visible: user can see what is stored
    editable: user can correct
    categorical: user can enable/disable by type
```

### When Content Memory Is Appropriate

```yaml
appropriate_use:
  yes:
    - user explicitly says "remember that..."
    - user asks for continuity across sessions
    - user is building long-term project with ENOQ
    
  no:
    - inferred from conversation
    - stored "because it might be useful"
    - retained after user asks to forget
```

---

## PART VI: MEMORY IN THE OS

### Where Each Memory Lives

```yaml
memory_in_os:
  S0_PERMIT:
    uses: none
    updates: none
    
  S1_SENSE:
    uses: 
      - working (current input)
      - structural (patterns for calibration)
    updates: none
    
  S2_CLARIFY:
    uses: working
    updates: none
    
  S3_PLAN:
    uses:
      - working (field model)
      - structural (preferences, patterns)
      - artifact_index (if continuing previous work)
    updates: none
    
  S4_ACT:
    uses: working, artifact (if editing)
    updates: artifact (if creating/updating)
    
  S5_VERIFY:
    uses: working
    updates: 
      - structural (counters, patterns)
      
  S6_STOP:
    uses: none
    updates:
      - structural (session summary)
      - artifact (if finalized)
```

### Memory Update Rules

```yaml
update_rules:
  structural:
    when: S5 VERIFY completes
    what: increment counters, update patterns
    how: append-only log or counter update
    cost: microseconds
    
  artifact:
    when: user creates/updates work
    what: store versioned artifact
    how: standard document storage
    cost: milliseconds
    
  content:
    when: user explicitly requests
    what: store specific memory
    how: encrypted, categorized storage
    cost: milliseconds
```

---

## PART VII: THE GOLDEN RULE

```yaml
golden_rule:
  statement: |
    Save only what improves routing, stop, or quality.
    Not what tells the story.
    
  test: |
    Before storing anything, ask:
    "Does this change how ENOQ will act?"
    
    If yes → structural memory (pattern)
    If no → don't store
    
  examples:
    store:
      - "COGNITION recurs 6/7"
      - "user rejects challenge"
      - "grounding works when arousal high"
      - "pacing slow preferred"
      
    do_not_store:
      - names
      - biographical details
      - emotional content
      - relationship history
```

---

## PART VIII: DESIGN DECISION

### Cross-Session Structural Memory

```yaml
decision:
  question: "Should Structural Memory persist across sessions?"
  
  option_1:
    name: session_only
    behavior: resets daily
    benefit: maximum privacy
    cost: loses pattern recognition
    
  option_2:
    name: cross_session
    behavior: persists, patterns accumulate
    benefit: better calibration over time
    cost: more data retained
    
  recommendation: cross_session
  
  rationale: |
    Structural memory contains no content.
    Only patterns that improve service.
    
    The value of recognizing:
    - "this is the 4th time you've been here"
    - "grounding has worked before"
    - "you tend to avoid depth"
    
    ...far outweighs the minimal data footprint.
    
  safeguards:
    - user can clear at any time
    - user can view summary
    - decays over time if not reinforced
    - never contains content
```

---

## PART IX: PERFORMANCE

```yaml
performance:
  principle: "Memory must not slow the system"
  
  structural_memory:
    read: key-value lookup, < 1ms
    write: counter increment, < 1ms
    size: < 1KB per user
    
  artifact_memory:
    read: document fetch, 10-50ms
    write: document store, 10-50ms
    size: user-defined limits
    
  content_memory:
    read: encrypted fetch, 20-100ms
    write: encrypted store, 20-100ms
    size: minimized by design
    
  impact_on_fast_path:
    structural_read: negligible (< 1ms)
    no_other_memory_on_fast_path: by design
```

---

## PART X: CONSTITUTIONAL COMPLIANCE

```yaml
constitutional_compliance:
  INV-004_no_dependency:
    risk: "Memory creates 'you need me to remember'"
    mitigation: 
      - content memory off by default
      - user can export everything
      - user can delete everything
      - ENOQ never references memory first
      
  INV-003_no_normative_delegation:
    risk: "Memory used to steer decisions"
    mitigation:
      - structural memory has no content
      - artifact memory is user's work
      - content memory never used for recommendations
      
  INV-009_rubicon:
    risk: "Memory of past choices influences new ones"
    mitigation:
      - never say "last time you chose X"
      - patterns inform calibration, not direction
```

---

## SUMMARY

```yaml
summary:
  working: "RAM. Inevitable. Ephemeral."
  structural: "Patterns without content. Improves service. Default on."
  artifact: "User's work. User owns. Persistent."
  content: "User's story. User controls. Off by default."
  
  principle: |
    ENOQ remembers how to help you better.
    ENOQ does not remember who you are.
    
    Unless you ask.
```

---

*"The best memory is the one that serves without surveilling."*
