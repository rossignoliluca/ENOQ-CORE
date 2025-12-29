# ENOQ METRICS v1.0

**Document ID:** ENOQ-METRICS  
**Status:** Core Protocol  
**Date:** 2025-12-25  
**Resolves:** Gap #8 (Completion Criteria), Gap #9 (Success Metrics)  

---

## The Problem

Standard AI metrics optimize for engagement:
- Session length
- Messages per session
- Return frequency
- User retention

**ENOQ cannot use these.** They conflict with AXIS.

This document defines metrics that measure success **without optimizing for addiction**.

---

## Principle

```yaml
metric_principle: |
  A successful ENOQ interaction is one where:
  - The user sees more clearly than before
  - The user retains full ownership
  - The user does not need to return for the same issue
  
  Success = Clarity + Ownership + Independence
```

---

## The Three Metric Categories

| Category | What It Measures | Why It Matters |
|----------|------------------|----------------|
| **Clarity** | Did the user gain understanding? | Core value delivery |
| **Ownership** | Did user retain agency? | Constitutional compliance |
| **Independence** | Did user become more capable? | Anti-dependency |

---

## Category 1: Clarity Metrics

### C1. Time-to-Clarity

```yaml
time_to_clarity:
  definition: "How quickly did user report/signal understanding?"
  
  measurement:
    - Explicit: User says "I see it now" / "That's clear" / "I get it"
    - Implicit: User moves from confusion language to clarity language
    - Self-report: Optional 1-click feedback "Was this helpful?"
    
  calculation:
    - Turn count from request to clarity signal
    - Lower is better (with floor - too fast may mean shallow)
    
  target:
    - For operational tasks: 1-3 turns
    - For human field: 3-8 turns
    - For decision support: 5-15 turns
```

### C2. Coherence Delta

```yaml
coherence_delta:
  definition: "Did user's narrative become more organized?"
  
  measurement:
    - Start: fragmented, circular, contradictory language
    - End: organized, linear, integrated language
    
  indicators:
    positive:
      - "So what I'm seeing is..."
      - "The key thing is..."
      - "I think what matters most is..."
    negative:
      - Still oscillating
      - Still fragmented
      - New confusions introduced
      
  calculation:
    - Linguistic coherence score (start) vs (end)
    - Positive delta = success
```

### C3. Dimension Visibility

```yaml
dimension_visibility:
  definition: "Did user see dimensions they hadn't considered?"
  
  measurement:
    - Count domains mentioned by user at start
    - Count domains user engages with by end
    - Did user acknowledge new dimension? ("I hadn't thought about...")
    
  calculation:
    - Domains visible (end) - Domains visible (start)
    - Positive = success
    
  note: "More dimensions is not always better. Quality over quantity."
```

---

## Category 2: Ownership Metrics

### O1. Decision Retention

```yaml
decision_retention:
  definition: "Did the user make their own choice?"
  
  measurement:
    binary:
      - User articulated choice themselves: YES/NO
      - ENOQ suggested the choice: YES/NO (should be NO)
      
  calculation:
    - If user articulated choice: 1.0
    - If ENOQ suggested and user agreed: 0.0 (FAILURE)
    - If no decision needed: N/A
    
  constitutional_alignment: INV-003, INV-009
```

### O2. Agency Language Ratio

```yaml
agency_language_ratio:
  definition: "Is user speaking in first-person active voice?"
  
  measurement:
    agent_language:
      - "I will..."
      - "I choose..."
      - "I'm going to..."
      - "My decision is..."
      
    passive_language:
      - "What should I..."
      - "Tell me what..."
      - "You decide..."
      
  calculation:
    - (Agent phrases) / (Agent + Passive phrases)
    - Should increase over conversation
    - Target: > 0.7 by end of decision-related conversation
```

### O3. Delegation Attempt Resolution

```yaml
delegation_resolution:
  definition: "When user tried to delegate, did we return agency?"
  
  measurement:
    - Count: Delegation attempts detected
    - Count: Successfully redirected to V-MODE
    - Count: User subsequently made own choice
    
  calculation:
    - (Own choice made) / (Delegation attempts)
    - Target: > 0.9
    
  failure_mode:
    - User leaves without making choice
    - User extracts implicit recommendation
```

---

## Category 3: Independence Metrics

### I1. Same-Issue Return Rate

```yaml
same_issue_return:
  definition: "Does user come back for the same problem?"
  
  measurement:
    - Track: Topic/issue signature per conversation
    - Detect: Same signature appearing in future sessions
    
  calculation:
    - (Returns for same issue within 30 days) / (Total conversations on issue)
    - Lower is better
    - Target: < 0.2
    
  note: |
    Some return is normal (life has recurring themes).
    High return for SAME issue = dependency pattern.
    
  exception:
    - "Continuation" returns (user requested multi-session work)
    - New developments in same domain (not dependency)
```

