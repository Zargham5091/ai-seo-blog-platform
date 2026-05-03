// models/MascotConfig.ts
import mongoose, {Schema, Document, Model} from "mongoose";

export interface IMascotMessage {
    id: string;
    trigger: "page_load" | "idle" | "scroll_hero" | "scroll_features" | "scroll_pricing" | "scroll_faq" | "scroll_cta" | "demo_page" | "pricing_page" | "register_page" | "hover" | "click" | "tour";
    messages: string[]; // randomly picks one
    action?: {
        label: string;
        type: "redirect" | "chat" | "tour" | "dismiss";
        href?: string;
    };
}

export interface IMascotConfig extends Document {
    // Appearance
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    name: string;
    size: "sm" | "md" | "lg";
    // Visibility
    enabledPages: string[]; // page paths where mascot shows
    disabledPages: string[];
    isGloballyEnabled: boolean;
    // Messages
    messages: IMascotMessage[];
    // Behavior
    showOnMobile: boolean;
    showOnTablet: boolean;
    autoGreetDelay: number; // ms before first greeting
    idleTimeout: number;    // ms before idle message
    updatedAt: Date;
}

const MascotMessageSchema = new Schema({
    id: {type: String, required: true},
    trigger: {type: String, required: true},
    messages: {type: [String], required: true},
    action: {
        label: {type: String},
        type: {type: String, enum: ["redirect", "chat", "tour", "dismiss"]},
        href: {type: String},
    },
}, {_id: false});

const MascotConfigSchema = new Schema<IMascotConfig>(
    {
        primaryColor: {type: String, default: "#4F46E5"},
        secondaryColor: {type: String, default: "#0EA5E9"},
        glowColor: {type: String, default: "#818CF8"},
        name: {type: String, default: "SEIO"},
        size: {type: String, enum: ["sm", "md", "lg"], default: "md"},
        enabledPages: {type: [String], default: ["/", "/demo", "/pricing", "/features", "/register"]},
        disabledPages: {type: [String], default: []},
        isGloballyEnabled: {type: Boolean, default: true},
        showOnMobile: {type: Boolean, default: true},
        showOnTablet: {type: Boolean, default: true},
        autoGreetDelay: {type: Number, default: 1500},
        idleTimeout: {type: Number, default: 8000},
        messages: {
            type: [MascotMessageSchema],
            default: [
                {
                    id: "page_load",
                    trigger: "page_load",
                    messages: [
                        "Hey there! 👋 I'm SEIO! Ready to supercharge your SEO?",
                        "Hi! I'm SEIO — your friendly SEO buddy! 🚀",
                        "Oh hello! I was just thinking about keywords... want to explore? ✨",
                    ],
                    action: {label: "Show me around!", type: "tour"},
                },
                {
                    id: "idle",
                    trigger: "idle",
                    messages: [
                        "Psst... did you know AI can write your entire blog post? 🤖",
                        "Still here! Want me to show you something cool? 👀",
                        "Fun fact: sites with consistent blogging get 3x more traffic! 📈",
                        "I can help you rank on Google. Just saying... 😊",
                    ],
                    action: {label: "Tell me more!", type: "redirect", href: "/demo"},
                },
                {
                    id: "scroll_hero",
                    trigger: "scroll_hero",
                    messages: [
                        "That's the magic button right there! 🎯 Start free — no credit card!",
                        "10 free AI credits waiting for you! ✨",
                    ],
                    action: {label: "Start free!", type: "redirect", href: "/register"},
                },
                {
                    id: "scroll_features",
                    trigger: "scroll_features",
                    messages: [
                        "These animations? That's literally what you get when you sign up! 🎉",
                        "40+ features... I helped build every single one! 🔧",
                        "My favorite is the AI generator — I may be biased though 😄",
                    ],
                },
                {
                    id: "scroll_pricing",
                    trigger: "scroll_pricing",
                    messages: [
                        "Free plan is real — no tricks! 10 AI credits, 3 blogs, no card needed 🙌",
                        "Silver plan is most popular for a reason... teams love it! 👥",
                        "Diamond users get bulk generation. That's like 10 blog posts at once! 🔥",
                    ],
                    action: {label: "See plans", type: "redirect", href: "/pricing"},
                },
                {
                    id: "scroll_faq",
                    trigger: "scroll_faq",
                    messages: [
                        "Great questions in here! I helped write some of them 😏",
                        "Still unsure? Our chat support is right there → 💬",
                    ],
                    action: {label: "Open chat", type: "chat"},
                },
                {
                    id: "demo_page",
                    trigger: "demo_page",
                    messages: [
                        "You get 3 REAL AI credits here. No fake data! 🎯",
                        "Try typing any topic — I'll show you what real AI output looks like! 🤖",
                        "These results are actual GPT-4o-mini outputs. Pretty cool right? ✨",
                    ],
                },
                {
                    id: "pricing_page",
                    trigger: "pricing_page",
                    messages: [
                        "Start free! Seriously, no credit card. I promise 🤞",
                        "Not sure which plan? Silver is perfect for most people! 💡",
                        "Pay with crypto? Coinbase Commerce is right there 🪙",
                    ],
                    action: {label: "Start free", type: "redirect", href: "/register"},
                },
                {
                    id: "register_page",
                    trigger: "register_page",
                    messages: [
                        "Almost there! You're 30 seconds from your first AI blog post! 🚀",
                        "Welcome to the family! I'm SO excited you're joining! 🎉",
                        "Quick tip: use a strong password. I watch over your account! 🛡️",
                    ],
                },
                {
                    id: "emotional",
                    trigger: "idle",
                    messages: [
                        "Hey — building something online is hard. You're doing great 💙",
                        "Every expert was once a beginner. Keep going! 🌱",
                        "SEO takes time but compound growth is worth it. Trust the process 📈",
                    ],
                },
            ],
        },
    },
    {timestamps: true}
);

const MascotConfigModel: Model<IMascotConfig> =
    mongoose.models.MascotConfig ??
    mongoose.model<IMascotConfig>("MascotConfig", MascotConfigSchema);

export default MascotConfigModel;