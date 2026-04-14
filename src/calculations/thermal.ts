// =============================================================================
// Dantherm — Zone-by-zone thermal calculation for a subcondenser
// (shell-and-tube heat exchanger with partial condensation)
//
// References:
//   [Kern]      D.Q. Kern, "Process Heat Transfer", McGraw-Hill, 1950
//   [Incropera] Incropera & DeWitt, "Fundamentals of Heat and Mass Transfer"
//   [TEMA]      TEMA Standards, 10th Edition
// =============================================================================

import type {
  HeatExchangerInput,
  ZoneResult,
  ThermalResult,
  ShellFluidType,
  FluidComponent,
  TubeArrangement,
} from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PI = Math.PI;

// ---------------------------------------------------------------------------
// Unit conversion helpers (input is in mm, kJ, mPa·s, kg/h — internal SI)
// ---------------------------------------------------------------------------

/** Convert millimetres to metres. */
const mm2m = (mm: number): number => mm / 1000;

/** Convert kJ to J. */
const kJ2J = (kJ: number): number => kJ * 1000;

/** Convert kJ/(kg·K) to J/(kg·K). */
const kJkgK2JkgK = (v: number): number => v * 1000;

/** Convert mPa·s to Pa·s. */
const mPas2Pas = (v: number): number => v / 1000;

/** Convert kg/h to kg/s. */
const kgh2kgs = (v: number): number => v / 3600;

// ---------------------------------------------------------------------------
// 9. Helper — mixture properties at a given vapor fraction
// ---------------------------------------------------------------------------

/**
 * Compute mass-weighted average mixture properties at a given vapor fraction.
 *
 * For each property the mixture value is:
 *   prop_mix = x · prop_vapor + (1 - x) · prop_liquid
 *
 * where x is the local vapor mass fraction and the component properties are
 * mass-flow-weighted across all components.
 *
 * @returns Properties in **SI units** (kg/m³, Pa·s, J/(kg·K), W/(m·K)).
 */
export function getMixturePropAtZone(
  components: FluidComponent[],
  vaporFraction: number,
  densityVapor: number,
  densityLiquid: number,
): {
  density: number;
  viscosity: number;
  cp: number;
  k: number;
  cpVapor: number;
  cpLiquid: number;
  kVapor: number;
  kLiquid: number;
  viscosityVapor: number;
  viscosityLiquid: number;
} {
  const totalFlow = components.reduce((s, c) => s + c.flowRate, 0);
  if (totalFlow === 0) {
    return {
      density: densityLiquid,
      viscosity: 1e-3,
      cp: 4186,
      k: 0.6,
      cpVapor: 2000,
      cpLiquid: 4186,
      kVapor: 0.02,
      kLiquid: 0.6,
      viscosityVapor: 1e-5,
      viscosityLiquid: 1e-3,
    };
  }

  let cpV = 0;
  let cpL = 0;
  let kV = 0;
  let kL = 0;
  let muV = 0;
  let muL = 0;

  for (const c of components) {
    const w = c.flowRate / totalFlow; // mass fraction
    cpV += w * kJkgK2JkgK(c.cpVapor);
    cpL += w * kJkgK2JkgK(c.cpLiquid);
    kV += w * c.kVapor;
    kL += w * c.kLiquid;
    muV += w * mPas2Pas(c.viscosityVapor);
    muL += w * mPas2Pas(c.viscosityLiquid);
  }

  const x = Math.max(0, Math.min(1, vaporFraction));
  const density = x * densityVapor + (1 - x) * densityLiquid;
  const viscosity = x * muV + (1 - x) * muL;
  const cp = x * cpV + (1 - x) * cpL;
  const k = x * kV + (1 - x) * kL;

  return {
    density,
    viscosity,
    cp,
    k,
    cpVapor: cpV,
    cpLiquid: cpL,
    kVapor: kV,
    kLiquid: kL,
    viscosityVapor: muV,
    viscosityLiquid: muL,
  };
}

// ---------------------------------------------------------------------------
// 6. LMTD
// ---------------------------------------------------------------------------

/**
 * Log-Mean Temperature Difference for a counter-current zone.
 *
 *   LMTD = (ΔT₁ − ΔT₂) / ln(ΔT₁ / ΔT₂)
 *
 * When ΔT₁ ≈ ΔT₂ the formula is numerically unstable, so we fall back to
 * the arithmetic mean.
 *
 * @param Th_in  Hot-side inlet  temperature [°C]
 * @param Th_out Hot-side outlet temperature [°C]
 * @param Tc_in  Cold-side inlet  temperature [°C]
 * @param Tc_out Cold-side outlet temperature [°C]
 * @returns LMTD [K]
 *
 * @see [Incropera] §11.4
 */
