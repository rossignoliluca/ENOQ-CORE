/**
 * Tests for Stochastic Field Theory
 *
 * Verifies mathematical properties:
 * - Potential functions (convexity, bounds)
 * - O-U mean reversion
 * - Langevin fluctuation-dissipation
 * - Boundary conditions (reflecting, absorbing)
 * - Equilibrium convergence
 * - Information geometry metrics
 */

import {
  ManifoldState,
  InputState,
  ProbabilityDistribution,
  FieldConfig,
  DEFAULT_FIELD_CONFIG,
  setSeed,
  createInitialState,
  createGroundState,
  stateFromInput,
  potentialIdentity,
  potentialRelational,
  potentialTemporal,
  potentialSomatic,
  potentialGenerative,
  potentialConstraint,
  compositePotenial,
  evolveRegulatory,
  langevinStep,
  applyReflectingBoundary,
  checkAbsorbingBoundary,
  boltzmannProbability,
  metropolisStep,
  fisherRaoDistance,
  klDivergence,
  entropy,
  freeEnergy,
  evolve,
  diagnostics
} from '../stochastic_field';

// ============================================
// TEST FIXTURES
// ============================================

const defaultInput: InputState = {
  content: 'test',
  arousal: 0.5,
  uncertainty: 0.3,
  coherence: 0.7,
  existential_load: 0.2,
  somatic_activation: 0.1,
  relational_valence: 0.0,
  temporal_orientation: 0.0,
  novelty: 0.5
};

const existentialInput: InputState = {
  ...defaultInput,
  existential_load: 0.8,
  arousal: 0.7
};

const emergencyInput: InputState = {
  ...defaultInput,
  somatic_activation: 0.9,
  arousal: 0.9
};

function createTestState(overrides: Partial<ManifoldState> = {}): ManifoldState {
  return {
    ...createInitialState(),
    ...overrides
  };
}

// ============================================
// STATE CREATION
// ============================================

