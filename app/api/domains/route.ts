import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import TenantDomainModel from "@/models/TenantDomain";
import {z} from "zod";
import crypto from "crypto";

const DomainSchema = z.object({
    subdomain: z
        .string()
        .min(3)
        .max(32)
        .regex(/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/, "Lowercase letters, numbers, hyphens only. Cannot start/end with hyphen.")
        .optional(),
    customDomain: z
        .string()
        .max(253)
        .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/, "Must be a valid domain e.g. blog.lisa.com")
        .optional()
        .or(z.literal("")),
    siteName: z.string().min(1).max(80).optional(),
    siteDescription: z.string().max(300).optional(),
    siteLogo: z.string().max(500).optional(),
    siteTheme: z.enum(["light", "dark", "auto"]).optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    navLinks: z
        .array(z.object({label: z.string().max(40), href: z.string().max(200)}))
        .max(8)
        .optional(),
    social: z
        .object({
            twitter: z.string().max(100).optional(),
            linkedin: z.string().max(200).optional(),
            github: z.string().max(200).optional(),
            website: z.string().max(200).optional(),
        })
        .optional(),
    defaultMetaTitle: z.string().max(60).optional(),
    defaultMetaDescription: z.string().max(160).optional(),
    defaultOgImage: z.string().max(500).optional(),
});

// GET /api/domains
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const domain = await TenantDomainModel.findOne({userId: session.user.id}).lean();
        return NextResponse.json({success: true, data: domain ?? null});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/domains — create or update
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        if (session.user.plan === "free") {
            return NextResponse.json(
                {success: false, error: "A paid plan is required to set up your own domain."},
                {status: 403}
            );
        }

        const body = await req.json();
        const parsed = DomainSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        await connectDB();

        // Check subdomain availability (excluding current user)
        if (parsed.data.subdomain) {
            const existing = await TenantDomainModel.findOne({
                subdomain: parsed.data.subdomain,
                userId: {$ne: session.user.id},
            });
            if (existing) {
                return NextResponse.json(
                    {success: false, error: "This subdomain is already taken. Please choose another."},
                    {status: 409}
                );
            }
        }

        // Check custom domain availability (excluding current user)
        if (parsed.data.customDomain) {
            const existing = await TenantDomainModel.findOne({
                customDomain: parsed.data.customDomain,
                userId: {$ne: session.user.id},
            });
            if (existing) {
                return NextResponse.json(
                    {success: false, error: "This custom domain is already in use."},
                    {status: 409}
                );
            }
        }

        // Generate a DNS verification token when custom domain is set for first time
        const currentRecord = await TenantDomainModel.findOne({userId: session.user.id});
        const isNewCustomDomain =
            parsed.data.customDomain &&
            parsed.data.customDomain !== currentRecord?.customDomain;

        const updatePayload: Record<string, unknown> = {...parsed.data, userId: session.user.id};

        if (isNewCustomDomain) {
            // Reset verification when domain changes
            updatePayload.customDomainVerified = false;
            updatePayload.customDomainVerifyToken = `seo-platform-verify=${crypto.randomBytes(16).toString("hex")}`;
        }

        const domain = await TenantDomainModel.findOneAndUpdate(
            {userId: session.user.id},
            {$set: updatePayload},
            {new: true, upsert: true, runValidators: true}
        );

        return NextResponse.json({success: true, data: domain});
    } catch (error) {
        console.error("[DOMAINS_POST]", error);
        return NextResponse.json(
            {success: false, error: "Failed to save domain settings"},
            {status: 500}
        );
    }
}

// DELETE /api/domains
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        await TenantDomainModel.findOneAndDelete({userId: session.user.id});
        return NextResponse.json({success: true, message: "Domain settings removed"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import TenantDomainModel from "@/models/TenantDomain";
// import { z } from "zod";
//
// const DomainSchema = z.object({
//     subdomain: z
//         .string()
//         .min(3, "Subdomain must be at least 3 characters")
//         .max(32, "Subdomain must be under 32 characters")
//         .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
//         .optional(),
//     siteName: z.string().min(1).max(80).optional(),
//     siteDescription: z.string().max(200).optional(),
//     siteLogo: z.string().optional(),
//     siteTheme: z.enum(["light", "dark", "auto"]).optional(),
//     primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").optional(),
//     navLinks: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
//     social: z.object({
//         twitter: z.string().optional(),
//         linkedin: z.string().optional(),
//         github: z.string().optional(),
//         website: z.string().optional(),
//     }).optional(),
//     defaultMetaTitle: z.string().max(60).optional(),
//     defaultMetaDescription: z.string().max(160).optional(),
//     defaultOgImage: z.string().optional(),
// });
//
// // GET /api/domains — get current user's domain settings
// export async function GET() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//         await connectDB();
//         const domain = await TenantDomainModel.findOne({ userId: session.user.id }).lean();
//         return NextResponse.json({ success: true, data: domain ?? null });
//     } catch {
//         return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//     }
// }
//
// // POST /api/domains — create or update domain settings
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//         // Only paid users can have a subdomain
//         if (session.user.plan === "free") {
//             return NextResponse.json(
//                 { success: false, error: "A paid plan is required to create your own subdomain." },
//                 { status: 403 }
//             );
//         }
//
//         const body = await req.json();
//         const parsed = DomainSchema.safeParse(body);
//         if (!parsed.success) {
//             return NextResponse.json(
//                 { success: false, error: parsed.error.errors[0].message },
//                 { status: 400 }
//             );
//         }
//
//         await connectDB();
//
//         // Check subdomain availability if provided and changing
//         if (parsed.data.subdomain) {
//             const existing = await TenantDomainModel.findOne({
//                 subdomain: parsed.data.subdomain,
//                 userId: { $ne: session.user.id },
//             });
//             if (existing) {
//                 return NextResponse.json(
//                     { success: false, error: "This subdomain is already taken. Please choose another." },
//                     { status: 409 }
//                 );
//             }
//         }
//
//         const domain = await TenantDomainModel.findOneAndUpdate(
//             { userId: session.user.id },
//             {
//                 $set: {
//                     ...parsed.data,
//                     userId: session.user.id,
//                 },
//             },
//             { new: true, upsert: true, runValidators: true }
//         );
//
//         return NextResponse.json({ success: true, data: domain });
//     } catch (error) {
//         console.error("[DOMAINS_POST]", error);
//         return NextResponse.json({ success: false, error: "Failed to save domain settings" }, { status: 500 });
//     }
// }
//
// // DELETE /api/domains — remove domain (resets to no subdomain)
// export async function DELETE() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//         await connectDB();
//         await TenantDomainModel.findOneAndDelete({ userId: session.user.id });
//         return NextResponse.json({ success: true, message: "Domain settings removed" });
//     } catch {
//         return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//     }
// }
