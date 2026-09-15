import { clerkClient } from "@clerk/nextjs/server";
import { getAdminEmails } from "./adminEmails";

// Admin is gated by an email allowlist (ADMIN_EMAILS, comma-separated) rather than the
// Clerk `role` field — so the owner can be both a seller AND an admin (role is a single
// string in this app). The real security check lives here on the server.
// The pure parsing lives in ./adminEmails (Clerk-free) so it can be unit-tested.
export { getAdminEmails };

// Returns true if the given Clerk userId belongs to an allowlisted admin.
const authAdmin = async (userId) => {
  try {
    if (!userId) return false;
    const allow = getAdminEmails();
    if (allow.length === 0) return false; // no admins configured → deny everyone

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = (
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      ""
    ).toLowerCase();

    return allow.includes(email);
  } catch (error) {
    console.error("authAdmin error:", error.message);
    return false;
  }
};

export default authAdmin;