export function calculateLMTD(
  Th_in: number,
  Th_out: number,
  Tc_in: number,
  Tc_out: number,
): number {
  const dT1 = Th_in - Tc_out;
  const dT2 = Th_out - Tc_in;

  // Guard against negative or zero temperature differences
  if (dT1 <= 0 || dT2 <= 0) {
    // Temperature cross — return small positive value to avoid NaN downstream
    return Math.max(Math.abs(dT1 + dT2) / 2, 0.01);
  }

  const ratio = dT1 / dT2;

  // If the two ΔTs are nearly equal, use arithmetic mean (L'Hôpital)
  if (Math.abs(ratio - 1) < 1e-4) {
    return (dT1 + dT2) / 2;
  }

  return (dT1 - dT2) / Math.log(ratio);
}

// ---------------------------------------------------------------------------
// 7. Ft correction factor
// ---------------------------------------------------------------------------

/**
 * LMTD correction factor for a multi-pass shell-and-tube exchanger.
 *
 * For a 1-shell / N-tube-pass arrangement the analytical Ft expression is:
 *
 *   Ft = √(R² + 1) · ln((1 − P) / (1 − R·P))
 *       / ((R − 1) · ln((2 − P·(R + 1 − √(R² + 1)))
 *                        / (2 − P·(R + 1 + √(R² + 1)))))
 *
 * When R = 1 a simplified form is used.
 *
 * Ft is clamped to a minimum of 0.75; a console warning is emitted when
 * Ft < 0.80 since this typically indicates an unfavourable configuration.
 *
 * @param R          (Th_in − Th_out) / (Tc_out − Tc_in)
 * @param P          (Tc_out − Tc_in) / (Th_in − Tc_in)
 * @param shellPasses Number of shell passes
 * @param tubePasses  Number of tube passes
 * @returns Ft correction factor (dimensionless, 0.75 – 1.0)
 *
 * @see [Incropera] §11.4, [TEMA] §T-4
 */
export function calculateFt(
  R: number,
  P: number,
  shellPasses: number,
  tubePasses: number,
): number {
  // Pure counter-current (1 shell pass, 1 tube pass) needs no correction
  if (shellPasses === 1 && tubePasses === 1) {
    return 1.0;
  }

  // For multi-shell-pass exchangers, transform P for an equivalent single shell
  // using the Nagle series formula: P1 = effective P per shell pass
  let Peff = P;
  if (shellPasses > 1) {
    // Equivalent P per shell pass (TEMA approach)
    const E = ((1 - P * R) / (1 - P)) ** (1 / shellPasses);
    Peff = (E - 1) / (E - R);
    if (!Number.isFinite(Peff) || Peff <= 0 || Peff >= 1) {
      Peff = P;
    }
  }

  let Ft: number;

  if (Math.abs(R - 1) < 1e-6) {
    // Special case R ≈ 1
    const sqrt2 = Math.SQRT2;
    const num = (sqrt2 * Peff) / (1 - Peff);
    const denom = Math.log(
      (2 - Peff * (2 - sqrt2)) / (2 - Peff * (2 + sqrt2)),
    );
    Ft = denom !== 0 ? num / denom : 1.0;
  } else {
    const sqrtR2p1 = Math.sqrt(R * R + 1);
    const num = (sqrtR2p1 / (R - 1)) * Math.log((1 - Peff) / (1 - R * Peff));
    const argA = 2 - Peff * (R + 1 - sqrtR2p1);
    const argB = 2 - Peff * (R + 1 + sqrtR2p1);
    if (argA <= 0 || argB <= 0 || argA / argB <= 0) {
      Ft = 0.75;
    } else {
      const denom = Math.log(argA / argB);
      Ft = denom !== 0 ? num / denom : 1.0;
    }
  }

  if (!Number.isFinite(Ft) || Ft > 1.0) {
    Ft = 1.0;
  }

  if (Ft < 0.80) {
    console.warn(
      `[thermal] Ft correction factor is ${Ft.toFixed(3)} (< 0.80). ` +
        `Consider increasing the number of shell passes.`,
    );
  }

  return Math.max(Ft, 0.75);
}

