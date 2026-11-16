import { describe, expect, it } from "vitest";
import {
  calculateNights,
  calculateTaxAndService,
  calculateUtilityCharge,
  hasDateOverlap,
} from "../pms-math";

describe("pms-math", () => {
  it("calculates nights accurately with minimum 1 night", () => {
    const d1 = new Date("2026-11-13T14:00:00");
    const d2 = new Date("2026-11-15T12:00:00");
    expect(calculateNights(d1, d2)).toBe(2);

    const sameDay = new Date("2026-11-13T18:00:00");
    expect(calculateNights(d1, sameDay)).toBe(1);
  });

  it("calculates utility meter usage and applies minimum units", () => {
    expect(calculateUtilityCharge(100, 112, 18, 5)).toEqual({
      units: 12,
      amount: 216,
    });
    expect(calculateUtilityCharge(100, 102, 18, 5)).toEqual({
      units: 2,
      amount: 90,
    });
    expect(() => calculateUtilityCharge(100, 95, 18, 0)).toThrow();
  });

  it("calculates service charge and VAT sequentially", () => {
    expect(calculateTaxAndService(1000, 7, 10)).toEqual({
      serviceChargeAmount: 100,
      vatAmount: 77,
      totalAmount: 1177,
    });
  });

  it("detects overlapping stay date ranges without blocking back-to-back checkout/checkin", () => {
    const aStart = new Date("2026-11-10");
    const aEnd = new Date("2026-11-12");
    const bStart = new Date("2026-11-12");
    const bEnd = new Date("2026-11-14");
    expect(hasDateOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);

    const cStart = new Date("2026-11-11");
    const cEnd = new Date("2026-11-13");
    expect(hasDateOverlap(aStart, aEnd, cStart, cEnd)).toBe(true);
  });
});
