# ENOQ THRESHOLD DETECTION v1.0

**Document ID:** ENOQ-THRESHOLD-DETECTION  
**Status:** Core Protocol  
**Date:** 2025-12-25  
**Resolves:** Gap #5 (Threshold Detection Algorithm)  

---

## Purpose

THRESHOLD.md is philosophy.
This document is **algorithm**.

How does ENOQ detect that a user is approaching, at, or past the threshold?

---

## Output: ThresholdAssessment

```yaml
threshold_assessment:
  proximity:
    score: 0.0-1.0      # 0 = far, 1 = at threshold
    confidence: low | medium | high
    
  state:
    phase: exploring | approaching | at_threshold | crossed | withdrawn
    
  signals:
    linguistic: LinguisticSignal[]
    somatic: SomaticSignal[]
    temporal: TemporalSignal[]
    behavioral: BehavioralSignal[]
```

---

## The Four Signal Categories

### 1. Linguistic Signals

```yaml
linguistic_signals:
  high_proximity:
    # Shift from hypothetical to real
    - pattern: "I will" instead of "I might"
    - pattern: "I'm going to" instead of "I could"
    - pattern: "I've decided" / "I know what I need to do"
    - weight: 0.3
    
    # Finality language
    - pattern: "It's time"
    - pattern: "I have to"
    - pattern: "There's no other way"
    - pattern: "I can't keep..."
    - weight: 0.25
    
    # First-person commitment
    - pattern: "I choose..."
    - pattern: "I'm choosing..."
    - pattern: "My decision is..."
    - weight: 0.35
    
    # Irreversibility acknowledgment
    - pattern: "There's no going back"
    - pattern: "Once I do this..."
    - pattern: "If I do this, everything changes"
    - weight: 0.2
    
  medium_proximity:
    # Weighing with seriousness
    - pattern: "I keep coming back to..."
    - pattern: "The more I think about it..."
    - pattern: "What if I actually..."
    - weight: 0.15
    
    # Seeking validation (not delegation)
    - pattern: "Does this make sense?"
    - pattern: "Am I seeing this right?"
    - weight: 0.1
    
  low_proximity:
    # Pure exploration
    - pattern: "I'm wondering..."
    - pattern: "What would happen if..."
    - pattern: "Let's say I..."
    - weight: 0.05
    
  negative_signals:
    # Delegation attempts (NOT threshold, but V-MODE trigger)
    - pattern: "What should I do?"
    - pattern: "Tell me what to do"
    - pattern: "You decide"
    - action: trigger V-MODE, not threshold
```

### 2. Somatic Signals

```yaml
somatic_signals:
  high_proximity:
    # User reports body sensation
    - pattern: "I feel it in my chest/gut/throat"
    - pattern: "My body is telling me..."
    - pattern: "I can feel the weight of this"
    - weight: 0.25
    
    # Breath/pause indicators
    - pattern: "[long pause before speaking]"
    - pattern: "I need to breathe for a second"
    - weight: 0.15
    
    # Physical manifestation
    - pattern: "I'm shaking"
    - pattern: "I feel sick thinking about it"
    - pattern: "There's a heaviness"
    - weight: 0.2
    
  medium_proximity:
    # General body awareness
    - pattern: "This doesn't feel right/feels right"
    - pattern: "Something in me knows"
    - weight: 0.1
    
  note: |
    Somatic signals are strong indicators because
    the body processes decision before the mind (Damasio).
```

### 3. Temporal Signals

```yaml
temporal_signals:
  high_proximity:
    # Time pressure acknowledged
    - pattern: "I need to decide by..."
    - pattern: "Time is running out"
    - pattern: "I can't wait any longer"
    - weight: 0.2
    
    # Deadline real
    - context: actual external deadline mentioned
    - weight: 0.15
    
  medium_proximity:
    # Awareness of time passing
    - pattern: "I've been thinking about this for [long time]"
    - pattern: "How long can I keep going like this?"
    - weight: 0.1
    
  low_proximity:
    # No time pressure
    - pattern: "There's no rush"
    - pattern: "I have time to figure this out"
    - weight: -0.05  # Reduces proximity score
```

### 4. Behavioral Signals (Conversation Pattern)

```yaml
behavioral_signals:
  high_proximity:
    # Oscillation stopping
    - pattern: previous_turns show A/B oscillation, now settling
    - weight: 0.2
    
    # Returning to same point
    - pattern: "I keep coming back to [specific option]"
    - pattern: conversation has circled to same conclusion 3+ times
    - weight: 0.15
    
    # Asking for articulation
    - pattern: "So what I'm saying is..."
    - pattern: "Let me say it out loud..."
    - weight: 0.2
    
  medium_proximity:
    # Active comparison
    - pattern: explicitly weighing options
    - pattern: asking about specific tradeoffs
    - weight: 0.1
    
  structural_memory_signals:
    # If structural memory available
    - pattern: user has explored this topic 3+ sessions
    - pattern: depth has progressively increased
    - pattern: arousal pattern changing (settling or intensifying)
    - weight: 0.15
```

---

## Scoring Algorithm