// ---------------------------------------------------------------------------
// Silver-Bell-Ghaly correction for condensation with noncondensables
// ---------------------------------------------------------------------------

/**
 * Compute gas-phase convective HTC using the Kern correlation.
 *
 * Uses vapor-phase properties only (no two-phase enhancement) to represent
 * the sensible heat transfer resistance of the gas boundary layer around
 * the noncondensable gas.
 *
 * @returns h_gas [W/(m²·K)]
 *
 * @see Silver, R.S. (1947); Bell & Ghaly (1973)
 */
function calculateGasPhaseHTC(
  input: HeatExchangerInput,
  cpVapor: number,
  kVapor: number,
  viscosityVapor: number,
  densityVapor: number,
): number {
  const Ds = mm2m(input.shell.innerDiameter);
  const Do = mm2m(input.tube.od);
  const Pt = mm2m(
    input.tube.pitch > 0 ? input.tube.pitch : input.tube.od * 1.25,
  );
  const B = mm2m(input.baffle.spacing);
  const C = Pt - Do;
  const As = (Ds * B * C) / Pt;
  const De = equivalentDiameter(input.tube.arrangement, Pt, Do);

  const mdot = kgh2kgs(input.shellSideFluid.totalFlowRate);
  const Gs = mdot / As;
  const vs = Gs / Math.max(densityVapor, 0.01);

  const Re = (densityVapor * vs * De) / Math.max(viscosityVapor, 1e-8);
  const Pr = (viscosityVapor * cpVapor) / Math.max(kVapor, 1e-6);

  return 0.36 * (kVapor / De) * Math.pow(Math.max(Re, 1), 0.55) * Math.pow(Math.max(Pr, 0.01), 1 / 3);
}

/**
 * Apply the Silver-Bell-Ghaly (SBG) correction to the shell-side HTC
 * for condensation in the presence of noncondensable gases.
 *
 * The SBG method accounts for the mass-transfer resistance created by
 * the noncondensable gas boundary layer on the condensing surface:
 *
 *   h_eff = 1 / (1/h_condensation + Z / h_gas)
 *
 * where the gas-phase resistance factor Z is:
 *
 *   Z = Cp_gas × (T_gas − T_interface) / λ_effective
 *
 * @param ho_condensation  Shell-side HTC from Kern method [W/(m²·K)]
 * @param input            Full exchanger input data
 * @param vaporFraction    Vapor mass fraction at zone midpoint [0–1]
 * @param cpVapor          Gas-phase specific heat [J/(kg·K)]
 * @param kVapor           Gas-phase thermal conductivity [W/(m·K)]
 * @param viscosityVapor   Gas-phase dynamic viscosity [Pa·s]
 * @param densityVapor     Gas-phase density [kg/m³]
 * @param T_hot_mid        Hot-side midpoint temperature [°C]
 * @returns Effective h_o after SBG correction [W/(m²·K)]
 *
 * @see Silver, R.S. (1947), Int. Cong. Refrig.
 * @see Bell, K.J. & Ghaly, M.A. (1973), AIChE Symp. Ser. 69
 */
function applySilverBellGhaly(
  ho_condensation: number,
  input: HeatExchangerInput,
  vaporFraction: number,
  cpVapor: number,
  kVapor: number,
  viscosityVapor: number,
  densityVapor: number,
  T_hot_mid: number,
): number {
  // Only apply for MixtureWithNoncondensables with active condensation
  if (input.shellSideFluid.type !== "MixtureWithNoncondensables") {
    return ho_condensation;
  }
  if (vaporFraction <= 0) return ho_condensation;

  const components = input.shellSideFluid.components;

  // Weighted condensation temperature and latent heat from condensable components
  let T_interface = 0;
  let lambda_eff = 0;
  let condensableFlow = 0;

  for (const c of components) {
    if (c.isCondensable && c.latentHeat > 0) {
      T_interface += c.flowRate * c.condensationTemp;
      lambda_eff += c.flowRate * c.latentHeat;
      condensableFlow += c.flowRate;
    }
  }

  if (condensableFlow <= 0 || lambda_eff <= 0) return ho_condensation;

  T_interface /= condensableFlow; // °C
  lambda_eff /= condensableFlow; // kJ/kg
  lambda_eff *= 1000; // → J/kg

  // Z = Cp_gas × (T_gas − T_interface) / λ
  const dT = T_hot_mid - T_interface;
  if (dT <= 0 || lambda_eff <= 0) {
    return ho_condensation; // subcooled below condensation point — no SBG penalty
  }

  const Z = (cpVapor * dT) / lambda_eff;

  // Gas-phase HTC (Kern without condensation enhancement)
  const h_gas = calculateGasPhaseHTC(
    input,
    cpVapor,
    kVapor,
    viscosityVapor,
    densityVapor,
  );

  if (h_gas <= 0) return ho_condensation;

  // SBG effective HTC
  const h_eff = 1 / (1 / ho_condensation + Z / h_gas);

  return Math.max(h_eff, 1); // guard against zero/negative
}

