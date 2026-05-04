/**
 * scripts/migrate-builder.ts
 *
 * Run once with: npx ts-node scripts/migrate-builder.ts
 * Or paste each section into MongoDB Compass shell / mongosh.
 *
 * Safe to run multiple times — uses $exists checks.
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({path: ".env"});

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/seo-platform";

async function run() {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("Database connection not established");
    }
    console.log("Connected to MongoDB");


    // ── 1. PlanComponent — add missing fields ────────────────────────────────
    console.log("\n[1/4] Migrating PlanComponent...");
    const compResult = await db.collection("plancomponents").updateMany(
        {htmlTemplate: {$exists: false}},
        {
            $set: {
                htmlTemplate: "",
                cssCode: "",
                jsCode: "",
                propsSchema: [],
                defaultProps: {},
                tags: [],
                siteTypes: ["all"],
                isFeatured: false,
                isPremium: false,
                usageCount: 0,
            }
        }
    );
    console.log(`  Updated ${compResult.modifiedCount} PlanComponent documents`);

    // Map old categories to new ones (section stays section, others are new)
    // Old categories that still exist: section, animation, template, widget, integration
    // New categories added: navbar, hero, footer, layout
    // No migration needed for existing category values — they're still valid.
    console.log("  Category values are backwards-compatible — no changes needed");

    // ── 2. UserSite — add missing fields ─────────────────────────────────────
    console.log("\n[2/4] Migrating UserSite...");
    const siteResult = await db.collection("usersites").updateMany(
        {siteType: {$exists: false}},
        {
            $set: {
                siteName: "My Site",
                siteType: "custom",
                customDomain: null,
                customDomainVerified: false,
                globalCSS: "",
                isPublished: false,
                pagePermissions: [],
                integrations: {},
                builderState: {
                    zoom: 100,
                    devicePreview: "desktop",
                    aiSuggestionsEnabled: true,
                },
                theme: {
                    primaryColor: "#4F46E5",
                    secondaryColor: "#0EA5E9",
                    accentColor: "#22C55E",
                    backgroundColor: "#ffffff",
                    textColor: "#111827",
                    fontHeading: "Playfair Display",
                    fontBody: "Source Sans Pro",
                    borderRadius: "md",
                    shadowStyle: "md",
                    darkMode: false,
                },
            }
        }
    );
    console.log(`  Updated ${siteResult.modifiedCount} UserSite documents`);

    // Fix existing UserSite docs that have pages without seo/customCSS
    const sites = await db.collection("usersites").find({}).toArray();
    let pageFixed = 0;
    for (const site of sites) {
        let changed = false;
        const pages = (site.pages ?? []).map((p: Record<string, unknown>) => {
            if (!p.seo) {
                p.seo = {};
                changed = true;
            }
            if (!p.pageId) {
                p.pageId = new mongoose.Types.ObjectId().toString();
                changed = true;
            }
            if (!p.customCSS) {
                p.customCSS = "";
                changed = true;
            }
            return p;
        });
        if (changed) {
            await db.collection("usersites").updateOne({_id: site._id}, {$set: {pages}});
            pageFixed++;
        }
    }
    console.log(`  Fixed pages in ${pageFixed} UserSite documents`);


    // ── 3. User — add siteSubdomain field ────────────────────────────────────
    console.log("\n[3/4] Migrating User...");

// Drop unique index if it exists (prevents duplicate null errors)
    try {
        await db.collection("users").dropIndex("siteSubdomain_1");
        console.log("  Dropped unique index on siteSubdomain");
    } catch (err: any) {
        if (err.code === 27) {
            console.log("  Index doesn't exist, continuing...");
        } else {
            console.log("  Error dropping index:", err.message);
        }
    }
    const userResult = await db.collection("users").updateMany(
        {siteSubdomain: {$exists: false}},
        {$set: {siteSubdomain: null}}
    );
    console.log(`  Updated ${userResult.modifiedCount} User documents`);

    // ── 4. Create public/sites directory ─────────────────────────────────────
    console.log("\n[4/4] Creating public/sites directory...");
    const {mkdir} = await import("fs/promises");
    const {join} = await import("path");
    await mkdir(join(process.cwd(), "public", "sites"), {recursive: true});
    console.log("  Created public/sites/");

    console.log("\n✅ Migration complete!\n");
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});