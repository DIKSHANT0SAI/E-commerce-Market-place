// middleware.js
import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { getRateLimitResponse } from '@/lib/ratelimit';
import authAdmin from '@/lib/authAdmin';

const isSellerRoute = createRouteMatcher(['/seller(.*)']);
const isDeliveryRoute = createRouteMatcher(['/delivery(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

// Resolve the user's role: prefer the session-token claim (no API call), fall back to
// the Clerk API until the `metadata` session claim is configured in the dashboard.
async function resolveRole(auth) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { userId: null, role: null };
  let role = sessionClaims?.metadata?.role;
  if (!role) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    role = user.publicMetadata?.role;
  }
  return { userId, role };
}

export default clerkMiddleware(async (auth, req) => {
  // Rate-limit API routes first (no-op if Upstash isn't configured).
  const limited = await getRateLimitResponse(req);
  if (limited) return limited;

  // Role-gate the seller and delivery areas. (Configure the `metadata` session claim
  // in Clerk for the fast path; otherwise it falls back to the Clerk API.)
  if (isSellerRoute(req)) {
    const { userId, role } = await resolveRole(auth);
    if (!userId || role !== 'seller') return Response.redirect(new URL('/', req.url));
  } else if (isDeliveryRoute(req)) {
    const { userId, role } = await resolveRole(auth);
    if (!userId || role !== 'delivery') return Response.redirect(new URL('/', req.url));
  } else if (isAdminRoute(req)) {
    // Admin is gated by the ADMIN_EMAILS allowlist (not the Clerk role).
    const { userId } = await auth();
    if (!userId || !(await authAdmin(userId))) return Response.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};