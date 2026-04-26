import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import {AlertModel, AlertSettingModel} from "@/models/Alert";
import type {AlertType, AlertChannel} from "@/models/Alert";

// GET /api/alerts — get user's alerts
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const {searchParams} = new URL(req.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const limit = parseInt(searchParams.get("limit") ?? "20");

        const query: Record<string, unknown> = {userId: session.user.id};
        if (unreadOnly) query.isRead = false;

        const [alerts, unreadCount, settings] = await Promise.all([
            AlertModel.find(query).sort({createdAt: -1}).limit(limit).lean(),
            AlertModel.countDocuments({userId: session.user.id, isRead: false}),
            AlertSettingModel.findOne({userId: session.user.id}).lean(),
        ]);

        return NextResponse.json({success: true, data: {alerts, unreadCount, settings}});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// PUT /api/alerts — mark alerts as read or update settings
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const body = await req.json();

        if (body.action === "mark_all_read") {
            await AlertModel.updateMany({userId: session.user.id, isRead: false}, {$set: {isRead: true}});
            return NextResponse.json({success: true, message: "All alerts marked as read"});
        }

        if (body.action === "mark_read" && body.id) {
            await AlertModel.findOneAndUpdate(
                {_id: body.id, userId: session.user.id},
                {$set: {isRead: true}}
            );
            return NextResponse.json({success: true});
        }

        if (body.action === "update_settings") {
            const settings = await AlertSettingModel.findOneAndUpdate(
                {userId: session.user.id},
                {
                    $set: {
                        enabledAlerts: body.enabledAlerts as AlertType[],
                        channel: body.channel as AlertChannel,
                        emailAddress: body.emailAddress,
                        rankDropThreshold: body.rankDropThreshold ?? 5,
                        creditThreshold: body.creditThreshold ?? 20,
                    },
                },
                {new: true, upsert: true}
            );
            return NextResponse.json({success: true, data: settings});
        }

        return NextResponse.json({success: false, error: "Invalid action"}, {status: 400});
    } catch (error) {
        console.error("[ALERTS_PUT]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// Utility function - called internally to create alerts
export async function createAlert(
    userId: string,
    type: AlertType,
    title: string,
    message: string,
    data?: Record<string, unknown>
): Promise<void> {
    try {
        await connectDB();

        const settings = await AlertSettingModel.findOne({userId}).lean();
        if (settings && !settings.enabledAlerts.includes(type)) return;

        await AlertModel.create({userId, type, title, message, data});
    } catch (error) {
        console.error("[CREATE_ALERT]", error);
    }
}


// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import {AlertModel, AlertSettingModel} from "@/models/Alert";
// import type {AlertType, AlertChannel} from "@/models/Alert";
//
// // GET /api/alerts — get user's alerts
// export async function GET(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         await connectDB();
//         const {searchParams} = new URL(req.url);
//         const unreadOnly = searchParams.get("unread") === "true";
//         const limit = parseInt(searchParams.get("limit") ?? "20");
//
//         const query: Record<string, unknown> = {userId: session.user.id};
//         if (unreadOnly) query.isRead = false;
//
//         const [alerts, unreadCount, settings] = await Promise.all([
//             AlertModel.find(query).sort({createdAt: -1}).limit(limit).lean(),
//             AlertModel.countDocuments({userId: session.user.id, isRead: false}),
//             AlertSettingModel.findOne({userId: session.user.id}).lean(),
//         ]);
//
//         return NextResponse.json({success: true, data: {alerts, unreadCount, settings}});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // PUT /api/alerts — mark alerts as read or update settings
// export async function PUT(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         await connectDB();
//         const body = await req.json();
//
//         if (body.action === "mark_all_read") {
//             await AlertModel.updateMany({userId: session.user.id, isRead: false}, {$set: {isRead: true}});
//             return NextResponse.json({success: true, message: "All alerts marked as read"});
//         }
//
//         if (body.action === "mark_read" && body.id) {
//             await AlertModel.findOneAndUpdate(
//                 {_id: body.id, userId: session.user.id},
//                 {$set: {isRead: true}}
//             );
//             return NextResponse.json({success: true});
//         }
//
//         if (body.action === "update_settings") {
//             const settings = await AlertSettingModel.findOneAndUpdate(
//                 {userId: session.user.id},
//                 {
//                     $set: {
//                         enabledAlerts: body.enabledAlerts as AlertType[],
//                         channel: body.channel as AlertChannel,
//                         emailAddress: body.emailAddress,
//                         rankDropThreshold: body.rankDropThreshold ?? 5,
//                         creditThreshold: body.creditThreshold ?? 20,
//                     },
//                 },
//                 {new: true, upsert: true}
//             );
//             return NextResponse.json({success: true, data: settings});
//         }
//
//         return NextResponse.json({success: false, error: "Invalid action"}, {status: 400});
//     } catch (error) {
//         console.error("[ALERTS_PUT]", error);
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // Utility function - called internally to create alerts
// export async function createAlert(
//     userId: string,
//     type: AlertType,
//     title: string,
//     message: string,
//     data?: Record<string, unknown>
// ): Promise<void> {
//     try {
//         await connectDB();
//
//         const settings = await AlertSettingModel.findOne({userId}).lean();
//         if (settings && !settings.enabledAlerts.includes(type)) return;
//
//         await AlertModel.create({userId, type, title, message, data});
//     } catch (error) {
//         console.error("[CREATE_ALERT]", error);
//     }
// }