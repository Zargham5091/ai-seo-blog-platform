import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import TenantDomainModel from "@/models/TenantDomain";
import {z} from "zod";
import crypto from "crypto";
import {canDelete, canWrite, getTenantContext} from "@/lib/tenant";

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
        .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/, "Must be a valid domain e.g. blog.example.com")
        .optional()
        .or(z.literal("")),
    siteName: z.string().min(1).max(80).optional(),
    siteDescription: z.string().max(300).optional(),
    siteLogo: z.string().max(500).optional(),
    siteTheme: z.enum(["light", "dark", "auto"]).optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    navLinks: z.array(z.object({label: z.string().max(40), href: z.string().max(200)})).max(8).optional(),
    social: z.object({
        twitter: z.string().max(100).optional(),
        linkedin: z.string().max(200).optional(),
        github: z.string().max(200).optional(),
        website: z.string().max(200).optional(),
    }).optional(),
    defaultMetaTitle: z.string().max(60).optional(),
    defaultMetaDescription: z.string().max(160).optional(),
    defaultOgImage: z.string().max(500).optional(),
});

// GET /api/domains
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const tenant = await getTenantContext(session.user.id);
        await connectDB();
        const domain = await TenantDomainModel.findOne({userId: tenant.tenantId}).lean();
        return NextResponse.json({success: true, data: domain ?? null});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/domains — create or update
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const tenant = await getTenantContext(session.user.id);
        if (!canWrite(tenant.role)) return NextResponse.json({
            success: false,
            error: "Only admins can write."
        }, {status: 403});

        const body = await req.json();
        if (body.customDomain === "") body.customDomain = undefined;

        const parsed = DomainSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        // Custom domains require paid plan — subdomains are free for everyone
        if (parsed.data.customDomain && session.user.plan === "free") {
            return NextResponse.json(
                {success: false, error: "A paid plan is required to use a custom domain."},
                {status: 403}
            );
        }

        await connectDB();

        // Check subdomain availability (excluding current user)
        if (parsed.data.subdomain) {
            const existing = await TenantDomainModel.findOne({
                subdomain: parsed.data.subdomain,
                userId: {$ne: tenant.tenantId},
            });
            if (existing) {
                return NextResponse.json(
                    {success: false, error: "This subdomain is already taken. Please choose another."},
                    {status: 409}
                );
            }
        }

        // Check custom domain availability
        if (parsed.data.customDomain) {
            const existing = await TenantDomainModel.findOne({
                customDomain: parsed.data.customDomain,
                userId: {$ne: tenant.tenantId},
            });
            if (existing) {
                return NextResponse.json(
                    {success: false, error: "This custom domain is already in use."},
                    {status: 409}
                );
            }
        }

        const currentRecord = await TenantDomainModel.findOne({userId: tenant.tenantId}).lean();
        const isNewCustomDomain =
            parsed.data.customDomain &&
            parsed.data.customDomain !== (currentRecord as any)?.customDomain;

        const updatePayload: Record<string, unknown> = {
            ...parsed.data,
            userId: tenant.tenantId,
            isActive: true, // ← CRITICAL FIX: always set active so preview route finds it
        };

        if (isNewCustomDomain) {
            updatePayload.customDomainVerified = false;
            updatePayload.customDomainVerifyToken = `seo-platform-verify=${crypto.randomBytes(16).toString("hex")}`;
        }

        const domain = await TenantDomainModel.findOneAndUpdate(
            {userId: tenant.tenantId},
            {$set: updatePayload},
            {new: true, upsert: true, runValidators: true}
        );

        return NextResponse.json({success: true, data: domain});
    } catch (error) {
        console.error("[DOMAINS_POST]", error);
        return NextResponse.json({success: false, error: "Failed to save domain settings"}, {status: 500});
    }
}

