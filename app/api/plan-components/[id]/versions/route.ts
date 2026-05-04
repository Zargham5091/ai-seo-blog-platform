// =============================================================================
// app/api/plan-components/[id]/versions/route.ts
// GET history, POST restore
// =============================================================================

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanComponentModel from "@/models/PlanComponent";
import ComponentVersionModel, {IComponentVersionDocument} from "@/models/ComponentVersion";

// Call this inside your PUT /api/plan-components/[id] BEFORE saving the update.
// It snapshots the CURRENT version before overwriting.
export async function saveVersion(
    componentId: string,
    componentKey: string,
    snapshot: IComponentVersionDocument["snapshot"],
    savedBy: string,
    changeNote?: string
): Promise<void> {
    try {
        await connectDB();
        // Get next version number
        const latest = await ComponentVersionModel.findOne({componentId})
            .sort({version: -1})
            .select("version")
            .lean();
        const nextVersion = (latest?.version ?? 0) + 1;
        await ComponentVersionModel.create({
            componentId, componentKey, version: nextVersion,
            savedBy, snapshot, changeNote,
        });
        // Keep only last 20 versions per component (prevent unbounded growth)
        const all = await ComponentVersionModel.find({componentId})
            .sort({version: -1})
            .select("_id")
            .lean();
        if (all.length > 20) {
            const toDelete = all.slice(20).map((v) => v._id);
            await ComponentVersionModel.deleteMany({_id: {$in: toDelete}});
        }
    } catch (err) {
        console.error("[SAVE_VERSION]", err); // non-fatal
    }
}

export async function GET(_req: NextRequest, id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin")
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        await connectDB();
        const versions = await ComponentVersionModel.find({componentId: id})
            .sort({version: -1})
            .populate("savedBy", "name email")
            .lean();
        return NextResponse.json({success: true, data: versions});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function POST(req: NextRequest, id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin")
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        const {versionId} = await req.json();
        await connectDB();
        const ver = await ComponentVersionModel.findById(versionId).lean();
        if (!ver) return NextResponse.json({success: false, error: "Version not found"}, {status: 404});
        // Snapshot current before restoring
        const current = await PlanComponentModel.findById(id).lean();
        if (current) {
            await saveVersion(id, current.key, {
                name: current.name,
                htmlTemplate: current.htmlTemplate ?? "",
                cssCode: current.cssCode ?? "",
                jsCode: current.jsCode ?? "",
                propsSchema: current.propsSchema ?? [],
                description: current.description ?? "",
            }, session.user.id, `Auto-snapshot before restore to v${ver.version}`);
        }
        // Restore snapshot
        const restored = await PlanComponentModel.findByIdAndUpdate(
            id,
            {$set: ver.snapshot},
            {new: true}
        );
        return NextResponse.json({success: true, data: restored});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

