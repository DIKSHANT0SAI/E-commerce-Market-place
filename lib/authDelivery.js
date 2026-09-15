import { auth, clerkClient } from '@clerk/nextjs/server';

// True only for users whose Clerk role is 'delivery'. Mirrors authSeller:
// fast path via the session-token claim, fallback to the Clerk API, fail-closed.
const authDelivery = async (userId) => {
    try {
        if (!userId) return false;

        const { sessionClaims } = await auth();
        const claimRole = sessionClaims?.metadata?.role;
        if (claimRole) return claimRole === 'delivery';

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        return user.publicMetadata?.role === 'delivery';
    } catch (error) {
        console.error('authDelivery error:', error.message);
        return false;
    }
};

export default authDelivery;
