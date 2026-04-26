import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import BlogModel from "@/models/Blog";
import TenantDomainModel from "@/models/TenantDomain";
import {ReferralModel} from "@/models/Referral";
import {AlertModel, AlertSettingModel} from "@/models/Alert";

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        // Super admin cannot self-delete
        if (session.user.role === "super_admin") {
            return NextResponse.json(
                {success: false, error: "Super admin accounts cannot be deleted this way"},
                {status: 403}
            );
        }

        await connectDB();
        const userId = session.user.id;

        // Delete all user data in parallel
        await Promise.all([
            UserModel.findByIdAndDelete(userId),
            BlogModel.deleteMany({tenantId: userId}),
            TenantDomainModel.findOneAndDelete({userId}),
            ReferralModel.deleteMany({referrerId: userId}),
            AlertModel.deleteMany({userId}),
            AlertSettingModel.findOneAndDelete({userId}),
        ]);

        return NextResponse.json({success: true, message: "Account deleted"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
