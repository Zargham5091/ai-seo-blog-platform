// app/api/site/domain/verify/route.ts

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import dns from "dns/promises";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "yourdomain.com";

export async function POST(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();

        const site = await UserSiteModel.findOne({userId: session.user.id})
            .select("customDomain customDomainVerified").lean();

        if (!site?.customDomain) {
            return NextResponse.json({success: false, error: "No custom domain set"}, {status: 400});
        }

        const rootWithoutPort = ROOT_DOMAIN.replace(/:\d+$/, "");
        let verified = false;
        let dnsError = "";

        try {
            // Try CNAME first
            const records = await dns.resolveCname(site.customDomain);
            verified = records.some((r) => r.endsWith(rootWithoutPort) || r === rootWithoutPort);
            if (!verified) dnsError = `CNAME points to "${records[0]}" — expected "${rootWithoutPort}"`;
        } catch {
            // Try A record for apex domains
            try {
                const serverIp = process.env.SERVER_IP;
                if (serverIp) {
                    const aRecords = await dns.resolve4(site.customDomain);
                    verified = aRecords.includes(serverIp);
                    if (!verified) dnsError = `A record "${aRecords[0]}" doesn't match server IP`;
                } else {
                    dnsError = "CNAME not found. DNS changes can take up to 48 hours.";
                }
            } catch {
                dnsError = "DNS lookup failed. Changes can take up to 48 hours to propagate.";
            }
        }

        if (verified) {
            await UserSiteModel.findOneAndUpdate(
                {userId: session.user.id},
                {$set: {customDomainVerified: true, customDomainVerifiedAt: new Date()}}
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                verified,
                domain: site.customDomain,
                error: verified ? null : dnsError,
            },
        });
    } catch (err) {
        console.error("[VERIFY_DOMAIN]", err);
        return NextResponse.json({success: false, error: "Verification failed"}, {status: 500});
    }
}