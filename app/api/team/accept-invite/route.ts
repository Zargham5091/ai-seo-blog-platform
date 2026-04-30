import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {logActivity, ACTIONS, parseRequestMeta} from "@/lib/activity";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({
                success: false,
                error: "You must be logged in to accept an invitation"
            }, {status: 401});
        }

        const {token} = await req.json();
        if (!token) {
            return NextResponse.json({success: false, error: "Invalid invite token"}, {status: 400});
        }

        await connectDB();

        const owner = await UserModel.findOne({"pendingInvites.token": token});
        if (!owner) {
            return NextResponse.json({success: false, error: "Invitation not found or already used"}, {status: 404});
        }

        const invite = owner.pendingInvites?.find((i) => i.token === token);
        if (!invite) {
            return NextResponse.json({success: false, error: "Invitation not found"}, {status: 404});
        }

        if (new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json({
                success: false,
                error: "This invitation has expired. Ask the team owner to resend it.",
            }, {status: 410});
        }

        if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
            return NextResponse.json({
                success: false,
                error: `This invitation was sent to ${invite.email}. Please sign in with that email address.`,
            }, {status: 403});
        }

        const alreadyMember = owner.teamMembers?.some(
            (m) => m.userId.toString() === session.user.id
        );
        if (alreadyMember) {
            return NextResponse.json({success: false, error: "You are already a member of this team"}, {status: 409});
        }

        await UserModel.findByIdAndUpdate(owner._id, {
            $push: {teamMembers: {userId: session.user.id, role: invite.role, joinedAt: new Date()}},
            $pull: {pendingInvites: {token}},
        });

        // Log for both the new member and the owner's feed
        const {ip, userAgent, device} = parseRequestMeta(req);
        logActivity({
            userId: session.user.id,
            tenantId: owner._id.toString(),
            action: ACTIONS.TEAM_MEMBER_JOINED,
            category: "team",
            metadata: {memberEmail: session.user.email, role: invite.role, device},
            ip,
            userAgent,
        }).catch(console.error);

        return NextResponse.json({
            success: true,
            message: "You have joined the team!",
            data: {ownerName: owner.name, role: invite.role},
        });
    } catch (error) {
        console.error("[ACCEPT_INVITE]", error);
        return NextResponse.json({success: false, error: "Failed to accept invitation"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import UserModel, {IUserDocument} from "@/models/User";
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({
//                 success: false,
//                 error: "You must be logged in to accept-invite an invitation"
//             }, {status: 401});
//         }
//
//         const {token} = await req.json();
//         if (!token) {
//             return NextResponse.json({success: false, error: "Invalid invite token"}, {status: 400});
//         }
//
//         await connectDB();
//
//         // Find the owner who sent this invite
//         const owner = await UserModel.findOne({
//             "pendingInvites.token": token,
//         }).lean<IUserDocument>();
//
//         if (!owner) {
//             return NextResponse.json({success: false, error: "Invitation not found or already used"}, {status: 404});
//         }
//
//         // Find the specific invite
//         const invite = (owner.pendingInvites as { email: string; role: string; token: string; expiresAt: Date }[])
//             .find((i) => i.token === token);
//
//         if (!invite) {
//             return NextResponse.json({success: false, error: "Invitation not found"}, {status: 404});
//         }
//
//         // Check expiry
//         if (new Date(invite.expiresAt) < new Date()) {
//             return NextResponse.json({
//                 success: false,
//                 error: "This invitation has expired. Ask the team owner to resend it."
//             }, {status: 410});
//         }
//
//         // Check email matches logged-in user
//         if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
//             return NextResponse.json({
//                 success: false,
//                 error: `This invitation was sent to ${invite.email}. Please sign in with that email address.`,
//             }, {status: 403});
//         }
//
//         // Check not already a member
//         const alreadyMember = owner.teamMembers
//             ?.some((m) => m.userId.toString() === session.user.id);
//
//         if (alreadyMember) {
//             return NextResponse.json({success: false, error: "You are already a member of this team"}, {status: 409});
//         }
//
//         // Add to team + remove pending invite
//         await UserModel.findByIdAndUpdate(owner._id, {
//             $push: {teamMembers: {userId: session.user.id, role: invite.role, joinedAt: new Date()}},
//             $pull: {pendingInvites: {token}},
//         });
//
//         return NextResponse.json({
//             success: true,
//             message: "You have joined the team!",
//             data: {ownerName: owner.name, role: invite.role},
//         });
//     } catch (error) {
//         console.error("[ACCEPT_INVITE]", error);
//         return NextResponse.json({success: false, error: "Failed to accept-invite invitation"}, {status: 500});
//     }
// }