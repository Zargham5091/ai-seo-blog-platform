import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {z} from "zod";

const UpdateSchema = z.object({
    plan: z.enum(["free", "silver", "gold", "diamond"]).optional(),
    role: z.enum(["user", "product_admin", "super_admin"]).optional(),
    isActive: z.boolean().optional(),
    aiCreditsLimit: z.number().min(0).optional(),
});

interface Params {
    params: { id: string }
}

export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        // Prevent super admin from modifying themselves
        if (params.id === session.user.id) {
            return NextResponse.json(
                {success: false, error: "Cannot modify your own account from here"},
                {status: 400}
            );
        }

        const body = await req.json();
        const parsed = UpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        await connectDB();
        const user = await UserModel.findByIdAndUpdate(
            params.id,
            {$set: parsed.data},
            {new: true}
        ).select("-password").lean();

        if (!user) return NextResponse.json({success: false, error: "User not found"}, {status: 404});
        return NextResponse.json({success: true, data: user});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function DELETE(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        if (params.id === session.user.id) {
            return NextResponse.json({success: false, error: "Cannot delete your own account"}, {status: 400});
        }

        await connectDB();
        await UserModel.findByIdAndDelete(params.id);
        return NextResponse.json({success: true, message: "User deleted"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}


// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
//
// type Params = { params: { id: string } };
//
// export async function PUT(req: NextRequest, { params }: Params) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || session.user.role !== "super_admin") {
//       return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
//     }
//     await connectDB();
//     const body = await req.json();
//     // Prevent changing own role/status
//     if (params.id === session.user.id) {
//       return NextResponse.json({ success: false, error: "Cannot modify your own account" }, { status: 400 });
//     }
//     const allowed = ["isActive", "role", "plan", "aiCreditsLimit"];
//     const update: Record<string, unknown> = {};
//     for (const key of allowed) {
//       if (key in body) update[key] = body[key];
//     }
//     const user = await UserModel.findByIdAndUpdate(params.id, { $set: update }, { new: true }).select("-password");
//     if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
//     return NextResponse.json({ success: true, data: user });
//   } catch {
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
//
// export async function DELETE(_req: NextRequest, { params }: Params) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || session.user.role !== "super_admin") {
//       return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
//     }
//     if (params.id === session.user.id) {
//       return NextResponse.json({ success: false, error: "Cannot delete your own account" }, { status: 400 });
//     }
//     await connectDB();
//     await UserModel.findByIdAndDelete(params.id);
//     return NextResponse.json({ success: true, message: "User deleted" });
//   } catch {
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