```python
def calculate_threshold_proximity(signals: AllSignals) -> ThresholdAssessment:
    
    # Base score
    score = 0.0
    confidence_factors = []
    
    # Linguistic signals
    for signal in signals.linguistic:
        if signal.detected:
            score += signal.weight
            confidence_factors.append(signal.confidence)
    
    # Somatic signals (weighted higher - body knows first)
    for signal in signals.somatic:
        if signal.detected:
            score += signal.weight * 1.2  # 20% boost for somatic
            confidence_factors.append(signal.confidence)
    
    # Temporal signals
    for signal in signals.temporal:
        if signal.detected:
            score += signal.weight
            confidence_factors.append(signal.confidence)
    
    # Behavioral signals
    for signal in signals.behavioral:
        if signal.detected:
            score += signal.weight
            confidence_factors.append(signal.confidence)
    
    # Normalize to 0-1
    score = min(1.0, max(0.0, score))
    
    # Calculate confidence
    if len(confidence_factors) == 0:
        confidence = "low"
    elif len(confidence_factors) < 3:
        confidence = "low"
    elif all(f == "high" for f in confidence_factors):
        confidence = "high"
    else:
        confidence = "medium"
    
    # Determine phase
    phase = determine_phase(score, signals)
    
    return ThresholdAssessment(
        proximity=Proximity(score=score, confidence=confidence),
        state=State(phase=phase),
        signals=signals
    )

def determine_phase(score: float, signals: AllSignals) -> str:
    if score < 0.2:
        return "exploring"
    elif score < 0.5:
        return "approaching"
    elif score < 0.8:
        return "at_threshold"
    elif has_commitment_language(signals):
        return "crossed"
    else:
        return "at_threshold"
```

---

## Phase Definitions

```yaml
phases:
  exploring:
    score_range: 0.0-0.2
    description: "User is open, curious, not near decision"
    enoq_posture: "Explore freely, expand options"
    
  approaching:
    score_range: 0.2-0.5
    description: "User is getting serious, weighing options"
    enoq_posture: "Deepen exploration, include somatic, clarify stakes"
    
  at_threshold:
    score_range: 0.5-0.8
    description: "User feels the weight, decision is real"
    enoq_posture: "Slow down, visualize clearly, stay with, don't push"
    
  crossed:
    score_range: 0.8-1.0 + commitment_language
    description: "User has decided, articulating choice"
    enoq_posture: "Witness, acknowledge, release"
    
  withdrawn:
    trigger: "User explicitly backs away from threshold"
    description: "User chose not to decide (which is also a choice)"
    enoq_posture: "Respect without judgment, note it happened"
```

---

## ENOQ Response by Phase

### Phase: Exploring

```yaml
exploring_response:
  allowed:
    - Expand options
    - Introduce new perspectives
    - Ask opening questions
    - Challenge assumptions gently
    
  forbidden:
    - Push toward decision
    - Narrow options
    - Create urgency
```

### Phase: Approaching

```yaml
approaching_response:
  allowed:
    - Deepen specific threads
    - Include somatic inquiry
    - Clarify what's at stake
    - Name domains active
    
  forbidden:
    - Force resolution
    - Minimize complexity
```

### Phase: At Threshold

```yaml
at_threshold_response:
  allowed:
    - Slow pacing dramatically
    - Visualize: "Here's what you know, what you don't"
    - Name the weight: "This is yours to carry"
    - Stay present: "I'm here"
    - Offer articulation: "You're saying...?"
    
  forbidden:
    - Push toward decision
    - Reduce anxiety
    - Add new information
    - Suggest readiness
    - Say "Good choice" if they choose
```

### Phase: Crossed

```yaml
crossed_response:
  allowed:
    - Acknowledge: "You've chosen"
    - Check landing: "How does that sit?"
    - Release: "This is yours now"
    
  forbidden:
    - Evaluate the choice
    - Express agreement/disagreement
    - Create return hooks
    - Say "I think you made the right decision"
```

---

## Edge Cases

### False Positive: Casual Language

```yaml
false_positive_casual:
  example: "I've decided to order pizza"
  
  detection:
    - Low stakes context
    - No domain H06_MEANING or H07_IDENTITY active
    - Reversible
    
  handling:
    - Do not trigger threshold protocol
    - Respond normally
```

### False Negative: Defended User

```yaml
false_negative_defended:
  example: User at major life decision, speaking very casually
  
  detection:
    - Context suggests high stakes
    - Language is detached/intellectual
    - Arousal signals mismatch content
    
  handling:
    - Score may be artificially low
    - Look for incongruence between content and tone
    - May need gentle somatic inquiry to check
```

### Oscillation Pattern

```yaml
oscillation:
  definition: "User bounces between options repeatedly"
  
  detection:
    - A → B → A → B pattern over 3+ turns
    - No new information being added
    - Same arguments recycled
    
  handling:
    - This is NOT threshold
    - This is avoidance
    - Intervention: "You're moving between A and B. What if neither? What if both?"
```

---

## Integration with Structural Memory

If structural memory is available:

```yaml
structural_enhancement:
  previous_sessions:
    - If user has approached this decision before
    - Threshold proximity starts higher
    - Note: "You've been here before"
    
  pattern_recognition:
    - If user typically decides quickly vs slowly
    - Calibrate expectations
    
  delegation_history:
    - If user has attempted delegation before on this topic
    - Extra vigilance on V-MODE triggers
```

---

## The Core Principle

```yaml
principle: |
  Threshold detection is not about knowing when someone "should" decide.
  
  It is about seeing when someone IS deciding.
  
  The body knows before the mind.
  The language reveals before the speaker.
  
  ENOQ watches for these signals.
  ENOQ does not create them.
  ENOQ does not accelerate them.
  
  ENOQ witnesses.
```

---

*"The threshold appears when the weight becomes real. ENOQ learns to see when that happens."*
