// =============================================================================
// Dantherm — Hydraulic (pressure drop) calculations for a shell-and-tube
// heat exchanger.
//
// References:
//   [Kern]  D.Q. Kern, "Process Heat Transfer", McGraw-Hill, 1950
//   [TEMA]  TEMA Standards, 10th Edition
//
// Tube-side pressure drop follows the Fanning friction factor approach with
// return-loss allowance of 4 velocity heads per pass ([Kern] ch. 7).
//
// Shell-side pressure drop uses the Kern method with separate crossflow and
// window contributions ([Kern] ch. 7; [TEMA] §T-4).
// =============================================================================

import type {
  HeatExchangerInput,
  HydraulicResult,
  TubeArrangement,
  ShellFluidType,
} from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PI = Math.PI;

// ---------------------------------------------------------------------------
// Unit conversion helpers (same conventions as thermal.ts)
// ---------------------------------------------------------------------------

/** Convert millimetres to metres. */
const mm2m = (mm: number): number => mm / 1000;

/** Convert mPa.s to Pa.s. */
const mPas2Pas = (v: number): number => v / 1000;

/** Convert kg/h to kg/s. */
const kgh2kgs = (v: number): number => v / 3600;

// ---------------------------------------------------------------------------
// Shell-side equivalent diameter (Kern method)
// ---------------------------------------------------------------------------

/**
 * Kern equivalent diameter for shell-side crossflow.
 *
 * **Triangular pitch (30 deg):**
 *
 *   D_e = 4 * (Pt^2 * sqrt(3)/4 - pi*Do^2/8) / (pi*Do/2)
 *
 * **Square pitch (90 deg):**
 *
 *   D_e = 4 * (Pt^2 - pi*Do^2/4) / (pi*Do)
 *
 * @param arrangement Tube layout pattern
 * @param Pt          Tube pitch (centre-to-centre) [m]
 * @param Do          Tube outer diameter [m]
 * @returns Equivalent diameter [m]
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
// Shell-side mixture properties helper
// ---------------------------------------------------------------------------

/**
 * Compute mass-weighted average shell-side properties for hydraulic
 * calculations.
 *
 * Density is the average of inlet and outlet values weighted by estimated
 * vapor fraction.  Viscosity is mass-flow-weighted across all components,
 * then blended between vapor and liquid phases by the average vapor fraction.
 *
 * @returns Properties in SI units (kg/m^3, Pa.s).
 */
function shellSideProperties(
  input: HeatExchangerInput,
): { density: number; viscosity: number } {
  const fluid = input.shellSideFluid;

  // Estimate average vapor fraction from fluid type
  const vfIn = inferVaporFractionIn(fluid.type);
  const vfOut = inferVaporFractionOut(fluid.type);
  const vfAvg = (vfIn + vfOut) / 2;

  // Average densities across inlet/outlet
  const rhoVapor = (fluid.densityVaporIn + fluid.densityVaporOut) / 2;
  const rhoLiquid = (fluid.densityLiquidIn + fluid.densityLiquidOut) / 2;
  const density = vfAvg * rhoVapor + (1 - vfAvg) * rhoLiquid;

  // Mass-weighted component viscosities
  const components = fluid.components;
  const totalFlow = components.reduce((s, c) => s + c.flowRate, 0);

  let muV = 0;
  let muL = 0;

  if (totalFlow > 0) {
    for (const c of components) {
      const w = c.flowRate / totalFlow;
      muV += w * mPas2Pas(c.viscosityVapor);
      muL += w * mPas2Pas(c.viscosityLiquid);
    }
  } else {
    // Fallback: reasonable defaults for water-like fluids
    muV = 1e-5;
    muL = 1e-3;
  }

  const viscosity = vfAvg * muV + (1 - vfAvg) * muL;

  return { density: Math.max(density, 0.01), viscosity: Math.max(viscosity, 1e-7) };
}

// ---------------------------------------------------------------------------
// Vapor-fraction inference (same logic as thermal.ts)
// ---------------------------------------------------------------------------

