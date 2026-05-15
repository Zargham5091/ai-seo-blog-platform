/** @type {import('next').NextConfig} */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "yourdomain.com";
const nextConfig = {
    images: {
        remotePatterns: [
            {protocol: "https", hostname: "res.cloudinary.com"},
            {protocol: "https", hostname: "lh3.googleusercontent.com"},
            {protocol: "https", hostname: "avatars.githubusercontent.com"},
            {protocol: "https", hostname: "uploadthing.com"},
            {protocol: "https", hostname: "utfs.io"},
        ],
    },
    async headers() {
        return [
            {
                // Applied to all tenant site routes
                source: "/:path*",
                headers: [
                    {key: "X-Frame-Options", value: "SAMEORIGIN"},
                    {key: "X-Content-Type-Options", value: "nosniff"},
                    {key: "Referrer-Policy", value: "strict-origin-when-cross-origin"},
                ],
            },
        ];
    },
    experimental: {
        serverActions: {
            allowedOrigins: [ROOT_DOMAIN, `*.${ROOT_DOMAIN}`],
        },
    },
    async rewrites() {
        return [
            {
                source: "/preview/:subdomain",
                destination: "/api/preview/:subdomain",
            },
        ];
    },
    // experimental: {
    //     serverActions: {allowedOrigins: ["localhost:3000"]},
    // },
};

module.exports = nextConfig;
