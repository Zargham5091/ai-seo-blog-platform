import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import {ReferralModel} from "@/models/Referral";
import UserModel, {IUserDocument} from "@/models/User";
import crypto from "crypto";

function generateCode(name: string): string {
    const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6);
    const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `${base}${suffix}`;
}

// GET /api/referral — user's own stats OR super admin overview
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const {searchParams} = new URL(req.url);
        const isAdminView = searchParams.get("admin") === "true" && session.user.role === "super_admin";

        if (isAdminView) {
            // Super admin: aggregate referral stats per user
            const agg = await ReferralModel.aggregate([
                {$match: {referredId: {$exists: true}}},
                {
                    $group: {
                        _id: "$referrerId",
                        totalReferrals: {$sum: 1},
                        convertedReferrals: {$sum: {$cond: [{$ne: ["$status", "pending"]}, 1, 0]}},
                        pendingAmount: {$sum: {$cond: [{$eq: ["$status", "converted"]}, "$commissionAmount", 0]}},
                        totalEarned: {$sum: "$commissionAmount"},
                    },
                },
                {$match: {totalReferrals: {$gt: 0}}},
                {$sort: {pendingAmount: -1}},
            ]);

            // Populate user details
            const userIds = agg.map((a) => a._id);
            const users = await UserModel.find({_id: {$in: userIds}})
                .select("name email")
                .lean<IUserDocument[]>();

            const userMap = new Map(users.map((u) => [u._id.toString(), u]));

            const data = agg.map((a) => ({
                _id: a._id.toString(),
                ...userMap.get(a._id.toString()),
                totalReferrals: a.totalReferrals,
                convertedReferrals: a.convertedReferrals,
                pendingAmount: a.pendingAmount,
                totalEarned: a.totalEarned,
            }));

            return NextResponse.json({success: true, data});
        }

        // Regular user: own referral data
        const referrals = await ReferralModel.find({referrerId: session.user.id})
            .populate("referredId", "name email plan createdAt")
            .sort({createdAt: -1})
            .lean();

        const stats = {
            totalReferrals: referrals.filter((r) => r.referredId).length,
            converted: referrals.filter((r) => r.status !== "pending").length,
            totalEarned: referrals.reduce((s, r) => s + (r.commissionAmount ?? 0), 0),
            pendingPayout: referrals.filter((r) => r.status === "converted").reduce((s, r) => s + (r.commissionAmount ?? 0), 0),
        };

        return NextResponse.json({success: true, data: {referrals, stats}});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/referral — generate a referral code for the current user
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();

        // Return existing template code if one already exists
        const existing = await ReferralModel.findOne({
            referrerId: session.user.id,
            referredId: {$exists: false},
        }).lean();

        if (existing) {
            return NextResponse.json({success: true, data: {code: existing.code}});
        }

        // Generate a unique code
        let code = generateCode(session.user.name ?? "USER");
        let attempts = 0;
        while ((await ReferralModel.findOne({code})) && attempts < 10) {
            code = generateCode(session.user.name ?? "USER");
            attempts++;
        }

        const referral = await ReferralModel.create({
            referrerId: session.user.id,
            code,
            commissionPercent: 20,
            status: "pending",
        });

        return NextResponse.json({success: true, data: {code: referral.code}}, {status: 201});
    } catch (error) {
        console.error("[REFERRAL_CREATE]", error);
        return NextResponse.json({success: false, error: "Failed to create referral code"}, {status: 500});
    }
}


// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import {ReferralModel} from "@/models/Referral";
// import crypto from "crypto";
//
// function generateCode(name: string): string {
//     const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6);
//     const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
//     return `${base}${suffix}`;
// }
//
// // GET /api/referral — get user's referral stats and code
// export async function GET() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         await connectDB();
//
//         const referrals = await ReferralModel.find({referrerId: session.user.id})
//             .populate("referredId", "name email plan createdAt")
//             .sort({createdAt: -1})
//             .lean();
//
//         const stats = {
//             totalReferrals: referrals.length,
//             converted: referrals.filter((r) => r.status !== "pending").length,
//             totalEarned: referrals.reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0),
//             pendingPayout: referrals
//                 .filter((r) => r.status === "converted")
//                 .reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0),
//         };
//
//         return NextResponse.json({success: true, data: {referrals, stats}});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // POST /api/referral — generate a referral code for the user
// export async function POST() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         await connectDB();
//
//         // Check if user already has a code (any referral they created)
//         const existing = await ReferralModel.findOne({
//             referrerId: session.user.id,
//             referredId: {$exists: false}, // template code, not tied to a specific person
//         }).lean();
//
//         if (existing) {
//             return NextResponse.json({success: true, data: {code: existing.code}});
//         }
//
//         // Generate new unique code
//         let code = generateCode(session.user.name ?? "USER");
//         let attempts = 0;
//         while (await ReferralModel.findOne({code}) && attempts < 10) {
//             code = generateCode(session.user.name ?? "USER");
//             attempts++;
//         }
//
//         const referral = await ReferralModel.create({
//             referrerId: session.user.id,
//             code,
//             commissionPercent: 20,
//             status: "pending",
//         });
//
//         return NextResponse.json({success: true, data: {code: referral.code}}, {status: 201});
//     } catch (error) {
//         console.error("[REFERRAL_CREATE]", error);
//         return NextResponse.json({success: false, error: "Failed to create referral code"}, {status: 500});
//     }
// }
//
// // import {NextRequest, NextResponse} from "next/server";
// // import {getServerSession} from "next-auth";
// // import {authOptions} from "@/lib/auth";
// // import {connectDB} from "@/lib/db";
// // import {ReferralModel} from "@/models/Referral";
// // import crypto from "crypto";
// //
// // function generateCode(name: string): string {
// //     const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6);
// //     const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
// //     return `${base}${suffix}`;
// // }
// //
// // // GET /api/referral — get user's referral stats and code
// // export async function GET() {
// //     try {
// //         const session = await getServerSession(authOptions);
// //         if (!session) {
// //             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
// //         }
// //
// //         await connectDB();
// //
// //         const referrals = await ReferralModel.find({referrerId: session.user.id})
// //             .populate("referredId", "name email plan createdAt")
// //             .sort({createdAt: -1})
// //             .lean();
// //
// //         const stats = {
// //             totalReferrals: referrals.length,
// //             converted: referrals.filter((r) => r.status !== "pending").length,
// //             totalEarned: referrals.reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0),
// //             pendingPayout: referrals
// //                 .filter((r) => r.status === "converted")
// //                 .reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0),
// //         };
// //
// //         return NextResponse.json({success: true, data: {referrals, stats}});
// //     } catch {
// //         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
// //     }
// // }
// //
// // // POST /api/referral — generate a referral code for the user
// // export async function POST() {
// //     try {
// //         const session = await getServerSession(authOptions);
// //         if (!session) {
// //             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
// //         }
// //
// //         await connectDB();
// //
// //         // Check if user already has a code (any referral they created)
// //         const existing = await ReferralModel.findOne({
// //             referrerId: session.user.id,
// //             referredId: {$exists: false}, // template code, not tied to a specific person
// //         }).lean();
// //
// //         if (existing) {
// //             return NextResponse.json({success: true, data: {code: existing.code}});
// //         }
// //
// //         // Generate new unique code
// //         let code = generateCode(session.user.name ?? "USER");
// //         let attempts = 0;
// //         while (await ReferralModel.findOne({code}) && attempts < 10) {
// //             code = generateCode(session.user.name ?? "USER");
// //             attempts++;
// //         }
// //
// //         const referral = await ReferralModel.create({
// //             referrerId: session.user.id,
// //             code,
// //             commissionPercent: 20,
// //             status: "pending",
// //         });
// //
// //         return NextResponse.json({success: true, data: {code: referral.code}}, {status: 201});
// //     } catch (error) {
// //         console.error("[REFERRAL_CREATE]", error);
// //         return NextResponse.json({success: false, error: "Failed to create referral code"}, {status: 500});
// //     }
// // }