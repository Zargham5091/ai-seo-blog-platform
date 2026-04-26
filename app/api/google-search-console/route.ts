import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";

const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";

async function getGSCToken(userId: string): Promise<string | null> {
    await connectDB();
    const user = await UserModel.findById(userId).select("gscAccessToken gscRefreshToken").lean() as Record<string, string> | null;
    return user?.gscAccessToken ?? null;
}

// ── GET /api/google-search-console?action=sites|queries|pages|status ─────────
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {searchParams} = new URL(req.url);
        const action = searchParams.get("action") ?? "status";
        const token = await getGSCToken(session.user.id);

        if (action === "status") {
            return NextResponse.json({success: true, data: {connected: !!token}});
        }

        if (!token) {
            return NextResponse.json({
                success: false,
                error: "Google Search Console not connected. Connect in Settings.",
            }, {status: 401});
        }

        // List verified sites
        if (action === "sites") {
            const res = await fetch(`${GSC_API}/sites`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            const data = await res.json() as { siteEntry?: unknown[] };
            return NextResponse.json({success: true, data: data.siteEntry ?? []});
        }

        const siteUrl = searchParams.get("siteUrl");
        if (!siteUrl) {
            return NextResponse.json({success: false, error: "siteUrl required"}, {status: 400});
        }

        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Top queries
        if (action === "queries") {
            const res = await fetch(
                `${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
                {
                    method: "POST",
                    headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
                    body: JSON.stringify({
                        startDate, endDate,
                        dimensions: ["query"],
                        rowLimit: 25,
                        orderBy: [{fieldName: "clicks", sortOrder: "DESCENDING"}],
                    }),
                }
            );
            const data = await res.json() as { rows?: unknown[] };
            return NextResponse.json({success: true, data: data.rows ?? []});
        }

        // Top pages
        if (action === "pages") {
            const res = await fetch(
                `${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
                {
                    method: "POST",
                    headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
                    body: JSON.stringify({
                        startDate, endDate,
                        dimensions: ["page"],
                        rowLimit: 25,
                        orderBy: [{fieldName: "clicks", sortOrder: "DESCENDING"}],
                    }),
                }
            );
            const data = await res.json() as { rows?: unknown[] };
            return NextResponse.json({success: true, data: data.rows ?? []});
        }

        return NextResponse.json({success: false, error: "Invalid action"}, {status: 400});
    } catch (error) {
        console.error("[GSC_GET]", error);
        return NextResponse.json({success: false, error: "GSC request failed"}, {status: 500});
    }
}

// ── POST /api/google-search-console — save preferred site URL ────────────────
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const {siteUrl} = await req.json() as { siteUrl: string };
        await UserModel.findByIdAndUpdate(session.user.id, {$set: {gscSiteUrl: siteUrl}});

        return NextResponse.json({success: true, message: "GSC site URL saved"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// ── DELETE /api/google-search-console — disconnect GSC ──────────────────────
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        await UserModel.findByIdAndUpdate(session.user.id, {
            $unset: {gscAccessToken: "", gscRefreshToken: "", gscConnectedAt: "", gscSiteUrl: ""},
        });

        return NextResponse.json({success: true, message: "Google Search Console disconnected"});
    } catch (error) {
        console.error("[GSC_DELETE]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import UserModel from "@/models/User";
//
// // NOTE: Full GSC integration requires Google OAuth scope "https://www.googleapis.com/auth/webmasters.readonly"
// // This API provides the endpoints to connect, fetch data, and disconnect GSC.
// // The OAuth flow is handled by NextAuth — add the scope in lib/auth.ts
//
// const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";
//
// async function getGSCToken(userId: string): Promise<string | null> {
//     await connectDB();
//     const user = await UserModel.findById(userId).select("gscAccessToken gscRefreshToken").lean() as Record<string, string> | null;
//     return user?.gscAccessToken ?? null;
// }
//
// // GET /api/google-search-console?action=sites|queries|pages|status
// export async function GET(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         const {searchParams} = new URL(req.url);
//         const action = searchParams.get("action") ?? "status";
//
//         const token = await getGSCToken(session.user.id);
//
//         if (action === "status") {
//             return NextResponse.json({success: true, data: {connected: !!token}});
//         }
//
//         if (!token) {
//             return NextResponse.json({
//                 success: false,
//                 error: "Google Search Console not connected. Connect in Settings.",
//             }, {status: 401});
//         }
//
//         // List verified sites
//         if (action === "sites") {
//             const res = await fetch(`${GSC_API}/sites`, {
//                 headers: {Authorization: `Bearer ${token}`},
//             });
//             const data = await res.json() as { siteEntry?: unknown[] };
//             return NextResponse.json({success: true, data: data.siteEntry ?? []});
//         }
//
//         const siteUrl = searchParams.get("siteUrl");
//         if (!siteUrl) {
//             return NextResponse.json({success: false, error: "siteUrl required"}, {status: 400});
//         }
//
//         const endDate = new Date().toISOString().split("T")[0];
//         const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
//
//         // Top queries
//         if (action === "queries") {
//             const res = await fetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
//                 method: "POST",
//                 headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
//                 body: JSON.stringify({
//                     startDate, endDate,
//                     dimensions: ["query"],
//                     rowLimit: 25,
//                     orderBy: [{fieldName: "clicks", sortOrder: "DESCENDING"}],
//                 }),
//             });
//             const data = await res.json() as { rows?: unknown[] };
//             return NextResponse.json({success: true, data: data.rows ?? []});
//         }
//
//         // Top pages
//         if (action === "pages") {
//             const res = await fetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
//                 method: "POST",
//                 headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
//                 body: JSON.stringify({
//                     startDate, endDate,
//                     dimensions: ["page"],
//                     rowLimit: 25,
//                     orderBy: [{fieldName: "clicks", sortOrder: "DESCENDING"}],
//                 }),
//             });
//             const data = await res.json() as { rows?: unknown[] };
//             return NextResponse.json({success: true, data: data.rows ?? []});
//         }
//
//         return NextResponse.json({success: false, error: "Invalid action"}, {status: 400});
//     } catch (error) {
//         console.error("[GSC]", error);
//         return NextResponse.json({success: false, error: "GSC request failed"}, {status: 500});
//     }
// }
//
// // POST /api/google-search-console — save GSC site URL preference
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         await connectDB();
//         const {siteUrl} = await req.json() as { siteUrl: string };
//
//         await UserModel.findByIdAndUpdate(session.user.id, {
//             $set: {gscSiteUrl: siteUrl},
//         });
//
//         return NextResponse.json({success: true, message: "GSC site URL saved"});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
