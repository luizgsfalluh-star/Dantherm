// =============================================================================
// Dantherm — Mechanical design calculations for shell-and-tube heat exchangers
//
// References:
//   [ASME]  ASME BPVC Section VIII, Division 1 (UG-28 for external pressure)
//   [TEMA]  TEMA Standards, 10th Edition (RCB-4 for baffles, Section V vibration)
// =============================================================================

import type { HeatExchangerInput, MechanicalResult } from "../types";

import {
  getMinBaffleThickness,
  tubeMaterials,
} from "../data/temaStandards";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PI = Math.PI;

/**
 * Shell material properties — Carbon Steel SA-516-70.
 * Used as the default shell material for pressure vessel calculations.
 */
const SHELL_MATERIAL = {
  /** Elastic (Young's) modulus [GPa] */
  elasticModulus: 200,
  /** Maximum allowable stress at design temperature [MPa] */
  allowableStress: 138,
} as const;

/** Weld joint efficiency for spot-examined joints per ASME UW-12. */
const E_WELD = 0.85;

// ---------------------------------------------------------------------------
// Unit conversion helpers
// ---------------------------------------------------------------------------

/** Convert millimetres to metres. */
const mm2m = (mm: number): number => mm / 1000;

/** Convert kg/h to kg/s. */
const kgh2kgs = (v: number): number => v / 3600;


// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Select a nominal shell wall thickness [mm] based on shell inner diameter.
 *
 * These are standard plate thicknesses commonly used in fabrication:
 *   - D_shell <= 300 mm  ->  6 mm
 *   - D_shell <= 600 mm  ->  8 mm
 *   - D_shell <= 900 mm  -> 10 mm
 *   - D_shell >  900 mm  -> 12 mm
 */
function assumeShellThickness(shellDiameterMm: number): number {
  if (shellDiameterMm <= 300) return 6;
  if (shellDiameterMm <= 600) return 8;
  if (shellDiameterMm <= 900) return 10;
  return 12;
}

/**
 * Map a tube material identifier string to the corresponding entry in the
 * TEMA tube materials table. Falls back to carbon steel if not found.
 */
function lookupTubeMaterial(materialId: string) {
  const idMap: Record<string, string> = {
    SS316L: "ss316l",
    SS304: "ss304",
    Copper: "copper",
    Titanium: "titanium",
    CarbonSteel: "carbon-steel",
  };
  const normalised = idMap[materialId] ?? materialId.toLowerCase();
  return (
    tubeMaterials.find((m) => m.id === normalised) ??
    tubeMaterials.find((m) => m.id === "carbon-steel")!
  );
}

/**
 * Estimate the shell-side crossflow velocity [m/s] using the Kern method.
 *
 * This mirrors the approach in the thermal module so that the vibration
 * check uses a consistent velocity value.
 */
