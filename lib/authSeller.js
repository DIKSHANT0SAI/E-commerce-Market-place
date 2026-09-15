import { auth, clerkClient } from '@clerk/nextjs/server';

const authSeller = async (userId) => {
    try {
        if (!userId) return false;

        // Fast path: read the role straight from the session token — NO API call.
        // (Active once `metadata` is added to the Clerk session token; see middleware.js.)
        const { sessionClaims } = await auth();
        const claimRole = sessionClaims?.metadata?.role;
        if (claimRole) return claimRole === 'seller';

        // Fallback: ask Clerk's API (used only until the session claim is configured).
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        return user.publicMetadata?.role === 'seller';
    } catch (error) {
        console.error('authSeller error:', error.message);
        return false;
    }
}

export default authSeller;