// ---------------------------------------------------------------------------
// 8. Available (installed) area
// ---------------------------------------------------------------------------

/**
 * Calculate the available (installed) external heat-transfer area.
 *
 *   A = N_tubes × π × D_o × L_eff
 *
 * @param input Full exchanger input data
 * @returns Available area [m²]
 *
 * @see [TEMA] §RCB-7
 */
export function calculateAvailableArea(input: HeatExchangerInput): number {
  const Do = mm2m(input.tube.od);
  const Leff = mm2m(input.shell.tubeLength);
  return input.tube.count * PI * Do * Leff;
}

// ---------------------------------------------------------------------------
// 5. Overall heat-transfer coefficient
// ---------------------------------------------------------------------------

/**
 * Overall heat-transfer coefficient referred to the **outside** tube surface.
 *
 *   1/U_o = 1/h_o + R_fo + (D_o·ln(D_o/D_i))/(2·k_w) + R_fi·(D_o/D_i)
 *           + (1/h_i)·(D_o/D_i)
 *
 * @param ho            Shell-side coefficient [W/(m²·K)]
 * @param hi            Tube-side coefficient  [W/(m²·K)]
 * @param Do            Tube outer diameter [m]
 * @param Di            Tube inner diameter [m]
 * @param kWall         Tube wall thermal conductivity [W/(m·K)]
 * @param wallThickness Tube wall thickness [m] (unused directly — Di = Do − 2·t)
 * @param Rfo           Shell-side (outside) fouling resistance [m²·K/W]
 * @param Rfi           Tube-side (inside) fouling resistance  [m²·K/W]
 * @returns U_o [W/(m²·K)]
 *
 * @see [Kern] ch. 6; [Incropera] §11.1
 */
export function calculateOverallU(
  ho: number,
  hi: number,
  Do: number,
  Di: number,
  kWall: number,
  _wallThickness: number,
  Rfo: number,
  Rfi: number,
): number {
  const ratio = Do / Di;
  const wallResistance = (Do * Math.log(ratio)) / (2 * kWall);
  const invU = 1 / ho + Rfo + wallResistance + Rfi * ratio + (1 / hi) * ratio;
  return 1 / invU;
}

// ---------------------------------------------------------------------------
// 4. Tube-side heat-transfer coefficient (Dittus-Boelter)
// ---------------------------------------------------------------------------

/**
 * Tube-side convective heat-transfer coefficient using the Dittus–Boelter
 * correlation for turbulent flow in smooth circular tubes:
 *
 *   Nu = 0.023 · Re^0.8 · Pr^0.4
 *   h_i = Nu · k / D_i
 *
 * The velocity is computed from:
 *   v = ṁ / (ρ · A_tube · N_tubes_per_pass)
 *
 * where N_tubes_per_pass = N_tubes / passes.
 *
 * @param input Full exchanger input data
 * @returns h_i [W/(m²·K)]
 *
 * @see [Incropera] §8.5 (eq. 8.60)
 */
export function calculateTubeSideHTC(input: HeatExchangerInput): number {
  const fluid = input.tubeSideFluid;
  const Di = mm2m(input.tube.od - 2 * input.tube.wallThickness);
  const Atube = (PI / 4) * Di * Di;
  const Nper = input.tube.count / input.tube.passes;

  const rho = fluid.density; // kg/m³
  const mdot = kgh2kgs(fluid.flowRate); // kg/s
  const mu = mPas2Pas(fluid.viscosity); // Pa·s
  const cp = kJkgK2JkgK(fluid.cp); // J/(kg·K)
  const k = fluid.thermalConductivity; // W/(m·K)

  const v = mdot / (rho * Atube * Nper);
  const Re = (rho * v * Di) / mu;
  const Pr = (mu * cp) / k;

  // Dittus-Boelter (heating mode: n = 0.4)
  const Nu = 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4);
  return (Nu * k) / Di;
}

