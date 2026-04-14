// =============================================================================
// Dantherm - Shell-and-Tube Heat Exchanger Calculator
// TypeScript type definitions (TEMA/ASME standards)
// =============================================================================

// ---------------------------------------------------------------------------
// Enums & Union Types
// ---------------------------------------------------------------------------

/** TEMA rear-end head / shell / front-end classification codes. */
export type TEMAClassification =
  | "BEM"
  | "AES"
  | "AEL"
  | "AET"
  | "AEP"
  | "AEW"
  | "AKT"
  | "AJW"
  | "BEU"
  | "BET"
  | "BEP"
  | "BEW"
  | "NEN";

/** Baffle configuration type. */
export type BaffleType =
  | "SegmentedSingle"
  | "SegmentedDouble"
  | "DiscAndRing"
  | "None";

/** Tube material specification. */
export type TubeMaterial =
  | "SS316L"
  | "SS304"
  | "Copper"
  | "Titanium"
  | "CarbonSteel";

/** Baffle material specification. */
export type BaffleMaterial = "CarbonSteel" | "SS304" | "SS316L";

/** Shell-side fluid regime. */
export type ShellFluidType =
  | "PureVapor"
  | "MixtureWithNoncondensables"
  | "Liquid"
  | "Gas";

/** Tube layout pattern. */
export type TubeArrangement =
  | "Triangular"
  | "Square"
  | "RotatedTriangular"
  | "RotatedSquare";

/** Tube-side cooling/heating fluid classification. */
export type TubeSideFluidType = "Water" | "Other";

// ---------------------------------------------------------------------------
// Fluid Component (mixture composition)
// ---------------------------------------------------------------------------

/** A single component in a shell-side fluid mixture. */
export interface FluidComponent {
  /** Unique identifier for this component. */
  id: string;

  /** Human-readable name (e.g. "Methanol"). */
  name: string;

  /** Chemical formula (e.g. "CH3OH"). */
  formula: string;

  /** Mass flow rate [kg/h]. */
  flowRate: number;

  /** Molecular weight [g/mol]. */
  molecularWeight: number;

  /** Specific heat capacity of the vapor phase [kJ/(kg.K)]. */
  cpVapor: number;

  /** Specific heat capacity of the liquid phase [kJ/(kg.K)]. */
  cpLiquid: number;

  /** Thermal conductivity of the vapor phase [W/(m.K)]. */
  kVapor: number;

  /** Thermal conductivity of the liquid phase [W/(m.K)]. */
  kLiquid: number;

  /** Dynamic viscosity of the vapor phase [mPa.s]. */
  viscosityVapor: number;

  /** Dynamic viscosity of the liquid phase [mPa.s]. */
  viscosityLiquid: number;

  /** Latent heat of vaporisation [kJ/kg]. */
  latentHeat: number;

  /** Condensation temperature at operating pressure [degC]. */
  condensationTemp: number;

  /** Whether this component is condensable under process conditions. */
  isCondensable: boolean;
}

// ---------------------------------------------------------------------------
// Geometry & Configuration
// ---------------------------------------------------------------------------

/** Shell geometry following TEMA designations. */
export interface ShellGeometry {
  /** TEMA type designation (e.g. "BEM"). */
  temaClass: TEMAClassification;

  /** Shell inner diameter [mm]. */
  innerDiameter: number;

  /** Effective tube length between tubesheets [mm]. */
  tubeLength: number;

  /** Number of shell passes. */
  shellPasses: number;
}

/** Baffle configuration and dimensions. */
export interface BaffleConfig {
  /** Baffle type. */
  type: BaffleType;

  /** Baffle cut as a percentage of the shell inner diameter [%]. */
  cutPercent: number;

  /** Centre-to-centre baffle spacing [mm]. */
  spacing: number;

  /** Baffle plate thickness [mm]. */
  thickness: number;

  /** Total number of baffles. */
  count: number;

  /** Baffle material. */
  material: BaffleMaterial;
}

/** Tube bundle geometry. */
export interface TubeGeometry {
  /** Tube outer diameter [mm]. */
  od: number;

  /** Tube wall thickness [mm]. */
  wallThickness: number;

  /** Total number of tubes. */
  count: number;

  /** Number of tube passes. */
  passes: number;

  /** Tube material. */
  material: TubeMaterial;

  /** Tube pitch (centre-to-centre distance) [mm]. */
  pitch: number;

  /** Tube layout pattern (triangular, square, etc.). */
  arrangement: TubeArrangement;
}

// ---------------------------------------------------------------------------
// Fluid Definitions (shell & tube sides)
// ---------------------------------------------------------------------------

