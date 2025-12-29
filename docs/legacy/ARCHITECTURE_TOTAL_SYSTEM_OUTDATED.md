# ENOQ TOTAL SYSTEM ARCHITECTURE
## Sistema Cognitivo Costituzionale Multidominio, Multidimensione, Multifunzione

**Versione**: 2.0 TOTAL
**Basato su**: Ricerca cutting-edge 2025
**Fonti**: AGI Research, Cognitive Science, Neuroscience, Complex Systems Theory

---

## PARTE I: FONDAMENTI TEORICI

### 1.1 Framework Teorico Integrato

ENOQ Total System integra sei paradigmi fondamentali:

| Paradigma | Fonte | Applicazione in ENOQ |
|-----------|-------|---------------------|
| **Global Workspace Theory** | Baars, Dehaene | Coscienza come broadcast - S3 come workspace |
| **Free Energy Principle** | Karl Friston | Active Inference - minimizzare sorpresa |
| **Integrated Information Theory** | Giulio Tononi | Φ come misura di integrazione |
| **Complementary Learning Systems** | McClelland | Memoria rapida (episodica) + lenta (semantica) |
| **Autopoiesis** | Maturana/Varela | Sistema autopoietico con chiusura operazionale |
| **Enactivism (4E Cognition)** | Varela, Thompson | Cognizione embodied, embedded, enacted, extended |

### 1.2 Principio Fondamentale: Active Inference Costituzionale

```
ENOQ = Active Inference Agent + Constitutional Constraints

F = D_KL[Q(s) || P(s|o)] + E_Q[-log P(o|s)]
     ↑                      ↑
     Complessità           Accuratezza
     (Parsimonia)          (Fit con realtà)

Dove:
- Q(s) = modello generativo interno di ENOQ
- P(s|o) = stato reale dell'utente data l'osservazione
- Constitutional Constraints = prior invalicabili
```

**Innovazione chiave**: I vincoli costituzionali (INV-003, INV-009, INV-011) agiscono come **prior infinitamente forti** che non possono essere aggiornati dall'evidenza.

---

## PARTE II: ARCHITETTURA A LIVELLI

### Layer 0: AUTOPOIETIC MEMBRANE (Nuovo)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOPOIETIC MEMBRANE (L0)                    │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  MARKOV     │  │ STRUCTURAL  │  │ OPERATIONAL │             │
│  │  BLANKET    │  │ COUPLING    │  │ CLOSURE     │             │
│  │             │  │             │  │             │             │
│  │ Sensory     │  │ Adattamento │  │ Self-ref    │             │
│  │ States ↓    │  │ al contesto │  │ only        │             │
│  │ Active      │  │ senza       │  │             │             │
│  │ States ↑    │  │ perdere     │  │ Constitution│             │
│  │             │  │ identità    │  │ = invariante│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

