import { describe, it, expect } from "vitest";
import { calculateHydraulic } from "../hydraulic";
import { presetBEM } from "../../data/presetExample";

describe("Hydraulic calculation — BEM example case", () => {
  const result = calculateHydraulic(presetBEM);

  it("Returns valid result with positive velocity, reynolds, and pressureDrop on both sides", () => {
    expect(result.tubeSide.velocity).toBeGreaterThan(0);
    expect(result.tubeSide.reynolds).toBeGreaterThan(0);
    expect(result.tubeSide.pressureDrop).toBeGreaterThan(0);
    expect(result.shellSide.velocity).toBeGreaterThan(0);
    expect(result.shellSide.reynolds).toBeGreaterThan(0);
    expect(result.shellSide.pressureDrop).toBeGreaterThan(0);
  });

  it("Tube velocity should be between 0.1 and 5 m/s for water service", () => {
    expect(result.tubeSide.velocity).toBeGreaterThan(0.1);
    expect(result.tubeSide.velocity).toBeLessThan(5);
  });

  it("Tube Reynolds number should be > 2100 (turbulent) for this flow rate", () => {
    expect(result.tubeSide.reynolds).toBeGreaterThan(2100);
  });

  it("Shell-side velocity should be positive", () => {
    expect(result.shellSide.velocity).toBeGreaterThan(0);
  });

  it("Pressure drops on both sides should be positive", () => {
    expect(result.tubeSide.pressureDrop).toBeGreaterThan(0);
    expect(result.shellSide.pressureDrop).toBeGreaterThan(0);
  });
});
