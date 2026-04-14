/**
 * TEMA (Tubular Exchanger Manufacturers Association) standards data
 * for shell-and-tube heat exchanger mechanical design.
 *
 * References: TEMA 10th Edition, Sections RCB-4.
 */

// ---------------------------------------------------------------------------
// 1. Baffle minimum thickness (TEMA RCB-4.52)
// ---------------------------------------------------------------------------

export interface BaffleThicknessEntry {
  /** Nominal shell inside diameter in mm */
  shellDiameter: number;
  /** Maximum unsupported baffle spacing in mm */
  maxBaffleSpacing: number;
  /** Minimum baffle thickness in mm */
  minThickness: number;
}

/**
 * Baffle minimum thickness per TEMA RCB-4.52.
 *
 * The table is indexed by shell diameter ranges and baffle spacing.
 * For a given shell ID and baffle spacing, find the applicable row
 * (shell diameter >= entry shellDiameter) with spacing <= maxBaffleSpacing.
 */
export const baffleThicknessTable: BaffleThicknessEntry[] = [
  // Shell ID up to 356 mm (14")
  { shellDiameter: 356,  maxBaffleSpacing: 305,  minThickness: 3.2 },
  { shellDiameter: 356,  maxBaffleSpacing: 457,  minThickness: 4.8 },
  { shellDiameter: 356,  maxBaffleSpacing: 610,  minThickness: 6.4 },
  // Shell ID up to 711 mm (28")
  { shellDiameter: 711,  maxBaffleSpacing: 305,  minThickness: 4.8 },
  { shellDiameter: 711,  maxBaffleSpacing: 457,  minThickness: 6.4 },
  { shellDiameter: 711,  maxBaffleSpacing: 610,  minThickness: 6.4 },
  { shellDiameter: 711,  maxBaffleSpacing: 914,  minThickness: 9.5 },
  // Shell ID up to 991 mm (39")
  { shellDiameter: 991,  maxBaffleSpacing: 305,  minThickness: 6.4 },
  { shellDiameter: 991,  maxBaffleSpacing: 457,  minThickness: 6.4 },
  { shellDiameter: 991,  maxBaffleSpacing: 610,  minThickness: 9.5 },
  { shellDiameter: 991,  maxBaffleSpacing: 914,  minThickness: 9.5 },
  { shellDiameter: 991,  maxBaffleSpacing: 1219, minThickness: 12.7 },
  // Shell ID up to 1524 mm (60")
  { shellDiameter: 1524, maxBaffleSpacing: 305,  minThickness: 6.4 },
  { shellDiameter: 1524, maxBaffleSpacing: 457,  minThickness: 9.5 },
  { shellDiameter: 1524, maxBaffleSpacing: 610,  minThickness: 9.5 },
  { shellDiameter: 1524, maxBaffleSpacing: 914,  minThickness: 12.7 },
  { shellDiameter: 1524, maxBaffleSpacing: 1219, minThickness: 12.7 },
  { shellDiameter: 1524, maxBaffleSpacing: 1524, minThickness: 15.9 },
];

/**
 * Look up minimum baffle thickness given shell ID (mm) and baffle spacing (mm).
 * Returns the minimum thickness in mm, or null if no matching entry is found.
 */
export function getMinBaffleThickness(
  shellDiameterMm: number,
  baffleSpacingMm: number
): number | null {
  // Find the smallest shell diameter bracket that covers the given shell ID
  const shellBrackets = [...new Set(baffleThicknessTable.map((e) => e.shellDiameter))].sort(
    (a, b) => a - b
  );
  const bracket = shellBrackets.find((d) => shellDiameterMm <= d);
  if (bracket === undefined) return null;

  // Among entries for this bracket, find the smallest spacing bracket >= given spacing
  const candidates = baffleThicknessTable
    .filter((e) => e.shellDiameter === bracket && baffleSpacingMm <= e.maxBaffleSpacing)
    .sort((a, b) => a.maxBaffleSpacing - b.maxBaffleSpacing);

  return candidates.length > 0 ? candidates[0].minThickness : null;
}

// ---------------------------------------------------------------------------
// 2. Tube-to-baffle hole clearance (TEMA RCB-4.2)
// ---------------------------------------------------------------------------