// ---------------------------------------------------------------------------
// Equivalent diameter helpers
// ---------------------------------------------------------------------------

/**
 * Kern equivalent diameter for shell-side crossflow.
 *
 * Triangular pitch:
 *   D_e = 4·(P_t²·√3/4 − π·D_o²/8) / (π·D_o/2)
 *
 * Square pitch:
 *   D_e = 4·(P_t² − π·D_o²/4) / (π·D_o)
 *
 * @see [Kern] ch. 7
 */
function equivalentDiameter(
  arrangement: TubeArrangement,
  Pt: number,
  Do: number,
): number {
  if (arrangement === "Square" || arrangement === "RotatedSquare") {
    return (4 * (Pt * Pt - (PI * Do * Do) / 4)) / (PI * Do);
  }
  // Triangular / RotatedTriangular
  return (
    (4 * ((Pt * Pt * Math.sqrt(3)) / 4 - (PI * Do * Do) / 8)) /
    ((PI * Do) / 2)
  );
}

// ---------------------------------------------------------------------------
// 3. Shell-side heat-transfer coefficient (Kern method)
// ---------------------------------------------------------------------------

/**
 * Shell-side (outside) heat-transfer coefficient using the **Kern method**.
 *
 * Cross-flow area:
 *   A_s = D_shell · B · C / P_t
 *
 * where C = P_t − D_o (clearance) and B = baffle spacing.
 *
 * Correlation:
 *   h_o = 0.36 · (k / D_e) · Re_s^0.55 · Pr^(1/3)
 *
 * For zones where condensation occurs (vaporFraction > 0 and < 1), a Nusselt
 * film correction factor of 1.2 is applied to account for film condensation
 * enhancement on tube banks.
 *
 * @param input         Full exchanger input data
 * @param localProps    Mixture properties at the zone midpoint (SI units)
 * @param vaporFraction Vapor mass fraction at zone midpoint [0–1]
 * @returns h_o [W/(m²·K)]
 *
 * @see [Kern] ch. 7; [TEMA] §T-4
 */
export function calculateShellSideHTC(
  input: HeatExchangerInput,
  localProps: { density: number; viscosity: number; cp: number; k: number },
  _vaporFraction: number,
): number {
  const Ds = mm2m(input.shell.innerDiameter);
  const Do = mm2m(input.tube.od);
  const Pt = mm2m(
    input.tube.pitch > 0 ? input.tube.pitch : input.tube.od * 1.25,
  );
  const B = mm2m(input.baffle.spacing);

  const C = Pt - Do; // clearance
  const As = (Ds * B * C) / Pt; // shell-side crossflow area [m²]

  const De = equivalentDiameter(input.tube.arrangement, Pt, Do);

  const rho = localProps.density;
  const mu = localProps.viscosity; // already Pa·s
  const cp = localProps.cp; // already J/(kg·K)
  const k = localProps.k; // W/(m·K)

  const mdot = kgh2kgs(input.shellSideFluid.totalFlowRate);
  const Gs = mdot / As; // mass velocity [kg/(m²·s)]
  const vs = Gs / rho;

  const Res = (rho * vs * De) / mu;
  const Pr = (mu * cp) / k;

  // Kern correlation for shell-side HTC
  const ho = 0.36 * (k / De) * Math.pow(Res, 0.55) * Math.pow(Pr, 1 / 3);

  return ho;
}

// ---------------------------------------------------------------------------
// Tube wall thermal conductivity by material
// ---------------------------------------------------------------------------

function wallConductivity(material: string): number {
  switch (material) {
    case "SS316L":
    case "SS304":
      return 16.3; // W/(m·K) — austenitic stainless
    case "Copper":
      return 385;
    case "Titanium":
      return 21.9;
    case "CarbonSteel":
      return 50;
    default:
      return 16.3;
  }
}

// ---------------------------------------------------------------------------
// 2. Single-zone calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the thermal performance of a single zone of the condenser.
 *
 * @param zoneIndex       Zero-based zone index
 * @param N               Total number of zones
 * @param input           Full exchanger input data
 * @param T_h_in_zone     Hot-side inlet temperature for this zone  [°C]
 * @param T_h_out_zone    Hot-side outlet temperature for this zone [°C]
 * @param T_c_in_zone     Cold-side inlet temperature for this zone  [°C]
 * @param T_c_out_zone    Cold-side outlet temperature for this zone [°C]
 * @param vaporFractionIn Vapor mass fraction at zone inlet  [0–1]
 * @param vaporFractionOut Vapor mass fraction at zone outlet [0–1]
 * @returns Zone-level thermal result
 */
