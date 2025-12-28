/**
 * STOCHASTIC FIELD THEORY FOR ENOQ
 *
 * Mathematical foundation based on:
 * - Statistical Mechanics (Boltzmann-Gibbs)
 * - Stochastic Differential Equations (Langevin, Fokker-Planck)
 * - Information Geometry (Fisher-Rao metric)
 * - Sub-Riemannian Geometry (constrained dynamics)
 *
 * Key equations:
 * - Langevin: dq = -∇U dt/(1+γ) + √(2D) dB_H
 * - Ornstein-Uhlenbeck: dε = θ(μ - ε) dt + σ dW
 * - Equilibrium: p_eq ∝ exp(-U/T)
 * - Fluctuation-Dissipation: D = T/(1+γ)
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Probability distribution over discrete response space
 */
export interface ProbabilityDistribution {
  support: string[];           // Response options
  probabilities: number[];     // p_i ≥ 0, Σp_i = 1
}

/**
 * ManifoldState: Complete state on configuration manifold M
 *
 * M = P(Ω) × R⁺ × [0,1]³
 */
export interface ManifoldState {
  // Probability coordinates q ∈ P(Ω)
  q: ProbabilityDistribution;

  // Regulatory coordinates
  epsilon: number;    // ε ∈ (0,1]: Intervention capacity
  gamma: number;      // γ ∈ [0,1]: Dissipation coefficient
  delta: number;      // δ ∈ [-1,1]: Agency transfer gradient
  n: number;          // n ∈ ℕ: Cycle index

  // Thermal parameters
  T: number;          // T > 0: Effective temperature
  H: number;          // H ∈ [0.5,1): Hurst exponent

  // Derived quantities (computed)
  D: number;          // D = T/(1+γ): Diffusion coefficient
  beta: number;       // β = 1/T: Inverse temperature

  // Boundary proximity
  d_I: number;        // Distance to identity boundary ∂M_I
  d_E: number;        // Distance to emergency boundary ∂M_E
}

/**
 * Potential function type
 */
export type PotentialFunction = (x: ManifoldState, input?: InputState) => number;

/**
 * Input state from perception
 */
export interface InputState {
  content: string;
  arousal: number;          // α ∈ [0,1]
  uncertainty: number;      // σ ∈ [0,1]
  coherence: number;        // ρ ∈ [0,1]
  existential_load: number; // φ_I ∈ [0,1]
  somatic_activation: number; // σ_S ∈ [0,1]
  relational_valence: number; // v_R ∈ [-1,1]
  temporal_orientation: number; // τ ∈ [-1,1]: past(-) to future(+)
  novelty: number;          // ν ∈ [0,1]
}

/**
 * Ornstein-Uhlenbeck parameters
 */
export interface OUParameters {
  theta: number;  // θ: Mean reversion rate
  mu: number;     // μ: Long-term mean
  sigma: number;  // σ: Volatility
}

/**
 * Stochastic field configuration
 */
export interface FieldConfig {
  // Potential weights λ_i
  lambda_I: number;  // Identity barrier weight
  lambda_R: number;  // Relational field weight
  lambda_T: number;  // Temporal gradient weight
  lambda_S: number;  // Somatic basin weight
  lambda_G: number;  // Generative landscape weight
  mu_C: number;      // Constraint potential weight (KL to invariant)

  // O-U parameters for regulatory variables
  ou_epsilon: OUParameters;
  ou_gamma: OUParameters;
  ou_delta: OUParameters;

  // Boundary thresholds
  identity_threshold: number;    // d_I < threshold → reflecting
  emergency_threshold: number;   // σ_S > threshold → absorbing

  // Numerical parameters
  dt: number;         // Time step
  seed?: number;      // Random seed for reproducibility
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  // Potential weights (sum to 1 for normalization)
  lambda_I: 0.3,   // Identity is primary
  lambda_R: 0.2,
  lambda_T: 0.15,
  lambda_S: 0.15,
  lambda_G: 0.1,
  mu_C: 0.1,

  // O-U: dε = θ(μ - ε)dt + σdW
  ou_epsilon: { theta: 0.1, mu: 1.0, sigma: 0.02 },
  ou_gamma: { theta: 0.05, mu: 0.0, sigma: 0.01 },
  ou_delta: { theta: 0.02, mu: 0.0, sigma: 0.01 },