// DELETE /api/domains
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const tenant = await getTenantContext(session.user.id);
        if (!canDelete(tenant.role)) return NextResponse.json({
            success: false,
            error: "Only admins can delete."
        }, {status: 403});
        await connectDB();
        await TenantDomainModel.findOneAndDelete({userId: tenant.tenantId});
        return NextResponse.json({success: true, message: "Domain settings removed"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import TenantDomainModel from "@/models/TenantDomain";
// import {z} from "zod";
// import crypto from "crypto";
// import {canDelete, canWrite, getTenantContext} from "@/lib/tenant";
//
// const DomainSchema = z.object({
//     subdomain: z
//         .string()
//         .min(3)
//         .max(32)
//         .regex(/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/, "Lowercase letters, numbers, hyphens only. Cannot start/end with hyphen.")
//         .optional(),
//     customDomain: z
//         .string()
//         .max(253)
//         .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/, "Must be a valid domain e.g. blog.lisa.com")
//         .optional()
//         .or(z.literal("")),
//     siteName: z.string().min(1).max(80).optional(),
//     siteDescription: z.string().max(300).optional(),
//     siteLogo: z.string().max(500).optional(),
//     siteTheme: z.enum(["light", "dark", "auto"]).optional(),
//     primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
//     navLinks: z
//         .array(z.object({label: z.string().max(40), href: z.string().max(200)}))
//         .max(8)
//         .optional(),
//     social: z
//         .object({
//             twitter: z.string().max(100).optional(),
//             linkedin: z.string().max(200).optional(),
//             github: z.string().max(200).optional(),
//             website: z.string().max(200).optional(),
//         })
//         .optional(),
//     defaultMetaTitle: z.string().max(60).optional(),
//     defaultMetaDescription: z.string().max(160).optional(),
//     defaultOgImage: z.string().max(500).optional(),
// });
//
// // GET /api/domains
// export async function GET() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//         const tenant = await getTenantContext(session.user.id);
//         await connectDB();
//         const domain = await TenantDomainModel.findOne({userId: tenant.tenantId}).lean();
//         return NextResponse.json({success: true, data: domain ?? null});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // POST /api/domains — create or update
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//         const tenant = await getTenantContext(session.user.id);
//         if (!canWrite(tenant.role)) return NextResponse.json({
//             success: false,
//             error: "Only admins can write."
//         }, {status: 403});
//
//         if (session.user.plan === "free") {
//             return NextResponse.json(
//                 {success: false, error: "A paid plan is required to set up your own domain."},
//                 {status: 403}
//             );
//         }
//
//         const body = await req.json();
//         if (body.customDomain === "") {
//             body.customDomain = undefined;
//         }
//         const parsed = DomainSchema.safeParse(body);
//
//         if (!parsed.success) {
//             return NextResponse.json(
//                 {success: false, error: parsed.error.errors[0].message},
//                 {status: 400}
//             );
//         }
//
//         await connectDB();
//
//         // Check subdomain availability (excluding current user)
//         if (parsed.data.subdomain) {
//             const existing = await TenantDomainModel.findOne({
//                 subdomain: parsed.data.subdomain,
//                 userId: {$ne: tenant.tenantId},
//             });
//             if (existing) {
//                 return NextResponse.json(
//                     {success: false, error: "This subdomain is already taken. Please choose another."},
//                     {status: 409}
//                 );
//             }
//         }
//
//         // Check custom domain availability (excluding current user)
//         if (parsed.data.customDomain) {
//             const existing = await TenantDomainModel.findOne({
//                 customDomain: parsed.data.customDomain,
//                 userId: {$ne: tenant.tenantId},
//             });
//             if (existing) {
//                 return NextResponse.json(
//                     {success: false, error: "This custom domain is already in use."},
//                     {status: 409}
//                 );
//             }
//         }
//
//         // Generate a DNS verification token when custom domain is set for first time
//         const currentRecord = await TenantDomainModel.findOne({userId: tenant.tenantId}).lean();
//         const isNewCustomDomain =
//             parsed.data.customDomain &&
//             parsed.data.customDomain !== currentRecord?.customDomain;
//
//         const updatePayload: Record<string, unknown> = {...parsed.data, userId: tenant.tenantId};
//
//         if (isNewCustomDomain) {
//             // Reset verification when domain changes
//             updatePayload.customDomainVerified = false;
//             updatePayload.customDomainVerifyToken = `seo-platform-verify=${crypto.randomBytes(16).toString("hex")}`;
//         }
//
//         const domain = await TenantDomainModel.findOneAndUpdate(
//             {userId: tenant.tenantId},
//             {$set: updatePayload},
//             {new: true, upsert: true, runValidators: true}
//         );
//
//         return NextResponse.json({success: true, data: domain});
//     } catch (error) {
//         console.error("[DOMAINS_POST]", error);
//         return NextResponse.json(
//             {success: false, error: "Failed to save domain settings"},
//             {status: 500}
//         );
//     }
// }
//
// // DELETE /api/domains
// export async function DELETE() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//         const tenant = await getTenantContext(session.user.id);
//         if (!canDelete(tenant.role)) return NextResponse.json({
//             success: false,
//             error: "Only admins can write."
//         }, {status: 403});
//
//         await connectDB();
//         await TenantDomainModel.findOneAndDelete({userId: tenant.tenantId});
//         return NextResponse.json({success: true, message: "Domain settings removed"});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
