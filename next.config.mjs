/** @type {import('next').NextConfig} */
const nextConfig = {
    // Bundle a minimal standalone server (.next/standalone) so the Docker image only
    // ships what it needs to run — keeps the production image small.
    output: 'standalone',
    // `next lint` is broken in this repo (eslint-config-next vs ESLint 9 flat-config
    // serialization error), which fails `next build`. We lint manually with eslint,
    // so skip the build-time lint step here.
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
                pathname: '**',
            },
        ],
    },
};

export default nextConfig;
