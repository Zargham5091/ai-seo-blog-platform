// app/api/site/domain/route.ts

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import UserSiteModel from "@/models/UserSite";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "yourdomain.com";

const RESERVED = [
    "www", "api", "app", "admin", "mail", "blog", "shop", "dev",
    "staging", "test", "demo", "help", "support", "status", "cdn",
    "static", "assets", "auth", "login", "register", "dashboard", "billing",
];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();

        const [user, site] = await Promise.all([
            UserModel.findById(session.user.id).select("siteSubdomain").lean(),
            UserSiteModel.findOne({userId: session.user.id})
                .select("customDomain customDomainVerified isPublished lastBuiltAt").lean(),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                subdomain: user?.siteSubdomain ?? null,
                subdomainUrl: user?.siteSubdomain ? `https://${user.siteSubdomain}.${ROOT_DOMAIN}` : null,
                customDomain: site?.customDomain ?? null,
                customDomainVerified: site?.customDomainVerified ?? false,
                isPublished: site?.isPublished ?? false,
                lastBuiltAt: site?.lastBuiltAt ?? null,
                rootDomain: ROOT_DOMAIN,
            },
        });
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {subdomain} = await req.json();

        if (!subdomain || !/^[a-z0-9-]{2,40}$/.test(subdomain)) {
            return NextResponse.json({
                success: false,
                error: "2-40 chars, lowercase letters, numbers and hyphens only",
            }, {status: 400});
        }

        if (RESERVED.includes(subdomain)) {
            return NextResponse.json({success: false, error: `"${subdomain}" is reserved`}, {status: 400});
        }

        await connectDB();

        const existing = await UserModel.findOne({
            siteSubdomain: subdomain,
            _id: {$ne: session.user.id},
        }).lean();

        if (existing) {
            return NextResponse.json({success: false, error: "Subdomain already taken"}, {status: 409});
        }

        await UserModel.findByIdAndUpdate(session.user.id, {$set: {siteSubdomain: subdomain}});

        return NextResponse.json({
            success: true,
            data: {subdomain, url: `https://${subdomain}.${ROOT_DOMAIN}`},
        });
    } catch (err) {
        console.error("[SET_SUBDOMAIN]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {customDomain} = await req.json();
        await connectDB();

        if (!customDomain) {
            await UserSiteModel.findOneAndUpdate(
                {userId: session.user.id},
                {$unset: {customDomain: 1}, $set: {customDomainVerified: false}}
            );
            return NextResponse.json({success: true, data: {customDomain: null}});
        }

        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
        if (!domainRegex.test(customDomain.toLowerCase())) {
            return NextResponse.json({success: false, error: "Invalid domain format"}, {status: 400});
        }

        const existing = await UserSiteModel.findOne({
            customDomain: customDomain.toLowerCase(),
            userId: {$ne: session.user.id},
        }).lean();

        if (existing) {
            return NextResponse.json({
                success: false,
                error: "Domain already connected to another site"
            }, {status: 409});
        }

        await UserSiteModel.findOneAndUpdate(
            {userId: session.user.id},
            {$set: {customDomain: customDomain.toLowerCase(), customDomainVerified: false}}
        );

        return NextResponse.json({
            success: true,
            data: {
                customDomain: customDomain.toLowerCase(),
                verified: false,
                dnsInstructions: {
                    type: "CNAME",
                    name: customDomain.toLowerCase().startsWith("www.") ? "www" : "@",
                    value: ROOT_DOMAIN,
                    note: `Add a CNAME record pointing to ${ROOT_DOMAIN}, then click Verify.`,
                },
            },
        });
    } catch (err) {
        console.error("[SET_CUSTOM_DOMAIN]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}