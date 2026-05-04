// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/plan-components/route.ts
// ════════════════════════════════════════════════════════════════════════════

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanComponentModel from "@/models/PlanComponent";
import {z} from "zod";

const PropSchemaZ = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(["text", "textarea", "richtext", "color", "image", "url", "select", "boolean", "number", "array", "icon"]),
    defaultValue: z.unknown().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    required: z.boolean().optional(),
    group: z.string().optional(),
    arrayItemSchema: z.array(z.any()).optional(),
});

const ComponentSchema = z.object({
    name: z.string().min(1).max(80),
    key: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
    category: z.enum(["navbar", "hero", "section", "footer", "layout", "widget", "animation", "template", "integration"]),
    description: z.string().max(500).optional().default(""),
    tags: z.array(z.string()).optional().default([]),
    siteTypes: z.array(z.enum(["blog", "portfolio", "saas", "ecommerce", "restaurant", "agency", "all"])).optional().default(["all"]),
    previewImage: z.string().optional(),
    previewVideo: z.string().optional(),
    htmlTemplate: z.string().optional().default(""),
    cssCode: z.string().optional().default(""),
    jsCode: z.string().optional().default(""),
    tailwindConfig: z.string().optional().default(""),
    propsSchema: z.array(PropSchemaZ).optional().default([]),
    availableTo: z.array(z.enum(["free", "silver", "gold", "diamond"])),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    isPremium: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        await connectDB();
        const {searchParams} = new URL(req.url);
        const category = searchParams.get("category");
        const siteType = searchParams.get("siteType");
        const search = searchParams.get("search");
        const query: Record<string, unknown> = {};
        if (session.user.role !== "super_admin") {
            query.availableTo = {$in: [session.user.plan ?? "free"]};
            query.isActive = true;
        }
        if (category && category !== "all") query.category = category;
        if (siteType && siteType !== "all") query.siteTypes = {$in: [siteType, "all"]};
        if (search) query.$or = [
            {name: {$regex: search, $options: "i"}},
            {description: {$regex: search, $options: "i"}},
            {tags: {$in: [new RegExp(search, "i")]}},
        ];
        const components = await PlanComponentModel.find(query)
            .sort({isFeatured: -1, category: 1, name: 1}).lean();
        return NextResponse.json({success: true, data: components});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin")
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        const body = await req.json();
        const parsed = ComponentSchema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        await connectDB();
        const existing = await PlanComponentModel.findOne({key: parsed.data.key});
        if (existing)
            return NextResponse.json({success: false, error: "Key already exists"}, {status: 409});
        const defaultProps: Record<string, unknown> = {};
        for (const prop of parsed.data.propsSchema ?? []) defaultProps[prop.key] = prop.defaultValue ?? "";
        const component = await PlanComponentModel.create({...parsed.data, defaultProps});
        return NextResponse.json({success: true, data: component}, {status: 201});
    } catch (err) {
        console.error("[COMPONENT_CREATE]", err);
        return NextResponse.json({success: false, error: "Failed to create"}, {status: 500});
    }
}

// // ════════════════════════════════════════════════════════════════════════════
// // FILE: app/api/plan-components/route.ts
// // ════════════════════════════════════════════════════════════════════════════
//
// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import PlanComponentModel from "@/models/PlanComponent";
// import {z} from "zod";
//
// const PropSchemaZ = z.object({
//     key: z.string().min(1),
//     label: z.string().min(1),
//     type: z.enum(["text", "textarea", "richtext", "color", "image", "url", "select", "boolean", "number", "array", "icon"]),
//     defaultValue: z.unknown().optional(),
//     placeholder: z.string().optional(),
//     options: z.array(z.string()).optional(),
//     min: z.number().optional(),
//     max: z.number().optional(),
//     required: z.boolean().optional(),
//     group: z.string().optional(),
//     arrayItemSchema: z.array(z.any()).optional(),
// });
//
// const ComponentSchema = z.object({
//     name: z.string().min(1).max(80),
//     key: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
//     category: z.enum(["navbar", "hero", "section", "footer", "layout", "widget", "animation", "template", "integration"]),
//     description: z.string().max(500).optional().default(""),
//     tags: z.array(z.string()).optional().default([]),
//     siteTypes: z.array(z.enum(["blog", "portfolio", "saas", "ecommerce", "restaurant", "agency", "all"])).optional().default(["all"]),
//     previewImage: z.string().optional(),
//     previewVideo: z.string().optional(),
//     htmlTemplate: z.string().optional().default(""),
//     cssCode: z.string().optional().default(""),
//     jsCode: z.string().optional().default(""),
//     tailwindConfig: z.string().optional().default(""),
//     propsSchema: z.array(PropSchemaZ).optional().default([]),
//     availableTo: z.array(z.enum(["free", "silver", "gold", "diamond"])),
//     isActive: z.boolean().optional().default(true),
//     isFeatured: z.boolean().optional().default(false),
//     isPremium: z.boolean().optional().default(false),
// });
//
// export async function GET(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         await connectDB();
//         const {searchParams} = new URL(req.url);
//         const category = searchParams.get("category");
//         const siteType = searchParams.get("siteType");
//         const search = searchParams.get("search");
//         const query: Record<string, unknown> = {};
//         if (session.user.role !== "super_admin") {
//             query.availableTo = {$in: [session.user.plan ?? "free"]};
//             query.isActive = true;
//         }
//         if (category && category !== "all") query.category = category;
//         if (siteType && siteType !== "all") query.siteTypes = {$in: [siteType, "all"]};
//         if (search) query.$or = [
//             {name: {$regex: search, $options: "i"}},
//             {description: {$regex: search, $options: "i"}},
//             {tags: {$in: [new RegExp(search, "i")]}},
//         ];
//         const components = await PlanComponentModel.find(query)
//             .sort({isFeatured: -1, category: 1, name: 1}).lean();
//         return NextResponse.json({success: true, data: components});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session || session.user.role !== "super_admin")
//             return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
//         const body = await req.json();
//         const parsed = ComponentSchema.safeParse(body);
//         if (!parsed.success)
//             return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
//         await connectDB();
//         const existing = await PlanComponentModel.findOne({key: parsed.data.key});
//         if (existing)
//             return NextResponse.json({success: false, error: "Key already exists"}, {status: 409});
//         const defaultProps: Record<string, unknown> = {};
//         for (const prop of parsed.data.propsSchema ?? []) defaultProps[prop.key] = prop.defaultValue ?? "";
//         const component = await PlanComponentModel.create({...parsed.data, defaultProps});
//         return NextResponse.json({success: true, data: component}, {status: 201});
//     } catch (err) {
//         console.error("[COMPONENT_CREATE]", err);
//         return NextResponse.json({success: false, error: "Failed to create"}, {status: 500});
//     }
// }
