// Shared validation for the product create/update endpoints so both enforce the same
// rules. The update route previously accepted negative prices and an offer price above
// the list price, because only the add route validated.
export function validateProductFields({ name, description, category, price, offerPrice }) {
  if (
    !String(name ?? "").trim() ||
    !String(description ?? "").trim() ||
    !String(category ?? "").trim()
  ) {
    return { ok: false, message: "Please fill all required fields." };
  }

  const priceNum = Number(price);
  const offerNum = Number(offerPrice);

  if (!Number.isFinite(priceNum) || priceNum <= 0 || !Number.isFinite(offerNum) || offerNum <= 0) {
    return { ok: false, message: "Price and offer price must be positive numbers." };
  }
  if (offerNum > priceNum) {
    return { ok: false, message: "Offer price cannot be greater than the price." };
  }

  return { ok: true, priceNum, offerNum };
}
