/**
 * Water thermophysical properties database.
 *
 * Data covers saturated liquid water from 0 °C to 200 °C in 5 °C steps.
 * Sources: Incropera & DeWitt "Fundamentals of Heat and Mass Transfer",
 * CRC Handbook of Chemistry and Physics, NIST webbook.
 */

export interface WaterPropertyEntry {
  /** Temperature in degrees Celsius */
  temperature: number;
  /** Density in kg/m³ */
  density: number;
  /** Specific heat capacity in kJ/(kg·K) */
  specificHeat: number;
  /** Dynamic viscosity in Pa·s */
  viscosity: number;
  /** Thermal conductivity in W/(m·K) */
  thermalConductivity: number;
  /** Prandtl number (dimensionless) */
  prandtl: number;
}

/**
 * Saturated liquid water properties from 0 °C to 200 °C in 5 °C increments.
 */
export const waterPropertiesTable: WaterPropertyEntry[] = [
  // 0–30 °C: given reference data
  { temperature: 0,   density: 999.8, specificHeat: 4.217, viscosity: 0.001792, thermalConductivity: 0.561, prandtl: 13.44 },
  { temperature: 5,   density: 999.9, specificHeat: 4.204, viscosity: 0.001519, thermalConductivity: 0.571, prandtl: 11.19 },
  { temperature: 10,  density: 999.7, specificHeat: 4.192, viscosity: 0.001307, thermalConductivity: 0.580, prandtl: 9.45  },
  { temperature: 15,  density: 999.1, specificHeat: 4.186, viscosity: 0.001138, thermalConductivity: 0.589, prandtl: 8.09  },
  { temperature: 20,  density: 998.2, specificHeat: 4.182, viscosity: 0.001002, thermalConductivity: 0.598, prandtl: 7.01  },
  { temperature: 25,  density: 997.0, specificHeat: 4.180, viscosity: 0.000891, thermalConductivity: 0.607, prandtl: 6.14  },
  { temperature: 30,  density: 995.6, specificHeat: 4.178, viscosity: 0.000798, thermalConductivity: 0.615, prandtl: 5.42  },
  // 35 °C: interpolated between 30 and 40
  { temperature: 35,  density: 993.9, specificHeat: 4.178, viscosity: 0.000720, thermalConductivity: 0.623, prandtl: 4.83  },
  { temperature: 40,  density: 992.2, specificHeat: 4.179, viscosity: 0.000653, thermalConductivity: 0.631, prandtl: 4.33  },
  // 45 °C: interpolated between 40 and 50
  { temperature: 45,  density: 990.2, specificHeat: 4.180, viscosity: 0.000596, thermalConductivity: 0.637, prandtl: 3.91  },
  { temperature: 50,  density: 988.1, specificHeat: 4.181, viscosity: 0.000547, thermalConductivity: 0.644, prandtl: 3.55  },
  // 55 °C: interpolated between 50 and 60
  { temperature: 55,  density: 985.7, specificHeat: 4.183, viscosity: 0.000504, thermalConductivity: 0.649, prandtl: 3.25  },
  { temperature: 60,  density: 983.2, specificHeat: 4.185, viscosity: 0.000467, thermalConductivity: 0.654, prandtl: 2.99  },
  // 65 °C: interpolated between 60 and 70
  { temperature: 65,  density: 980.5, specificHeat: 4.187, viscosity: 0.000433, thermalConductivity: 0.659, prandtl: 2.75  },
  { temperature: 70,  density: 977.7, specificHeat: 4.190, viscosity: 0.000404, thermalConductivity: 0.663, prandtl: 2.55  },
  // 75 °C: interpolated between 70 and 80
  { temperature: 75,  density: 974.8, specificHeat: 4.193, viscosity: 0.000378, thermalConductivity: 0.667, prandtl: 2.38  },
  { temperature: 80,  density: 971.8, specificHeat: 4.197, viscosity: 0.000355, thermalConductivity: 0.670, prandtl: 2.22  },
  // 85 °C: interpolated between 80 and 90
  { temperature: 85,  density: 968.6, specificHeat: 4.201, viscosity: 0.000333, thermalConductivity: 0.673, prandtl: 2.08  },
  { temperature: 90,  density: 965.3, specificHeat: 4.205, viscosity: 0.000315, thermalConductivity: 0.675, prandtl: 1.96  },
  // 95 °C: interpolated between 90 and 100
  { temperature: 95,  density: 961.9, specificHeat: 4.210, viscosity: 0.000297, thermalConductivity: 0.677, prandtl: 1.85  },
  { temperature: 100, density: 958.4, specificHeat: 4.216, viscosity: 0.000282, thermalConductivity: 0.679, prandtl: 1.75  },
  // 105–200 °C: published / extrapolated saturated liquid data
  { temperature: 105, density: 954.7, specificHeat: 4.222, viscosity: 0.000268, thermalConductivity: 0.680, prandtl: 1.66  },
  { temperature: 110, density: 950.9, specificHeat: 4.229, viscosity: 0.000255, thermalConductivity: 0.681, prandtl: 1.58  },
  { temperature: 115, density: 947.0, specificHeat: 4.236, viscosity: 0.000243, thermalConductivity: 0.681, prandtl: 1.51  },
  { temperature: 120, density: 943.1, specificHeat: 4.244, viscosity: 0.000232, thermalConductivity: 0.681, prandtl: 1.45  },
  { temperature: 125, density: 939.0, specificHeat: 4.252, viscosity: 0.000222, thermalConductivity: 0.680, prandtl: 1.39  },
  { temperature: 130, density: 934.8, specificHeat: 4.261, viscosity: 0.000213, thermalConductivity: 0.679, prandtl: 1.34  },
  { temperature: 135, density: 930.5, specificHeat: 4.270, viscosity: 0.000204, thermalConductivity: 0.677, prandtl: 1.29  },
  { temperature: 140, density: 926.1, specificHeat: 4.280, viscosity: 0.000196, thermalConductivity: 0.675, prandtl: 1.24  },
  { temperature: 145, density: 921.6, specificHeat: 4.290, viscosity: 0.000189, thermalConductivity: 0.673, prandtl: 1.20  },
  { temperature: 150, density: 917.0, specificHeat: 4.301, viscosity: 0.000182, thermalConductivity: 0.670, prandtl: 1.17  },
  { temperature: 155, density: 912.2, specificHeat: 4.312, viscosity: 0.000176, thermalConductivity: 0.667, prandtl: 1.13  },
  { temperature: 160, density: 907.4, specificHeat: 4.324, viscosity: 0.000170, thermalConductivity: 0.664, prandtl: 1.10  },
  { temperature: 165, density: 902.5, specificHeat: 4.336, viscosity: 0.000165, thermalConductivity: 0.660, prandtl: 1.08  },
  { temperature: 170, density: 897.5, specificHeat: 4.349, viscosity: 0.000160, thermalConductivity: 0.656, prandtl: 1.06  },
  { temperature: 175, density: 892.3, specificHeat: 4.362, viscosity: 0.000155, thermalConductivity: 0.652, prandtl: 1.04  },
  { temperature: 180, density: 887.0, specificHeat: 4.376, viscosity: 0.000150, thermalConductivity: 0.647, prandtl: 1.01  },
  { temperature: 185, density: 881.6, specificHeat: 4.390, viscosity: 0.000146, thermalConductivity: 0.642, prandtl: 1.00  },
  { temperature: 190, density: 876.1, specificHeat: 4.405, viscosity: 0.000142, thermalConductivity: 0.637, prandtl: 0.98  },
  { temperature: 195, density: 870.4, specificHeat: 4.421, viscosity: 0.000138, thermalConductivity: 0.632, prandtl: 0.97  },
  { temperature: 200, density: 864.7, specificHeat: 4.437, viscosity: 0.000134, thermalConductivity: 0.627, prandtl: 0.95  },
];

