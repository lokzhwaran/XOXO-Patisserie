import { describe, expect, it } from "vitest";

import { calcGstPaise, paiseToRupeeDisplay, paiseToWords, rupeesToPaise } from "../../src/lib/money";

describe("money helpers", () => {
  it("calculates GST and formats rupees for INR display", () => {
    expect(calcGstPaise(10000, 5)).toBe(500);
    expect(rupeesToPaise(299.99)).toBe(29999);
    expect(paiseToRupeeDisplay(2500)).toBe("₹25");
    expect(paiseToRupeeDisplay(2550)).toBe("₹25.50");
  });

  it("converts paise to words for invoice output", () => {
    expect(paiseToWords(12345)).toBe("Rupees One Hundred Twenty Three Only");
  });
});