export interface TubeBaffleClearanceEntry {
  /** Nominal tube OD in mm */
  tubeOD: number;
  /** Diametral clearance (hole diameter minus tube OD) in mm */
  diametralClearance: number;
}

/**
 * Standard tube-to-baffle hole diametral clearance per TEMA RCB-4.2.
 * The clearance is the difference between the baffle hole diameter and the
 * tube outside diameter.
 */
export const tubeBaffleClearanceTable: TubeBaffleClearanceEntry[] = [
  { tubeOD: 6.35,  diametralClearance: 0.4 },
  { tubeOD: 9.525, diametralClearance: 0.4 },
  { tubeOD: 12.7,  diametralClearance: 0.4 },
  { tubeOD: 15.875, diametralClearance: 0.4 },
  { tubeOD: 19.05, diametralClearance: 0.8 },
  { tubeOD: 25.4,  diametralClearance: 0.8 },
  { tubeOD: 31.75, diametralClearance: 0.8 },
  { tubeOD: 38.1,  diametralClearance: 0.8 },
  { tubeOD: 50.8,  diametralClearance: 0.8 },
];

/**
 * Get tube-to-baffle diametral clearance for a given tube OD.
 * Uses the nearest matching OD from the table.
 */
export function getTubeBaffleClearance(tubeODmm: number): number {
  const sorted = [...tubeBaffleClearanceTable].sort(
    (a, b) => Math.abs(a.tubeOD - tubeODmm) - Math.abs(b.tubeOD - tubeODmm)
  );
  return sorted[0].diametralClearance;
}

// ---------------------------------------------------------------------------
// 3. Shell-to-baffle clearance (TEMA Table RCB-4.3)
// ---------------------------------------------------------------------------

export interface ShellBaffleClearanceEntry {
  /** Nominal shell inside diameter in mm */
  shellID: number;
  /** Diametral clearance (shell ID minus baffle OD) in mm */
  diametralClearance: number;
}

/**
 * Shell-to-baffle diametral clearance per TEMA Table RCB-4.3.
 */
export const shellBaffleClearanceTable: ShellBaffleClearanceEntry[] = [
  { shellID: 152,  diametralClearance: 2.4 },
  { shellID: 203,  diametralClearance: 2.4 },
  { shellID: 254,  diametralClearance: 3.2 },
  { shellID: 305,  diametralClearance: 3.2 },
  { shellID: 356,  diametralClearance: 3.2 },
  { shellID: 406,  diametralClearance: 3.2 },
  { shellID: 457,  diametralClearance: 3.2 },
  { shellID: 508,  diametralClearance: 3.2 },
  { shellID: 559,  diametralClearance: 4.0 },
  { shellID: 610,  diametralClearance: 4.0 },
  { shellID: 686,  diametralClearance: 4.8 },
  { shellID: 762,  diametralClearance: 4.8 },
  { shellID: 838,  diametralClearance: 4.8 },
  { shellID: 914,  diametralClearance: 4.8 },
  { shellID: 991,  diametralClearance: 5.6 },
  { shellID: 1067, diametralClearance: 5.6 },
  { shellID: 1219, diametralClearance: 5.6 },
  { shellID: 1372, diametralClearance: 6.4 },
  { shellID: 1524, diametralClearance: 6.4 },
];

/**
 * Get shell-to-baffle diametral clearance for a given shell ID (mm).
 * Returns the clearance for the nearest shell diameter in the table.
 */
export function getShellBaffleClearance(shellIDmm: number): number {
  const sorted = [...shellBaffleClearanceTable].sort(
    (a, b) => Math.abs(a.shellID - shellIDmm) - Math.abs(b.shellID - shellIDmm)
  );
  return sorted[0].diametralClearance;
}

// ---------------------------------------------------------------------------
// 4. Tube material properties
// ---------------------------------------------------------------------------

export interface TubeMaterial {
  /** Material identifier */
  id: string;
  /** Display name */
  name: string;
  /** Thermal conductivity in W/(m·K) */
  thermalConductivity: number;
  /** Maximum allowable stress in MPa (at ~100 °C) */
  allowableStress: number;
  /** Elastic (Young's) modulus in GPa */
  elasticModulus: number;
  /** Density in kg/m³ */
  density: number;
}