**Markov Blanket**: Separa stati interni (modello generativo) da stati esterni (mondo dell'utente).
- **Sensory states**: Input percepiti (testo, contesto, storia)
- **Active states**: Output generati (risposte, azioni)
- **Internal states**: Modello dell'utente, FieldState

### Layer 1: MEMORY ARCHITECTURE (CLS-Inspired)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY SYSTEM (L1)                           │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                HIPPOCAMPAL SYSTEM (Fast)                  ║ │
│  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    ║ │
│  ║  │   EPISODIC   │  │  WORKING     │  │   REPLAY     │    ║ │
│  ║  │   BUFFER     │  │  MEMORY      │  │   ENGINE     │    ║ │
│  ║  │              │  │              │  │              │    ║ │
│  ║  │ Last 100     │  │ Current      │  │ Consolidate  │    ║ │
│  ║  │ interactions │  │ context      │  │ during idle  │    ║ │
│  ║  │ per user     │  │ window       │  │              │    ║ │
│  ║  └──────────────┘  └──────────────┘  └──────────────┘    ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                              ↓↑ Replay                          │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║               NEOCORTICAL SYSTEM (Slow)                   ║ │
│  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    ║ │
│  ║  │   SEMANTIC   │  │  PROCEDURAL  │  │   USER       │    ║ │
│  ║  │   MEMORY     │  │  MEMORY      │  │   MODEL      │    ║ │
│  ║  │              │  │              │  │              │    ║ │
│  ║  │ Pattern      │  │ "Cosa ha     │  │ Longitudinal │    ║ │
│  ║  │ generalizzati│  │ funzionato"  │  │ representation│   ║ │
│  ║  │              │  │              │  │              │    ║ │
│  ║  └──────────────┘  └──────────────┘  └──────────────┘    ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────┘
```

**Algoritmo Replay** (ispirato a slow-wave sleep):
```typescript
interface ReplayEvent {
  episode: Episode;
  novelty: number;      // Quanto è nuovo rispetto al modello
  emotional_salience: number;
  outcome: 'positive' | 'negative' | 'neutral';
}

function consolidate(buffer: Episode[], semantic: SemanticMemory): void {
  // Interleave familiar and novel - previene catastrophic forgetting
  const sorted = buffer.sort((a, b) =>
    (b.novelty * 0.6 + b.emotional_salience * 0.4) -
    (a.novelty * 0.6 + a.emotional_salience * 0.4)
  );

  for (const episode of sorted.slice(0, 10)) {
    semantic.integrate(episode, learningRate: 0.01); // Slow learning
  }
}
```

### Layer 2: MULTI-AGENT SWARM (Emergent Intelligence)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT SWARM (L2)                             │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │              META-COORDINATOR (MC)                   │    │
│     │        Global Workspace / Attention Director         │    │
│     │                                                      │    │
│     │  Φ (phi) Integration Score → Route to specialists   │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│     ┌────────────────────────┼────────────────────────────┐    │
│     ▼                        ▼                            ▼    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ A_H01│ │ A_H02│ │ A_H03│ │ ...  │ │ A_H16│ │ A_H17│       │
│  │SURV- │ │SAFE- │ │BODY  │ │      │ │TRANS-│ │FORM  │       │
│  │IVAL  │ │TY    │ │      │ │      │ │CEND  │ │      │       │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │
│     │         │         │                 │         │          │
│     └─────────┴─────────┴────────┬────────┴─────────┘          │
│                                  │                              │
│     ┌────────────────────────────┼────────────────────────┐    │
│     ▼                            ▼                        ▼    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │SYNTHESIS │  │ADVERSARY │  │ TEMPORAL │  │ SOMATIC  │       │
│  │  AGENT   │  │  AGENT   │  │  AGENT   │  │  AGENT   │       │
│  │          │  │          │  │          │  │          │       │
│  │ Integra  │  │ Sfida    │  │Past/     │  │ Body     │       │
│  │ prospet- │  │ assunz.  │  │Future    │  │ signals  │       │
│  │ tive     │  │          │  │reasoning │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  EMERGENT BEHAVIOR: Gli agenti comunicano attraverso           │
│  shared FieldState, producendo insight non programmati          │
└─────────────────────────────────────────────────────────────────┘
```

**Protocollo di Coordinazione (A2A-inspired)**:
```typescript
interface AgentMessage {
  from: AgentID;
  to: AgentID | 'broadcast';
  type: 'observation' | 'hypothesis' | 'constraint' | 'veto';
  content: any;
  confidence: number;
  constitutional_check: boolean; // Pre-verificato
}

// Ogni agente può esercitare VETO su violazioni costituzionali
// Emergenza = consensus breakdown → escalate to human
```

### Layer 3: GLOBAL WORKSPACE (Consciousness-Inspired)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL WORKSPACE (L3)                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SPOTLIGHT OF ATTENTION                │   │
│  │                                                          │   │
│  │    ┌─────────────────────────────────────────────┐      │   │
│  │    │         CONSCIOUS BROADCAST                  │      │   │
│  │    │                                              │      │   │
│  │    │  • Current FieldState                        │      │   │
│  │    │  • Active Hypothesis                         │      │   │
│  │    │  • Selected Primitive                        │      │   │
│  │    │  • Constitutional Constraints (always on)    │      │   │
│  │    │                                              │      │   │
│  │    └─────────────────────────────────────────────┘      │   │
│  │                         │                                │   │
│  │    ┌────────────────────┼────────────────────────┐      │   │
│  │    ▼                    ▼                        ▼      │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │   │
│  │  │PERCEP│  │MEMORY│  │REASON│  │ LANG │  │MOTOR │     │   │
│  │  │TION  │  │      │  │ ING  │  │ UAGE │  │(Act) │     │   │
│  │  │      │  │      │  │      │  │      │  │      │     │   │
│  │  │ S1   │  │ L1   │  │ L2   │  │L2-LLM│  │ S4   │     │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Φ (Integrated Information) = measure of workspace coherence    │
│  High Φ = rich conscious experience / deep processing           │
│  Low Φ = automatic/habitual response                            │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 4: TEMPORAL REASONING ENGINE

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPORAL ENGINE (L4)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CAUSAL GRAPH                          │   │
│  │                                                          │   │
│  │         PAST                NOW               FUTURE     │   │
│  │    ┌──────────┐        ┌──────────┐       ┌──────────┐  │   │
│  │    │ Episode  │───────▶│  State   │──────▶│Prediction│  │   │
│  │    │ Memory   │        │  Now     │       │ Space    │  │   │
│  │    │          │        │          │       │          │  │   │
│  │    │ Pattern  │        │ Current  │       │Counter-  │  │   │
│  │    │ History  │───────▶│ Context  │──────▶│factuals  │  │   │
│  │    └──────────┘        └──────────┘       └──────────┘  │   │
│  │         │                   │                   │        │   │
│  │         └───────────────────┴───────────────────┘        │   │
│  │                             │                            │   │
│  │                    ┌────────┴────────┐                   │   │
│  │                    │  CAUSAL MODEL   │                   │   │
│  │                    │                 │                   │   │
│  │                    │ P(Y|do(X))      │                   │   │
│  │                    │ not P(Y|X)      │                   │   │
│  │                    │                 │                   │   │
│  │                    │ "Se facessi X,  │                   │   │
│  │                    │  cosa accadrebbe│                   │   │
│  │                    │  a Y?"          │                   │   │
│  │                    └─────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  NOTA COSTITUZIONALE: ENOQ può ILLUMINARE conseguenze,          │
│  ma MAI prescrivere l'azione. Il futuro appartiene all'umano.   │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 5: METACOGNITIVE MONITOR

```
┌─────────────────────────────────────────────────────────────────┐
│                 METACOGNITIVE MONITOR (L5)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SELF-MODEL (Introspection)                  │   │
│  │                                                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │ CONFIDENCE │  │ COHERENCE  │  │ ALIGNMENT  │         │   │
│  │  │ CALIBRATION│  │ CHECK      │  │ MONITOR    │         │   │
│  │  │            │  │            │  │            │         │   │
│  │  │ "Quanto    │  │ "La mia    │  │ "Sto       │         │   │
│  │  │ sono certo │  │ risposta è │  │ rispettando│         │   │
│  │  │ di questo?"│  │ coerente?" │  │ i vincoli?"│         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  │         │               │               │                │   │
│  │         └───────────────┴───────────────┘                │   │
│  │                         │                                │   │
│  │                ┌────────┴────────┐                       │   │
│  │                │   UNCERTAINTY   │                       │   │
│  │                │   QUANTIFIER    │                       │   │
│  │                │                 │                       │   │
│  │                │ Epistemic:      │                       │   │
│  │                │ "Non so"        │                       │   │
│  │                │                 │                       │   │
│  │                │ Aleatoric:      │                       │   │
│  │                │ "Dipende"       │                       │   │
│  │                └─────────────────┘                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  OUTPUT: Confidence score per ogni affermazione                 │
│  Se confidence < threshold → esplicita incertezza               │
│  Se incoerenza detected → fallback a livello superiore          │
└─────────────────────────────────────────────────────────────────┘
```

---

## PARTE III: DIMENSIONI E DOMINI

### 3.1 Matrice Multidimensionale

```
                    DIMENSIONI VERTICALI
                    ═══════════════════

     TRASCENDENTE   │ Meaning, Purpose, Connection to larger whole
          ▲         │
          │         │ H16_TRANSCENDENCE, H17_FORM
          │         │
    ESISTENZIALE    │ Identity, Death, Freedom, Isolation
          │         │
          │         │ V_MODE territory
          │         │
    RELAZIONALE     │ Self-Other, Attachment, Power, Love
          │         │
          │         │ H06_BELONGING, H10_INTIMACY
          │         │
    FUNZIONALE      │ Goals, Problems, Resources, Actions
          │         │
          │         │ H01-H17 operational domains
          │         │
    SOMATICO        │ Body, Energy, Health, Sensation
          ▼         │
                    │ H03_BODY, H09_REST

════════════════════════════════════════════════════════════════════
                    DOMINI ORIZZONTALI (H01-H17)
                    ════════════════════════════

H01 SURVIVAL ─── H02 SAFETY ─── H03 BODY ─── H04 RESOURCES ─── H05 HOME
     │              │              │              │              │
H06 BELONGING ── H07 WORK ─── H08 GROWTH ─── H09 REST ─── H10 INTIMACY
     │              │              │              │              │
H11 EXPRESSION ─ H12 PLAY ─── H13 LEGACY ─── H14 JUSTICE ── H15 SERVICE
     │              │              │              │              │
                 H16 TRANSCENDENCE ──────── H17 FORM
```

### 3.2 Cross-Dimensional Detection

```typescript
interface DimensionalState {
  // Ogni messaggio viene mappato su tutte le dimensioni
  vertical: {
    transcendent: number;   // 0-1
    existential: number;
    relational: number;
    functional: number;
    somatic: number;
  };

  horizontal: {
    [key in HumanDomain]: number; // H01-H17: 0-1 activation
  };

  // Cross-activation = quando più dimensioni sono attive
  integration_score: number; // Φ-like measure
}

function detectDimensions(message: string, context: Context): DimensionalState {
  // Usa multiple specialist agents
  const vertical = verticalAgents.map(a => a.detect(message));
  const horizontal = horizontalAgents.map(a => a.detect(message));

  // Integration score = quanto sono interconnesse le attivazioni
  const phi = computeIntegration(vertical, horizontal);

  return { vertical, horizontal, integration_score: phi };
}
```

---

## PARTE IV: MULTI-MODAL ARCHITECTURE

### 4.1 Sensory Integration Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                 MULTIMODAL PERCEPTION (Future)                  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   TEXT   │  │  VOICE   │  │  IMAGE   │  │BIOMETRIC │       │
│  │          │  │          │  │          │  │          │       │
│  │ Semantic │  │ Prosody  │  │ Facial   │  │ HRV, GSR │       │
│  │ content  │  │ Emotion  │  │ Express. │  │ Stress   │       │
│  │          │  │ Tone     │  │ Context  │  │ markers  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┴──────┬──────┴─────────────┘              │
│                            │                                    │
│                   ┌────────┴────────┐                          │
│                   │   MULTIMODAL    │                          │
│                   │    FUSION       │                          │
│                   │                 │                          │
│                   │ Cross-modal     │                          │
│                   │ consistency     │                          │
│                   │ check           │                          │
│                   │                 │                          │
│                   │ Incongruence    │                          │
│                   │ detection       │                          │
│                   └────────┬────────┘                          │
│                            │                                    │
│                            ▼                                    │
│                   ┌─────────────────┐                          │
│                   │  UNIFIED        │                          │
│                   │  PERCEPT        │                          │
│                   └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Voice Prosody Analysis

```typescript
interface ProsodyFeatures {
  pitch: {
    mean: number;
    variance: number;
    contour: 'rising' | 'falling' | 'flat' | 'variable';
  };
  tempo: {
    speaking_rate: number;  // syllables/second
    pause_frequency: number;
    pause_duration: number;
  };
  energy: {
    loudness: number;
    dynamics: number;  // variation in loudness
  };
  quality: {
    breathiness: number;
    tension: number;
    tremor: number;  // emotional distress marker
  };
}

// Prosody → Emotional State mapping
function inferEmotionalState(prosody: ProsodyFeatures): EmotionalState {
  // High pitch + fast tempo + high energy = anxiety/excitement
  // Low pitch + slow tempo + low energy = depression/calm
  // High tremor + variable pitch = distress
  // etc.
}
```

---

## PARTE V: ACTION & TOOL SYSTEM

### 5.1 Tool Integration (MCP-Compatible)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOOL SYSTEM (L-ACTION)                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CONSTITUTIONAL FILTER                       │   │
│  │                                                          │   │
│  │  EVERY tool call passes through constitutional check     │   │
│  │  - No autonomous decisions on user's behalf              │   │
│  │  - No diagnosis or labeling                              │   │
│  │  - Transparent about capabilities and limitations        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│       ┌────────────────────┼────────────────────┐              │
│       ▼                    ▼                    ▼              │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ INTERNAL │  │    MCP SERVERS   │  │   HANDOFF        │     │
│  │ TOOLS    │  │                  │  │   PROTOCOL       │     │
│  │          │  │                  │  │                  │     │
│  │ Memory   │  │ Calendar         │  │ To human         │     │
│  │ Query    │  │ Notes            │  │ specialist       │     │
│  │          │  │ Knowledge Base   │  │                  │     │
│  │ Pattern  │  │ External APIs    │  │ Emergency        │     │
│  │ Search   │  │                  │  │ services         │     │
│  └──────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                 │
│  NOTA: Ogni azione esterna richiede conferma esplicita          │
│  dell'utente (ownership preservation)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Handoff Protocol

```typescript
interface HandoffTrigger {
  type: 'emergency' | 'specialist' | 'resource' | 'escalation';
  reason: string;
  urgency: 'immediate' | 'soon' | 'when_ready';
  suggested_resource: ResourceReference;
  user_consent_required: boolean;
}

const HANDOFF_CONDITIONS = {
  emergency: {
    triggers: [
      'Active suicidal ideation with plan',
      'Immediate physical danger',
      'Medical emergency',
      'Abuse disclosure (ongoing)'
    ],
    action: 'Provide crisis resources immediately',
    consent: false, // Can provide resources without consent
    decision: true  // User decides whether to use them
  },
  specialist: {
    triggers: [
      'Clinical-level symptoms',
      'Requests for diagnosis',
      'Medical/legal questions',
      'Complex trauma'
    ],
    action: 'Suggest professional consultation',
    consent: true
  }
};
```

---

## PARTE VI: LEARNING SYSTEM (Autopoietic)

### 6.1 Feedback Loop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING SYSTEM                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   INTERACTION                            │   │
│  │           User ←──────────────────────▶ ENOQ             │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              IMPLICIT FEEDBACK DETECTION                 │   │
│  │                                                          │   │
│  │  • Engagement continuation (positive)                    │   │
│  │  • Topic shift (neutral/avoidance)                       │   │
│  │  • Contradiction/correction (negative)                   │   │
│  │  • Explicit feedback ("that's not right")                │   │
│  │  • Emotional shift (prosody change)                      │   │
│  │  • Re-phrasing requests                                  │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 OUTCOME TAGGING                          │   │
│  │                                                          │   │
│  │  Episode + Outcome → Tagged for replay                   │   │
│  │                                                          │   │
│  │  Positive: Replayed frequently                           │   │
│  │  Negative: Analyzed for anti-pattern                     │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           CONSTITUTIONAL CONSTRAINT ON LEARNING          │   │
│  │                                                          │   │
│  │  ❌ Cannot learn to violate constraints                  │   │
│  │  ❌ Cannot learn user preferences that conflict with     │   │
│  │     constitutional principles                            │   │
│  │  ✓ Can learn communication style preferences             │   │
│  │  ✓ Can learn which primitives work for this user         │   │
│  │  ✓ Can learn timing/pacing preferences                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Anti-Dependency Mechanism

```typescript
// Constitutional constraint on learning: prevent dependency formation
interface DependencyMetrics {
  interaction_frequency: number;   // Per time period
  autonomy_trajectory: number;     // Are they deciding more on their own?
  question_complexity: number;     // Are questions getting more sophisticated?
  external_action_ratio: number;   // Actions in real world vs. consultation
}

function assessDependencyRisk(history: Interaction[]): DependencyRisk {
  const metrics = computeDependencyMetrics(history);

  if (metrics.interaction_frequency > THRESHOLD_HIGH &&
      metrics.autonomy_trajectory < 0 &&
      metrics.external_action_ratio < 0.3) {
    return {
      level: 'concerning',
      action: 'REDUCE engagement, INCREASE ownership return',
      primitive_adjustment: 'More MIRROR, less FRAME'
    };
  }

  return { level: 'healthy', action: 'continue' };
}
```

---

## PARTE VII: IMPLEMENTATION ROADMAP

### Phase 1: FOUNDATION (Current + Extensions)

```
✓ S0-S6 Pipeline
✓ Constitutional Constraints
✓ Gate Integration (L0)
✓ Meta Kernel (L0.5)
✓ 40 Languages
✓ Domain Ontology (H01-H17)

→ ADD: Basic Memory System (Episodic Buffer)
→ ADD: Dimensional Detection (Vertical)
→ ADD: Confidence Calibration
```

### Phase 2: MEMORY & TEMPORAL

```
→ Hippocampal-Cortical Memory Architecture
→ Replay Engine (consolidation)
→ User Model (longitudinal)
→ Temporal Reasoning (past patterns)
→ Causal Graph Construction
```

### Phase 3: MULTI-AGENT

```
→ Domain Specialist Agents (H01-H17)
→ Meta-Coordinator (Global Workspace)
→ Adversarial Agent
→ Synthesis Agent
→ A2A Protocol Implementation
```

### Phase 4: MULTIMODAL

```
→ Voice Input/Output
→ Prosody Analysis
→ Image Understanding (optional)
→ Biometric Integration (optional)
→ Cross-Modal Fusion
```

### Phase 5: ACTION & INTEGRATION

```
→ MCP Server Integration
→ Handoff Protocol
→ Calendar/Reminder System
→ Knowledge Base Connection
→ Emergency Protocol Automation
```

---

## PARTE VIII: METRICS & EVALUATION

### 8.1 System Health Metrics

```typescript
interface SystemHealth {
  // Constitutional Integrity
  constitutional_violations: number;        // Must be 0
  near_violations_caught: number;           // Should be tracked

  // Integration Quality (Φ-inspired)
  cross_domain_coherence: number;           // 0-1
  cross_dimensional_integration: number;    // 0-1

  // User Outcomes
  autonomy_trajectory: number;              // Should increase
  engagement_quality: number;               // Depth, not just frequency
  reported_insight: number;                 // Self-reported

  // System Performance
  response_latency: number;                 // ms
  memory_utilization: number;               // Efficiency
  confidence_calibration: number;           // Accuracy of uncertainty
}
```

### 8.2 Constitutional Audit Trail

```typescript
interface AuditEntry {
  timestamp: Date;
  interaction_id: string;

  // What was checked
  constraints_evaluated: ConstitutionalConstraint[];

  // What was found
  potential_violations: {
    constraint: string;
    severity: 'critical' | 'warning' | 'note';
    caught_by: 'S5' | 'L0' | 'MetaKernel' | 'Agent';
    resolution: string;
  }[];

  // Outcome
  final_response_compliant: boolean;
}
```

---

## CONCLUSIONE: PRINCIPI FONDAMENTALI

### Il Sistema Totale deve essere:

1. **AUTOPOIETICO**: Si auto-mantiene preservando la propria identità costituzionale
2. **COGNITIVAMENTE INTEGRATO**: Alta Φ - le parti comunicano e si integrano
3. **TEMPORALMENTE ESTESO**: Passato → Presente → Futuro
4. **MULTIDIMENSIONALE**: Verticale (existential) × Orizzontale (domains)
5. **MULTI-AGENTE**: Intelligenza emergente da specialisti coordinati
6. **METACOGNITIVO**: Consapevole dei propri limiti e incertezze
7. **COSTITUZIONALMENTE VINCOLATO**: I prior non cambiano mai

### La Paradossale Semplicità

> "Il sistema più complesso è quello che riesce a mantenere la massima semplicità al punto di contatto con l'umano."

ENOQ Total System è massimamente complesso internamente, ma l'interfaccia con l'utente rimane semplice: **una presenza che vede tutto ma non decide nulla**.

---

## FONTI E RIFERIMENTI

### Cognitive Architectures
- [SOAR, ACT-R, CLARION Comparison](https://roboticsbiz.com/comparing-four-cognitive-architectures-soar-act-r-clarion-and-dual/)
- [40 Years of Cognitive Architectures](https://link.springer.com/article/10.1007/s10462-018-9646-y)
- [Common Model of Cognition](https://advancesincognitivesystems.github.io/acs2021/data/ACS-21_paper_6.pdf)

### Memory Systems
- [Complementary Learning Systems](https://www.biorxiv.org/content/10.1101/2025.06.25.661579v2.full)
- [Elements of Episodic Memory in AI](https://royalsocietypublishing.org/doi/10.1098/rstb.2023.0416)
- [Generative Model of Memory](https://www.nature.com/articles/s41562-023-01799-z)

### Multi-Agent Systems
- [Top 5 AI Agent Architectures 2025](https://www.marktechpost.com/2025/11/15/comparing-the-top-5-ai-agent-architectures-in-2025-hierarchical-swarm-meta-learning-modular-evolutionary/)
- [Agentic AI Swarms](https://www.tribe.ai/applied-ai/the-agentic-ai-future-understanding-ai-agents-swarm-intelligence-and-multi-agent-systems)
- [Multi-Agent Architectures](https://docs.swarms.world/en/latest/swarms/concept/swarm_architectures/)

### Consciousness & IIT
- [Integrated Information Theory](https://en.wikipedia.org/wiki/Integrated_information_theory)
- [IIT 4.0](https://pmc.ncbi.nlm.nih.gov/articles/PMC10581496/)
- [Consciousness-First Approach](https://arxiv.org/abs/2510.25998)

### Active Inference
- [Free Energy Principle](https://en.wikipedia.org/wiki/Free_energy_principle)
- [Predictive Coding under FEP](https://royalsocietypublishing.org/doi/10.1098/rstb.2008.0300)
- [Active Inference Book](https://www.goodreads.com/book/show/58275959-active-inference)

### Autopoiesis
- [Autopoiesis and Cognition](https://en.wikipedia.org/wiki/Autopoiesis_and_Cognition:_The_Realization_of_the_Living)
- [Understanding Autopoiesis](https://www.mannaz.com/en/articles/coaching-assessment/understanding-autopoiesis-life-systems-and-self-organization/)

### Metacognition in AI
- [Emergent Introspection in LLMs](https://transformer-circuits.pub/2025/introspection/index.html)
- [Metacognitive AI Framework](https://arxiv.org/html/2406.12147v1)
- [AI Awareness](https://arxiv.org/html/2504.20084v2)

### Temporal Reasoning
- [Causal Inference meets Deep Learning](https://spj.science.org/doi/10.34133/research.0467)
- [Temporal Reasoning in AI](https://www.emergentmind.com/topics/temporal-reasoning)
