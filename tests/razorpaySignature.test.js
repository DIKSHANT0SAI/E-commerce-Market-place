import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { isValidSignature } from "@/lib/razorpaySignature";

const SECRET = "test_webhook_secret";
const sign = (payload, secret = SECRET) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

describe("isValidSignature — accepts genuine Razorpay callbacks", () => {
  it("accepts the order|payment payload used by /api/payment/verify", () => {
    const payload = "order_ABC123|pay_XYZ789";
    expect(isValidSignature({ payload, signature: sign(payload), secret: SECRET })).toBe(true);
  });

  it("accepts a raw JSON body as used by /api/payment/webhook", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });
    expect(isValidSignature({ payload: body, signature: sign(body), secret: SECRET })).toBe(true);
  });
});

describe("isValidSignature — rejects forgeries", () => {
  const payload = "order_ABC123|pay_XYZ789";

  it("rejects a tampered payload (amount/order swapped after signing)", () => {
    const signature = sign(payload);
    expect(isValidSignature({ payload: "order_EVIL|pay_XYZ789", signature, secret: SECRET })).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    const signature = sign(payload, "attacker_guess");
    expect(isValidSignature({ payload, signature, secret: SECRET })).toBe(false);
  });

  it("rejects a signature of the right length but wrong content", () => {
    const forged = "a".repeat(sign(payload).length);
    expect(isValidSignature({ payload, signature: forged, secret: SECRET })).toBe(false);
  });

  it("rejects a truncated signature WITHOUT throwing (timingSafeEqual would)", () => {
    const truncated = sign(payload).slice(0, 20);
    expect(() => isValidSignature({ payload, signature: truncated, secret: SECRET })).not.toThrow();
    expect(isValidSignature({ payload, signature: truncated, secret: SECRET })).toBe(false);
  });

  it("rejects an over-long signature without throwing", () => {
    const tooLong = sign(payload) + "deadbeef";
    expect(() => isValidSignature({ payload, signature: tooLong, secret: SECRET })).not.toThrow();
    expect(isValidSignature({ payload, signature: tooLong, secret: SECRET })).toBe(false);
  });
});

describe("isValidSignature — fails closed on missing input", () => {
  it.each([
    ["no signature", { payload: "x", signature: "", secret: SECRET }],
    ["no secret", { payload: "x", signature: "abc", secret: "" }],
    ["no payload", { payload: "", signature: "abc", secret: SECRET }],
    ["all undefined", {}],
  ])("returns false when there is %s", (_label, args) => {
    expect(isValidSignature(args)).toBe(false);
  });
});