export interface WaterProperties {
  density: number;
  specificHeat: number;
  viscosity: number;
  thermalConductivity: number;
  prandtl: number;
}

/**
 * Returns linearly interpolated water properties for any temperature
 * between 0 °C and 200 °C.
 *
 * @param tempC - Temperature in degrees Celsius (0 to 200).
 * @returns Interpolated water properties.
 * @throws RangeError if temperature is outside the table range.
 */
export function getWaterProperties(tempC: number): WaterProperties {
  const table = waterPropertiesTable;
  const tMin = table[0].temperature;
  const tMax = table[table.length - 1].temperature;

  if (tempC < tMin || tempC > tMax) {
    throw new RangeError(
      `Temperature ${tempC} °C is outside the valid range [${tMin}, ${tMax}] °C.`
    );
  }

  // Find bounding entries
  let lowerIdx = 0;
  for (let i = 0; i < table.length - 1; i++) {
    if (table[i].temperature <= tempC && table[i + 1].temperature >= tempC) {
      lowerIdx = i;
      break;
    }
  }

  const lower = table[lowerIdx];
  const upper = table[lowerIdx + 1];

  // Exact match
  if (lower.temperature === tempC) {
    return {
      density: lower.density,
      specificHeat: lower.specificHeat,
      viscosity: lower.viscosity,
      thermalConductivity: lower.thermalConductivity,
      prandtl: lower.prandtl,
    };
  }

  if (upper.temperature === tempC) {
    return {
      density: upper.density,
      specificHeat: upper.specificHeat,
      viscosity: upper.viscosity,
      thermalConductivity: upper.thermalConductivity,
      prandtl: upper.prandtl,
    };
  }

  // Linear interpolation factor
  const f = (tempC - lower.temperature) / (upper.temperature - lower.temperature);

  const lerp = (a: number, b: number) => a + f * (b - a);

  return {
    density: lerp(lower.density, upper.density),
    specificHeat: lerp(lower.specificHeat, upper.specificHeat),
    viscosity: lerp(lower.viscosity, upper.viscosity),
    thermalConductivity: lerp(lower.thermalConductivity, upper.thermalConductivity),
    prandtl: lerp(lower.prandtl, upper.prandtl),
  };
}
