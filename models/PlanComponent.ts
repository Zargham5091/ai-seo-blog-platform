import mongoose, {Schema, Document, Model} from "mongoose";
import type {PlanLevel} from "./SiteTemplate";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ComponentCategory =
    | "navbar"        // Navigation bars
    | "hero"          // Hero / banner sections
    | "section"       // General page sections (features, about, etc.)
    | "footer"        // Footer components
    | "layout"        // Layout wrappers (grid, container, sidebar layout)
    | "widget"        // Embeddable widgets (contact form, pricing table, FAQ)
    | "animation"     // Animation presets (applied to other components)
    | "template"      // Full page templates (landing, blog, ecommerce)
    | "integration";  // Third-party embed code (maps, chat widgets, etc.)

export type PropType =
    | "text"          // Single-line text input
    | "textarea"      // Multi-line text
    | "richtext"      // WYSIWYG rich text (produces HTML string)
    | "color"         // Color picker → hex string
    | "image"         // Image URL input + upload button
    | "url"           // URL input with validation
    | "select"        // Dropdown — requires `options` array
    | "boolean"       // Toggle / checkbox
    | "number"        // Numeric input
    | "array"         // Repeatable group of sub-props (e.g. nav links, features list)
    | "icon";         // Icon picker (lucide icon name)

export interface IPropSchema {
    key: string;           // Maps to {{key}} in htmlTemplate
    label: string;         // Human-readable label in editor panel
    type: PropType;
    defaultValue: unknown; // Used when component is first added to a page
    placeholder?: string;
    options?: string[];    // For type="select"
    min?: number;          // For type="number"
    max?: number;
    required?: boolean;
    group?: string;        // Group props into collapsible sections in the editor
    // For type="array" — describes each item in the repeatable list
    arrayItemSchema?: Omit<IPropSchema, "arrayItemSchema">[];
}

export interface IPlanComponentDocument extends Document {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: string;
    key: string;              // Unique slug e.g. "navbar_sticky_dark"
    category: ComponentCategory;
    description: string;
    tags: string[];           // Searchable tags e.g. ["dark", "sticky", "blog"]
    siteTypes: string[];      // Designed for: ["blog","portfolio","saas","ecommerce","all"]

    // ── Preview ───────────────────────────────────────────────────────────────
    previewImage?: string;    // Screenshot URL
    previewVideo?: string;    // Short video preview URL

    // ── Code ─────────────────────────────────────────────────────────────────
    /**
     * Full HTML markup with Mustache-style placeholders: {{propKey}}
     * Arrays use: {{#items}}<li>{{text}}</li>{{/items}}
     * Conditionals use: {{#showCTA}}<button>{{ctaLabel}}</button>{{/showCTA}}
     * Tailwind classes are fully supported — CDN injected into iframe.
     * Custom CSS goes in <style> tags inside this string.
     */
    htmlTemplate: string;
    cssCode?: string;         // Additional scoped CSS (appended to globalCSS)
    jsCode?: string;          // Vanilla JS (runs after DOM ready, scoped to component)
    tailwindConfig?: string;  // Optional Tailwind theme extend config (JSON string)

    // ── Props Schema ─────────────────────────────────────────────────────────
    /**
     * Defines what users can edit in the right-panel props editor.
     * Each prop key maps to a {{key}} placeholder in htmlTemplate.
     */
    propsSchema: IPropSchema[];

    // ── Default Props ─────────────────────────────────────────────────────────
    /**
     * Default values used when component is first dropped on canvas.
     * Derived from propsSchema.defaultValue but stored flat for quick access.
     */
    defaultProps: Record<string, unknown>;

    // ── Access Control ────────────────────────────────────────────────────────
    availableTo: PlanLevel[];
    isActive: boolean;
    isFeatured: boolean;
    isPremium: boolean;       // Shows "Pro" badge even within allowed plans

    // ── Stats ─────────────────────────────────────────────────────────────────
    usageCount: number;

