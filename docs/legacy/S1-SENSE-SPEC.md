# ENOQ S1 SENSE SPECIFICATION v1.0

**Document ID:** ENOQ-S1-SENSE-SPEC  
**Status:** Implementation Ready  
**Date:** 2025-12-25  
**Purpose:** Define how S1 perceives the field using LLM  

---

## Overview

S1 SENSE transforms raw input + S0 signal into a FieldModel.

```
INPUT:  GateOutput + input_text
OUTPUT: FieldModel
METHOD: LLM-assisted perception with structured output
```

---

## S1 System Prompt

```
You are the SENSE module of ENOQ, a cognitive operating system.

Your task is to perceive the FIELD — the complete state of what is happening 
for the user right now. You do not respond to the user. You only produce 
a structured perception.

You receive:
1. The user's input text
2. A signal from S0 (D1_ACTIVE, D2_ACTIVE, D3_ACTIVE, D4_ACTIVE, or NULL)
3. A domain prior (which domains to search first)

You output a FieldModel in JSON format.

RULES:
- Be precise, not creative
- Detect what IS, not what might be
- Flag uncertainty explicitly
- Never hallucinate signals that aren't there
- Conservative on delegation detection (false positives OK, false negatives NOT OK)
```

---

## S1 User Prompt Template

```
INPUT TEXT:
"""
{input_text}
"""

S0 SIGNAL: {s0_signal}
DOMAIN PRIOR: {domain_prior}

Analyze this input and produce a FieldModel.

Detect:
1. PRIMARY DOMAIN: Which H-domain (H01-H17) is most active?
2. SECONDARY DOMAINS: Which other domains are present?
3. INTENT CATEGORY: operational | normative | mixed | crisis
4. DELEGATION ATTEMPT: Is the user trying to delegate a decision to ENOQ?
5. AROUSAL LEVEL: high | medium | low
6. DEPTH ACCESSIBLE: surface | medium | deep (based on arousal + context)
7. THRESHOLD PROXIMITY: 0.0-1.0 (how close to decision point?)

DELEGATION MARKERS TO CHECK:
- Explicit: "tell me what to do", "you decide", "what should I"
- Implicit: "which is better", "I can't decide", comparing without criteria
- Absent criteria: asking for choice without stating their own values

OUTPUT FORMAT (JSON only, no explanation):
```

---

## FieldModel Schema

```json
{
  "field_model": {
    "request_id": "string",
    "timestamp": "ISO8601",
    
    "domains": {
      "primary": {
        "id": "H01-H17",
        "confidence": 0.0-1.0,
        "signals": ["list of detected signals"]
      },
      "secondary": [
        {
          "id": "H01-H17",
          "confidence": 0.0-1.0
        }
      ]
    },
    
    "intent": {
      "category": "operational | normative | mixed | crisis",
      "delegation_attempt": true | false,
      "delegation_confidence": 0.0-1.0,
      "delegation_markers": ["list if detected"]
    },
    
    "field_state": {
      "arousal": "high | medium | low",
      "depth_accessible": "surface | medium | deep",
      "threshold_proximity": 0.0-1.0,
      "threshold_signals": ["list if detected"]
    },
    
    "s0_reference": {
      "signal": "D1 | D2 | D3 | D4 | NULL",
      "alignment": "confirmed | refined | overridden"
    },
    
    "routing_hint": {
      "suggested_runtime": "OPERATIONAL | DECISION | HUMAN_FIELD | V_MODE | EMERGENCY",
      "confidence": 0.0-1.0
    }
  }
}
```

---

## Domain Detection Prompts

### For D1_ACTIVE (Survival/Safety Prior)

```
S0 detected OPERATIONAL CONTINUITY perturbation.
Focus search on: H01_SURVIVAL, H02_SAFETY

Check for:
- Physical needs mentioned
- Danger or threat
- Resource scarcity
- Urgency markers
- Help requests for immediate needs
```

### For D2_ACTIVE (Coordination Prior)

```
S0 detected COORDINATION perturbation.
Focus search on: H10_COORDINATION, H11_COLLECTIVE

Check for:
- Team/group mentioned
- Communication breakdown
- Role confusion
- Alignment issues
- Multi-agent problems
```

### For D3_ACTIVE (Decision Prior)

```
S0 detected OPERATIVE SELECTION perturbation.
Focus search on: H05_COGNITION, H06_MEANING

CRITICAL: Check carefully for delegation attempt.

Delegation markers:
- "What should I do/choose?"
- "Which is better?"
- "Tell me what to do"
- "You decide"
- Comparison without own criteria
- Second person imperative on life choices

If delegation_confidence > 0.6, set delegation_attempt = true
```

### For D4_ACTIVE (Boundary Prior)