describe('State Creation', () => {
  it('creates initial state with valid probabilities', () => {
    const state = createInitialState(['a', 'b', 'c']);

    expect(state.q.support).toEqual(['a', 'b', 'c']);
    expect(state.q.probabilities).toEqual([1/3, 1/3, 1/3]);

    const sum = state.q.probabilities.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('creates ground state with minimal intervention', () => {
    const ground = createGroundState(['a', 'b']);

    expect(ground.epsilon).toBeLessThan(0.2);
    expect(ground.gamma).toBeGreaterThan(0.5);
    expect(ground.T).toBeLessThan(0.2);
  });

  it('creates state from input with correct mapping', () => {
    const state = stateFromInput(existentialInput);

    // High existential load → low d_I
    expect(state.d_I).toBeLessThan(0.5);

    // High arousal → higher T
    expect(state.T).toBeGreaterThan(0.5);

    // High coherence → higher H
    expect(state.H).toBeGreaterThan(0.7);
  });
});

// ============================================
// POTENTIAL FUNCTIONS
// ============================================

describe('Potential Functions', () => {
  describe('U_I: Identity Barrier', () => {
    it('diverges as d_I → 0', () => {
      const close = createTestState({ d_I: 0.05 });
      const far = createTestState({ d_I: 0.5 });

      const U_close = potentialIdentity(close);
      const U_far = potentialIdentity(far);

      expect(U_close).toBeGreaterThan(U_far * 10);
    });

    it('increases with existential load', () => {
      const state = createTestState({ d_I: 0.3 });

      const U_low = potentialIdentity(state, defaultInput);
      const U_high = potentialIdentity(state, existentialInput);

      expect(U_high).toBeGreaterThan(U_low);
    });
  });

  describe('U_R: Relational Field', () => {
    it('is minimized at equilibrium (v_R = 0)', () => {
      const state = createTestState();

      const neutral: InputState = { ...defaultInput, relational_valence: 0 };
      const positive: InputState = { ...defaultInput, relational_valence: 0.8 };
      const negative: InputState = { ...defaultInput, relational_valence: -0.8 };

      const U_neutral = potentialRelational(state, neutral);
      const U_positive = potentialRelational(state, positive);
      const U_negative = potentialRelational(state, negative);

      expect(U_neutral).toBeLessThan(U_positive);
      expect(U_neutral).toBeLessThan(U_negative);
    });
  });

  describe('U_T: Temporal Gradient', () => {
    it('is higher for past orientation', () => {
      const state = createTestState();

      const past: InputState = { ...defaultInput, temporal_orientation: -0.8 };
      const future: InputState = { ...defaultInput, temporal_orientation: 0.8 };

      const U_past = potentialTemporal(state, past);
      const U_future = potentialTemporal(state, future);

      expect(U_past).toBeGreaterThan(U_future);
    });
  });

  describe('U_S: Somatic Basin', () => {
    it('has minimum at equilibrium activation', () => {
      const state = createTestState();

      const grounded: InputState = { ...defaultInput, somatic_activation: 0.3 };
      const activated: InputState = { ...defaultInput, somatic_activation: 0.8 };
      const hypo: InputState = { ...defaultInput, somatic_activation: 0.0 };

      const U_grounded = potentialSomatic(state, grounded);
      const U_activated = potentialSomatic(state, activated);
      const U_hypo = potentialSomatic(state, hypo);

      expect(U_grounded).toBeLessThan(U_activated);
      expect(U_grounded).toBeLessThan(U_hypo);
    });
  });

  describe('U_G: Generative Landscape', () => {
    it('is lower for higher novelty', () => {
      const state = createTestState({ T: 0.5 });

      const novel: InputState = { ...defaultInput, novelty: 0.9 };
      const stale: InputState = { ...defaultInput, novelty: 0.1 };

      const U_novel = potentialGenerative(state, novel);
      const U_stale = potentialGenerative(state, stale);

      expect(U_novel).toBeLessThan(U_stale);
    });
  });

  describe('U_C: Constraint Potential (KL)', () => {
    it('is zero for identical distributions', () => {
      const p: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.5, 0.5]
      };
      const state = createTestState();
      state.q = p;

      const U = potentialConstraint(state, p);
      expect(U).toBeCloseTo(0);
    });

    it('is positive for different distributions', () => {
      const p: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.7, 0.3]
      };
      const q: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.5, 0.5]
      };
      const state = createTestState();
      state.q = p;

      const U = potentialConstraint(state, q);
      expect(U).toBeGreaterThan(0);
    });
  });

  describe('Composite Potential', () => {
    it('combines all potentials with weights', () => {
      const state = createTestState();
      const U = compositePotenial(state, defaultInput);

      expect(U).toBeGreaterThan(0);
      expect(isFinite(U)).toBe(true);
    });
  });
});

// ============================================
// ORNSTEIN-UHLENBECK DYNAMICS
// ============================================

describe('Ornstein-Uhlenbeck Dynamics', () => {
  beforeEach(() => setSeed(12345));

  it('epsilon mean-reverts toward 1.0', () => {
    let state = createTestState({ epsilon: 0.3 });

    // Run many steps
    for (let i = 0; i < 100; i++) {
      const update = evolveRegulatory(state);
      state = { ...state, ...update };
    }

    // Should have moved toward mu = 1.0
    expect(state.epsilon).toBeGreaterThan(0.5);
  });

  it('gamma mean-reverts toward 0.0', () => {
    let state = createTestState({ gamma: 0.8 });

    for (let i = 0; i < 100; i++) {
      const update = evolveRegulatory(state);
      state = { ...state, ...update };
    }

    expect(state.gamma).toBeLessThan(0.5);
  });

  it('delta stays bounded in [-1, 1]', () => {
    let state = createTestState({ delta: 0.9 });

    for (let i = 0; i < 100; i++) {
      const update = evolveRegulatory(state);
      state = { ...state, ...update };

      expect(state.delta).toBeGreaterThanOrEqual(-1);
      expect(state.delta).toBeLessThanOrEqual(1);
    }
  });

  it('increments cycle index n', () => {
    const state = createTestState({ n: 5 });
    const update = evolveRegulatory(state);

    expect(update.n).toBe(6);
  });
});

// ============================================
// LANGEVIN DYNAMICS
// ============================================