    createdAt: Date;
    updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

const PropSchemaDefinition: Schema = new Schema<IPropSchema>(
    {
        key: {type: String, required: true},
        label: {type: String, required: true},
        type: {
            type: String,
            enum: ["text", "textarea", "richtext", "color", "image", "url", "select", "boolean", "number", "array", "icon"],
            required: true,
        },
        defaultValue: {type: Schema.Types.Mixed},
        placeholder: {type: String},
        options: [{type: String}],
        min: {type: Number},
        max: {type: Number},
        required: {type: Boolean, default: false},
        group: {type: String},
        arrayItemSchema: [{type: Schema.Types.Mixed}], // Recursive — stored as plain objects
    },
    {_id: false}
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Schema
// ─────────────────────────────────────────────────────────────────────────────

const PlanComponentSchema = new Schema<IPlanComponentDocument>(
    {
        name: {type: String, required: true, trim: true, maxlength: 80},
        key: {type: String, required: true, unique: true, lowercase: true, trim: true},
        category: {
            type: String,
            enum: ["navbar", "hero", "section", "footer", "layout", "widget", "animation", "template", "integration"],
            required: true,
        },
        description: {type: String, maxlength: 500, default: ""},
        tags: [{type: String, lowercase: true, trim: true}],
        siteTypes: [{
            type: String,
            enum: ["blog", "portfolio", "saas", "ecommerce", "restaurant", "agency", "all"],
        }],

        previewImage: {type: String},
        previewVideo: {type: String},

        htmlTemplate: {type: String, default: ""},
        cssCode: {type: String, default: ""},
        jsCode: {type: String, default: ""},
        tailwindConfig: {type: String, default: ""},

        propsSchema: [PropSchemaDefinition],
        defaultProps: {type: Schema.Types.Mixed, default: {}},

        availableTo: [{type: String, enum: ["free", "silver", "gold", "diamond"]}],
        isActive: {type: Boolean, default: true},
        isFeatured: {type: Boolean, default: false},
        isPremium: {type: Boolean, default: false},

        usageCount: {type: Number, default: 0},
    },
    {timestamps: true}
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────

PlanComponentSchema.index({category: 1, isActive: 1});
PlanComponentSchema.index({availableTo: 1, isActive: 1});
PlanComponentSchema.index({tags: 1});
PlanComponentSchema.index({siteTypes: 1});
PlanComponentSchema.index({isFeatured: 1, isActive: 1});
PlanComponentSchema.index({key: 1}, {unique: true});

// ─────────────────────────────────────────────────────────────────────────────
// Pre-save: auto-derive defaultProps from propsSchema
// ─────────────────────────────────────────────────────────────────────────────

PlanComponentSchema.pre("save", function (next) {
    if (this.propsSchema && this.propsSchema.length > 0) {
        const defaults: Record<string, unknown> = {};
        for (const prop of this.propsSchema) {
            defaults[prop.key] = prop.defaultValue ?? "";
        }
        this.defaultProps = defaults;
    }
    next();
});

const PlanComponentModel: Model<IPlanComponentDocument> =
    mongoose.models.PlanComponent ??
    mongoose.model<IPlanComponentDocument>("PlanComponent", PlanComponentSchema);

export default PlanComponentModel;
// import mongoose, {Schema, Document, Model} from "mongoose";
// import type {PlanLevel} from "./SiteTemplate";
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────
//
// export type ComponentCategory =
//     | "navbar"        // Navigation bars
//     | "hero"          // Hero / banner sections
//     | "section"       // General page sections (features, about, etc.)
//     | "footer"        // Footer components
//     | "layout"        // Layout wrappers (grid, container, sidebar layout)
//     | "widget"        // Embeddable widgets (contact form, pricing table, FAQ)
//     | "animation"     // Animation presets (applied to other components)
//     | "template"      // Full page templates (landing, blog, ecommerce)
//     | "integration";  // Third-party embed code (maps, chat widgets, etc.)
//
// export type PropType =
//     | "text"          // Single-line text input
//     | "textarea"      // Multi-line text
//     | "richtext"      // WYSIWYG rich text (produces HTML string)
//     | "color"         // Color picker → hex string
//     | "image"         // Image URL input + upload button
//     | "url"           // URL input with validation
//     | "select"        // Dropdown — requires `options` array
//     | "boolean"       // Toggle / checkbox
//     | "number"        // Numeric input
//     | "array"         // Repeatable group of sub-props (e.g. nav links, features list)
//     | "icon";         // Icon picker (lucide icon name)
//
// export interface IPropSchema {
//     key: string;           // Maps to {{key}} in htmlTemplate
//     label: string;         // Human-readable label in editor panel
//     type: PropType;
//     defaultValue: unknown; // Used when component is first added to a page
//     placeholder?: string;
//     options?: string[];    // For type="select"
//     min?: number;          // For type="number"
//     max?: number;
//     required?: boolean;
//     group?: string;        // Group props into collapsible sections in the editor
//     // For type="array" — describes each item in the repeatable list
//     arrayItemSchema?: Omit<IPropSchema, "arrayItemSchema">[];
// }
//
// export interface IPlanComponentDocument extends Document {
//     // ── Identity ──────────────────────────────────────────────────────────────
//     name: string;
//     key: string;              // Unique slug e.g. "navbar_sticky_dark"
//     category: ComponentCategory;
//     description: string;
//     tags: string[];           // Searchable tags e.g. ["dark", "sticky", "blog"]
//     siteTypes: string[];      // Designed for: ["blog","portfolio","saas","ecommerce","all"]
//
//     // ── Preview ───────────────────────────────────────────────────────────────
//     previewImage?: string;    // Screenshot URL
//     previewVideo?: string;    // Short video preview URL
//
//     // ── Code ─────────────────────────────────────────────────────────────────
//     /**
//      * Full HTML markup with Mustache-style placeholders: {{propKey}}
//      * Arrays use: {{#items}}<li>{{text}}</li>{{/items}}
//      * Conditionals use: {{#showCTA}}<button>{{ctaLabel}}</button>{{/showCTA}}
//      * Tailwind classes are fully supported — CDN injected into iframe.
//      * Custom CSS goes in <style> tags inside this string.
//      */
//     htmlTemplate: string;
//     cssCode?: string;         // Additional scoped CSS (appended to globalCSS)
//     jsCode?: string;          // Vanilla JS (runs after DOM ready, scoped to component)
//     tailwindConfig?: string;  // Optional Tailwind theme extend config (JSON string)
//
//     // ── Props Schema ─────────────────────────────────────────────────────────
//     /**
//      * Defines what users can edit in the right-panel props editor.
//      * Each prop key maps to a {{key}} placeholder in htmlTemplate.
//      */
//     propsSchema: IPropSchema[];
//
//     // ── Default Props ─────────────────────────────────────────────────────────
//     /**
//      * Default values used when component is first dropped on canvas.
//      * Derived from propsSchema.defaultValue but stored flat for quick access.
//      */
//     defaultProps: Record<string, unknown>;
//
//     // ── Access Control ────────────────────────────────────────────────────────
//     availableTo: PlanLevel[];
//     isActive: boolean;
//     isFeatured: boolean;
//     isPremium: boolean;       // Shows "Pro" badge even within allowed plans
//
//     // ── Stats ─────────────────────────────────────────────────────────────────
//     usageCount: number;
//
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Sub-schemas
// // ─────────────────────────────────────────────────────────────────────────────
//
// const PropSchemaDefinition: Schema = new Schema<IPropSchema>(
//     {
//         key: {type: String, required: true},
//         label: {type: String, required: true},
//         type: {
//             type: String,
//             enum: ["text", "textarea", "richtext", "color", "image", "url", "select", "boolean", "number", "array", "icon"],
//             required: true,
//         },
//         defaultValue: {type: Schema.Types.Mixed},
//         placeholder: {type: String},
//         options: [{type: String}],
//         min: {type: Number},
//         max: {type: Number},
//         required: {type: Boolean, default: false},
//         group: {type: String},
//         arrayItemSchema: [{type: Schema.Types.Mixed}], // Recursive — stored as plain objects
//     },
//     {_id: false}
// );
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Main Schema
// // ─────────────────────────────────────────────────────────────────────────────
//
// const PlanComponentSchema = new Schema<IPlanComponentDocument>(
//     {
//         name: {type: String, required: true, trim: true, maxlength: 80},
//         key: {type: String, required: true, unique: true, lowercase: true, trim: true},
//         category: {
//             type: String,
//             enum: ["navbar", "hero", "section", "footer", "layout", "widget", "animation", "template", "integration"],
//             required: true,
//         },
//         description: {type: String, maxlength: 500, default: ""},
//         tags: [{type: String, lowercase: true, trim: true}],
//         siteTypes: [{
//             type: String,
//             enum: ["blog", "portfolio", "saas", "ecommerce", "restaurant", "agency", "all"],
//         }],
//
//         previewImage: {type: String},
//         previewVideo: {type: String},
//
//         htmlTemplate: {type: String, default: ""},
//         cssCode: {type: String, default: ""},
//         jsCode: {type: String, default: ""},
//         tailwindConfig: {type: String, default: ""},
//
//         propsSchema: [PropSchemaDefinition],
//         defaultProps: {type: Schema.Types.Mixed, default: {}},
//
//         availableTo: [{type: String, enum: ["free", "silver", "gold", "diamond"]}],
//         isActive: {type: Boolean, default: true},
//         isFeatured: {type: Boolean, default: false},
//         isPremium: {type: Boolean, default: false},
//
//         usageCount: {type: Number, default: 0},
//     },
//     {timestamps: true}
// );
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Indexes
// // ─────────────────────────────────────────────────────────────────────────────
//
// PlanComponentSchema.index({category: 1, isActive: 1});
// PlanComponentSchema.index({availableTo: 1, isActive: 1});
// PlanComponentSchema.index({tags: 1});
// PlanComponentSchema.index({siteTypes: 1});
// PlanComponentSchema.index({isFeatured: 1, isActive: 1});
// PlanComponentSchema.index({key: 1}, {unique: true});
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Pre-save: auto-derive defaultProps from propsSchema
// // ─────────────────────────────────────────────────────────────────────────────
//
// PlanComponentSchema.pre("save", function (next) {
//     if (this.propsSchema && this.propsSchema.length > 0) {
//         const defaults: Record<string, unknown> = {};
//         for (const prop of this.propsSchema) {
//             defaults[prop.key] = prop.defaultValue ?? "";
//         }
//         this.defaultProps = defaults;
//     }
//     next();
// });
//
// const PlanComponentModel: Model<IPlanComponentDocument> =
//     mongoose.models.PlanComponent ??
//     mongoose.model<IPlanComponentDocument>("PlanComponent", PlanComponentSchema);
//
// export default PlanComponentModel;
//