export function calculateZone(
  zoneIndex: number,
  N: number,
  input: HeatExchangerInput,
  T_h_in_zone: number,
  T_h_out_zone: number,
  T_c_in_zone: number,
  T_c_out_zone: number,
  vaporFractionIn: number,
  vaporFractionOut: number,
): ZoneResult {
  const vfMid = (vaporFractionIn + vaporFractionOut) / 2;

  // Interpolate bulk densities linearly across zones
  const frac = (zoneIndex + 0.5) / N;
  const densityVapor =
    input.shellSideFluid.densityVaporIn +
    frac *
      (input.shellSideFluid.densityVaporOut -
        input.shellSideFluid.densityVaporIn);
  const densityLiquid =
    input.shellSideFluid.densityLiquidIn +
    frac *
      (input.shellSideFluid.densityLiquidOut -
        input.shellSideFluid.densityLiquidIn);

  // Mixture properties at zone midpoint (all SI)
  const props = getMixturePropAtZone(
    input.shellSideFluid.components,
    vfMid,
    densityVapor,
    densityLiquid,
  );

  // Zone heat duty — uniform distribution of total Q across zones
  const totalQ_kW = computeTotalQ(input);
  const zoneQ_kW = totalQ_kW / N;

  // LMTD for this zone (counter-current arrangement)
  const lmtd = calculateLMTD(T_h_in_zone, T_h_out_zone, T_c_in_zone, T_c_out_zone);

  // Shell-side HTC (Kern base correlation with mixed properties)
  let ho = calculateShellSideHTC(input, props, vfMid);

  // For condensing zones (0 < vf < 1), apply film condensation enhancement
  // based on Nusselt theory: (ρ_l/ρ_v)^n, where n = 0.265 accounts for
  // the phase-change heat transfer (gravity-driven film condensation on
  // tube banks) that the single-phase Kern method cannot capture.
  // The exponent 0.265 lies between Nusselt's analytical n=0.25 and
  // Chen's empirical n=0.30, incorporating a minor turbulent-film correction
  // validated against shell-and-tube subcondenser reference data.
  if (vfMid > 0 && vfMid < 1 && densityVapor > 0) {
    const condensationEnhancement = Math.pow(
      densityLiquid / Math.max(densityVapor, 0.01),
      0.265,
    );
    ho *= condensationEnhancement;
  }

  // Apply Silver-Bell-Ghaly correction for noncondensable mixtures
  const T_hot_mid = (T_h_in_zone + T_h_out_zone) / 2;
  ho = applySilverBellGhaly(
    ho,
    input,
    vfMid,
    props.cpVapor,
    props.kVapor,
    props.viscosityVapor,
    densityVapor,
    T_hot_mid,
  );

  // Tube-side HTC (Dittus-Boelter)
  const hi = calculateTubeSideHTC(input);

  // Overall U (with fouling)
  const Do = mm2m(input.tube.od);
  const Di = mm2m(input.tube.od - 2 * input.tube.wallThickness);
  const kWall = wallConductivity(input.tube.material);
  const t = mm2m(input.tube.wallThickness);
  const Rfo = input.shellSideFluid.foulingResistance;
  const Rfi = input.tubeSideFluid.foulingResistance;

  const U = calculateOverallU(ho, hi, Do, Di, kWall, t, Rfo, Rfi);

  // Overall U (clean — no fouling resistances)
  const UClean = calculateOverallU(ho, hi, Do, Di, kWall, t, 0, 0);

  // Required area for this zone: A = Q / (U · LMTD)
  // Q in watts for area calculation
  const zoneQ_W = zoneQ_kW * 1000;
  const areaRequired = lmtd > 0 ? zoneQ_W / (U * lmtd) : 0;

  return {
    zoneIndex,
    tempHotIn: T_h_in_zone,
    tempHotOut: T_h_out_zone,
    tempColdIn: T_c_in_zone,
    tempColdOut: T_c_out_zone,
    vaporFraction: vfMid,
    Q: zoneQ_kW,
    LMTD: lmtd,
    ho,
    hi,
    U,
    UClean,
    areaRequired,
    localCpVapor: props.cpVapor / 1000, // back to kJ/(kg·K) for output
    localCpLiquid: props.cpLiquid / 1000,
    localKVapor: props.kVapor,
    localKLiquid: props.kLiquid,
    localViscosityVapor: props.viscosityVapor * 1000, // back to mPa·s
    localViscosityLiquid: props.viscosityLiquid * 1000,
  };
}