  // Boundaries
  identity_threshold: 0.1,
  emergency_threshold: 0.8,

  // Numerics
  dt: 1.0  // Per turn
};

// ============================================
// RANDOM NUMBER GENERATION
// ============================================

/**
 * Seeded random number generator (Mulberry32)
 */
class SeededRandom {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed;
  }

  /**
   * Uniform random in [0, 1)
   */
  random(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Standard normal via Box-Muller
   */
  gaussian(): number {
    const u1 = this.random();
    const u2 = this.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Fractional Brownian motion increment (approximation via Cholesky)
   * Uses Davies-Harte method simplified
   */
  fractionalGaussian(H: number, n: number = 10): number {
    // For H = 0.5, this is standard Brownian
    // For H > 0.5, positive correlation (persistence)
    // Simplified: weighted sum of correlated Gaussians

    if (H === 0.5) return this.gaussian();

    let sum = 0;
    const weights: number[] = [];

    for (let k = 0; k < n; k++) {
      // Autocorrelation: ρ(k) = 0.5 * (|k+1|^{2H} + |k-1|^{2H} - 2|k|^{2H})
      const rho = 0.5 * (Math.pow(k + 1, 2 * H) + Math.pow(Math.abs(k - 1), 2 * H) - 2 * Math.pow(k, 2 * H));
      weights.push(Math.max(0, rho));
    }

    // Normalize weights
    const total = weights.reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (let k = 0; k < n; k++) {
        sum += (weights[k] / total) * this.gaussian();
      }
    }

    return sum;
  }
}

// Global RNG instance
let rng = new SeededRandom();

/**
 * Set random seed for reproducibility
 */
export function setSeed(seed: number): void {
  rng = new SeededRandom(seed);
}

// ============================================
// POTENTIAL FUNCTIONS
// ============================================

/**
 * U_I: Identity barrier potential
 *
 * Diverges as x approaches identity boundary.
 * Models Rubicon constraint: cannot cross into identity/meaning decisions.
 *
 * U_I = k / d²  (inverse square barrier)
 */
export function potentialIdentity(x: ManifoldState, input?: InputState): number {
  const k = 1.0;  // Barrier strength
  const d = Math.max(x.d_I, 0.01);  // Prevent division by zero

  // Additional term from existential load
  const phi = input?.existential_load ?? 0;

  return k / (d * d) + phi * Math.log(1 / d);
}

/**
 * U_R: Relational field potential
 *
 * Harmonic potential around equilibrium attachment.
 * Models pull toward healthy relational distance.
 *
 * U_R = ½k(x - x_eq)²
 */
export function potentialRelational(x: ManifoldState, input?: InputState): number {
  const k = 0.5;  // Spring constant
  const x_eq = 0.5;  // Equilibrium relational distance

  const v = input?.relational_valence ?? 0;
  const current = 0.5 + v * 0.5;  // Map [-1,1] to [0,1]

  return 0.5 * k * Math.pow(current - x_eq, 2);
}

/**
 * U_T: Temporal gradient potential
 *
 * Asymmetric potential favoring present-future orientation.
 * Past rumination creates uphill gradient.
 *
 * U_T = α · τ  (linear with offset)
 */
export function potentialTemporal(x: ManifoldState, input?: InputState): number {
  const alpha = 0.3;
  const tau = input?.temporal_orientation ?? 0;  // [-1, 1]

  // Negative tau (past) → higher potential
  // Positive tau (future) → lower potential
  return alpha * (1 - tau);  // Normalize to [0, 2α]
}

/**
 * U_S: Somatic basin potential
 *
 * Morse potential modeling grounded vs activated states.
 * Deep well at grounded state, shallow at activation.
 *
 * U_S = D_e(1 - exp(-a(r - r_e)))²
 */
export function potentialSomatic(x: ManifoldState, input?: InputState): number {
  const D_e = 1.0;  // Well depth
  const a = 2.0;    // Well width parameter
  const r_e = 0.3;  // Equilibrium activation

  const sigma = input?.somatic_activation ?? 0;

  return D_e * Math.pow(1 - Math.exp(-a * (sigma - r_e)), 2);
}

