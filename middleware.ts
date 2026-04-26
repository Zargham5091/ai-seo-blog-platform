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

        // ── 1. Subdomain detection (production) ──────────────────────────────
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

        // ── 2. Local dev preview: /preview/[subdomain] → tenant blog ─────────
        // In local dev visit: http://localhost:3000/preview/zrgblog
        // In production this path is unused — real subdomain takes over
        // if (pathname.startsWith("/preview/")) {
        //     const parts = pathname.split("/");
        //     const subdomain = parts[2]; // /preview/[subdomain]/...
        //     if (subdomain) {
        //         const rest = "/" + parts.slice(3).join("/") || "/";
        //         url.pathname = `/_tenants/subdomain/${subdomain}${rest}`;
        //         return NextResponse.rewrite(url);
        //     }
        // }

        // ── Local dev preview: /preview/[subdomain] ───────────────────────────
        if (pathname.startsWith("/preview/")) {
            const parts = pathname.split("/");
            const subdomain = parts[2];
            if (subdomain) {
                const rest = parts.slice(3).join("/");
                url.pathname = `/_tenants/subdomain/${subdomain}${rest ? `/${rest}` : ""}`;
                return NextResponse.rewrite(url);
            }
        }

        // ── 3. Dashboard RBAC ─────────────────────────────────────────────────
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

        // ── 4. API route protection ───────────────────────────────────────────
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

        // ── 5. Security headers ───────────────────────────────────────────────
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

                // Subdomain / custom domain traffic is always public
                if (isSubdomain || isCustomDomain) return true;

                // Local preview route is public
                if (pathname.startsWith("/preview/")) return true;

                // Tenant internal routes are always public
                if (pathname.startsWith("/_tenants/")) return true;

                // Standard public paths
                if (
                    pathname === "/" ||
                    pathname.startsWith("/login") ||
                    pathname.startsWith("/register") ||
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
//         // ── 1. Subdomain / custom domain routing ──────────────────────────────
//         const rootDomainClean = ROOT_DOMAIN.replace(/:\d+$/, "");
//         const hostnameClean = hostname.replace(/:\d+$/, "");
//
//         const isSubdomain =
//             hostnameClean !== rootDomainClean &&
//             hostnameClean !== `www.${rootDomainClean}` &&
//             hostnameClean.endsWith(`.${rootDomainClean}`);
//
//         // Custom domain: not a subdomain of root, not the root itself
//         const isCustomDomain =
//             !isSubdomain &&
//             hostnameClean !== rootDomainClean &&
//             hostnameClean !== `www.${rootDomainClean}` &&
//             !hostnameClean.endsWith(`.${rootDomainClean}`);
//
//         if (isSubdomain) {
//             const subdomain = hostnameClean.replace(`.${rootDomainClean}`, "");
//             // Rewrite internally — URL the user sees does NOT change
//             url.pathname = `/_tenants/subdomain/${subdomain}${pathname}`;
//             return NextResponse.rewrite(url);
//         }
//
//         if (isCustomDomain) {
//             // Pass the custom domain to the tenant resolver
//             url.pathname = `/_tenants/custom/${hostnameClean}${pathname}`;
//             return NextResponse.rewrite(url);
//         }
//
//         // ── 2. Dashboard RBAC ─────────────────────────────────────────────────
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
//         // ── 3. API route protection ───────────────────────────────────────────
//         // Super admin only APIs
//         if (pathname.startsWith("/api/super-admin")) {
//             if (!token || role !== "super_admin") {
//                 return NextResponse.json(
//                     {success: false, error: "Forbidden"},
//                     {status: 403}
//                 );
//             }
//         }
//
//         // Admin + super admin APIs
//         if (pathname.startsWith("/api/admin")) {
//             if (!token) {
//                 return NextResponse.json(
//                     {success: false, error: "Unauthorized"},
//                     {status: 401}
//                 );
//             }
//             if (role !== "super_admin" && role !== "product_admin") {
//                 return NextResponse.json(
//                     {success: false, error: "Forbidden"},
//                     {status: 403}
//                 );
//             }
//         }
//
//         // Authenticated user APIs — need any valid session
//         const protectedApiPaths = [
//             "/api/ai",
//             "/api/blog",
//             "/api/media",
//             "/api/team",
//             "/api/analytics",
//             "/api/seo",
//             "/api/cms",
//             "/api/subscriptions",
//             "/api/users",
//             "/api/domains",
//         ];
//
//         const isProtectedApi = protectedApiPaths.some((p) => pathname.startsWith(p));
//         if (isProtectedApi && !token) {
//             return NextResponse.json(
//                 {success: false, error: "Unauthorized"},
//                 {status: 401}
//             );
//         }
//
//         // ── 4. Security headers on every response ─────────────────────────────
//         const response = NextResponse.next();
//         response.headers.set("X-Content-Type-Options", "nosniff");
//         response.headers.set("X-Frame-Options", "SAMEORIGIN");
//         response.headers.set("X-XSS-Protection", "1; mode=block");
//         response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
//         response.headers.set(
//             "Permissions-Policy",
//             "camera=(), microphone=(), geolocation=()"
//         );
//         // Prevent caching of authenticated pages
//         if (pathname.startsWith("/dashboard")) {
//             response.headers.set(
//                 "Cache-Control",
//                 "no-store, no-cache, must-revalidate, proxy-revalidate"
//             );
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
//
//                 // Subdomain and custom domain requests are always public
//                 const isSubdomain =
//                     hostnameClean !== rootDomainClean &&
//                     hostnameClean !== `www.${rootDomainClean}` &&
//                     hostnameClean.endsWith(`.${rootDomainClean}`);
//
//                 const isCustomDomain =
//                     !isSubdomain &&
//                     hostnameClean !== rootDomainClean &&
//                     hostnameClean !== `www.${rootDomainClean}`;
//
//                 if (isSubdomain || isCustomDomain) return true;
//
//                 // Public paths — no auth needed
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
//                     pathname.startsWith("/_tenants") ||
//                     pathname.startsWith("/favicon") ||
//                     pathname.startsWith("/sitemap") ||
//                     pathname.startsWith("/robots")
//                 ) {
//                     return true;
//                 }
//
//                 // All other routes require a valid session
//                 return !!token;
//             },
//         },
//     }
// );
//
// export const config = {
//     matcher: [
//         // Match everything except Next.js internals and static files
//         "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
//     ],
// };


// import { withAuth } from "next-auth/middleware";
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
//
// export default withAuth(
//   function middleware(req: NextRequest & { nextauth: { token: { role?: string; plan?: string } | null } }) {
//     const { pathname } = req.nextUrl;
//     const token = req.nextauth.token;
//     const role = token?.role;
//
//     // ─── Super Admin routes ───────────────────────────────────────────────────
//     if (pathname.startsWith("/dashboard/super-admin")) {
//       if (role !== "super_admin") {
//         return NextResponse.redirect(new URL("/dashboard/admin", req.url));
//       }
//     }
//
//     // ─── Product Admin / Admin routes ─────────────────────────────────────────
//     if (pathname.startsWith("/dashboard/admin")) {
//       if (role === "user") {
//         return NextResponse.redirect(new URL("/dashboard/user", req.url));
//       }
//     }
//
//     // ─── API route protection ─────────────────────────────────────────────────
//     if (pathname.startsWith("/api/admin")) {
//       if (!token) {
//         return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//       }
//       if (role !== "super_admin" && role !== "product_admin") {
//         return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
//       }
//     }
//
//     if (pathname.startsWith("/api/super-admin")) {
//       if (role !== "super_admin") {
//         return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
//       }
//     }
//
//     // ─── Security headers ─────────────────────────────────────────────────────
//     const response = NextResponse.next();
//     response.headers.set("X-Content-Type-Options", "nosniff");
//     response.headers.set("X-Frame-Options", "DENY");
//     response.headers.set("X-XSS-Protection", "1; mode=block");
//     response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
//     response.headers.set(
//       "Permissions-Policy",
//       "camera=(), microphone=(), geolocation=()"
//     );
//     return response;
//   },
//   {
//     callbacks: {
//       authorized({ token, req }) {
//         const { pathname } = req.nextUrl;
//         // Public paths — no token needed
//         if (
//           pathname.startsWith("/login") ||
//           pathname.startsWith("/register") ||
//           pathname.startsWith("/api/auth") ||
//           pathname.startsWith("/api/webhooks") ||
//           pathname.startsWith("/api/public") ||
//           pathname === "/" ||
//           pathname.startsWith("/blog") ||
//           pathname.startsWith("/pricing") ||
//           pathname.startsWith("/features") ||
//           pathname.startsWith("/about") ||
//           pathname.startsWith("/contact") ||
//           pathname.startsWith("/demo") ||
//           pathname.startsWith("/_next") ||
//           pathname.startsWith("/favicon")
//         ) {
//           return true;
//         }
//         // Everything else needs a token
//         return !!token;
//       },
//     },
//   }
// );
//
// export const config = {
//   matcher: [
//     "/dashboard/:path*",
//     "/api/ai/:path*",
//     "/api/blog/:path*",
//     "/api/users/:path*",
//     "/api/plans/:path*",
//     "/api/subscriptions/:path*",
//     "/api/analytics/:path*",
//     "/api/seo/:path*",
//     "/api/cms/:path*",
//     "/api/media/:path*",
//     "/api/admin/:path*",
//     "/api/super-admin/:path*",
//   ],
// };