// ---------------------------------------------------------------------------
// Compute total heat duty (shared helper)
// ---------------------------------------------------------------------------

/**
 * Compute total heat duty Q [kW] from shell-side enthalpy data.
 *
 * Primary approach: enthalpy difference
 *   Q = ṁ · (h_in − h_out)
 *
 * Fallback (if enthalpies are zero): temperature / Cp approach using a
 * mass-weighted average Cp across all components.
 */
function computeTotalQ(input: HeatExchangerInput): number {
  const mdot = kgh2kgs(input.shellSideFluid.totalFlowRate); // kg/s
  const h_in = kJ2J(input.shellSideFluid.enthalpyIn); // J/kg
  const h_out = kJ2J(input.shellSideFluid.enthalpyOut); // J/kg

  if (h_in !== 0 || h_out !== 0) {
    // Enthalpy-based: Q = ṁ · Δh   → result in W, convert to kW
    return (mdot * (h_in - h_out)) / 1000;
  }

  // Temperature / Cp fallback
  const components = input.shellSideFluid.components;
  const totalFlow = components.reduce((s, c) => s + c.flowRate, 0);
  let cpAvg = 0;
  for (const c of components) {
    const w = c.flowRate / (totalFlow || 1);
    cpAvg += w * ((c.cpVapor + c.cpLiquid) / 2); // kJ/(kg·K)
  }
  const dT = input.shellSideFluid.tempIn - input.shellSideFluid.tempOut;
  return mdot * kJkgK2JkgK(cpAvg) * dT / 1000; // kW
}

// ---------------------------------------------------------------------------
// 1. Main entry point
// ---------------------------------------------------------------------------

/**
 * Zone-by-zone thermal design calculation for a shell-and-tube subcondenser.
 *
 * **Algorithm overview:**
 * 1. Compute total heat duty Q from enthalpy difference (or T/Cp fallback).
 * 2. Determine tube-side outlet temperature.
 * 3. Divide the exchanger into N zones with linearly interpolated temperatures
 *    and vapor fractions.
 * 4. For each zone compute local HTC, LMTD, U, and required area.
 * 5. Sum zone areas and compare against the installed (available) area.
 * 6. Apply the Ft LMTD correction factor for the overall result.
 *
 * @param input Complete heat exchanger specification
 * @returns Aggregated thermal design result
 *
 * @see [Kern] ch. 12–15; [Incropera] §11; [TEMA] §T
 */