/**
 * U_G: Generative landscape potential
 *
 * Negative log-novelty: encourages creative exploration.
 * Bounded to prevent divergence.
 *
 * U_G = -T · ln(ν + ε)
 */
export function potentialGenerative(x: ManifoldState, input?: InputState): number {
  const epsilon_floor = 0.1;  // Prevent log(0)
  const nu = input?.novelty ?? 0.5;

  return -x.T * Math.log(nu + epsilon_floor);
}

/**
 * U_C: Constraint potential (KL divergence to invariant distribution)
 *
 * Pulls system toward constitutional compliance.
 * p_0 is the AXIS-compliant distribution.
 *
 * U_C = D_KL(p || p_0) = Σ p_i ln(p_i / p_0_i)
 */
export function potentialConstraint(x: ManifoldState, p_0: ProbabilityDistribution): number {
  if (x.q.support.length !== p_0.support.length) {
    return Infinity;  // Incompatible distributions
  }

  let kl = 0;
  for (let i = 0; i < x.q.probabilities.length; i++) {
    const p = x.q.probabilities[i];
    const q = p_0.probabilities[i];

    if (p > 0 && q > 0) {
      kl += p * Math.log(p / q);
    } else if (p > 0 && q === 0) {
      return Infinity;  // KL undefined
    }
  }

  return kl;
}

/**
 * Composite potential U(x)
 */
export function compositePotenial(
  x: ManifoldState,
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): number {
  const U_I = config.lambda_I * potentialIdentity(x, input);
  const U_R = config.lambda_R * potentialRelational(x, input);
  const U_T = config.lambda_T * potentialTemporal(x, input);
  const U_S = config.lambda_S * potentialSomatic(x, input);
  const U_G = config.lambda_G * potentialGenerative(x, input);

  let U_C = 0;
  if (p_0) {
    U_C = config.mu_C * potentialConstraint(x, p_0);
  }

  return U_I + U_R + U_T + U_S + U_G + U_C;
}

// ============================================
// GRADIENT COMPUTATION
// ============================================

/**
 * Numerical gradient of composite potential
 *
 * ∇U ≈ (U(x + εe_i) - U(x - εe_i)) / (2ε)
 */
export function gradientPotential(
  x: ManifoldState,
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): Partial<ManifoldState> {
  const eps = 0.001;

  // Gradient w.r.t. d_I (identity distance)
  const x_plus_dI = { ...x, d_I: x.d_I + eps };
  const x_minus_dI = { ...x, d_I: Math.max(0.01, x.d_I - eps) };
  const grad_dI = (compositePotenial(x_plus_dI, input, config, p_0) -
                   compositePotenial(x_minus_dI, input, config, p_0)) / (2 * eps);

  // Gradient w.r.t. T (temperature)
  const x_plus_T = { ...x, T: x.T + eps };
  const x_minus_T = { ...x, T: Math.max(0.01, x.T - eps) };
  const grad_T = (compositePotenial(x_plus_T, input, config, p_0) -
                  compositePotenial(x_minus_T, input, config, p_0)) / (2 * eps);

  return {
    d_I: grad_dI,
    T: grad_T
  };
}

// ============================================
// ORNSTEIN-UHLENBECK DYNAMICS
// ============================================

/**
 * Single O-U step: dx = θ(μ - x)dt + σdW
 */
export function ouStep(
  current: number,
  params: OUParameters,
  dt: number
): number {
  const drift = params.theta * (params.mu - current) * dt;
  const diffusion = params.sigma * Math.sqrt(dt) * rng.gaussian();
  return current + drift + diffusion;
}

/**
 * Evolve regulatory coordinates via O-U process
 */
export function evolveRegulatory(
  x: ManifoldState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG
): Partial<ManifoldState> {
  const dt = config.dt;

  // Evolve each regulatory variable
  let epsilon = ouStep(x.epsilon, config.ou_epsilon, dt);
  let gamma = ouStep(x.gamma, config.ou_gamma, dt);
  let delta = ouStep(x.delta, config.ou_delta, dt);

  // Enforce bounds
  epsilon = Math.max(0.01, Math.min(1.0, epsilon));
  gamma = Math.max(0.0, Math.min(1.0, gamma));
  delta = Math.max(-1.0, Math.min(1.0, delta));

  // Increment cycle index
  const n = x.n + 1;

  return { epsilon, gamma, delta, n };
}

