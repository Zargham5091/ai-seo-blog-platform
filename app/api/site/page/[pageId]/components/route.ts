// app/api/site/page/[pageId]/components/route.ts
//
// COMPLETE FILE — replaces existing route.ts
// Adds POST (add single component from marketplace) to existing PATCH (reorder/replace all)

import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {connectDB} from '@/lib/db';
import UserSiteModel from '@/models/UserSite';
import PlanComponentModel from '@/models/PlanComponent';
import mongoose from 'mongoose';

interface Params {
    params: { pageId: string }
}

// ─── PATCH — replace entire components array (used by builder drag/reorder) ──

export async function PATCH(req: NextRequest, {params}: { params: Promise<{ pageId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});

        const {components} = await req.json();
        const {pageId} = await params;
        await connectDB();

        // Use findOneAndUpdate with positional operator — avoids loading/validating
        // the full document and all its components on every save (much faster)
        const result = await UserSiteModel.findOneAndUpdate(
            {
                userId: session.user.id,
                "pages.pageId": pageId,
            },
            {
                $set: {
                    "pages.$.components": components,
                    "pages.$.updatedAt": new Date(),
                },
            },
            {new: false} // don't need to return full doc
        );

        if (!result) {
            return NextResponse.json({success: false, error: 'Site or page not found'}, {status: 404});
        }

        return NextResponse.json({success: true});
    } catch (err) {
        console.error('[SAVE_COMPONENTS]', err);
        return NextResponse.json({success: false, error: 'Failed to save'}, {status: 500});
    }
}

// ─── POST — add a single component from marketplace ──────────────────────────

export async function POST(req: NextRequest, {params}: { params: Promise<{ pageId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});

        const body = await req.json() as {
            componentId?: string;
            componentKey?: string;
            instanceId?: string;
            name?: string;
            category?: string;
            propValues?: Record<string, unknown>;
        };

        const {componentId, componentKey, instanceId, name, category, propValues} = body;
        const {pageId} = await params;
        if (!componentId || !componentKey || !instanceId) {
            return NextResponse.json({
                success: false,
                error: 'componentId, componentKey and instanceId required'
            }, {status: 400});
        }

        await connectDB();

        // Verify the plan component exists and user's plan can access it
        const planComp = await PlanComponentModel.findById(componentId).lean();
        if (!planComp || !planComp.isActive) {
            return NextResponse.json({success: false, error: 'Component not found'}, {status: 404});
        }

        const userPlan = (session.user.plan ?? 'free') as 'free' | 'silver' | 'gold' | 'diamond';
        if (!planComp.availableTo.includes(userPlan) && !planComp.availableTo.includes('free')) {
            return NextResponse.json({
                success: false,
                error: 'Your plan does not include this component'
            }, {status: 403});
        }

        // Verify site exists
        const site = await UserSiteModel.findOne({userId: session.user.id, "pages.pageId": pageId});
        if (!site) return NextResponse.json({success: false, error: 'Site or page not found'}, {status: 404});
        const page = site.pages.find((p: { pageId: string }) => p.pageId === pageId);
        if (!page) return NextResponse.json({success: false, error: 'Page not found'}, {status: 404});

        const existingComponents = page.components ?? [];
        // Build new canvas component — matches ICanvasComponent shape in UserSite model
        const newComponent = {
            instanceId,
            componentId: new mongoose.Types.ObjectId(componentId),
            componentKey,
            name: name ?? planComp.name,
            category: category ?? planComp.category,
            propValues: {...(planComp.defaultProps ?? {}), ...(propValues ?? {})},
            order: existingComponents.length,
            isVisible: true,
            isLocked: false,
            animationPreset: '',
        };

        await UserSiteModel.findOneAndUpdate(
            {userId: session.user.id, "pages.pageId": pageId},
            {
                $push: {"pages.$.components": newComponent},
                $set: {"pages.$.updatedAt": new Date()},
            }
        );

        return NextResponse.json({success: true, data: newComponent}, {status: 201});
    } catch (err) {
        console.error('[ADD_COMPONENT]', err);
        return NextResponse.json({success: false, error: 'Failed to add component'}, {status: 500});
    }
}


