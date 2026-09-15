import { clerkClient } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import { User } from "@/models/user";

// Load the signed-in user's DB record, creating it from CLERK data if the
// `clerk/user.created` webhook hasn't landed yet.
//
// Profile fields come from Clerk — never from request headers. An earlier version
// read `x-user-name` / `x-user-email` / `x-user-image` off the request, which let a
// caller write an arbitrary address into `User.email` (a `unique: true` field) and
// permanently block the real owner's webhook sync from inserting their row.
export default async function getOrCreateUser(userId) {
  await connectDB();

  const existing = await User.findById(userId);
  if (existing) return existing;

  const client = await clerkClient();
  const u = await client.users.getUser(userId);
  const email =
    u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
    u.emailAddresses?.[0]?.emailAddress ||
    `${userId}@placeholder.local`;

  try {
    return await User.create({
      _id: userId,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "User",
      email,
      imageUrl: u.imageUrl || "",
      cartItems: {},
    });
  } catch (err) {
    // The webhook won the race (duplicate _id or email) — use the row it wrote.
    if (err?.code === 11000) {
      const raced = await User.findById(userId);
      if (raced) return raced;
    }
    throw err;
  }
}