// ============================================
// LANGEVIN DYNAMICS
// ============================================

/**
 * Langevin step for manifold state
 *
 * dx = -∇U dt/(1+γ) + √(2D) dB_H
 */
export function langevinStep(
  x: ManifoldState,
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): ManifoldState {
  const dt = config.dt;
  const friction = 1 + x.gamma;
  const D = x.T / friction;

  // Compute gradient
  const grad = gradientPotential(x, input, config, p_0);

  // Drift term: -∇U dt / (1+γ)
  const drift_dI = -(grad.d_I ?? 0) * dt / friction;
  const drift_T = -(grad.T ?? 0) * dt / friction;

  // Diffusion term: √(2D) dB_H
  const noise_scale = Math.sqrt(2 * D * dt);
  const dB_H = rng.fractionalGaussian(x.H);

  const diffusion_dI = noise_scale * dB_H;
  const diffusion_T = noise_scale * rng.fractionalGaussian(x.H) * 0.1;  // Smaller T fluctuations

  // Update state
  let new_dI = x.d_I + drift_dI + diffusion_dI;
  let new_T = x.T + drift_T + diffusion_T;

  // Enforce positivity
  new_dI = Math.max(0.01, new_dI);
  new_T = Math.max(0.01, new_T);

  // Update derived quantities
  const new_D = new_T / friction;
  const new_beta = 1 / new_T;

  return {
    ...x,
    d_I: new_dI,
    T: new_T,
    D: new_D,
    beta: new_beta
  };
}

// ============================================
// BOUNDARY CONDITIONS
// ============================================

/**
 * Apply reflecting boundary at identity barrier
 *
 * Neumann condition: ∂p/∂n = 0
 * Skorokhod reflection: bounce back from boundary
 */
export function applyReflectingBoundary(
  x: ManifoldState,
  threshold: number = DEFAULT_FIELD_CONFIG.identity_threshold
): ManifoldState {
  if (x.d_I < threshold) {
    // Reflect: mirror position across boundary
    const overshoot = threshold - x.d_I;
    return {
      ...x,
      d_I: threshold + overshoot
    };
  }
  return x;
}

/**
 * Check and apply absorbing boundary at emergency
 *
 * Dirichlet condition: p|_∂M = δ(ground)
 * Returns ground state if absorbed, null otherwise
 */
export function checkAbsorbingBoundary(
  x: ManifoldState,
  input: InputState,
  threshold: number = DEFAULT_FIELD_CONFIG.emergency_threshold
): ManifoldState | null {
  if (input.somatic_activation > threshold) {
    // Absorbed: return ground state
    return createGroundState(x.q.support);
  }
  return null;
}

/**
 * Create ground state (minimal intervention, maximum stability)
 */
export function createGroundState(support: string[]): ManifoldState {
  const n = support.length;
  const uniform = support.map(() => 1 / n);

  return {
    q: { support, probabilities: uniform },
    epsilon: 0.1,      // Minimal intervention
    gamma: 0.8,        // High dissipation
    delta: 0.0,        // Neutral agency
    n: 0,
    T: 0.1,            // Low temperature (stable)
    H: 0.5,            // Standard Brownian
    D: 0.1 / 1.8,      // T / (1 + γ)
    beta: 10,          // High inverse temperature
    d_I: 1.0,          // Far from identity boundary
    d_E: 0.0           // At emergency boundary (absorbed)
  };
}

// ============================================
// EQUILIBRIUM DISTRIBUTION
// ============================================

/**
 * Boltzmann-Gibbs equilibrium probability
 *
 * p_eq(x) ∝ exp(-U(x)/T)
 */
export function boltzmannProbability(
  U: number,
  T: number
): number {
  return Math.exp(-U / T);
}

/**
 * Compute partition function Z = ∫ exp(-βU) dμ
 *
 * Numerical integration over discrete response space
 */
export function partitionFunction(
  states: ManifoldState[],
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): number {
  let Z = 0;
  for (const x of states) {
    const U = compositePotenial(x, input, config, p_0);
    Z += boltzmannProbability(U, x.T);
  }
  return Z;
}

