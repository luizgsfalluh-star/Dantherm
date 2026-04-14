import { describe, it, expect } from "vitest";
import { calculateMechanical } from "../mechanical";
import { presetBEM } from "../../data/presetExample";

describe("Mechanical calculation — BEM example case", () => {
  const result = calculateMechanical(presetBEM);

  it("Returns valid result with shell, tubesheet, and baffle sections", () => {
    expect(result.shell).toBeDefined();
    expect(result.tubesheet).toBeDefined();
    expect(result.baffle).toBeDefined();
  });

  it("Shell thickness: adopted and required should both be > 0", () => {
    expect(result.shell.thickness).toBeGreaterThan(0);
    expect(result.shell.requiredThickness).toBeGreaterThan(0);
  });

  it("Tubesheet thickness: adopted and required should both be > 0", () => {
    expect(result.tubesheet.thickness).toBeGreaterThan(0);
    expect(result.tubesheet.requiredThickness).toBeGreaterThan(0);
  });

  it("Baffle vibration check: vibrationFrequency and criticalVelocity should be > 0", () => {
    expect(result.baffle.vibrationFrequency).toBeGreaterThan(0);
    expect(result.baffle.criticalVelocity).toBeGreaterThan(0);
  });
});
