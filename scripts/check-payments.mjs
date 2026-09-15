/**
 * Read-only payment diagnostic.
 *
 *   node scripts/check-payments.mjs
 *
 * Answers the question "did my payment actually become an order?" by showing:
 *   1. the most recent orders, and how they were paid
 *   2. any PaymentIntent still sitting in the database
 *
 * An outstanding PaymentIntent is the interesting case. It means a checkout was
 * started but no order was created from it — either the customer abandoned the
 * payment (harmless, it expires after 1h), or they paid and the callback never
 * ran (the exact failure the webhook exists to prevent).
 *
 * This script only reads. It never writes or deletes anything.
 */

import mongoose from "mongoose";
import { readFileSync } from "node:fs";

// Next.js loads .env then .env.local, so .env.local wins. Mirror that order here.
function readEnv(key) {
  for (const file of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      const m = txt.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (m) return m[1].trim().replace(/^["']+/, "").replace(/["';]+$/, "");
    } catch {
      /* file may not exist */
    }
  }
  return null;
}

const uri = readEnv("MONGODB_URI");
if (!uri) {
  console.error("Could not find MONGODB_URI in .env.local or .env");
  process.exit(1);
}

const ago = (ms) => {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

await mongoose.connect(`${uri}/ECommerce`, { serverSelectionTimeoutMS: 8000 });
const db = mongoose.connection.db;

// ---------------------------------------------------------------- recent orders
const orders = await db
  .collection("orders")
  .find({}, { projection: { amount: 1, date: 1, status: 1, paymentMethod: 1, paymentStatus: 1, razorpayOrderId: 1 } })
  .sort({ date: -1 })
  .limit(8)
  .toArray();

console.log("\nRECENT ORDERS");
console.log("─".repeat(96));
if (orders.length === 0) {
  console.log("  (none)");
} else {
  console.log(
    "  " + "ORDER ID".padEnd(26) + "AMOUNT".padStart(10) + "  " +
    "METHOD".padEnd(8) + "PAID".padEnd(9) + "STATUS".padEnd(16) + "WHEN"
  );
  for (const o of orders) {
    console.log(
      "  " +
        String(o._id).padEnd(26) +
        `₹${Number(o.amount || 0).toFixed(2)}`.padStart(10) + "  " +
        String(o.paymentMethod || "-").padEnd(8) +
        String(o.paymentStatus || "-").padEnd(9) +
        String(o.status || "-").padEnd(16) +
        (o.date ? ago(o.date) : "-")
    );
  }
}

// ------------------------------------------------------- outstanding intents
const intents = await db
  .collection("paymentintents")
  .find({}, { projection: { razorpayOrderId: 1, amount: 1, userId: 1, createdAt: 1 } })
  .sort({ createdAt: -1 })
  .toArray();

console.log("\nOUTSTANDING PAYMENT INTENTS");
console.log("─".repeat(96));
if (intents.length === 0) {
  console.log("  (none — every checkout that started has either completed or expired)");
} else {
  for (const i of intents) {
    const created = i.createdAt ? new Date(i.createdAt).getTime() : null;
    // Was an order ever created for this Razorpay order id?
    const matched = await db.collection("orders").findOne(
      { razorpayOrderId: i.razorpayOrderId },
      { projection: { _id: 1 } }
    );
    console.log(
      `  ${String(i.razorpayOrderId).padEnd(24)} ₹${Number(i.amount || 0).toFixed(2).padStart(9)}  ` +
        `${created ? ago(created).padEnd(9) : "-".padEnd(9)} ` +
        (matched ? "order EXISTS (intent not cleaned up)" : "NO ORDER YET")
    );
  }
  console.log(
    "\n  An intent with NO ORDER YET is either an abandoned checkout (fine — it expires\n" +
    "  after 1 hour) or a payment that succeeded while the browser callback never ran.\n" +
    "  Cross-check the Razorpay dashboard: if that order id shows as captured, this is\n" +
    "  precisely the case /api/payment/webhook was built to recover."
  );
}

console.log();
await mongoose.disconnect();
