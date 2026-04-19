import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import TenantDomainModel from "@/models/TenantDomain";
import dns from "dns/promises";

// POST /api/domains/verify — check if DNS TXT record matches
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const record = await TenantDomainModel.findOne({userId: session.user.id});

        if (!record?.customDomain) {
            return NextResponse.json(
                {success: false, error: "No custom domain configured"},
                {status: 400}
            );
        }

        if (!record.customDomainVerifyToken) {
            return NextResponse.json(
                {success: false, error: "No verification token found. Save your domain settings first."},
                {status: 400}
            );
        }

        // Look up TXT records for the domain
        let txtRecords: string[][] = [];
        try {
            txtRecords = await dns.resolveTxt(record.customDomain);
        } catch {
            return NextResponse.json({
                success: false,
                error: "Could not look up DNS records. Make sure the TXT record has been added and DNS has propagated (can take up to 24 hours).",
            }, {status: 400});
        }

        const allTxt = txtRecords.flat();
        const isVerified = allTxt.some((t) => t === record.customDomainVerifyToken);

        if (!isVerified) {
            return NextResponse.json({
                success: false,
                error: `TXT record not found yet. Add this exact value to your domain's DNS:\n\nName: @\nType: TXT\nValue: ${record.customDomainVerifyToken}\n\nDNS changes can take up to 24 hours to propagate.`,
            }, {status: 400});
        }

        // Mark as verified
        await TenantDomainModel.findByIdAndUpdate(record._id, {
            customDomainVerified: true,
        });

        return NextResponse.json({
            success: true,
            message: "Domain verified successfully! Your blog is now live at " + record.customDomain,
        });
    } catch (error) {
        console.error("[DOMAIN_VERIFY]", error);
        return NextResponse.json({success: false, error: "Verification failed"}, {status: 500});
    }
}