// // app/api/site/page/[pageId]/components/route.ts
// //
// // COMPLETE FILE — replaces existing route.ts
// // Adds POST (add single component from marketplace) to existing PATCH (reorder/replace all)
//
// import {NextRequest, NextResponse} from 'next/server';
// import {getServerSession} from 'next-auth';
// import {authOptions} from '@/lib/auth';
// import {connectDB} from '@/lib/db';
// import UserSiteModel from '@/models/UserSite';
// import PlanComponentModel from '@/models/PlanComponent';
// import mongoose from 'mongoose';
//
// interface Params {
//     params: { pageId: string }
// }
//
// // ─── PATCH — replace entire components array (used by builder drag/reorder) ──
//
// export async function PATCH(req: NextRequest, {params}: Params) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});
//
//         const {components} = await req.json();
//         await connectDB();
//
//         const site = await UserSiteModel.findOne({userId: session.user.id});
//         if (!site) return NextResponse.json({success: false, error: 'Site not found'}, {status: 404});
//
//         // Team member page access check
//         if (site.pagePermissions?.length > 0) {
//             const perm = site.pagePermissions.find(
//                 (p: { userId: { toString(): string }; pageIds: string[] }) =>
//                     p.userId.toString() === session.user.id
//             );
//             if (perm && perm.pageIds.length > 0 && !perm.pageIds.includes(params.pageId)) {
//                 return NextResponse.json({success: false, error: 'No access to this page'}, {status: 403});
//             }
//         }
//
//         const pageIdx = site.pages.findIndex((p: { pageId: string }) => p.pageId === params.pageId);
//         if (pageIdx === -1) return NextResponse.json({success: false, error: 'Page not found'}, {status: 404});
//
//         site.pages[pageIdx].components = components;
//         site.pages[pageIdx].updatedAt = new Date();
//         await site.save();
//
//         return NextResponse.json({success: true});
//     } catch (err) {
//         console.error('[SAVE_COMPONENTS]', err);
//         return NextResponse.json({success: false, error: 'Failed to save'}, {status: 500});
//     }
// }
//
// // ─── POST — add a single component from marketplace ──────────────────────────
//
// export async function POST(req: NextRequest, {params}: Params) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});
//
//         const body = await req.json() as {
//             componentId?: string;
//             componentKey?: string;
//             instanceId?: string;
//             name?: string;
//             category?: string;
//             propValues?: Record<string, unknown>;
//         };
//
//         const {componentId, componentKey, instanceId, name, category, propValues} = body;
//
//         if (!componentId || !componentKey || !instanceId) {
//             return NextResponse.json({
//                 success: false,
//                 error: 'componentId, componentKey and instanceId required'
//             }, {status: 400});
//         }
//
//         await connectDB();
//
//         // Verify the plan component exists and user's plan can access it
//         const planComp = await PlanComponentModel.findById(componentId).lean();
//         if (!planComp || !planComp.isActive) {
//             return NextResponse.json({success: false, error: 'Component not found'}, {status: 404});
//         }
//
//         const userPlan = (session.user.plan ?? 'free') as 'free' | 'silver' | 'gold' | 'diamond';
//         if (!planComp.availableTo.includes(userPlan) && !planComp.availableTo.includes('free')) {
//             return NextResponse.json({
//                 success: false,
//                 error: 'Your plan does not include this component'
//             }, {status: 403});
//         }
//
//         const site = await UserSiteModel.findOne({userId: session.user.id});
//         if (!site) return NextResponse.json({success: false, error: 'Site not found'}, {status: 404});
//
//         const pageIdx = site.pages.findIndex((p: { pageId: string }) => p.pageId === params.pageId);
//         if (pageIdx === -1) return NextResponse.json({success: false, error: 'Page not found'}, {status: 404});
//
//         const existingComponents = site.pages[pageIdx].components ?? [];
//
//         // Build new canvas component — matches ICanvasComponent shape in UserSite model
//         const newComponent = {
//             instanceId,
//             componentId: new mongoose.Types.ObjectId(componentId),
//             componentKey,
//             name: name ?? planComp.name,
//             category: category ?? planComp.category,
//             propValues: {...(planComp.defaultProps ?? {}), ...(propValues ?? {})},
//             order: existingComponents.length,
//             isVisible: true,
//             isLocked: false,
//             animationPreset: '',
//         };
//
//         site.pages[pageIdx].components = [...existingComponents, newComponent];
//         site.pages[pageIdx].updatedAt = new Date();
//         await site.save();
//
//         return NextResponse.json({success: true, data: newComponent}, {status: 201});
//     } catch (err) {
//         console.error('[ADD_COMPONENT]', err);
//         return NextResponse.json({success: false, error: 'Failed to add component'}, {status: 500});
//     }
// }