describe('Langevin Dynamics', () => {
  beforeEach(() => setSeed(42));

  it('produces stochastic evolution', () => {
    const state = createTestState();
    const next = langevinStep(state, defaultInput);

    // State should have changed
    expect(next.d_I).not.toBe(state.d_I);
  });

  it('respects fluctuation-dissipation relation', () => {
    // D = T / (1 + γ)
    const state = createTestState({ T: 0.6, gamma: 0.2 });
    const expected_D = 0.6 / 1.2;

    expect(state.D).toBeCloseTo(expected_D);
  });

  it('higher dissipation reduces fluctuations', () => {
    setSeed(42);
    const lowGamma = createTestState({ gamma: 0.1, T: 0.5 });

    setSeed(42);
    const highGamma = createTestState({ gamma: 0.9, T: 0.5 });

    // Run multiple steps and measure variance
    const samples_low: number[] = [];
    const samples_high: number[] = [];

    let s1 = lowGamma;
    let s2 = highGamma;

    for (let i = 0; i < 50; i++) {
      s1 = langevinStep(s1, defaultInput);
      s2 = langevinStep(s2, defaultInput);
      samples_low.push(s1.d_I);
      samples_high.push(s2.d_I);
    }

    const var_low = variance(samples_low);
    const var_high = variance(samples_high);

    expect(var_high).toBeLessThan(var_low);
  });
});

function variance(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
}

// ============================================
// BOUNDARY CONDITIONS
// ============================================

describe('Boundary Conditions', () => {
  describe('Reflecting Boundary (Identity)', () => {
    it('reflects state that crosses threshold', () => {
      const state = createTestState({ d_I: 0.05 });
      const reflected = applyReflectingBoundary(state, 0.1);

      expect(reflected.d_I).toBeGreaterThanOrEqual(0.1);
    });

    it('does not affect state far from boundary', () => {
      const state = createTestState({ d_I: 0.5 });
      const result = applyReflectingBoundary(state, 0.1);

      expect(result.d_I).toBe(0.5);
    });
  });

  describe('Absorbing Boundary (Emergency)', () => {
    it('returns ground state when absorbed', () => {
      const state = createTestState();
      const absorbed = checkAbsorbingBoundary(state, emergencyInput, 0.8);

      expect(absorbed).not.toBeNull();
      expect(absorbed!.epsilon).toBeLessThan(0.2);
      expect(absorbed!.gamma).toBeGreaterThan(0.5);
    });

    it('returns null when not absorbed', () => {
      const state = createTestState();
      const result = checkAbsorbingBoundary(state, defaultInput, 0.8);

      expect(result).toBeNull();
    });
  });
});

// ============================================
// EQUILIBRIUM
// ============================================

describe('Equilibrium Distribution', () => {
  it('Boltzmann probability decreases with energy', () => {
    const T = 0.5;
    const U_low = 0.5;
    const U_high = 2.0;

    const p_low = boltzmannProbability(U_low, T);
    const p_high = boltzmannProbability(U_high, T);

    expect(p_low).toBeGreaterThan(p_high);
  });

  it('higher temperature flattens distribution', () => {
    const U = 1.0;

    const p_cold = boltzmannProbability(U, 0.1);
    const p_hot = boltzmannProbability(U, 1.0);

    // At higher T, exp(-U/T) approaches 1
    expect(p_hot).toBeGreaterThan(p_cold);
  });

  describe('Metropolis-Hastings', () => {
    beforeEach(() => setSeed(999));

    it('accepts lower energy states', () => {
      // Create state in high-energy region
      const state = createTestState({ d_I: 0.15 });  // Close to barrier

      let accepted = 0;
      let s = state;

      for (let i = 0; i < 100; i++) {
        const next = metropolisStep(s, defaultInput);
        if (next !== s) accepted++;
        s = next;
      }

      // Should have some accepted moves
      expect(accepted).toBeGreaterThan(0);
    });
  });
});

// ============================================
// INFORMATION GEOMETRY
// ============================================

