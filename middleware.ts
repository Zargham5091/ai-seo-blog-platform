import {withAuth} from "next-auth/middleware";
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export default withAuth(
    function middleware(
        req: NextRequest & {
            nextauth: { token: { role?: string; plan?: string; id?: string } | null };
        }
    ) {
        const url = req.nextUrl.clone();
        const {pathname} = url;
        const hostname = req.headers.get("host") ?? "";
        const token = req.nextauth.token;
        const role = token?.role;

        const rootDomainClean = ROOT_DOMAIN.replace(/:\d+$/, "");
        const hostnameClean = hostname.replace(/:\d+$/, "");
        const isLocalhost = hostnameClean === "localhost" || hostnameClean === "127.0.0.1";

        // ── 1. Subdomain detection ────────────────────────────────────────────────
        const isSubdomain =
            !isLocalhost &&
            hostnameClean !== rootDomainClean &&
            hostnameClean !== `www.${rootDomainClean}` &&
            hostnameClean.endsWith(`.${rootDomainClean}`);

        const isCustomDomain =
            !isLocalhost &&
            !isSubdomain &&
            hostnameClean !== rootDomainClean &&
            hostnameClean !== `www.${rootDomainClean}`;

        if (isSubdomain) {
            const subdomain = hostnameClean.replace(`.${rootDomainClean}`, "");
            url.pathname = `/_tenants/subdomain/${subdomain}${pathname}`;
            return NextResponse.rewrite(url);
        }

        if (isCustomDomain) {
            url.pathname = `/_tenants/custom/${hostnameClean}${pathname}`;
            return NextResponse.rewrite(url);
        }

        // ── 2. Local dev preview ──────────────────────────────────────────────────
        if (pathname.startsWith("/preview/")) {
            const parts = pathname.split("/");
            const subdomain = parts[2];
            if (subdomain) {
                const rest = parts.slice(3).join("/");
                url.pathname = `/_tenants/subdomain/${subdomain}${rest ? `/${rest}` : ""}`;
                return NextResponse.rewrite(url);
            }
        }

        // ── 3. Dashboard RBAC ─────────────────────────────────────────────────────
        if (pathname.startsWith("/dashboard/super-admin")) {
            if (role !== "super_admin") {
                return NextResponse.redirect(new URL("/dashboard/admin", req.url));
            }
        }

        if (pathname.startsWith("/dashboard/admin")) {
            if (role === "user") {
                return NextResponse.redirect(new URL("/dashboard/user", req.url));
            }
        }

        // ── 4. Team member page access enforcement ────────────────────────────────
        // NOTE: We can't do DB lookups in middleware (edge runtime).
        // Page-level permission check is handled in the dashboard layout server component.
        // Middleware only handles role-based routing above.
        // Fine-grained allowedPages enforcement happens in: app/(dashboard)/layout.tsx

        // ── 5. API route protection ───────────────────────────────────────────────
        if (pathname.startsWith("/api/super-admin")) {
            if (!token || role !== "super_admin") {
                return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
            }
        }

        if (pathname.startsWith("/api/admin")) {
            if (!token) {
                return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
            }
            if (role !== "super_admin" && role !== "product_admin") {
                return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
            }
        }

        const PROTECTED_API = [
            "/api/ai", "/api/blog", "/api/media", "/api/team",
            "/api/analytics", "/api/seo", "/api/cms",
            "/api/subscriptions", "/api/users", "/api/domains", "/api/categories",
        ];
        if (PROTECTED_API.some((p) => pathname.startsWith(p)) && !token) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        // ── 6. Security headers ───────────────────────────────────────────────────
        const response = NextResponse.next();
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "SAMEORIGIN");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        if (pathname.startsWith("/dashboard")) {
            response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
        }
        return response;
    },
    {
        callbacks: {
            authorized({token, req}) {
                const {pathname} = req.nextUrl;
                const hostname = req.headers.get("host") ?? "";
                const rootDomainClean = ROOT_DOMAIN.replace(/:\d+$/, "");
                const hostnameClean = hostname.replace(/:\d+$/, "");
                const isLocalhost = hostnameClean === "localhost" || hostnameClean === "127.0.0.1";

                const isSubdomain =
                    !isLocalhost &&
                    hostnameClean !== rootDomainClean &&
                    hostnameClean !== `www.${rootDomainClean}` &&
                    hostnameClean.endsWith(`.${rootDomainClean}`);

                const isCustomDomain =
                    !isLocalhost &&
                    !isSubdomain &&
                    hostnameClean !== rootDomainClean &&
                    hostnameClean !== `www.${rootDomainClean}`;

                if (isSubdomain || isCustomDomain) return true;
                if (pathname.startsWith("/preview/")) return true;
                if (pathname.startsWith("/_tenants/")) return true;

                if (
                    pathname === "/" ||
                    pathname.startsWith("/login") ||
                    pathname.startsWith("/register") ||
                    pathname.startsWith("/invite") ||
                    pathname.startsWith("/api/auth") ||
                    pathname.startsWith("/api/webhooks") ||
                    pathname.startsWith("/api/plans") ||
                    pathname.startsWith("/api/public") ||
                    pathname.startsWith("/blog") ||
                    pathname.startsWith("/pricing") ||
                    pathname.startsWith("/features") ||
                    pathname.startsWith("/about") ||
                    pathname.startsWith("/contact") ||
                    pathname.startsWith("/demo") ||
                    pathname.startsWith("/documentation") ||
                    pathname.startsWith("/privacy") ||
                    pathname.startsWith("/terms") ||
                    pathname.startsWith("/_next") ||
                    pathname.startsWith("/favicon") ||
                    pathname.startsWith("/sitemap") ||
                    pathname.startsWith("/robots") ||
                    pathname.startsWith("/preview/") ||
                    pathname.startsWith("/api/support") ||
                    pathname.startsWith("/api/support") ||
                    pathname.startsWith("/api/demo") ||
                    pathname.startsWith("/api/mascot") ||
                    pathname.startsWith("/_tenants/")
                ) {
                    return true;
                }

                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
    ],
};

// import {withAuth} from "next-auth/middleware";
// import {NextResponse} from "next/server";
// import type {NextRequest} from "next/server";
//
// const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
//
// export default withAuth(
//     function middleware(
//         req: NextRequest & {
//             nextauth: { token: { role?: string; plan?: string; id?: string } | null };
//         }
//     ) {
//         const url = req.nextUrl.clone();
//         const {pathname} = url;
//         const hostname = req.headers.get("host") ?? "";
//         const token = req.nextauth.token;
//         const role = token?.role;
//
//         const rootDomainClean = ROOT_DOMAIN.replace(/:\d+$/, "");
//         const hostnameClean = hostname.replace(/:\d+$/, "");
//         const isLocalhost = hostnameClean === "localhost" || hostnameClean === "127.0.0.1";
//
//         // ── 1. Subdomain detection (production) ──────────────────────────────
//         const isSubdomain =
//             !isLocalhost &&
//             hostnameClean !== rootDomainClean &&
//             hostnameClean !== `www.${rootDomainClean}` &&
//             hostnameClean.endsWith(`.${rootDomainClean}`);
//
//         const isCustomDomain =
//             !isLocalhost &&
//             !isSubdomain &&
//             hostnameClean !== rootDomainClean &&
//             hostnameClean !== `www.${rootDomainClean}`;
//
//         if (isSubdomain) {
//             const subdomain = hostnameClean.replace(`.${rootDomainClean}`, "");
//             url.pathname = `/_tenants/subdomain/${subdomain}${pathname}`;
//             return NextResponse.rewrite(url);
//         }
//
//         if (isCustomDomain) {
//             url.pathname = `/_tenants/custom/${hostnameClean}${pathname}`;
//             return NextResponse.rewrite(url);
//         }
//
//         // ── 2. Local dev preview: /preview/[subdomain] → tenant blog ─────────
//         // In local dev visit: http://localhost:3000/preview/zrgblog
//         // In production this path is unused — real subdomain takes over
//         // if (pathname.startsWith("/preview/")) {
//         //     const parts = pathname.split("/");
//         //     const subdomain = parts[2]; // /preview/[subdomain]/...
//         //     if (subdomain) {
//         //         const rest = "/" + parts.slice(3).join("/") || "/";
//         //         url.pathname = `/_tenants/subdomain/${subdomain}${rest}`;
//         //         return NextResponse.rewrite(url);
//         //     }
//         // }
//
//         // ── Local dev preview: /preview/[subdomain] ───────────────────────────
//         if (pathname.startsWith("/preview/")) {
//             const parts = pathname.split("/");
//             const subdomain = parts[2];
//             if (subdomain) {
//                 const rest = parts.slice(3).join("/");
//                 url.pathname = `/_tenants/subdomain/${subdomain}${rest ? `/${rest}` : ""}`;
//                 return NextResponse.rewrite(url);
//             }
//         }
//
//         // ── 3. Dashboard RBAC ─────────────────────────────────────────────────
//         if (pathname.startsWith("/dashboard/super-admin")) {
//             if (role !== "super_admin") {
//                 return NextResponse.redirect(new URL("/dashboard/admin", req.url));
//             }
//         }
//
//         if (pathname.startsWith("/dashboard/admin")) {
//             if (role === "user") {
//                 return NextResponse.redirect(new URL("/dashboard/user", req.url));
//             }
//         }
//
//         // ── 4. API route protection ───────────────────────────────────────────
//         if (pathname.startsWith("/api/super-admin")) {
//             if (!token || role !== "super_admin") {
//                 return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
//             }
//         }
//
//         if (pathname.startsWith("/api/admin")) {
//             if (!token) {
//                 return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//             }
//             if (role !== "super_admin" && role !== "product_admin") {
//                 return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
//             }
//         }
//
//         const PROTECTED_API = [
//             "/api/ai", "/api/blog", "/api/media", "/api/team",
//             "/api/analytics", "/api/seo", "/api/cms",
//             "/api/subscriptions", "/api/users", "/api/domains", "/api/categories",
//         ];
//         if (PROTECTED_API.some((p) => pathname.startsWith(p)) && !token) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         // ── 5. Security headers ───────────────────────────────────────────────
//         const response = NextResponse.next();
//         response.headers.set("X-Content-Type-Options", "nosniff");
//         response.headers.set("X-Frame-Options", "SAMEORIGIN");
//         response.headers.set("X-XSS-Protection", "1; mode=block");
//         response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
//         response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
//         if (pathname.startsWith("/dashboard")) {
//             response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
//         }
//         return response;
//     },
//     {
//         callbacks: {
//             authorized({token, req}) {
//                 const {pathname} = req.nextUrl;
//                 const hostname = req.headers.get("host") ?? "";
//                 const rootDomainClean = ROOT_DOMAIN.replace(/:\d+$/, "");
//                 const hostnameClean = hostname.replace(/:\d+$/, "");
//                 const isLocalhost = hostnameClean === "localhost" || hostnameClean === "127.0.0.1";
//
//                 const isSubdomain =
//                     !isLocalhost &&
//                     hostnameClean !== rootDomainClean &&
//                     hostnameClean !== `www.${rootDomainClean}` &&
//                     hostnameClean.endsWith(`.${rootDomainClean}`);
//
//                 const isCustomDomain =
//                     !isLocalhost &&
//                     !isSubdomain &&
//                     hostnameClean !== rootDomainClean &&
//                     hostnameClean !== `www.${rootDomainClean}`;
//
//                 // Subdomain / custom domain traffic is always public
//                 if (isSubdomain || isCustomDomain) return true;
//
//                 // Local preview route is public
//                 if (pathname.startsWith("/preview/")) return true;
//
//                 // Tenant internal routes are always public
//                 if (pathname.startsWith("/_tenants/")) return true;
//
//                 // Standard public paths
//                 if (
//                     pathname === "/" ||
//                     pathname.startsWith("/login") ||
//                     pathname.startsWith("/register") ||
//                     pathname.startsWith("/api/auth") ||
//                     pathname.startsWith("/api/webhooks") ||
//                     pathname.startsWith("/api/plans") ||
//                     pathname.startsWith("/api/public") ||
//                     pathname.startsWith("/blog") ||
//                     pathname.startsWith("/pricing") ||
//                     pathname.startsWith("/features") ||
//                     pathname.startsWith("/about") ||
//                     pathname.startsWith("/contact") ||
//                     pathname.startsWith("/demo") ||
//                     pathname.startsWith("/documentation") ||
//                     pathname.startsWith("/privacy") ||
//                     pathname.startsWith("/terms") ||
//                     pathname.startsWith("/_next") ||
//                     pathname.startsWith("/favicon") ||
//                     pathname.startsWith("/sitemap") ||
//                     pathname.startsWith("/robots") ||
//                     pathname.startsWith("/preview/") ||
//                     pathname.startsWith("/_tenants/")
//                 ) {
//                     return true;
//                 }
//
//                 return !!token;
//             },
//         },
//     }
// );
//
// export const config = {
//     matcher: [
//         "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
//     ],
// };
