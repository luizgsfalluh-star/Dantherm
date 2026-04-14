import { describe, it, expect } from "vitest";
import {
  calculateThermal,
  calculateLMTD,
  calculateAvailableArea,
} from "../thermal";
import { presetBEM } from "../../data/presetExample";

describe("Thermal calculation engine — BEM example case", () => {
  const result = calculateThermal(presetBEM);

  it("Total Q should be approximately 132 kW (within ±3%)", () => {
    expect(result.totalQ).toBeGreaterThan(132 * 0.97);
    expect(result.totalQ).toBeLessThan(132 * 1.03);
  });

  it("Tube-side outlet temp should be approximately 12.1 °C (within ±0.5 °C)", () => {
    // In counter-current layout, zone 0 cold_out is the tube outlet
    const tubeColdOut = result.zones[0].tempColdOut;
    expect(tubeColdOut).toBeGreaterThan(12.1 - 0.5);
    expect(tubeColdOut).toBeLessThan(12.1 + 0.5);
  });

  it("LMTD for known temperatures should be approximately 15.5-16 °C", () => {
    const lmtd = calculateLMTD(40, 14.65, 7, 12.1);
    expect(lmtd).toBeGreaterThan(15.0);
    expect(lmtd).toBeLessThan(16.5);
  });

  it("Ft factor should be approximately 0.82 (within ±5%)", () => {
    expect(result.Ft).toBeGreaterThan(0.82 * 0.95);
    expect(result.Ft).toBeLessThan(0.82 * 1.05);
  });

  it("Corrected LMTD should be approximately 12.7 °C (within ±5%)", () => {
    expect(result.correctedLMTD).toBeGreaterThan(12.7 * 0.95);
    expect(result.correctedLMTD).toBeLessThan(12.7 * 1.05);
  });

  it("Available area should be approximately 26.7 m² (149 × π × 0.01905 × 3.0)", () => {
    const area = calculateAvailableArea(presetBEM);
    const expected = 149 * Math.PI * 0.01905 * 3.0;
    expect(area).toBeCloseTo(expected, 1);
  });

  it("Result should have exactly 10 zones (default numberOfZones)", () => {
    expect(result.zones).toHaveLength(10);
  });

  it("First zone hot_in should be 40 °C and last zone hot_out should be ≈14.65 °C", () => {
    expect(result.zones[0].tempHotIn).toBeCloseTo(40, 1);
    expect(result.zones[9].tempHotOut).toBeCloseTo(14.65, 1);
  });

  it("All zone U values should be positive", () => {
    for (const zone of result.zones) {
      expect(zone.U).toBeGreaterThan(0);
    }
  });

  it("Average U (service) should be approximately 300 W/m²K (within ±15%)", () => {
    expect(result.averageU).toBeGreaterThan(300 * 0.85);
    expect(result.averageU).toBeLessThan(300 * 1.15);
  });

  it("Average U (clean) should be approximately 380 W/m²K (within ±15%)", () => {
    expect(result.averageUClean).toBeGreaterThan(380 * 0.85);
    expect(result.averageUClean).toBeLessThan(380 * 1.15);
  });

  it("U clean should always be greater than U service in each zone", () => {
    for (const zone of result.zones) {
      expect(zone.UClean).toBeGreaterThan(zone.U);
    }
  });

  it("Overdesign percent should be a finite number", () => {
    expect(typeof result.overdesignPercent).toBe("number");
    expect(Number.isFinite(result.overdesignPercent)).toBe(true);
  });
});