/** Shell-side (hot-side) fluid definition including mixture composition. */
export interface ShellSideFluid {
  /** Fluid regime on the shell side. */
  type: ShellFluidType;

  /** Total mass flow rate entering the shell [kg/h]. */
  totalFlowRate: number;

  /** Individual mixture components (may be a single pure substance). */
  components: FluidComponent[];

  /** Inlet temperature [degC]. */
  tempIn: number;

  /** Outlet temperature [degC]. */
  tempOut: number;

  /** Operating pressure [kPa abs]. */
  pressure: number;

  /** Vapor-phase density at the inlet [kg/m3]. */
  densityVaporIn: number;

  /** Vapor-phase density at the outlet [kg/m3]. */
  densityVaporOut: number;

  /** Liquid-phase density at the inlet [kg/m3]. */
  densityLiquidIn: number;

  /** Liquid-phase density at the outlet [kg/m3]. */
  densityLiquidOut: number;

  /** Shell-side fouling resistance [m2.K/W]. */
  foulingResistance: number;

  /** Specific enthalpy at the inlet [kJ/kg]. */
  enthalpyIn: number;

  /** Specific enthalpy at the outlet [kJ/kg]. */
  enthalpyOut: number;

  /** Vapor mass fraction at the shell inlet [0-1]. If omitted, inferred from fluid type. */
  vaporFractionIn?: number;

  /** Vapor mass fraction at the shell outlet [0-1]. If omitted, inferred from fluid type. */
  vaporFractionOut?: number;
}

/** Tube-side (cold-side) fluid definition. */
export interface TubeSideFluid {
  /** Mass flow rate [kg/h]. */
  flowRate: number;

  /** Inlet temperature [degC]. */
  tempIn: number;

  /** Operating pressure [kPa abs]. */
  pressure: number;

  /** Specific heat capacity [kJ/(kg.K)]. */
  cp: number;

  /** Density [kg/m3]. */
  density: number;

  /** Dynamic viscosity [mPa.s]. */
  viscosity: number;

  /** Thermal conductivity [W/(m.K)]. */
  thermalConductivity: number;

  /** Tube-side fouling resistance [m2.K/W]. */
  foulingResistance: number;

  /** Fluid classification (water or other). */
  fluidType: TubeSideFluidType;
}

// ---------------------------------------------------------------------------
// Top-Level Input
// ---------------------------------------------------------------------------

/** Complete input data for a heat exchanger thermal/mechanical calculation. */
export interface HeatExchangerInput {
  /** Internal reference / project number. */
  referenceNumber: string;

  /** Project date (ISO 8601 string). */
  projectDate: string;

  /** Number of calculation zones for the condensation curve. */
  numberOfZones: number;

  /** Shell geometry. */
  shell: ShellGeometry;

  /** Baffle configuration. */
  baffle: BaffleConfig;

  /** Tube bundle geometry. */
  tube: TubeGeometry;

  /** Shell-side (hot) fluid data. */
  shellSideFluid: ShellSideFluid;

  /** Tube-side (cold) fluid data. */
  tubeSideFluid: TubeSideFluid;
}

// ---------------------------------------------------------------------------
// Results - Thermal
// ---------------------------------------------------------------------------

/** Thermal calculation result for a single condensation zone. */
export interface ZoneResult {
  /** Zero-based zone index. */
  zoneIndex: number;

  /** Hot-side inlet temperature for this zone [degC]. */
  tempHotIn: number;

  /** Hot-side outlet temperature for this zone [degC]. */
  tempHotOut: number;

  /** Cold-side inlet temperature for this zone [degC]. */
  tempColdIn: number;

  /** Cold-side outlet temperature for this zone [degC]. */
  tempColdOut: number;

  /** Vapor mass fraction at the zone midpoint [0-1]. */
  vaporFraction: number;

  /** Heat duty for this zone [kW]. */
  Q: number;

  /** Log-mean temperature difference for this zone [K]. */
  LMTD: number;

  /** Shell-side (outside) heat-transfer coefficient [W/(m2.K)]. */
  ho: number;

  /** Tube-side (inside) heat-transfer coefficient [W/(m2.K)]. */
  hi: number;

  /** Overall heat-transfer coefficient for this zone (with fouling) [W/(m2.K)]. */
  U: number;

  /** Overall heat-transfer coefficient for this zone (clean, no fouling) [W/(m2.K)]. */
  UClean: number;

  /** Required heat-transfer area for this zone [m2]. */
  areaRequired: number;

  /** Local mixture specific heat (vapor) at zone midpoint [kJ/(kg.K)]. */
  localCpVapor: number;

  /** Local mixture specific heat (liquid) at zone midpoint [kJ/(kg.K)]. */
  localCpLiquid: number;

