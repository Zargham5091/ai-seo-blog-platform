import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import {z} from "zod";

const Schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const body = await req.json();
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        await connectDB();
        const user = await UserModel.findById(session.user.id).select("+password");
        if (!user) return NextResponse.json({success: false, error: "User not found"}, {status: 404});

        // Google-only users have no password
        if (!user.password) {
            return NextResponse.json(
                {success: false, error: "Your account uses Google sign-in. Password change is not available."},
                {status: 400}
            );
        }

        const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({success: false, error: "Current password is incorrect"}, {status: 400});
        }

        const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
        await UserModel.findByIdAndUpdate(session.user.id, {password: hashed});

        return NextResponse.json({success: true, message: "Password updated successfully"});
    } catch (error) {
        console.error("[CHANGE_PASSWORD]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import UserModel from "@/models/User";
// import bcrypt from "bcryptjs";
// import {z} from "zod";
//
// const Schema = z.object({
//     currentPassword: z.string().min(1),
//     newPassword: z.string().min(6, "New password must be at least 6 characters"),
// });
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         const body = await req.json();
//         const parsed = Schema.safeParse(body);
//         if (!parsed.success) {
//             return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
//         }
//
//         await connectDB();
//         const user = await UserModel.findById(session.user.id).select("password");
//         if (!user) return NextResponse.json({success: false, error: "User not found"}, {status: 404});
//
//         if (!user.password) {
//             return NextResponse.json(
//                 {success: false, error: "This account uses Google login — no password to change"},
//                 {status: 400}
//             );
//         }
//
//         const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
//         if (!isValid) {
//             return NextResponse.json({success: false, error: "Current password is incorrect"}, {status: 400});
//         }
//
//         const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
//         await UserModel.findByIdAndUpdate(session.user.id, {$set: {password: hashed}});
//
//         return NextResponse.json({success: true, message: "Password updated successfully"});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