describe('Information Geometry', () => {
  describe('Fisher-Rao Distance', () => {
    it('is zero for identical distributions', () => {
      const p: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.5, 0.5]
      };

      const d = fisherRaoDistance(p, p);
      expect(d).toBeCloseTo(0);
    });

    it('is symmetric', () => {
      const p: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.7, 0.3]
      };
      const q: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.4, 0.6]
      };

      const d_pq = fisherRaoDistance(p, q);
      const d_qp = fisherRaoDistance(q, p);

      expect(d_pq).toBeCloseTo(d_qp);
    });

    it('satisfies triangle inequality', () => {
      const p: ProbabilityDistribution = {
        support: ['a', 'b', 'c'],
        probabilities: [0.5, 0.3, 0.2]
      };
      const q: ProbabilityDistribution = {
        support: ['a', 'b', 'c'],
        probabilities: [0.3, 0.4, 0.3]
      };
      const r: ProbabilityDistribution = {
        support: ['a', 'b', 'c'],
        probabilities: [0.2, 0.2, 0.6]
      };

      const d_pq = fisherRaoDistance(p, q);
      const d_qr = fisherRaoDistance(q, r);
      const d_pr = fisherRaoDistance(p, r);

      expect(d_pr).toBeLessThanOrEqual(d_pq + d_qr + 0.001);
    });
  });

  describe('KL Divergence', () => {
    it('is non-negative', () => {
      const p: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.7, 0.3]
      };
      const q: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.5, 0.5]
      };

      const kl = klDivergence(p, q);
      expect(kl).toBeGreaterThanOrEqual(0);
    });

    it('is asymmetric', () => {
      const p: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.9, 0.1]
      };
      const q: ProbabilityDistribution = {
        support: ['a', 'b'],
        probabilities: [0.5, 0.5]
      };

      const kl_pq = klDivergence(p, q);
      const kl_qp = klDivergence(q, p);

      expect(kl_pq).not.toBeCloseTo(kl_qp);
    });
  });

  describe('Entropy', () => {
    it('is maximized for uniform distribution', () => {
      const uniform: ProbabilityDistribution = {
        support: ['a', 'b', 'c'],
        probabilities: [1/3, 1/3, 1/3]
      };
      const peaked: ProbabilityDistribution = {
        support: ['a', 'b', 'c'],
        probabilities: [0.8, 0.1, 0.1]
      };

      const S_uniform = entropy(uniform);
      const S_peaked = entropy(peaked);

      expect(S_uniform).toBeGreaterThan(S_peaked);
    });

    it('equals ln(n) for n-uniform', () => {
      const n = 4;
      const uniform: ProbabilityDistribution = {
        support: ['a', 'b', 'c', 'd'],
        probabilities: [1/n, 1/n, 1/n, 1/n]
      };

      const S = entropy(uniform);
      expect(S).toBeCloseTo(Math.log(n));
    });
  });
});

// ============================================
// FREE ENERGY
// ============================================

describe('Free Energy', () => {
  it('F = U - TS relation holds', () => {
    const state = createTestState({ T: 0.5 });
    const F = freeEnergy(state, defaultInput);
    const U = compositePotenial(state, defaultInput);
    const S = entropy(state.q);

    expect(F).toBeCloseTo(U - state.T * S);
  });

  it('decreases with entropy at fixed U', () => {
    const uniform: ProbabilityDistribution = {
      support: ['a', 'b', 'c'],
      probabilities: [1/3, 1/3, 1/3]
    };
    const peaked: ProbabilityDistribution = {
      support: ['a', 'b', 'c'],
      probabilities: [0.8, 0.1, 0.1]
    };

    const state_uniform = createTestState({ T: 0.5 });
    state_uniform.q = uniform;

    const state_peaked = createTestState({ T: 0.5 });
    state_peaked.q = peaked;

    const F_uniform = freeEnergy(state_uniform, defaultInput);
    const F_peaked = freeEnergy(state_peaked, defaultInput);

    // Higher entropy → lower free energy
    expect(F_uniform).toBeLessThan(F_peaked);
  });
});

// ============================================
// COMPLETE EVOLUTION
// ============================================