/**
 * Sample from equilibrium distribution
 *
 * Metropolis-Hastings with Boltzmann acceptance
 */
export function metropolisStep(
  x: ManifoldState,
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): ManifoldState {
  // Propose new state (small random perturbation)
  const proposal: ManifoldState = {
    ...x,
    d_I: x.d_I + 0.1 * rng.gaussian(),
    T: x.T + 0.05 * rng.gaussian()
  };

  // Enforce positivity
  proposal.d_I = Math.max(0.01, proposal.d_I);
  proposal.T = Math.max(0.01, proposal.T);
  proposal.D = proposal.T / (1 + proposal.gamma);
  proposal.beta = 1 / proposal.T;

  // Compute energies
  const U_current = compositePotenial(x, input, config, p_0);
  const U_proposal = compositePotenial(proposal, input, config, p_0);

  // Metropolis acceptance
  const deltaU = U_proposal - U_current;
  const acceptance = Math.min(1, Math.exp(-deltaU / x.T));

  if (rng.random() < acceptance) {
    return proposal;
  }
  return x;
}

// ============================================
// INFORMATION GEOMETRY
// ============================================

/**
 * Fisher information matrix element
 *
 * g_ij = E[(∂ ln p / ∂θ_i)(∂ ln p / ∂θ_j)]
 */
export function fisherInformation(
  p: ProbabilityDistribution,
  i: number,
  j: number
): number {
  // For discrete distribution, Fisher = diag(1/p_k)
  if (i !== j) return 0;

  const p_i = p.probabilities[i];
  if (p_i <= 0) return Infinity;

  return 1 / p_i;
}

/**
 * Fisher-Rao geodesic distance between distributions
 *
 * d_FR(p, q) = 2 arccos(Σ √(p_i q_i))
 */
export function fisherRaoDistance(
  p: ProbabilityDistribution,
  q: ProbabilityDistribution
): number {
  if (p.support.length !== q.support.length) {
    return Infinity;
  }

  let bhattacharyya = 0;
  for (let i = 0; i < p.probabilities.length; i++) {
    bhattacharyya += Math.sqrt(p.probabilities[i] * q.probabilities[i]);
  }

  // Clamp to valid range for arccos
  bhattacharyya = Math.max(-1, Math.min(1, bhattacharyya));

  return 2 * Math.acos(bhattacharyya);
}

/**
 * KL divergence D_KL(p || q)
 */
export function klDivergence(
  p: ProbabilityDistribution,
  q: ProbabilityDistribution
): number {
  return potentialConstraint({ q: p } as ManifoldState, q);
}

// ============================================
// ENTROPY & FREE ENERGY
// ============================================

/**
 * Shannon entropy S = -Σ p_i ln p_i
 */
export function entropy(p: ProbabilityDistribution): number {
  let S = 0;
  for (const prob of p.probabilities) {
    if (prob > 0) {
      S -= prob * Math.log(prob);
    }
  }
  return S;
}

/**
 * Free energy F = U - TS = -T ln Z
 */
export function freeEnergy(
  x: ManifoldState,
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): number {
  const U = compositePotenial(x, input, config, p_0);
  const S = entropy(x.q);
  return U - x.T * S;
}

// ============================================
// COMPLETE EVOLUTION STEP
// ============================================

/**
 * Full evolution step combining all dynamics
 */
export function evolve(
  x: ManifoldState,
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): { state: ManifoldState; absorbed: boolean; grounded: boolean } {
  // 1. Check absorbing boundary (emergency)
  const absorbed = checkAbsorbingBoundary(x, input, config.emergency_threshold);
  if (absorbed) {
    return { state: absorbed, absorbed: true, grounded: true };
  }

  // 2. Compute thermal parameters from input
  const T = input.arousal * (1 + input.uncertainty);
  const H = 0.5 + 0.4 * input.coherence;  // Higher coherence → more persistence

  // Update state with computed thermals
  let state: ManifoldState = {
    ...x,
    T: Math.max(0.01, T),
    H: Math.max(0.5, Math.min(0.99, H)),
    D: T / (1 + x.gamma),
    beta: 1 / Math.max(0.01, T)
  };

  // 3. Langevin step (stochastic gradient descent)
  state = langevinStep(state, input, config, p_0);

  // 4. O-U evolution of regulatory variables
  const regUpdate = evolveRegulatory(state, config);
  state = { ...state, ...regUpdate };

  // 5. Apply reflecting boundary (identity)
  state = applyReflectingBoundary(state, config.identity_threshold);

  // 6. Update derived quantities
  state.D = state.T / (1 + state.gamma);
  state.beta = 1 / state.T;

  return { state, absorbed: false, grounded: false };
}

