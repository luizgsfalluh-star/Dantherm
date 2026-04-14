/**
 * Preset fluid component data for common substances used in
 * heat exchanger design.
 *
 * Properties are representative values at near-atmospheric pressure
 * and typical operating temperatures. All flow rates default to 0.
 */

export interface FluidComponent {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Chemical formula */
  formula: string;
  /** Mass flow rate in kg/s (default 0) */
  flowRate: number;
  /** Molecular weight in g/mol */
  molecularWeight: number;
  /** Vapor specific heat in kJ/(kg·K) */
  cpVapor: number;
  /** Liquid specific heat in kJ/(kg·K) */
  cpLiquid: number;
  /** Vapor thermal conductivity in W/(m·K) */
  kVapor: number;
  /** Liquid thermal conductivity in W/(m·K) */
  kLiquid: number;
  /** Vapor dynamic viscosity in Pa·s */
  viscosityVapor: number;
  /** Liquid dynamic viscosity in Pa·s */
  viscosityLiquid: number;
  /** Latent heat of vaporization in kJ/kg */
  latentHeat: number;
  /** Normal condensation (boiling) temperature in °C at ~1 atm */
  condensationTemp: number;
  /** Whether the component condenses under operating conditions */
  isCondensable: boolean;
}

export const componentPresets: FluidComponent[] = [
  {
    id: 'water',
    name: 'Water / Steam',
    formula: 'H₂O',
    flowRate: 0,
    molecularWeight: 18.015,
    cpVapor: 2.080,
    cpLiquid: 4.182,
    kVapor: 0.0248,
    kLiquid: 0.598,
    viscosityVapor: 0.0000120,
    viscosityLiquid: 0.001002,
    latentHeat: 2257,
    condensationTemp: 100,
    isCondensable: true,
  },
  {
    id: 'ammonia',
    name: 'Ammonia',
    formula: 'NH₃',
    flowRate: 0,
    molecularWeight: 17.031,
    cpVapor: 2.060,
    cpLiquid: 4.744,
    kVapor: 0.0247,
    kLiquid: 0.507,
    viscosityVapor: 0.0000101,
    viscosityLiquid: 0.000150,
    latentHeat: 1371,
    condensationTemp: -33.3,
    isCondensable: true,
  },
  {
    id: 'r134a',
    name: 'R-134a',
    formula: 'CH₂FCF₃',
    flowRate: 0,
    molecularWeight: 102.03,
    cpVapor: 0.852,
    cpLiquid: 1.425,
    kVapor: 0.0133,
    kLiquid: 0.0824,
    viscosityVapor: 0.0000115,
    viscosityLiquid: 0.000202,
    latentHeat: 217,
    condensationTemp: -26.1,
    isCondensable: true,
  },
  {
    id: 'r22',
    name: 'R-22',
    formula: 'CHClF₂',
    flowRate: 0,
    molecularWeight: 86.47,
    cpVapor: 0.657,
    cpLiquid: 1.256,
    kVapor: 0.0107,
    kLiquid: 0.0850,
    viscosityVapor: 0.0000127,
    viscosityLiquid: 0.000190,
    latentHeat: 234,
    condensationTemp: -40.8,
    isCondensable: true,
  },
  {
    id: 'propane',
    name: 'Propane',
    formula: 'C₃H₈',
    flowRate: 0,
    molecularWeight: 44.096,
    cpVapor: 1.679,
    cpLiquid: 2.520,
    kVapor: 0.0177,
    kLiquid: 0.0960,
    viscosityVapor: 0.0000082,
    viscosityLiquid: 0.000110,
    latentHeat: 426,
    condensationTemp: -42.1,
    isCondensable: true,
  },
  {
    id: 'butane',
    name: 'Butane',
    formula: 'C₄H₁₀',
    flowRate: 0,
    molecularWeight: 58.122,
    cpVapor: 1.675,
    cpLiquid: 2.390,
    kVapor: 0.0159,
    kLiquid: 0.1120,
    viscosityVapor: 0.0000075,
    viscosityLiquid: 0.000164,
    latentHeat: 386,
    condensationTemp: -0.5,
    isCondensable: true,
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    flowRate: 0,
    molecularWeight: 44.010,
    cpVapor: 0.846,
    cpLiquid: 2.160,
    kVapor: 0.0166,
    kLiquid: 0.0870,
    viscosityVapor: 0.0000149,
    viscosityLiquid: 0.000071,
    latentHeat: 234,
    condensationTemp: -78.5,
    isCondensable: false,
  },
  {
    id: 'n2',
    name: 'Nitrogen',
    formula: 'N₂',
    flowRate: 0,
    molecularWeight: 28.014,
    cpVapor: 1.040,
    cpLiquid: 2.042,
    kVapor: 0.0259,
    kLiquid: 0.1396,
    viscosityVapor: 0.0000178,
    viscosityLiquid: 0.000158,
    latentHeat: 199,
    condensationTemp: -195.8,
    isCondensable: false,
  },
  {
    id: 'o2',
    name: 'Oxygen',
    formula: 'O₂',
    flowRate: 0,
    molecularWeight: 31.999,
    cpVapor: 0.919,
    cpLiquid: 1.699,
    kVapor: 0.0267,
    kLiquid: 0.1514,
    viscosityVapor: 0.0000207,
    viscosityLiquid: 0.000189,
    latentHeat: 213,
    condensationTemp: -183.0,
    isCondensable: false,
  },
  {
    id: 'argon',
    name: 'Argon',
    formula: 'Ar',
    flowRate: 0,
    molecularWeight: 39.948,
    cpVapor: 0.520,
    cpLiquid: 1.116,
    kVapor: 0.0177,
    kLiquid: 0.1232,
    viscosityVapor: 0.0000227,
    viscosityLiquid: 0.000252,
    latentHeat: 163,
    condensationTemp: -185.9,
    isCondensable: false,
  },
];

/**
 * Look up a preset fluid component by its id.
 */
export function getComponentPreset(id: string): FluidComponent | undefined {
  return componentPresets.find((c) => c.id === id);
}