  /** Local mixture thermal conductivity (vapor) [W/(m.K)]. */
  localKVapor: number;

  /** Local mixture thermal conductivity (liquid) [W/(m.K)]. */
  localKLiquid: number;

  /** Local mixture viscosity (vapor) [mPa.s]. */
  localViscosityVapor: number;

  /** Local mixture viscosity (liquid) [mPa.s]. */
  localViscosityLiquid: number;
}

/** Aggregated thermal design result across all zones. */
export interface ThermalResult {
  /** Per-zone thermal breakdown. */
  zones: ZoneResult[];

  /** Total heat duty [kW]. */
  totalQ: number;

  /** Total required heat-transfer area (sum of zones) [m2]. */
  totalArea: number;

  /** Available (installed) heat-transfer area [m2]. */
  availableArea: number;

  /** Over-design percentage [(available - required) / required * 100] [%]. */
  overdesignPercent: number;

  /** Uncorrected global LMTD [K]. */
  globalLMTD: number;

  /** LMTD correction factor Ft (for multi-pass arrangements) [-]. */
  Ft: number;

  /** Corrected LMTD (globalLMTD * Ft) [K]. */
  correctedLMTD: number;

  /** Weighted-average overall heat-transfer coefficient (with fouling) [W/(m2.K)]. */
  averageU: number;

  /** Weighted-average overall heat-transfer coefficient (clean, no fouling) [W/(m2.K)]. */
  averageUClean: number;

  /** Whether the available area is sufficient (overdesignPercent >= 0). */
  isAdequate: boolean;
}

// ---------------------------------------------------------------------------
// Results - Hydraulic
// ---------------------------------------------------------------------------

/** Pressure-drop and flow results for one side. */
export interface HydraulicSideResult {
  /** Mean fluid velocity [m/s]. */
  velocity: number;

  /** Reynolds number [-]. */
  reynolds: number;

  /** Calculated pressure drop [kPa]. */
  pressureDrop: number;

  /** Maximum allowable pressure drop [kPa]. */
  allowed: number;
}

/** Combined hydraulic results for tube and shell sides. */
export interface HydraulicResult {
  /** Tube-side hydraulic results. */
  tubeSide: HydraulicSideResult;

  /** Shell-side hydraulic results. */
  shellSide: HydraulicSideResult;
}

// ---------------------------------------------------------------------------
// Results - Mechanical (ASME Section VIII)
// ---------------------------------------------------------------------------

/** Shell mechanical adequacy check. */
export interface ShellMechanicalResult {
  /** Nominal shell wall thickness [mm]. */
  thickness: number;

  /** Minimum required thickness per ASME [mm]. */
  requiredThickness: number;

  /** Maximum allowable internal pressure for the given thickness [kPa]. */
  allowablePressure: number;

  /** Whether the shell wall meets code requirements. */
  isAdequate: boolean;
}

/** Tubesheet mechanical adequacy check. */
export interface TubesheetMechanicalResult {
  /** Nominal tubesheet thickness [mm]. */
  thickness: number;

  /** Minimum required thickness per ASME/TEMA [mm]. */
  requiredThickness: number;

  /** Calculated bending stress in the tubesheet [MPa]. */
  stress: number;

  /** Whether the tubesheet meets code requirements. */
  isAdequate: boolean;
}

/** Baffle mechanical and vibration check. */
export interface BaffleMechanicalResult {
  /** Nominal baffle thickness [mm]. */
  thickness: number;

  /** Minimum required baffle thickness per TEMA [mm]. */
  minThickness: number;

  /** Natural frequency of tube spans between baffles [Hz]. */
  vibrationFrequency: number;

  /** Critical cross-flow velocity for vibration onset [m/s]. */
  criticalVelocity: number;

  /** Whether the design is free of flow-induced vibration risk. */
  isVibrationOK: boolean;
}

/** Combined mechanical results. */
export interface MechanicalResult {
  /** Shell wall assessment. */
  shell: ShellMechanicalResult;

  /** Tubesheet assessment. */
  tubesheet: TubesheetMechanicalResult;

  /** Baffle and vibration assessment. */
  baffle: BaffleMechanicalResult;
}

// ---------------------------------------------------------------------------
// Combined Calculation Output
// ---------------------------------------------------------------------------

/** Full calculation output combining thermal, hydraulic, and mechanical checks. */
export interface CalculationResults {
  /** Thermal design results. */
  thermal: ThermalResult;

  /** Hydraulic (pressure-drop) results. */
  hydraulic: HydraulicResult;

  /** Mechanical integrity results per ASME/TEMA. */
  mechanical: MechanicalResult;
}