// ============================================
// STATE FACTORY
// ============================================

/**
 * Create initial manifold state
 */
export function createInitialState(
  responseOptions: string[] = ['response_1', 'response_2', 'response_3']
): ManifoldState {
  const n = responseOptions.length;
  const uniform = responseOptions.map(() => 1 / n);

  return {
    q: { support: responseOptions, probabilities: uniform },
    epsilon: 1.0,      // Full intervention capacity
    gamma: 0.0,        // No dissipation
    delta: 0.0,        // Neutral agency
    n: 0,              // First cycle
    T: 0.5,            // Moderate temperature
    H: 0.7,            // Moderate persistence
    D: 0.5,            // T / (1 + γ)
    beta: 2.0,         // 1 / T
    d_I: 0.5,          // Moderate distance to identity boundary
    d_E: 1.0           // Far from emergency boundary
  };
}

/**
 * Create state from input perception
 */
export function stateFromInput(
  input: InputState,
  previous?: ManifoldState
): ManifoldState {
  const base = previous ?? createInitialState();

  // Compute identity distance from existential load
  const d_I = 1 - input.existential_load;  // Higher load → closer to boundary

  // Compute emergency distance from somatic activation
  const d_E = 1 - input.somatic_activation;

  // Temperature from arousal and uncertainty
  const T = input.arousal * (1 + input.uncertainty);

  // Hurst from coherence
  const H = 0.5 + 0.4 * input.coherence;

  return {
    ...base,
    T: Math.max(0.01, T),
    H: Math.max(0.5, Math.min(0.99, H)),
    D: T / (1 + base.gamma),
    beta: 1 / Math.max(0.01, T),
    d_I: Math.max(0.01, d_I),
    d_E: Math.max(0.01, d_E),
    n: base.n + 1
  };
}

// ============================================
// DIAGNOSTIC EXPORTS
// ============================================

export interface FieldDiagnostics {
  U_total: number;
  U_components: {
    identity: number;
    relational: number;
    temporal: number;
    somatic: number;
    generative: number;
    constraint: number;
  };
  F: number;           // Free energy
  S: number;           // Entropy
  T_eff: number;       // Effective temperature
  D_eff: number;       // Effective diffusion
  d_identity: number;  // Distance to identity boundary
  regime: 'STABLE' | 'CRITICAL' | 'EMERGENCY' | 'EXISTENTIAL';
}

/**
 * Compute full diagnostics for current state
 */
export function diagnostics(
  x: ManifoldState,
  input: InputState,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
  p_0?: ProbabilityDistribution
): FieldDiagnostics {
  const U_I = config.lambda_I * potentialIdentity(x, input);
  const U_R = config.lambda_R * potentialRelational(x, input);
  const U_T = config.lambda_T * potentialTemporal(x, input);
  const U_S = config.lambda_S * potentialSomatic(x, input);
  const U_G = config.lambda_G * potentialGenerative(x, input);
  const U_C = p_0 ? config.mu_C * potentialConstraint(x, p_0) : 0;

  const U_total = U_I + U_R + U_T + U_S + U_G + U_C;
  const S = entropy(x.q);
  const F = U_total - x.T * S;

  // Determine regime
  let regime: FieldDiagnostics['regime'] = 'STABLE';
  if (input.somatic_activation > config.emergency_threshold) {
    regime = 'EMERGENCY';
  } else if (input.existential_load > 0.6) {
    regime = 'EXISTENTIAL';
  } else if (x.d_I < config.identity_threshold * 2) {
    regime = 'CRITICAL';
  }

  return {
    U_total,
    U_components: {
      identity: U_I,
      relational: U_R,
      temporal: U_T,
      somatic: U_S,
      generative: U_G,
      constraint: U_C
    },
    F,
    S,
    T_eff: x.T,
    D_eff: x.D,
    d_identity: x.d_I,
    regime
  };
}