function inferVaporFractionIn(type: ShellFluidType): number {
  switch (type) {
    case "PureVapor":
    case "MixtureWithNoncondensables":
    case "Gas":
      return 1.0;
    case "Liquid":
      return 0.0;
    default:
      return 1.0;
  }
}

function inferVaporFractionOut(type: ShellFluidType): number {
  switch (type) {
    case "PureVapor":
      return 0.0;
    case "MixtureWithNoncondensables":
      return 0.15;
    case "Gas":
      return 1.0;
    case "Liquid":
      return 0.0;
    default:
      return 0.0;
  }
}

// ---------------------------------------------------------------------------
// Tube-side hydraulic calculation
// ---------------------------------------------------------------------------

/**
 * Calculate tube-side velocity, Reynolds number, and pressure drop.
 *
 * **Friction factor:**
 * - Turbulent (Re > 2100): Blasius correlation f = 0.079 * Re^(-0.25)
 * - Laminar (Re <= 2100):  f = 64 / Re
 *
 * **Pressure drop:**
 *
 *   dP = (4*f*L/Di + 4*passes) * rho*v^2/2
 *
 * The term `4*passes` accounts for return losses at approximately 4 velocity
 * heads per pass.
 *
 * **Allowed pressure drop:** 70 kPa (reasonable default for water service).
 *
 * @param input Full exchanger input data
 * @returns Tube-side velocity [m/s], Reynolds [-], pressure drop [kPa], allowed [kPa]
 *
 * @see [Kern] ch. 7; [TEMA] §T-4
 */
function calculateTubeSideHydraulic(
  input: HeatExchangerInput,
): { velocity: number; reynolds: number; pressureDrop: number; allowed: number } {
  const fluid = input.tubeSideFluid;
  const Di = mm2m(input.tube.od - 2 * input.tube.wallThickness); // inner diameter [m]
  const Atube = (PI / 4) * Di * Di; // single tube flow area [m^2]
  const Nper = input.tube.count / input.tube.passes; // tubes per pass
  const L = mm2m(input.shell.tubeLength); // effective tube length [m]
  const passes = input.tube.passes;

  const rho = fluid.density; // kg/m^3
  const mdot = kgh2kgs(fluid.flowRate); // kg/s
  const mu = mPas2Pas(fluid.viscosity); // Pa.s

  // Velocity
  const v = mdot / (rho * Atube * Nper);

  // Reynolds number
  const Re = (rho * v * Di) / mu;

  // Fanning friction factor
  let f: number;
  if (Re > 2100) {
    // Turbulent — Blasius correlation
    f = 0.079 * Math.pow(Re, -0.25);
  } else {
    // Laminar — Hagen-Poiseuille
    f = Re > 0 ? 64 / Re : 0;
  }

  // Pressure drop [Pa] — straight tube + return losses
  const dP = (4 * f * L / Di + 4 * passes) * (rho * v * v) / 2;

  // Convert to kPa
  const pressureDrop = dP / 1000;

  // Default allowable pressure drop for water service
  const allowed = 70; // kPa

  return { velocity: v, reynolds: Re, pressureDrop, allowed };
}

// ---------------------------------------------------------------------------
// Shell-side hydraulic calculation (Kern method)
// ---------------------------------------------------------------------------

/**
 * Calculate shell-side velocity, Reynolds number, and pressure drop using
 * the Kern method.
 *
 * **Crossflow area:**
 *
 *   A_s = D_shell * B * C / Pt
 *
 * where C = Pt - Do (clearance) and B = baffle spacing.
 *
 * **Friction factor (Kern correlation for Re_s > 500):**
 *
 *   f = exp(0.576 - 0.19 * ln(Re_s))
 *
 * For Re_s <= 500 a laminar estimate is used.
 *
 * **Pressure drop components:**
 *
 * - Crossflow: dP_cross = f * D_shell * (N_b + 1) * rho * v_s^2 / (2 * D_e)
 * - Window:    dP_window = N_b * 0.5 * rho * v_s^2
 * - Total:     dP = dP_cross + dP_window
 *
 * **Allowed pressure drop:** 50 kPa (conservative default for low-pressure
 * shell-side service).
 *
 * @param input Full exchanger input data
 * @returns Shell-side velocity [m/s], Reynolds [-], pressure drop [kPa], allowed [kPa]
 *
 * @see [Kern] ch. 7; [TEMA] §T-4
 */
