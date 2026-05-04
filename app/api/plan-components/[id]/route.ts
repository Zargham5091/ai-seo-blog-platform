// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/plan-components/[id]/route.ts
// ════════════════════════════════════════════════════════════════════════════

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanComponentModel from "@/models/PlanComponent";

interface Params { params: {id: string} }

export async function GET(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success:false,error:"Unauthorized"},{status:401});
        await connectDB();
        const component = await PlanComponentModel.findById(params.id).lean();
        if (!component) return NextResponse.json({success:false,error:"Not found"},{status:404});
        // Plan access check for non-admin users
        if (session.user.role !== "super_admin") {
            const userPlan = session.user.plan ?? "free";
            if (!component.availableTo.includes(userPlan as never) || !component.isActive)
                return NextResponse.json({success:false,error:"Upgrade required"},{status:403});
        }
        return NextResponse.json({success:true,data:component});
    } catch {
        return NextResponse.json({success:false,error:"Internal server error"},{status:500});
    }
}

export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin")
            return NextResponse.json({success:false,error:"Forbidden"},{status:403});
        await connectDB();
        const body = await req.json();
        // Re-derive defaultProps on update
        if (body.propsSchema) {
            const defaultProps: Record<string,unknown> = {};
            for (const prop of body.propsSchema) defaultProps[prop.key] = prop.defaultValue ?? "";
            body.defaultProps = defaultProps;
        }
        const component = await PlanComponentModel.findByIdAndUpdate(
            params.id, {$set:body}, {new:true,runValidators:true}
        );
        if (!component) return NextResponse.json({success:false,error:"Not found"},{status:404});
        return NextResponse.json({success:true,data:component});
    } catch (err) {
        console.error("[COMPONENT_UPDATE]",err);
        return NextResponse.json({success:false,error:"Internal server error"},{status:500});
    }
}

export async function DELETE(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin")
            return NextResponse.json({success:false,error:"Forbidden"},{status:403});
        await connectDB();
        await PlanComponentModel.findByIdAndDelete(params.id);
        return NextResponse.json({success:true,message:"Component deleted"});
    } catch {
        return NextResponse.json({success:false,error:"Internal server error"},{status:500});
    }
}
// // ════════════════════════════════════════════════════════════════════════════
// // FILE: app/api/plan-components/[id]/route.ts
// // ════════════════════════════════════════════════════════════════════════════
//
// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import PlanComponentModel from "@/models/PlanComponent";
//
// interface Params {
//     params: { id: string }
// }
//
// export async function GET(_req: NextRequest, {params}: Params) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         await connectDB();
//         const component = await PlanComponentModel.findById(params.id).lean();
//         if (!component) return NextResponse.json({success: false, error: "Not found"}, {status: 404});
//         // Plan access check for non-admin users
//         if (session.user.role !== "super_admin") {
//             const userPlan = session.user.plan ?? "free";
//             if (!component.availableTo.includes(userPlan as never) || !component.isActive)
//                 return NextResponse.json({success: false, error: "Upgrade required"}, {status: 403});
//         }
//         return NextResponse.json({success: true, data: component});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// export async function PUT(req: NextRequest, {params}: Params) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session || session.user.role !== "super_admin")
//             return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
//         await connectDB();
//         const body = await req.json();
//         // Re-derive defaultProps on update
//         if (body.propsSchema) {
//             const defaultProps: Record<string, unknown> = {};
//             for (const prop of body.propsSchema) defaultProps[prop.key] = prop.defaultValue ?? "";
//             body.defaultProps = defaultProps;
//         }
//         const component = await PlanComponentModel.findByIdAndUpdate(
//             params.id, {$set: body}, {new: true, runValidators: true}
//         );
//         if (!component) return NextResponse.json({success: false, error: "Not found"}, {status: 404});
//         return NextResponse.json({success: true, data: component});
//     } catch (err) {
//         console.error("[COMPONENT_UPDATE]", err);
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// export async function DELETE(_req: NextRequest, {params}: Params) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session || session.user.role !== "super_admin")
//             return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
//         await connectDB();
//         await PlanComponentModel.findByIdAndDelete(params.id);
//         return NextResponse.json({success: true, message: "Component deleted"});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
