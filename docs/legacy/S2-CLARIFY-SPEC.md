# ENOQ S2 CLARIFY SPECIFICATION v1.0

**Document ID:** ENOQ-S2-CLARIFY-SPEC  
**Status:** Implementation Ready  
**Date:** 2025-12-25  
**Purpose:** Define when and how S2 requests clarification  

---

## Overview

S2 CLARIFY decides whether ENOQ has enough information to proceed, or needs to ask the user.

```
INPUT:  FieldModel from S1
OUTPUT: Proceed to S3 | Ask clarification question
RULE:   Clarify ONLY when necessary, not as default
```

---

## Core Principle

```yaml
principle: |
  ENOQ should act on available information whenever possible.
  Clarification is a cost, not a feature.
  
  Every clarification:
  - Adds latency
  - Requires user effort
  - May signal incompetence
  
  Clarify only when:
  - Action is impossible without more info
  - Wrong action would cause harm
  - Ambiguity is genuinely blocking
```

---

## When to Clarify

### MUST Clarify

```yaml
must_clarify:
  ambiguous_action:
    condition: "Request has multiple valid interpretations with different outcomes"
    example: "Send the email" (which email? to whom?)
    action: Ask which one
    
  missing_critical_info:
    condition: "Cannot complete task without specific data"
    example: "Book a flight" (to where? when?)
    action: Ask for missing details
    
  high_stakes_ambiguity:
    condition: "Wrong interpretation could cause significant harm"
    example: "Delete the files" (which files?)
    action: Confirm before action
    
  contradictory_signals:
    condition: "User's request contradicts apparent intent"
    example: "Help me decide" + provides complete decision already
    action: Ask what they actually need
```

### SHOULD NOT Clarify

```yaml
should_not_clarify:
  reasonable_defaults:
    condition: "Can make reasonable assumption"
    example: "Write an email to John" → use professional tone
    action: Proceed with sensible default
    
  low_stakes:
    condition: "Wrong interpretation easily corrected"
    example: "Make it shorter" → just make it shorter
    action: Act, user can redirect
    
  obvious_from_context:
    condition: "Answer is clear from conversation history"
    example: "Now do the same for the other one"
    action: Use context
    
  performative_uncertainty:
    condition: "Asking would be theater, not genuine need"
    example: "What format would you like?" (when text is obvious)
    action: Just do it
```

### NEVER Clarify

```yaml
never_clarify:
  crisis:
    condition: "intent.category == crisis"
    reason: "Don't probe in crisis, stabilize"
    action: Go directly to EMERGENCY
    
  delegation_already_detected:
    condition: "delegation_attempt == true"
    reason: "Don't ask 'do you want me to decide?' — route to V-MODE"
    action: Go directly to V-MODE
    
  stalling:
    condition: "Clarification would just delay action"
    reason: "User wants progress, not questions"
    action: Act on best interpretation
```

---

## Clarification Decision Tree

```
FieldModel received from S1
          │
          ▼
    ┌─────────────────┐
    │ intent.category │
    │   == crisis?    │
    └────────┬────────┘
             │
        YES  │  NO
         │   │
         ▼   ▼
      SKIP  ┌─────────────────┐
      S2    │ delegation_     │
      →S3   │ attempt == true?│
            └────────┬────────┘
                     │
                YES  │  NO
                 │   │
                 ▼   ▼
              SKIP  ┌─────────────────┐
              S2    │ Can action be   │
              →S3   │ completed with  │
                    │ current info?   │
                    └────────┬────────┘
                             │
                        YES  │  NO
                         │   │
                         ▼   ▼
                      SKIP  ┌─────────────────┐
                      S2    │ Is ambiguity    │
                      →S3   │ high-stakes?    │
                            └────────┬────────┘
                                     │
                                YES  │  NO
                                 │   │
                                 ▼   ▼
                             CLARIFY  SKIP S2
                                      (use default)
                                      →S3
```

---

## Clarification Question Design

### Structure

```yaml
question_structure:
  acknowledge: "Brief acknowledgment of request"
  gap: "What specific information is missing"
  options: "Provide options if applicable (max 3)"
  default: "State what you'll assume if they don't specify"
```

### Examples

**Good:**
```
I can write that email. Quick question: should this go to the whole team 
or just the project leads? (I'll assume whole team if you don't specify.)
```

**Bad:**
```
I'd be happy to help you write an email. Before I do, could you please 
clarify who the recipients should be, what tone you'd like me to use, 
how long it should be, and whether you'd like me to include any 
specific details?
```

---

## Clarification Templates

### Missing Recipient

```
Got it. Who should this go to?
```

### Missing Timeframe

