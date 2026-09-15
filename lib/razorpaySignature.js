import crypto from "crypto";

// Constant-time HMAC-SHA256 signature verification, shared by both Razorpay entry points:
//
//   /api/payment/verify   signs "<razorpay_order_id>|<razorpay_payment_id>" with the KEY secret
//   /api/payment/webhook  signs the RAW request body with the WEBHOOK secret
//
// Kept as a pure function (no request, no DB) so the security-critical comparison can be
// unit-tested directly — see tests/razorpaySignature.test.js.
export function isValidSignature({ payload, signature, secret }) {
  if (!payload || !signature || !secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(String(signature));

  // Two things matter here:
  //  1. timingSafeEqual THROWS if the buffers differ in length, so length is checked first.
  //  2. It always compares every byte, so the time taken leaks nothing about how much of
  //     a forged signature was correct — which a normal `===` would (a timing attack).
  return expBuf.length === sigBuf.length && crypto.timingSafeEqual(expBuf, sigBuf);
}