function calculateShellSideHydraulic(
  input: HeatExchangerInput,
): { velocity: number; reynolds: number; pressureDrop: number; allowed: number } {
  const Ds = mm2m(input.shell.innerDiameter); // shell ID [m]
  const Do = mm2m(input.tube.od); // tube OD [m]
  const Pt = mm2m(
    input.tube.pitch > 0 ? input.tube.pitch : input.tube.od * 1.25,
  ); // tube pitch [m]
  const B = mm2m(input.baffle.spacing); // baffle spacing [m]
  const Nb = input.baffle.count; // number of baffles

  // Clearance and crossflow area
  const C = Pt - Do;
  const As = (Ds * B * C) / Pt; // crossflow area [m^2]

  // Equivalent diameter
  const De = equivalentDiameter(input.tube.arrangement, Pt, Do);

  // Shell-side fluid properties (averaged)
  const { density: rho, viscosity: mu } = shellSideProperties(input);

  // Mass flow and velocity
  const mdot = kgh2kgs(input.shellSideFluid.totalFlowRate);
  const vs = mdot / (rho * As);

  // Reynolds number
  const Res = (rho * vs * De) / mu;

  // Friction factor — Kern correlation
  let f: number;
  if (Res > 500) {
    f = Math.exp(0.576 - 0.19 * Math.log(Res));
  } else {
    // Low-Re estimate: use a simple inverse power fit
    f = Res > 0 ? Math.exp(0.576 - 0.19 * Math.log(Math.max(Res, 1))) : 1;
  }

  // Crossflow pressure drop [Pa]
  const dP_crossflow =
    (f * Ds * (Nb + 1) * rho * vs * vs) / (2 * De);

  // Window pressure drop [Pa] (approximate)
  const dP_window = Nb * 0.5 * rho * vs * vs;

  // Total pressure drop [kPa]
  const pressureDrop = (dP_crossflow + dP_window) / 1000;

  // Default allowable pressure drop for low-pressure shell side
  const allowed = 50; // kPa

  return { velocity: vs, reynolds: Res, pressureDrop, allowed };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Calculate the hydraulic (pressure-drop) performance for both the tube side
 * and shell side of a shell-and-tube heat exchanger.
 *
 * **Tube side** uses the Fanning friction factor (Blasius for turbulent flow)
 * with return-loss allowances of 4 velocity heads per pass.
 *
 * **Shell side** uses the Kern method with crossflow and window pressure-drop
 * contributions.  The equivalent diameter accounts for the tube layout
 * (triangular or square pitch) per Kern's formulation.
 *
 * All calculations are performed in SI units internally.  Input dimensions are
 * in mm, flow rates in kg/h, viscosities in mPa.s, and pressures are returned
 * in kPa.
 *
 * @param input Complete heat exchanger specification
 * @returns Combined hydraulic results for tube and shell sides
 *
 * @see [Kern] ch. 7 — shell-side and tube-side pressure drop
 * @see [TEMA] §T-4 — allowable pressure drops and flow arrangements
 */
export function calculateHydraulic(
  input: HeatExchangerInput,
): HydraulicResult {
  const tube = calculateTubeSideHydraulic(input);
  const shell = calculateShellSideHydraulic(input);

  return {
    tubeSide: {
      velocity: tube.velocity,
      reynolds: tube.reynolds,
      pressureDrop: tube.pressureDrop,
      allowed: tube.allowed,
    },
    shellSide: {
      velocity: shell.velocity,
      reynolds: shell.reynolds,
      pressureDrop: shell.pressureDrop,
      allowed: shell.allowed,
    },
  };
}
