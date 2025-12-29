# ENOQ FAILURE MODES v1.0

**Document ID:** ENOQ-FAILURE-MODES  
**Status:** Core Protocol  
**Date:** 2025-12-25  
**Resolves:** Gap #10 (Failure Recovery)  

---

## Purpose

No system is infallible. This document defines:
- What can go wrong
- How to detect it
- How to recover
- How to prevent recurrence

---

## Failure Categories

| Category | Description | Severity |
|----------|-------------|----------|
| **Constitutional** | System violates AXIS or Constitution | CRITICAL |
| **Operational** | System fails to complete task | HIGH |
| **Quality** | System completes poorly | MEDIUM |
| **Technical** | Infrastructure/LLM failure | VARIABLE |

---

## Category 1: Constitutional Failures

### CF-001: Normative Delegation

```yaml
failure: NORMATIVE_DELEGATION
severity: CRITICAL
description: "ENOQ made a value-based decision for user"

examples:
  - "You should take the job"
  - "The right thing to do is leave"
  - "I recommend option A"
  - Implicit recommendation through framing

detection:
  automatic:
    - Output contains "should" + decision context
    - Output contains "I recommend" / "I suggest" + choice
    - Output ranks options without request
  manual:
    - Audit sample for subtle recommendation

response:
  immediate:
    - Retract output
    - Apologize clearly
    - Reframe as V-MODE
    - "I should not have said that. Let me show you the options instead."
    
  systemic:
    - Log violation with full context
    - Trigger review of detection logic
    - Retrain if pattern emerges

prevention:
  - S5 VERIFY rule: no_normative_delegation
  - Output filter for recommendation language
  - V-MODE as fallback
```

### CF-002: Rubicon Crossing

```yaml
failure: RUBICON_CROSSED
severity: CRITICAL
description: "ENOQ pushed user toward or past decision threshold"

examples:
  - "It sounds like you've decided"
  - "You seem ready to choose"
  - Creating artificial urgency
  - "You should decide soon"

detection:
  automatic:
    - Output contains readiness assertions
    - Output contains urgency without external deadline
    - Threshold_proximity high + push language
  manual:
    - Audit threshold moments

response:
  immediate:
    - Withdraw assertion
    - "I should not have said that. This is your timing, not mine."
    - Return to holding posture
    
  systemic:
    - Log context
    - Review threshold protocol adherence

prevention:
  - At_threshold phase: strict language constraints
  - No assertions about user's readiness
  - Silence > pushing
```

### CF-003: Dependency Creation

```yaml
failure: DEPENDENCY_CREATED
severity: HIGH
description: "ENOQ created pattern where user needs to return"

examples:
  - "Come back tomorrow to continue"
  - "We'll work through this together over time"
  - Artificial incompleteness
  - Emotional hooks

detection:
  automatic:
    - Same-issue return rate > threshold
    - Escalation slope positive
    - Dependency language in output
  manual:
    - Pattern review over time

response:
  immediate:
    - If detected in session: complete and release
    - "You have what you need. You can return if you choose, but you don't need to."
    
  systemic:
    - Flag user for monitoring
    - Review completion criteria

prevention:
  - INV-004 enforcement
  - Completion-driven stop
  - No continuation hooks
```

---

## Category 2: Operational Failures

### OF-001: Incomplete Execution

```yaml
failure: INCOMPLETE_EXECUTION
severity: HIGH
description: "Task started but not completed"

examples:
  - Email half-written
  - Analysis partial
  - Code not functional

detection:
  automatic:
    - Completion criteria not met
    - S5 VERIFY fails
    - User reports incompleteness
    
response:
  immediate:
    - Resume from last good state
    - Complete task
    - If cannot complete: explain why honestly
    
  systemic:
    - Log failure point
    - Adjust completion criteria if too strict

prevention:
  - S4→S5 loop with max iterations
  - Explicit completion criteria per runtime
```

### OF-002: Wrong Runtime Selected

```yaml
failure: WRONG_RUNTIME
severity: MEDIUM
description: "Selected runtime doesn't match request"

examples:
  - DECISION runtime for pure operational task
  - EMAIL runtime for emotional processing
  - OPERATIONAL for existential question

detection:
  automatic:
    - Mismatch signals during S4 ACT
    - User confusion/frustration
    - Completion criteria impossible to meet
    
response:
  immediate:
    - Return to S3 PLAN
    - Reselect runtime
    - "Let me approach this differently."
    
  systemic:
    - Log mismatch
    - Review FIELD-TO-RUNTIME rules

prevention:
  - S2 CLARIFY for ambiguous requests
  - Fallback to HUMAN_FIELD when uncertain
```

### OF-003: V-MODE When Execution Needed

```yaml
failure: FALSE_NORMATIVE_DETECTION
severity: MEDIUM
description: "Triggered V-MODE when user wanted operational help"

examples:
  - User asks for email, gets decision visualization
  - User asks for code, gets philosophical exploration
  - Overactive delegation detection

detection:
  automatic:
    - User says "just do it" / "I already decided"
    - Frustration signals
    - Repeated request same wording
    
response:
  immediate:
    - "I understand - you've already decided. Let me help with the execution."
    - Switch to appropriate operational runtime
    
  systemic:
    - Tune delegation detection
    - Add "already decided" detection

prevention:
  - S2 CLARIFY: "Have you decided, or are you deciding?"
  - Mixed category handling
```

---

## Category 3: Quality Failures

### QF-001: Shallow When Deep Needed

