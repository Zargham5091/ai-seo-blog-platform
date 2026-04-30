// app/api/team/permissions/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {getTenantContext, canManageTeam} from "@/lib/tenant";

// PATCH /api/team/permissions — set allowed pages for a team member
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        if (!canManageTeam(tenant.role)) {
            return NextResponse.json({
                success: false,
                error: "Only team admins can manage permissions."
            }, {status: 403});
        }

        const {memberId, allowedPages} = await req.json() as {
            memberId: string;
            allowedPages: string[]; // empty array = all pages allowed
        };

        if (!memberId) {
            return NextResponse.json({success: false, error: "memberId required"}, {status: 400});
        }

        await UserModel.findOneAndUpdate(
            {_id: tenant.tenantId, "teamMembers.userId": memberId},
            {$set: {"teamMembers.$.allowedPages": allowedPages ?? []}}
        );

        return NextResponse.json({success: true, message: "Permissions updated"});
    } catch (error) {
        console.error("[TEAM_PERMISSIONS]", error);
        return NextResponse.json({success: false, error: "Failed to update permissions"}, {status: 500});
    }
}

// GET /api/team/permissions?memberId=xxx — get allowed pages for a member
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);
        const {searchParams} = new URL(req.url);
        const memberId = searchParams.get("memberId");

        if (!memberId) return NextResponse.json({success: false, error: "memberId required"}, {status: 400});

        const owner = await UserModel.findById(tenant.tenantId).lean() as {
            teamMembers: { userId: { toString(): string }; allowedPages: string[] }[]
        } | null;

        const member = owner?.teamMembers.find((m) => m.userId.toString() === memberId);
        return NextResponse.json({success: true, data: {allowedPages: member?.allowedPages ?? []}});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}