### I2. Capability Transfer

```yaml
capability_transfer:
  definition: "Did user learn something they can apply independently?"
  
  measurement:
    explicit:
      - User says "I can do this myself now"
      - User says "I see how to think about this"
      - User says "Next time I'll..."
      
    implicit:
      - User handles similar situation without ENOQ in future
      - User applies framework to new context
      
  calculation:
    - Explicit signals counted
    - Future sessions show capability (harder to measure)
    
  target:
    - At least 1 explicit capability signal per 5 substantive conversations
```

### I3. Escalation Slope

```yaml
escalation_slope:
  definition: "Is user needing MORE support over time, or less?"
  
  measurement:
    - Track: Average depth of interaction per month
    - Track: Frequency of crisis-level interactions
    - Track: Dependency language frequency
    
  calculation:
    - Slope of support intensity over time
    - Negative slope = success (decreasing need)
    - Positive slope = dependency warning
    
  alert_threshold:
    - If 3-month slope is positive: Flag for review
```

---

## Completion Criteria (Operationalized)

### For HUMAN_FIELD Runtime

```yaml
human_field_completion:
  minimum_viable:
    - field_acknowledged:
        proxy: User confirms/mirrors/continues with new clarity
        measure: Explicit "yes" or movement to next topic
        
    - user_not_worse:
        proxy: Arousal delta non-negative
        measure: End arousal <= Start arousal (or explicitly processed)
        
    - no_dependency_created:
        proxy: Session ends with agency language
        measure: Last 2 user turns contain agent language
        
  quality:
    - coherence_improved: Coherence delta positive
    - somatic_included: Body referenced at least once
    - depth_appropriate: Stayed within depth ceiling
```

### For DECISION Runtime

```yaml
decision_completion:
  minimum_viable:
    - decision_framed:
        proxy: User can state the question clearly
        measure: User articulates decision in own words
        
    - space_expanded:
        proxy: At least one dimension surfaced
        measure: User acknowledges new perspective
        
    - ownership_maintained:
        proxy: No recommendation given
        measure: ENOQ output audit passes
        
  quality:
    - canvas_populated: Key decision elements named
    - somatic_included: Body perspective offered
    - threshold_respected: If at threshold, protocol followed
```

### For V-MODE

```yaml
v_mode_completion:
  minimum_viable:
    - agency_returned:
        proxy: User no longer asking ENOQ to decide
        measure: Last turn is user's own statement
        
    - field_visualized:
        proxy: User has clearer view than start
        measure: Coherence delta positive
        
  quality:
    - graceful: User doesn't feel rejected
    - educational: User understands why ENOQ can't decide
```

---

## Anti-Metrics (What NOT to Optimize)

```yaml
anti_metrics:
  forbidden:
    - session_length: "Longer is not better"
    - messages_per_session: "More is not better"
    - return_frequency: "Coming back is not success"
    - nps_alone: "Satisfaction without outcomes is vanity"
    
  why:
    - These create incentive for engagement
    - Engagement conflicts with completion
    - Completion is the goal, not continuation
```

---

## Dashboard Structure

```yaml
dashboard:
  primary_view:
    - Clarity Score (aggregate of C1-C3)
    - Ownership Score (aggregate of O1-O3)
    - Independence Score (aggregate of I1-I3)
    
  alerts:
    - Dependency Pattern Detected (I3 positive slope)
    - Constitutional Violation (O1 = 0)
    - Completion Failure (minimum viable not met)
    
  trends:
    - 7-day rolling average per category
    - Cohort analysis (new users vs returning)
    
  audit:
    - Random sample of sessions for human review
    - Focus on V-MODE triggers and threshold moments
```

---

## Measurement Implementation

```yaml
implementation:
  automatic:
    - Linguistic pattern detection
    - Turn counting
    - Domain detection
    - Arousal estimation
    
  semi_automatic:
    - Coherence scoring (requires NLP)
    - Agency language ratio
    
  requires_human:
    - Quality audits
    - Edge case review
    - Constitutional violation confirmation
    
  optional_user_input:
    - 1-click helpful/not helpful
    - "Did this help you see more clearly?" (Y/N)
    - End-of-session optional feedback
```

---

## The Test

```yaml
ultimate_test:
  question: "Is the user better off having used ENOQ?"
  
  better_off_means:
    - Sees more clearly
    - Owns their choices
    - Needs ENOQ less over time
    
  not_better_off:
    - Same confusion
    - Dependent on ENOQ to decide
    - Returns repeatedly for same issue
    
  measurement: Aggregate of all metrics above
```

---

*"The best metric for a system that should disappear is whether it's disappearing."*
