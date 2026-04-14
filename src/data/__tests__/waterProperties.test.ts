import { describe, it, expect } from "vitest";
import { getWaterProperties } from "../waterProperties";

describe("Water properties lookup", () => {
  it("Known value at 20 °C: density ≈ 998.2, cp ≈ 4.182", () => {
    const props = getWaterProperties(20);
    expect(props.density).toBeCloseTo(998.2, 1);
    expect(props.specificHeat).toBeCloseTo(4.182, 2);
  });

  it("Interpolation at 15 °C returns reasonable values", () => {
    const props = getWaterProperties(15);
    expect(props.density).toBeGreaterThan(990);
    expect(props.density).toBeLessThan(1010);
    expect(props.specificHeat).toBeGreaterThan(4.0);
    expect(props.specificHeat).toBeLessThan(4.3);
    expect(props.viscosity).toBeGreaterThan(0);
    expect(props.thermalConductivity).toBeGreaterThan(0);
  });

  it("Out of range: -1 °C should throw RangeError", () => {
    expect(() => getWaterProperties(-1)).toThrow(RangeError);
  });

  it("Out of range: 201 °C should throw RangeError", () => {
    expect(() => getWaterProperties(201)).toThrow(RangeError);
  });

  it("Viscosity decreases with temperature: viscosity at 80 °C < viscosity at 20 °C", () => {
    const at20 = getWaterProperties(20);
    const at80 = getWaterProperties(80);
    expect(at80.viscosity).toBeLessThan(at20.viscosity);
  });
});