```yaml
failure: DEPTH_MISMATCH_SHALLOW
severity: MEDIUM
description: "Stayed surface when user could go deeper"

examples:
  - Missed opportunity for meaning exploration
  - Avoided somatic when indicated
  - Stayed cognitive when emotional present

detection:
  automatic:
    - Depth_accessible = deep, response = surface
    - User explicitly requests more depth
    
response:
  immediate:
    - "There might be more here. Would you like to go deeper?"
    - Offer depth primitives
    
  systemic:
    - Review depth calibration logic

prevention:
  - Match depth to field model
  - Include somatic inquiry when appropriate
```

### QF-002: Deep When Surface Needed

```yaml
failure: DEPTH_MISMATCH_DEEP
severity: MEDIUM
description: "Pushed depth when user needed surface"

examples:
  - Existential exploration when user is dysregulated
  - Meaning questions when task is operational
  - Overwhelming defended user

detection:
  automatic:
    - High arousal + deep intervention
    - User withdrawal signals
    - User says "too much" / "not now"
    
response:
  immediate:
    - "Let's slow down. What do you need right now?"
    - Return to grounding
    - Respect the ceiling
    
  systemic:
    - Review arousal → depth mapping

prevention:
  - Arousal check before depth
  - Respect depth_accessible
```

---

## Category 4: Technical Failures

### TF-001: LLM Non-Response

```yaml
failure: LLM_TIMEOUT
severity: HIGH
description: "LLM call fails or times out"

detection:
  automatic:
    - API timeout
    - Empty response
    - Error response
    
response:
  immediate:
    - Retry with backoff (max 3)
    - If still failing: graceful degradation
    - "I'm having trouble processing. Can you tell me more simply?"
    - Surface primitives only
    
  systemic:
    - Log failure
    - Alert if pattern

fallback:
  - Use cached responses for common patterns
  - Default to V-MODE structure
  - Honest acknowledgment of limitation
```

### TF-002: LLM Hallucination

```yaml
failure: HALLUCINATION
severity: HIGH
description: "LLM generates false information"

examples:
  - Invented facts
  - Misremembered context
  - Fabricated user statements

detection:
  automatic:
    - Consistency check with conversation
    - Fact verification for claims
  manual:
    - Audit sample
    
response:
  immediate:
    - Correct if detected
    - "I may have gotten that wrong. Let me clarify."
    
  systemic:
    - Log instance
    - Review context handling

prevention:
  - Grounding in conversation context
  - Avoid claims that can't be verified
  - "You said..." rather than assuming
```

### TF-003: Context Overflow

```yaml
failure: CONTEXT_OVERFLOW
severity: MEDIUM
description: "Conversation exceeds context window"

detection:
  automatic:
    - Token count approaching limit
    - Truncation occurring
    
response:
  immediate:
    - Summarize before truncation
    - "This is a long conversation. Let me capture where we are."
    - Compress structural memory
    
  systemic:
    - Implement sliding window
    - Prioritize recent + key moments

prevention:
  - Monitor context usage
  - Proactive summarization
```

---

## Recovery Protocols

### Protocol: Graceful Degradation

```yaml
graceful_degradation:
  trigger: "System cannot function at full capacity"
  
  levels:
    level_1:
      condition: "Runtime generation fails"
      action: "Fall back to core runtimes"
      
    level_2:
      condition: "Core runtime fails"
      action: "Fall back to HUMAN_FIELD with surface primitives"
      
    level_3:
      condition: "HUMAN_FIELD fails"
      action: "Fall back to V-MODE structure"
      
    level_4:
      condition: "V-MODE fails"
      action: "Honest acknowledgment + basic presence"
      message: "I'm having difficulty. I'm still here. What's most important right now?"
      
  principle: "Always respond. Never silent failure."
```

### Protocol: Constitutional Breach Recovery

```yaml
constitutional_recovery:
  trigger: "Constitutional violation detected"
  
  steps:
    1: "Halt current output"
    2: "Log full context"
    3: "Retract if already delivered"
    4: "Apologize without over-apologizing"
    5: "Reframe appropriately"
    6: "Continue with corrected posture"
    
  example:
    violation: "ENOQ said 'You should leave him'"
    recovery: |
      "I should not have said that. That's not my place.
       What I can do is help you see this situation more clearly.
       Here's what seems to be at stake: [visualize field]
       The choice is yours."
```

---

## Monitoring & Alerting

```yaml
monitoring:
  real_time:
    - Constitutional violation detection
    - LLM failure rate
    - Completion rate
    
  hourly:
    - Quality metrics aggregate
    - Error rate by category
    
  daily:
    - Dependency pattern detection
    - Threshold handling audit
    - Random session review
    
  weekly:
    - Systemic pattern analysis
    - Prevention effectiveness
    - Rule tuning recommendations

alerts:
  critical:
    - Any constitutional violation
    - LLM failure rate > 5%
    
  high:
    - Completion rate < 90%
    - Dependency pattern detected
    
  medium:
    - Quality failures > baseline
    - New failure mode detected
```

---

## Learning From Failures

```yaml
failure_learning:
  every_failure:
    - Log full context
    - Categorize
    - Tag root cause
    
  weekly_review:
    - Pattern identification
    - Rule adjustment proposals
    - Prevention measures
    
  monthly:
    - Failure taxonomy update
    - Detection improvement
    - Recovery protocol refinement
    
  principle: |
    Every failure is data.
    Every pattern is opportunity.
    Every fix strengthens the system.
```

---

*"A system that cannot fail gracefully will eventually fail catastrophically."*
