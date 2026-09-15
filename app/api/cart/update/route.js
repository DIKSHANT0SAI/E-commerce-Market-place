import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import getOrCreateUser from "@/lib/getOrCreateUser";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { cartdata } = await request.json();
    // Must be a plain { productId: quantity } map — not an array or a scalar.
    if (!cartdata || typeof cartdata !== "object" || Array.isArray(cartdata)) {
      return NextResponse.json({ success: false, message: "Invalid cart data" }, { status: 400 });
    }

    const user = await getOrCreateUser(userId);
    user.cartItems = { ...cartdata };
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("cart update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
