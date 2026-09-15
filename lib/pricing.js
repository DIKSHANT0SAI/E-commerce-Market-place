// Shared pricing rules — keep the cart UI (OrderSummary), the server-side order total
// (lib/createOrder), and the confirmation email (config/inngest) in sync, so the amount
// charged always matches what the user was shown.
export const TAX_RATE = 0.18; // 18% tax
export const SHIPPING_FEE = 0; // free shipping

// Round a money value to 2 decimal places (avoids floating-point noise like 117.98999...).
export const roundMoney = (n) => Math.round(n * 100) / 100;

// FORWARD: given a pre-tax subtotal, the total the customer is actually charged.
// total = subtotal + tax + shipping
export const cartTotal = (subtotal) => roundMoney(subtotal * (1 + TAX_RATE) + SHIPPING_FEE);

// REVERSE: split a charged total back into { subtotal, tax, shipping } that sum to it.
// Used by the order email so its line items reconcile to exactly what was charged.
export const breakdownFromTotal = (amount) => {
  const subtotal = roundMoney((amount - SHIPPING_FEE) / (1 + TAX_RATE));
  const tax = roundMoney(amount - SHIPPING_FEE - subtotal);
  return { subtotal, tax, shipping: SHIPPING_FEE };
};
