import { describe, expect, it } from "vitest";

import { CapacityExceededError } from "../../src/lib/capacity";

describe("capacity guardrails", () => {
  it("surfaces a clear capacity error when a request exceeds daily availability", () => {
    const error = new CapacityExceededError("Dark Chocolate Brownie", 2, 4);

    expect(error.name).toBe("CapacityExceededError");
    expect(error.available).toBe(2);
    expect(error.requested).toBe(4);
    expect(error.message).toContain("Only 2 Dark Chocolate Brownie");
  });
});
