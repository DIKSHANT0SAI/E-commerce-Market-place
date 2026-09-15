import { describe, it, expect } from "vitest";
import { cartTotal, breakdownFromTotal, roundMoney } from "@/lib/pricing";

describe("cartTotal (subtotal → charged total, 18% tax)", () => {
  it("adds 18% tax (real cart example: ₹1399 → ₹1650.82)", () => {
    expect(cartTotal(1399)).toBe(1650.82);
  });

  it("is 0 for an empty cart", () => {
    expect(cartTotal(0)).toBe(0);
  });

  it("rounds to 2 decimals (99.99 → 117.99, not 117.9882)", () => {
    expect(cartTotal(99.99)).toBe(117.99);
  });
});

describe("breakdownFromTotal (charged total → subtotal + tax + shipping)", () => {
  it("splits ₹1650.82 back into ₹1399 subtotal + ₹251.82 tax", () => {
    const { subtotal, tax, shipping } = breakdownFromTotal(1650.82);
    expect(subtotal).toBe(1399);
    expect(tax).toBe(251.82);
    expect(shipping).toBe(0);
  });

  it("its parts always sum back to the exact total charged", () => {
    const { subtotal, tax, shipping } = breakdownFromTotal(1650.82);
    expect(roundMoney(subtotal + tax + shipping)).toBe(1650.82);
  });
});

describe("the two functions are inverses (no drift between checkout & email)", () => {
  it.each([100, 250.5, 999, 1399, 12345])(
    "round-trips a subtotal of ₹%d",
    (subtotal) => {
      const total = cartTotal(subtotal);
      const back = breakdownFromTotal(total);
      // recovered subtotal matches the original (within a rounding cent)
      expect(back.subtotal).toBeCloseTo(subtotal, 1);
      // and the parts always reconstruct the charged total exactly
      expect(roundMoney(back.subtotal + back.tax + back.shipping)).toBe(total);
    }
  );
});
