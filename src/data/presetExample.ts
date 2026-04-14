// =============================================================================
// Dantherm - BEM Subcondenser Preset Example
// Shell-and-tube heat exchanger with noncondensable gases
//
// Expected results:
//   Q ≈ 132 kW
//   T_water_out ≈ 12.1 °C
//   LMTD ≈ 15.5 °C
//   Ft ≈ 0.82
//   A ≈ 26.74 m²
//   U_service ≈ 300 W/m²K
// =============================================================================

import type { HeatExchangerInput } from "../types";

/**
 * BEM subcondenser example case.
 *
 * Shell-side: organic vapor mixture with noncondensables (946 kg/h, 40 → 14.65 °C).
 * Tube-side: cooling water (22 377 kg/h, 7 °C inlet).
 */
export const presetBEM: HeatExchangerInput = {
  referenceNumber: "MC-2024-001",
  projectDate: "2024-01-15",
  numberOfZones: 10,

  // --- Shell geometry (TEMA BEM) -------------------------------------------
  shell: {
    temaClass: "BEM",
    innerDiameter: 450, // mm
    tubeLength: 3000, // mm
    shellPasses: 1,
  },

  // --- Baffles --------------------------------------------------------------
  baffle: {
    type: "SegmentedSingle",
    cutPercent: 25, // % of shell ID
    spacing: 300, // mm centre-to-centre
    thickness: 6, // mm — default for 450 mm shell per TEMA
    count: 9, // = tubeLength / spacing − 1 = 3000 / 300 − 1
    material: "CarbonSteel",
  },

  // --- Tube bundle ----------------------------------------------------------
  tube: {
    od: 19.05, // mm (3/4″)
    wallThickness: 1.65, // mm
    count: 149,
    passes: 4,
    material: "SS316L",
    pitch: 25.4, // mm (1″ triangular)
    arrangement: "Triangular",
  },

  // --- Shell-side fluid (hot — mixture with noncondensables) ----------------
  shellSideFluid: {
    type: "MixtureWithNoncondensables",
    totalFlowRate: 946, // kg/h
    tempIn: 40, // °C
    tempOut: 14.65, // °C
    pressure: 39.6, // kPa abs (0.396 bar)
    densityVaporIn: 0.8, // kg/m³ — estimated for low-pressure organic vapor
    densityVaporOut: 0.6, // kg/m³
    densityLiquidIn: 800, // kg/m³ — estimated for organic liquid
    densityLiquidOut: 850, // kg/m³
    foulingResistance: 0.0002, // m²·K/W
    enthalpyIn: -2918.54, // kJ/kg (= −2 760 924 kJ/h ÷ 946 kg/h — total stream enthalpy)
    enthalpyOut: -3420.93, // kJ/kg (= −3 235 702 kJ/h ÷ 946 kg/h)
    vaporFractionIn: 1.0, // fully vapor at inlet
    vaporFractionOut: 0.55, // partial condensation — consistent with Q=132kW and λ=1038kJ/kg

    components: [
      // 1. Condensable component
      {
        id: "condensable-1",
        name: "Organic Condensable",
        formula: "CxHy",
        flowRate: 768, // kg/h
        molecularWeight: 50.5, // g/mol — average of 59 (inlet) to 42 (outlet)
        cpVapor: 1.5, // kJ/(kg·K)
        cpLiquid: 2.0, // kJ/(kg·K)
        kVapor: 0.015, // W/(m·K)
        kLiquid: 0.15, // W/(m·K)
        viscosityVapor: 0.01, // mPa·s
        viscosityLiquid: 0.5, // mPa·s
        latentHeat: 1038, // kJ/kg
        condensationTemp: 35, // °C
        isCondensable: true,
      },
      // 2. Noncondensable gas
      {
        id: "noncondensable-1",
        name: "Noncondensable Gas",
        formula: "NCG",
        flowRate: 178, // kg/h
        molecularWeight: 42, // g/mol
        cpVapor: 1.1, // kJ/(kg·K)
        cpLiquid: 1.5, // kJ/(kg·K)
        kVapor: 0.02, // W/(m·K)
        kLiquid: 0.1, // W/(m·K)
        viscosityVapor: 0.012, // mPa·s
        viscosityLiquid: 0.4, // mPa·s
        latentHeat: 0, // kJ/kg — noncondensable
        condensationTemp: -100, // °C — effectively never condenses
        isCondensable: false,
      },
    ],
  },

  // --- Tube-side fluid (cooling water) -------------------------------------
  tubeSideFluid: {
    flowRate: 22377, // kg/h
    tempIn: 7, // °C
    pressure: 493, // kPa abs (4.93 bar)
    cp: 4.18, // kJ/(kg·K)
    density: 999.7, // kg/m³
    viscosity: 1.38, // mPa·s — water at ~9.5 °C average
    thermalConductivity: 0.585, // W/(m·K)
    foulingResistance: 0.0005, // m²·K/W
    fluidType: "Water",
  },
};

/** Default input for the initial form state (identical to the BEM preset). */
export const defaultInput: HeatExchangerInput = { ...presetBEM };