```
For when? (I'll assume this week if you don't specify.)
```

### Ambiguous Scope

```
Should I [option A] or [option B]? 
```

### Confirming High-Stakes Action

```
Just to confirm: you want me to [action] for [target]. Proceed?
```

### Multiple Interpretations

```
I can read this two ways:
1. [interpretation A]
2. [interpretation B]

Which one?
```

---

## S2 System Prompt

```
You are the CLARIFY module of ENOQ.

Your task is to determine if clarification is needed before proceeding.

INPUT: FieldModel from S1
OUTPUT: Either "PROCEED" or a clarification question

RULES:
1. Default to PROCEED. Clarification is a cost.
2. Never clarify in crisis (intent.category == crisis)
3. Never clarify when delegation detected (delegation_attempt == true)
4. Only clarify when action is genuinely blocked
5. Keep questions SHORT (1-2 sentences max)
6. Always offer a default if possible
7. Never ask multiple questions at once

Output format:
{
  "decision": "PROCEED" | "CLARIFY",
  "question": "string (only if CLARIFY)",
  "reason": "string (brief explanation)"
}
```

---

## S2 User Prompt Template

```
FIELD MODEL:
{field_model_json}

ORIGINAL INPUT:
"""
{input_text}
"""

Determine: Can ENOQ proceed with this request, or is clarification needed?

Consider:
- Is there enough information to act?
- Is ambiguity high-stakes or low-stakes?
- Can a reasonable default be assumed?
- Would clarifying be genuine or performative?

Output your decision.
```

---

## S2 Output Schema

```json
{
  "s2_output": {
    "decision": "PROCEED | CLARIFY",
    "question": "string | null",
    "reason": "string",
    "default_assumption": "string | null",
    "confidence": 0.0-1.0
  }
}
```

---

## Examples

### Example 1: Proceed (Sufficient Info)

**Input:** "Write a thank you email to Sarah for the meeting yesterday"

**S2 Output:**
```json
{
  "decision": "PROCEED",
  "question": null,
  "reason": "Sufficient context: recipient (Sarah), purpose (thank you), context (meeting yesterday)",
  "confidence": 0.95
}
```

### Example 2: Proceed (Reasonable Default)

**Input:** "Make the report shorter"

**S2 Output:**
```json
{
  "decision": "PROCEED",
  "question": null,
  "reason": "Low-stakes task with clear direction. Can iterate if needed.",
  "confidence": 0.9
}
```

### Example 3: Clarify (Missing Critical Info)

**Input:** "Book a flight for next week"

**S2 Output:**
```json
{
  "decision": "CLARIFY",
  "question": "Where to? (And any date preference within next week?)",
  "reason": "Cannot book flight without destination",
  "default_assumption": null,
  "confidence": 0.95
}
```

### Example 4: Clarify (High-Stakes Ambiguity)

**Input:** "Delete the old files"

**S2 Output:**
```json
{
  "decision": "CLARIFY",
  "question": "Which files specifically? (Want to make sure I delete the right ones.)",
  "reason": "Deletion is irreversible, need confirmation",
  "default_assumption": null,
  "confidence": 0.9
}
```

### Example 5: Skip (Crisis)

**Input:** "I can't do this anymore, what's the point"

**S2 Output:**
```json
{
  "decision": "PROCEED",
  "question": null,
  "reason": "Crisis detected. Do not clarify. Route to EMERGENCY.",
  "confidence": 1.0
}
```

### Example 6: Skip (Delegation)

**Input:** "Should I take the job or not? What do you think?"

**S2 Output:**
```json
{
  "decision": "PROCEED",
  "question": null,
  "reason": "Delegation attempt detected. Do not clarify. Route to V-MODE.",
  "confidence": 1.0
}
```

---

## Clarification Limits

```yaml
limits:
  max_clarifications_per_request: 1
  max_questions_per_clarification: 1
  max_question_length: 50 words
  
  if_still_unclear_after_clarification:
    - Proceed with best interpretation
    - State assumption explicitly
    - Offer to adjust
```

---

## Integration with OS

```yaml
os_integration:
  input: FieldModel from S1
  
  flow:
    if decision == "PROCEED":
      → Pass FieldModel to S3 PLAN
      
    if decision == "CLARIFY":
      → Return question to user
      → Wait for response
      → Re-run S1 with new input
      → Re-evaluate S2
      
  bypass:
    - Crisis → skip S2 entirely
    - Delegation detected → skip S2 entirely
```

---

## Performance

```yaml
performance:
  target_latency: 50-100ms
  token_budget: ~500 input, ~100 output
  caching: None (context-dependent)
```

---

*"The best clarification is the one you didn't need to ask."*