export const tubeMaterials: TubeMaterial[] = [
  {
    id: 'ss316l',
    name: 'Stainless Steel 316L',
    thermalConductivity: 16.3,
    allowableStress: 115,
    elasticModulus: 193,
    density: 7990,
  },
  {
    id: 'ss304',
    name: 'Stainless Steel 304',
    thermalConductivity: 16.2,
    allowableStress: 138,
    elasticModulus: 193,
    density: 8000,
  },
  {
    id: 'copper',
    name: 'Copper (C12200)',
    thermalConductivity: 339,
    allowableStress: 62,
    elasticModulus: 117,
    density: 8940,
  },
  {
    id: 'titanium',
    name: 'Titanium Grade 2',
    thermalConductivity: 21.9,
    allowableStress: 165,
    elasticModulus: 103,
    density: 4510,
  },
  {
    id: 'carbon-steel',
    name: 'Carbon Steel (SA-179)',
    thermalConductivity: 54.0,
    allowableStress: 118,
    elasticModulus: 200,
    density: 7850,
  },
];

/**
 * Look up a tube material by its id.
 */
export function getTubeMaterial(id: string): TubeMaterial | undefined {
  return tubeMaterials.find((m) => m.id === id);
}

// ---------------------------------------------------------------------------
// 5. Common tube dimension presets
// ---------------------------------------------------------------------------

export interface TubeDimension {
  /** Descriptive label */
  label: string;
  /** Outer diameter in mm */
  od: number;
  /** Wall thickness in mm (BWG or standard) */
  wallThickness: number;
  /** Inner diameter in mm (computed: od - 2*wallThickness) */
  id: number;
  /** Triangular pitch in mm (typical) */
  triangularPitch: number;
  /** Square pitch in mm (typical) */
  squarePitch: number;
}

/**
 * Common tube dimensions used in shell-and-tube heat exchangers.
 * Pitches follow the TEMA minimum of 1.25 * OD (triangular) and
 * 1.25 * OD (square), rounded to standard values.
 */
export const tubeDimensions: TubeDimension[] = [
  {
    label: '3/8" OD × 18 BWG',
    od: 9.525,
    wallThickness: 1.245,
    id: 7.035,
    triangularPitch: 12.7,
    squarePitch: 12.7,
  },
  {
    label: '1/2" OD × 18 BWG',
    od: 12.7,
    wallThickness: 1.245,
    id: 10.21,
    triangularPitch: 15.875,
    squarePitch: 15.875,
  },
  {
    label: '5/8" OD × 16 BWG',
    od: 15.875,
    wallThickness: 1.651,
    id: 12.573,
    triangularPitch: 19.844,
    squarePitch: 19.844,
  },
  {
    label: '3/4" OD × 16 BWG',
    od: 19.05,
    wallThickness: 1.651,
    id: 15.748,
    triangularPitch: 23.813,
    squarePitch: 25.4,
  },
  {
    label: '3/4" OD × 14 BWG',
    od: 19.05,
    wallThickness: 2.108,
    id: 14.834,
    triangularPitch: 23.813,
    squarePitch: 25.4,
  },
  {
    label: '1" OD × 14 BWG',
    od: 25.4,
    wallThickness: 2.108,
    id: 21.184,
    triangularPitch: 31.75,
    squarePitch: 31.75,
  },
  {
    label: '1" OD × 12 BWG',
    od: 25.4,
    wallThickness: 2.769,
    id: 19.862,
    triangularPitch: 31.75,
    squarePitch: 31.75,
  },
  {
    label: '1-1/4" OD × 12 BWG',
    od: 31.75,
    wallThickness: 2.769,
    id: 26.212,
    triangularPitch: 39.688,
    squarePitch: 39.688,
  },
  {
    label: '1-1/2" OD × 12 BWG',
    od: 38.1,
    wallThickness: 2.769,
    id: 32.562,
    triangularPitch: 47.625,
    squarePitch: 47.625,
  },
  {
    label: '2" OD × 12 BWG',
    od: 50.8,
    wallThickness: 2.769,
    id: 45.262,
    triangularPitch: 63.5,
    squarePitch: 63.5,
  },
];

/**
 * Find tube dimension presets matching a given OD (mm).
 */
export function getTubeDimensionsByOD(odMm: number): TubeDimension[] {
  return tubeDimensions.filter(
    (t) => Math.abs(t.od - odMm) < 0.1
  );
}