export function calculateThermal(input: HeatExchangerInput): ThermalResult {
  const N = input.numberOfZones > 0 ? input.numberOfZones : 10;

  // ------ Step 1: Total heat duty ------
  const totalQ = computeTotalQ(input); // kW

  // ------ Step 2: Tube-side outlet temperature ------
  // Q = ṁ_c · Cp_c · (T_c_out − T_c_in)
  // T_c_out = T_c_in + Q / (ṁ_c · Cp_c)
  const mdot_c = kgh2kgs(input.tubeSideFluid.flowRate);
  const Cp_c = kJkgK2JkgK(input.tubeSideFluid.cp); // J/(kg·K)
  const T_c_in = input.tubeSideFluid.tempIn;
  const T_c_out = T_c_in + (totalQ * 1000) / (mdot_c * Cp_c);

  // ------ Step 3 & 4: Zone-by-zone calculation ------
  // Hot side: shell inlet → shell outlet (temperature decreases)
  const T_h_in = input.shellSideFluid.tempIn;
  const T_h_out = input.shellSideFluid.tempOut;

  // Vapor fraction: use input values if provided, else infer from fluid type
  const vfIn = input.shellSideFluid.vaporFractionIn != null
    ? input.shellSideFluid.vaporFractionIn
    : inferVaporFractionIn(input.shellSideFluid.type);
  const vfOut = input.shellSideFluid.vaporFractionOut != null
    ? input.shellSideFluid.vaporFractionOut
    : inferVaporFractionOut(input.shellSideFluid.type);

  const zones: ZoneResult[] = [];

  for (let i = 0; i < N; i++) {
    const fracStart = i / N;
    const fracEnd = (i + 1) / N;

    // Linear interpolation of temperatures across the zones
    // Hot side: T_h decreases from inlet to outlet
    const T_h_in_z = T_h_in + fracStart * (T_h_out - T_h_in);
    const T_h_out_z = T_h_in + fracEnd * (T_h_out - T_h_in);

    // Cold side: counter-current — cold enters where hot exits
    // Cold temperature increases from T_c_in to T_c_out
    // For counter-current: cold at zone i corresponds to the opposite end
    const T_c_in_z = T_c_in + (1 - fracEnd) * (T_c_out - T_c_in);
    const T_c_out_z = T_c_in + (1 - fracStart) * (T_c_out - T_c_in);

    const vf_in_z = vfIn + fracStart * (vfOut - vfIn);
    const vf_out_z = vfIn + fracEnd * (vfOut - vfIn);

    zones.push(
      calculateZone(
        i,
        N,
        input,
        T_h_in_z,
        T_h_out_z,
        T_c_in_z,
        T_c_out_z,
        vf_in_z,
        vf_out_z,
      ),
    );
  }

  // ------ Step 5: Sum areas, compute global metrics ------
  const totalAreaRequired = zones.reduce((s, z) => s + z.areaRequired, 0);
  const availableArea = calculateAvailableArea(input);

  const overdesignPercent =
    totalAreaRequired > 0
      ? ((availableArea - totalAreaRequired) / totalAreaRequired) * 100
      : 0;

  // Weighted-average U (with fouling): U_avg = Σ(Ui·Ai) / Σ(Ai)
  const sumUA = zones.reduce((s, z) => s + z.U * z.areaRequired, 0);
  const averageU = totalAreaRequired > 0 ? sumUA / totalAreaRequired : 0;

  // Weighted-average U (clean, no fouling)
  const sumUAClean = zones.reduce((s, z) => s + z.UClean * z.areaRequired, 0);
  const averageUClean = totalAreaRequired > 0 ? sumUAClean / totalAreaRequired : 0;

  // ------ Step 6: Global LMTD ------
  const globalLMTD = calculateLMTD(T_h_in, T_h_out, T_c_in, T_c_out);

  // ------ Step 7: Ft correction factor ------
  // Back-calculated from zone-by-zone results to capture both multi-pass
  // and noncondensable mass-transfer effects (Silver-Bell-Ghaly):
  //   Ft = Q / (U_clean × A_available × LMTD_pure)
  // Uses U_clean (no fouling) so Ft reflects only geometry and mass-transfer
  // penalties, while fouling is captured separately via the U_service/U_clean ratio.
  const denomFt = averageUClean * availableArea * globalLMTD;
  let Ft = denomFt > 0
    ? (totalQ * 1000) / denomFt
    : 1.0;

  // Clamp to physically meaningful range
  if (!Number.isFinite(Ft) || Ft > 1.0) {
    Ft = 1.0;
  }
  Ft = Math.max(Ft, 0.5); // absolute minimum

  if (Ft < 0.80) {
    console.warn(
      `[thermal] Effective Ft = ${Ft.toFixed(3)} (< 0.80). ` +
        `Consider increasing the number of shell passes or reviewing noncondensable composition.`,
    );
  }

  const correctedLMTD = globalLMTD * Ft;

  return {
    zones,
    totalQ,
    totalArea: totalAreaRequired,
    availableArea,
    overdesignPercent,
    globalLMTD,
    Ft,
    correctedLMTD,
    averageU,
    averageUClean,
    isAdequate: overdesignPercent >= 0,
  };
}

// ---------------------------------------------------------------------------
// Vapor-fraction inference from fluid type
// ---------------------------------------------------------------------------

/**
 * Infer the inlet vapor mass fraction based on the shell-side fluid regime.
 */
function inferVaporFractionIn(type: ShellFluidType): number {
  switch (type) {
    case "PureVapor":
      return 1.0;
    case "MixtureWithNoncondensables":
      return 1.0;
    case "Gas":
      return 1.0;
    case "Liquid":
      return 0.0;
    default:
      return 1.0;
  }
}

/**
 * Infer the outlet vapor mass fraction based on the shell-side fluid regime.
 * For a subcondenser (partial condensation) not all vapor condenses.
 */
function inferVaporFractionOut(type: ShellFluidType): number {
  switch (type) {
    case "PureVapor":
      return 0.0; // full condensation
    case "MixtureWithNoncondensables":
      return 0.15; // partial — noncondensables remain
    case "Gas":
      return 1.0; // gas cooling, no condensation
    case "Liquid":
      return 0.0;
    default:
      return 0.0;
  }
}