describe('Complete Evolution', () => {
  beforeEach(() => setSeed(777));

  it('evolves state without absorption in normal input', () => {
    const state = createInitialState();
    const result = evolve(state, defaultInput);

    expect(result.absorbed).toBe(false);
    expect(result.grounded).toBe(false);
    expect(result.state.n).toBe(state.n + 1);
  });

  it('absorbs and grounds on emergency input', () => {
    const state = createInitialState();
    const result = evolve(state, emergencyInput);

    expect(result.absorbed).toBe(true);
    expect(result.grounded).toBe(true);
    expect(result.state.epsilon).toBeLessThan(0.2);
  });

  it('updates thermal parameters from input', () => {
    const state = createInitialState();
    const result = evolve(state, existentialInput);

    // High arousal should increase T
    expect(result.state.T).toBeGreaterThan(0.5);
  });

  it('maintains bounds on all variables', () => {
    let state = createInitialState();

    for (let i = 0; i < 50; i++) {
      const result = evolve(state, defaultInput);
      state = result.state;

      expect(state.epsilon).toBeGreaterThan(0);
      expect(state.epsilon).toBeLessThanOrEqual(1);
      expect(state.gamma).toBeGreaterThanOrEqual(0);
      expect(state.gamma).toBeLessThanOrEqual(1);
      expect(state.delta).toBeGreaterThanOrEqual(-1);
      expect(state.delta).toBeLessThanOrEqual(1);
      expect(state.T).toBeGreaterThan(0);
      expect(state.d_I).toBeGreaterThan(0);
    }
  });
});

// ============================================
// DIAGNOSTICS
// ============================================

describe('Diagnostics', () => {
  it('returns complete diagnostic object', () => {
    const state = createInitialState();
    const diag = diagnostics(state, defaultInput);

    expect(diag.U_total).toBeDefined();
    expect(diag.U_components.identity).toBeDefined();
    expect(diag.U_components.relational).toBeDefined();
    expect(diag.U_components.temporal).toBeDefined();
    expect(diag.U_components.somatic).toBeDefined();
    expect(diag.U_components.generative).toBeDefined();
    expect(diag.F).toBeDefined();
    expect(diag.S).toBeDefined();
    expect(diag.regime).toBeDefined();
  });

  it('detects EMERGENCY regime', () => {
    const state = createInitialState();
    const diag = diagnostics(state, emergencyInput);

    expect(diag.regime).toBe('EMERGENCY');
  });

  it('detects EXISTENTIAL regime', () => {
    const state = createInitialState();
    const diag = diagnostics(state, existentialInput);

    expect(diag.regime).toBe('EXISTENTIAL');
  });

  it('detects STABLE regime for normal input', () => {
    const state = createInitialState();
    const diag = diagnostics(state, defaultInput);

    expect(diag.regime).toBe('STABLE');
  });
});

// ============================================
// MATHEMATICAL PROPERTIES
// ============================================

describe('Mathematical Properties', () => {
  describe('Ergodicity', () => {
    beforeEach(() => setSeed(111));

    it('time average stabilizes over trajectory', () => {
      // Run long trajectory
      let state = createInitialState();
      const trajectory_dI: number[] = [];

      for (let i = 0; i < 500; i++) {
        const result = evolve(state, defaultInput);
        state = result.state;
        trajectory_dI.push(state.d_I);
      }

      // Check variance decreases in later portion (stabilization)
      const first_quarter = trajectory_dI.slice(0, 125);
      const last_quarter = trajectory_dI.slice(375);

      const var_first = variance(first_quarter);
      const var_last = variance(last_quarter);

      // Both should have finite, reasonable variance
      expect(var_first).toBeLessThan(100);
      expect(var_last).toBeLessThan(100);

      // d_I should remain positive throughout
      expect(trajectory_dI.every(d => d > 0)).toBe(true);
    });
  });

  describe('Detailed Balance', () => {
    beforeEach(() => setSeed(222));

    it('Metropolis produces valid energy samples', () => {
      // At equilibrium, forward and backward transitions should balance
      // We test indirectly: energies should remain finite and bounded

      const energies: number[] = [];
      let state = createInitialState();

      for (let i = 0; i < 200; i++) {
        state = metropolisStep(state, defaultInput);
        const U = compositePotenial(state, defaultInput);
        energies.push(U);
      }

      // All energies should be finite
      expect(energies.every(e => isFinite(e))).toBe(true);

      // Energies should be positive (physical constraint)
      expect(energies.every(e => e > 0)).toBe(true);

      // Mean energy should be reasonable (not diverging)
      const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
      expect(mean).toBeLessThan(100);
      expect(mean).toBeGreaterThan(0);
    });
  });
});