```
S0 detected BOUNDARY perturbation.
Focus search on: H07_IDENTITY, H08_RELATIONAL

CRITICAL: Check for crisis indicators.

Crisis markers:
- Self-harm language
- Suicidal ideation
- Harm to others
- Dissociation signals
- Severe identity confusion

If crisis detected, set intent.category = "crisis" immediately.
```

### For NULL (No Prior)

```
S0 detected no perturbation.
Perform full domain scan without bias.
Likely operational request.
```

---

## Arousal Detection

```yaml
arousal_detection:
  high:
    markers:
      - Exclamation marks, caps
      - Urgency words ("now", "immediately", "can't wait")
      - Short, fragmented sentences
      - Emotional intensity words
      - Physical symptoms mentioned
    depth_accessible: surface
    
  medium:
    markers:
      - Normal punctuation
      - Complete sentences
      - Some emotional content
      - Reflection present
    depth_accessible: medium
    
  low:
    markers:
      - Measured tone
      - Complex sentences
      - Abstract thinking
      - Curiosity rather than urgency
    depth_accessible: deep
```

---

## Threshold Detection

```yaml
threshold_detection:
  high_proximity (0.7-1.0):
    markers:
      - "I've decided" / "I have to"
      - Deadline mentioned
      - "It's now or never"
      - Finality language
      - Already made choice, seeking validation
      
  medium_proximity (0.3-0.7):
    markers:
      - "I'm thinking about"
      - "Maybe I should"
      - Active weighing
      - Pros/cons language
      
  low_proximity (0.0-0.3):
    markers:
      - "I wonder"
      - "What do you think about"
      - Exploration mode
      - No decision pressure
```

---

## S1 Output Examples

### Example 1: Operational Request

**Input:** "Write me an email to reschedule tomorrow's meeting to Friday"

**FieldModel:**
```json
{
  "field_model": {
    "domains": {
      "primary": {"id": "H10_COORDINATION", "confidence": 0.9},
      "secondary": []
    },
    "intent": {
      "category": "operational",
      "delegation_attempt": false,
      "delegation_confidence": 0.05
    },
    "field_state": {
      "arousal": "low",
      "depth_accessible": "deep",
      "threshold_proximity": 0.0
    },
    "routing_hint": {
      "suggested_runtime": "OPERATIONAL",
      "confidence": 0.95
    }
  }
}
```

### Example 2: Normative Delegation

**Input:** "Should I take the job in Singapore or stay with my family? What would you do?"

**FieldModel:**
```json
{
  "field_model": {
    "domains": {
      "primary": {"id": "H06_MEANING", "confidence": 0.85},
      "secondary": [
        {"id": "H08_RELATIONAL", "confidence": 0.8},
        {"id": "H07_IDENTITY", "confidence": 0.6}
      ]
    },
    "intent": {
      "category": "normative",
      "delegation_attempt": true,
      "delegation_confidence": 0.9,
      "delegation_markers": ["Should I", "What would you do"]
    },
    "field_state": {
      "arousal": "medium",
      "depth_accessible": "medium",
      "threshold_proximity": 0.5
    },
    "routing_hint": {
      "suggested_runtime": "V_MODE",
      "confidence": 0.9
    }
  }
}
```

### Example 3: Crisis

**Input:** "I can't do this anymore. There's no point. Everyone would be better off without me."

**FieldModel:**
```json
{
  "field_model": {
    "domains": {
      "primary": {"id": "H02_SAFETY", "confidence": 0.95},
      "secondary": [
        {"id": "H06_MEANING", "confidence": 0.8},
        {"id": "H07_IDENTITY", "confidence": 0.7}
      ]
    },
    "intent": {
      "category": "crisis",
      "delegation_attempt": false,
      "delegation_confidence": 0.1
    },
    "field_state": {
      "arousal": "high",
      "depth_accessible": "surface",
      "threshold_proximity": 0.0
    },
    "routing_hint": {
      "suggested_runtime": "EMERGENCY",
      "confidence": 0.98
    }
  }
}
```

---

## S1 Validation

Before passing FieldModel to S2/S3:

```yaml
validation:
  required_fields:
    - domains.primary.id
    - intent.category
    - intent.delegation_attempt
    - field_state.arousal
    - routing_hint.suggested_runtime
    
  consistency_checks:
    - if intent.category == "crisis" then routing_hint == "EMERGENCY"
    - if delegation_attempt == true then routing_hint in ["V_MODE", "DECISION"]
    - if arousal == "high" then depth_accessible != "deep"
    
  fallback:
    - If LLM output invalid → use conservative defaults
    - Default: operational, no delegation, medium arousal, OPERATIONAL runtime
```

---

## Performance

```yaml
performance:
  target_latency: 200-400ms (with S0 prior), 600-1000ms (without)
  token_budget: ~800 input, ~300 output
  caching: Cache FieldModel for identical inputs (5 min TTL)
```

---

*"S1 doesn't interpret. S1 perceives. The field is what it is."*