function estimateShellSideVelocity(input: HeatExchangerInput): number {
  const Ds = mm2m(input.shell.innerDiameter);
  const Do = mm2m(input.tube.od);
  const Pt = mm2m(
    input.tube.pitch > 0 ? input.tube.pitch : input.tube.od * 1.25,
  );
  const B = mm2m(input.baffle.spacing);

  const C = Pt - Do; // clearance between tubes [m]
  const As = (Ds * B * C) / Pt; // shell-side crossflow area [m2]

  const mdot = kgh2kgs(input.shellSideFluid.totalFlowRate); // kg/s

  // Use average density between inlet and outlet
  const rhoVapAvg =
    (input.shellSideFluid.densityVaporIn +
      input.shellSideFluid.densityVaporOut) /
    2;
  const rhoLiqAvg =
    (input.shellSideFluid.densityLiquidIn +
      input.shellSideFluid.densityLiquidOut) /
    2;
  // Simple two-phase average (assume 50 % quality midpoint for mixed regimes)
  const rho =
    input.shellSideFluid.type === "Liquid"
      ? rhoLiqAvg
      : input.shellSideFluid.type === "Gas"
        ? rhoVapAvg
        : (rhoVapAvg + rhoLiqAvg) / 2;

  const Gs = mdot / (As > 0 ? As : 1e-6); // mass velocity [kg/(m2.s)]
  return Gs / (rho > 0 ? rho : 1);
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Perform mechanical design checks for a shell-and-tube heat exchanger.
 *
 * The function evaluates three aspects:
 *
 * 1. **Shell wall** — internal and external pressure adequacy per
 *    ASME BPVC Section VIII Division 1 (UG-27 for internal pressure,
 *    UG-28 simplified approach for external pressure / vacuum).
 *
 * 2. **Tubesheet** — minimum thickness and bending stress per TEMA
 *    Standards 10th Edition (Section RCB-7).
 *
 * 3. **Baffles** — minimum thickness per TEMA RCB-4.52 and
 *    flow-induced vibration screening per TEMA Section V.
 *
 * All geometry inputs are expected in **millimetres**. Pressures in the
 * input are in **kPa (absolute)**. Results are returned in mm (thicknesses),
 * kPa (pressures), MPa (stresses), Hz (frequencies), and m/s (velocities).
 *
 * @param input Complete heat exchanger specification
 * @returns Combined mechanical results for shell, tubesheet, and baffles
 *
 * @see ASME BPVC Section VIII Div.1 UG-27, UG-28
 * @see TEMA Standards 10th Edition, Sections RCB-4, RCB-7, Section V
 */
export function calculateMechanical(
  input: HeatExchangerInput,
): MechanicalResult {
  // =========================================================================
  // 1. Shell wall thickness check
  // =========================================================================

  const D_shell_mm = input.shell.innerDiameter; // [mm]

  const t_shell_mm = assumeShellThickness(D_shell_mm); // nominal [mm]



  // Shell material
  const E_shell_GPa = SHELL_MATERIAL.elasticModulus; // 200 GPa
  const E_shell_MPa = E_shell_GPa * 1000; // 200 000 MPa
  const S_allow_MPa = SHELL_MATERIAL.allowableStress; // 138 MPa

  // Design pressures (take the maximum of shell and tube side)
  const P_shell_kPa = input.shellSideFluid.pressure; // kPa abs
  const P_tube_kPa = input.tubeSideFluid.pressure; // kPa abs

  // --- Internal pressure check (ASME UG-27) ---
  // t_req = P * R / (S * E_weld - 0.6 * P)
  // Convert pressure to MPa for the formula
  const P_int_MPa = P_shell_kPa / 1000; // kPa -> MPa
  const R_shell_mm = D_shell_mm / 2;
  const t_req_internal_mm =
    (P_int_MPa * R_shell_mm) /
    (S_allow_MPa * E_WELD - 0.6 * P_int_MPa);

  // --- External pressure check (ASME UG-28 simplified) ---
  // Required thickness for external pressure (vacuum) — invert Pa formula
  // Pa = 4 * B / (3*(D/t)) where B = (0.125/(D/t)) * E/2
  // Pa = 4 * 0.125 * E / (2 * 3 * (D/t)^2) = E / (12 * (D/t)^2)
  // (D/t)^2 = E / (12 * Pa)  =>  t = D / sqrt(E / (12 * Pa_design))
  // For vacuum: assume full vacuum (101.325 kPa external)
  const P_ext_design_MPa = 0.101325; // 1 atm vacuum
  const DoverT_req_ext = Math.sqrt(E_shell_MPa / (12 * P_ext_design_MPa));
  const t_req_external_mm =
    DoverT_req_ext > 0 ? D_shell_mm / DoverT_req_ext : 0;

  // Required thickness is the maximum of internal and external requirements
  const t_req_shell_mm = Math.max(t_req_internal_mm, t_req_external_mm);

  // Allowable internal pressure for the adopted thickness
  // P_allow = S * E_weld * t / (R + 0.6 * t)  [MPa -> kPa]
  const P_allow_int_MPa =
    (S_allow_MPa * E_WELD * t_shell_mm) / (R_shell_mm + 0.6 * t_shell_mm);
  const P_allow_int_kPa = P_allow_int_MPa * 1000;

  const shellResult = {
    thickness: t_shell_mm,
    requiredThickness: Math.round(t_req_shell_mm * 100) / 100,
    allowablePressure: Math.round(P_allow_int_kPa * 100) / 100,
    isAdequate: t_shell_mm >= t_req_shell_mm,
  };

  // =========================================================================
  // 2. Tubesheet thickness check (TEMA)
  // =========================================================================

  const t_ts_mm = 25; // assumed initial tubesheet thickness [mm]

  const Do_mm = input.tube.od; // tube OD [mm]
  const Pt_mm = input.tube.pitch > 0 ? input.tube.pitch : Do_mm * 1.25;

  // Ligament efficiency (drilling factor) approximation
  const phi = Do_mm / Pt_mm;

  // Design pressure: maximum of shell-side and tube-side
  const P_design_kPa = Math.max(P_shell_kPa, P_tube_kPa);
  const P_design_MPa = P_design_kPa / 1000;

  // Effective diameter ~ shell ID
  const D_eff_mm = D_shell_mm;

  // Tubesheet material — use tube material allowable stress as proxy
  const tubeMat = lookupTubeMaterial(input.tube.material);
  const S_ts_MPa = tubeMat.allowableStress; // [MPa]

  // Required thickness: t = D_eff * sqrt( P / (2 * S * (1 - phi)) )
  const denominator = 2 * S_ts_MPa * (1 - phi);
  const t_req_ts_mm =
    denominator > 0
      ? D_eff_mm * Math.sqrt(P_design_MPa / denominator)
      : D_eff_mm;

  // Bending stress: sigma = P * D_eff^2 / (4 * t^2 * (1 - phi))
  const sigma_ts_MPa =
    (1 - phi) > 0
      ? (P_design_MPa * D_eff_mm * D_eff_mm) /
        (4 * t_ts_mm * t_ts_mm * (1 - phi))
      : 0;

  const tubesheetResult = {
    thickness: t_ts_mm,
    requiredThickness: Math.round(t_req_ts_mm * 100) / 100,
    stress: Math.round(sigma_ts_MPa * 100) / 100,
    isAdequate: t_ts_mm >= t_req_ts_mm,
  };

  // =========================================================================
  // 3. Baffle thickness and vibration check (TEMA RCB-4 / Section V)
  // =========================================================================

  const t_baffle_mm = input.baffle.thickness; // adopted baffle thickness [mm]
  const baffleSpacing_mm = input.baffle.spacing; // centre-to-centre [mm]

  // Minimum thickness from TEMA table
  const minBaffleThick =
    getMinBaffleThickness(D_shell_mm, baffleSpacing_mm) ?? t_baffle_mm;

  // --- Vibration check (TEMA Section V) ---

  // Tube geometry
  const Do_m = mm2m(Do_mm);
  const wallThick_mm = input.tube.wallThickness;
  const Di_mm = Do_mm - 2 * wallThick_mm;
  const Di_m = mm2m(Di_mm);

  // Second moment of area of a hollow tube [m4]
  const I_tube =
    (PI / 64) * (Math.pow(Do_m, 4) - Math.pow(Di_m, 4));

  // Cross-sectional area of tube wall [m2]
  const A_tube =
    (PI / 4) * (Math.pow(Do_m, 2) - Math.pow(Di_m, 2));

  // Tube material properties
  const E_tube_Pa = tubeMat.elasticModulus * 1e9; // GPa -> Pa
  const rho_tube = tubeMat.density; // kg/m3

  // Linear mass of tube (mass per unit length) [kg/m]
  const rho_t = rho_tube * A_tube;

  // Unsupported tube span = baffle spacing [m]
  const L_b = mm2m(baffleSpacing_mm);

  // Natural frequency of tube span (clamped-clamped / fixed-fixed)
  // f_n = (lambda^2 / (2*pi*L^2)) * sqrt(E*I / rho_t)
  // For first mode clamped-clamped: lambda = 4.73, lambda^2 = 22.37
  const lambda_sq = 22.37;
  const f_n =
    L_b > 0
      ? (lambda_sq / (2 * PI * L_b * L_b)) *
        Math.sqrt((E_tube_Pa * I_tube) / rho_t)
      : 0;

  // Critical crossflow velocity for vortex-shedding induced vibration
  // v_cr = f_n * Do / St, where Strouhal number St ~ 0.2 for tube banks
  // Simplified: v_cr = f_n * Do * 5
  const v_cr = f_n * Do_m * 5;

  // Actual shell-side crossflow velocity
  const v_shell = estimateShellSideVelocity(input);

  const baffleResult = {
    thickness: t_baffle_mm,
    minThickness: minBaffleThick,
    vibrationFrequency: Math.round(f_n * 100) / 100,
    criticalVelocity: Math.round(v_cr * 1000) / 1000,
    isVibrationOK: v_shell < v_cr,
  };

  // =========================================================================
  // Combined result
  // =========================================================================

  return {
    shell: shellResult,
    tubesheet: tubesheetResult,
    baffle: baffleResult,
  };
}
