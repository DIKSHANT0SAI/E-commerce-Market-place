import { describe, it, expect } from "vitest";
import { validateProductFields } from "@/lib/productValidation";

const valid = {
  name: "Sony Airbuds",
  description: "Noise cancelling earbuds",
  category: "Earphone",
  price: "1999",
  offerPrice: "1499",
};

describe("validateProductFields — happy path", () => {
  it("accepts a complete product and returns coerced numbers", () => {
    const r = validateProductFields(valid);
    expect(r.ok).toBe(true);
    expect(r.priceNum).toBe(1999);
    expect(r.offerNum).toBe(1499);
  });

  it("allows offerPrice to equal price (no discount)", () => {
    expect(validateProductFields({ ...valid, offerPrice: "1999" }).ok).toBe(true);
  });
});

describe("validateProductFields — required text fields", () => {
  it.each(["name", "description", "category"])("rejects a missing %s", (field) => {
    const r = validateProductFields({ ...valid, [field]: "" });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/required/i);
  });

  it("rejects whitespace-only text", () => {
    expect(validateProductFields({ ...valid, name: "   " }).ok).toBe(false);
  });
});

describe("validateProductFields — price rules", () => {
  it.each([
    ["negative price", { price: "-10" }],
    ["zero price", { price: "0" }],
    ["negative offer", { offerPrice: "-1" }],
    ["zero offer", { offerPrice: "0" }],
    ["non-numeric price", { price: "free" }],
    ["Infinity", { price: "Infinity" }],
  ])("rejects %s", (_label, override) => {
    const r = validateProductFields({ ...valid, ...override });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/positive numbers/i);
  });

  it("rejects an offer price above the list price", () => {
    const r = validateProductFields({ ...valid, price: "1000", offerPrice: "1500" });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/cannot be greater/i);
  });
});
