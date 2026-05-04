"use client";
/**
 * components/builder/ThemeEditor.tsx
 * Visual theme editor — colors, fonts, radius, shadows, dark mode.
 * Drop into site builder right panel when "Theme" is open.
 */

import {useState} from "react";
import {X, RotateCcw, Check, Moon, Sun} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/form-elements";

export interface SiteTheme {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontHeading: string;
    fontBody: string;
    borderRadius: "none" | "sm" | "md" | "lg" | "full";
    shadowStyle: "none" | "sm" | "md" | "lg";
    darkMode: boolean;
}

interface ThemeEditorProps {
    theme: SiteTheme;
    onChange: (theme: SiteTheme) => void;
    onSave: () => void;
    onClose: () => void;
    isSaving?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const HEADING_FONTS = [
    "Playfair Display", "Syne", "Fraunces", "Cormorant Garamond",
    "Plus Jakarta Sans", "Unbounded", "DM Serif Display",
    "Libre Baskerville", "Josefin Sans", "Bebas Neue", "Righteous", "Abril Fatface",
];

const BODY_FONTS = [
    "Source Sans Pro", "DM Sans", "Nunito", "Lato", "Inter",
    "Mulish", "Rubik", "Work Sans", "Outfit", "Karla", "Manrope", "Open Sans",
];

const RADIUS_OPTIONS: { value: SiteTheme["borderRadius"]; label: string; preview: string }[] = [
    {value: "none", label: "Sharp", preview: "0px"},
    {value: "sm", label: "Slight", preview: "4px"},
    {value: "md", label: "Rounded", preview: "8px"},
    {value: "lg", label: "Soft", preview: "16px"},
    {value: "full", label: "Pill", preview: "999px"},
];

const SHADOW_OPTIONS: { value: SiteTheme["shadowStyle"]; label: string }[] = [
    {value: "none", label: "Flat"},
    {value: "sm", label: "Subtle"},
    {value: "md", label: "Medium"},
    {value: "lg", label: "Bold"},
];

const COLOR_PALETTES: { label: string; colors: Partial<SiteTheme> }[] = [
    {
        label: "Indigo",
        colors: {
            primaryColor: "#4F46E5",
            secondaryColor: "#0EA5E9",
            accentColor: "#22C55E",
            backgroundColor: "#ffffff",
            textColor: "#111827"
        }
    },
    {
        label: "Rose",
        colors: {
            primaryColor: "#E11D48",
            secondaryColor: "#F97316",
            accentColor: "#FBBF24",
            backgroundColor: "#fff1f2",
            textColor: "#1C1917"
        }
    },
    {
        label: "Emerald",
        colors: {
            primaryColor: "#059669",
            secondaryColor: "#0891B2",
            accentColor: "#D97706",
            backgroundColor: "#ECFDF5",
            textColor: "#064E3B"
        }
    },
    {
        label: "Violet",
        colors: {
            primaryColor: "#7C3AED",
            secondaryColor: "#EC4899",
            accentColor: "#06B6D4",
            backgroundColor: "#F5F3FF",
            textColor: "#1E1B4B"
        }
    },
    {
        label: "Slate",
        colors: {
            primaryColor: "#334155",
            secondaryColor: "#475569",
            accentColor: "#F59E0B",
            backgroundColor: "#F8FAFC",
            textColor: "#0F172A"
        }
    },
    {
        label: "Dark Pro",
        colors: {
            primaryColor: "#6366F1",
            secondaryColor: "#22D3EE",
            accentColor: "#A3E635",
            backgroundColor: "#0F172A",
            textColor: "#F1F5F9"
        }
    },
    {
        label: "Rust",
        colors: {
            primaryColor: "#B45309",
            secondaryColor: "#92400E",
            accentColor: "#DC2626",
            backgroundColor: "#FFFBEB",
            textColor: "#1C1917"
        }
    },
    {
        label: "Midnight",
        colors: {
            primaryColor: "#818CF8",
            secondaryColor: "#34D399",
            accentColor: "#FB923C",
            backgroundColor: "#0F0F0F",
            textColor: "#FFFFFF"
        }
    },
];

// ── Color swatch picker ────────────────────────────────────────────────────

function ColorField({label, value, onChange}: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8 w-10 rounded border cursor-pointer p-0.5 bg-background"
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value);
                    }}
                    className="flex-1 h-8 rounded border bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    maxLength={7}
                />
            </div>
        </div>
    );
}

// ── Font preview pill ──────────────────────────────────────────────────────

function FontPill({font, selected, onClick}: { font: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg border text-sm text-left transition-all whitespace-nowrap ${
                selected ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700" : "border-border hover:border-indigo-300"
            }`}
            style={{fontFamily: `'${font}', serif`}}
        >
            {selected && <Check className="inline h-3 w-3 mr-1"/>}
            {font}
        </button>
    );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ThemeEditor({theme, onChange, onSave, onClose, isSaving}: ThemeEditorProps) {
    const [localTheme, setLocalTheme] = useState<SiteTheme>({...theme});

    const update = (patch: Partial<SiteTheme>) => {
        const updated = {...localTheme, ...patch};
        setLocalTheme(updated);
        onChange(updated); // live preview
    };

    const applyPalette = (palette: Partial<SiteTheme>) => update(palette);

    const reset = () => {
        const defaults: SiteTheme = {
            primaryColor: "#4F46E5", secondaryColor: "#0EA5E9", accentColor: "#22C55E",
            backgroundColor: "#ffffff", textColor: "#111827",
            fontHeading: "Playfair Display", fontBody: "Source Sans Pro",
            borderRadius: "md", shadowStyle: "md", darkMode: false,
        };
        setLocalTheme(defaults);
        onChange(defaults);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <p className="font-semibold text-sm">Theme Editor</p>
                <div className="flex items-center gap-1">
                    <button onClick={reset} title="Reset to defaults"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                        <RotateCcw className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-muted">
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

                {/* Quick palettes */}
                <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick
                        Palettes</Label>
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                        {COLOR_PALETTES.map((p) => (
                            <button key={p.label} onClick={() => applyPalette(p.colors)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:border-indigo-300 transition-colors">
                                <div className="flex gap-0.5">
                                    {[p.colors.primaryColor, p.colors.secondaryColor, p.colors.accentColor].map((c, i) => (
                                        <div key={i} className="h-4 w-4 rounded-full border border-background shadow-sm"
                                             style={{background: c}}/>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">{p.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Colors */}
                <div>
                    <Label
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colors</Label>
                    <div className="space-y-3 mt-2">
                        <ColorField label="Primary" value={localTheme.primaryColor}
                                    onChange={(v) => update({primaryColor: v})}/>
                        <ColorField label="Secondary" value={localTheme.secondaryColor}
                                    onChange={(v) => update({secondaryColor: v})}/>
                        <ColorField label="Accent" value={localTheme.accentColor}
                                    onChange={(v) => update({accentColor: v})}/>
                        <ColorField label="Background" value={localTheme.backgroundColor}
                                    onChange={(v) => update({backgroundColor: v})}/>
                        <ColorField label="Text" value={localTheme.textColor} onChange={(v) => update({textColor: v})}/>
                    </div>
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border">
                    <div className="flex items-center gap-2">
                        {localTheme.darkMode ? <Moon className="h-4 w-4 text-indigo-400"/> :
                            <Sun className="h-4 w-4 text-amber-400"/>}
                        <div>
                            <p className="text-sm font-medium">{localTheme.darkMode ? "Dark Mode" : "Light Mode"}</p>
                            <p className="text-xs text-muted-foreground">Affects background & text defaults</p>
                        </div>
                    </div>
                    <button
                        onClick={() => update({
                            darkMode: !localTheme.darkMode,
                            backgroundColor: !localTheme.darkMode ? "#0F172A" : "#ffffff",
                            textColor: !localTheme.darkMode ? "#F1F5F9" : "#111827",
                        })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${localTheme.darkMode ? "bg-indigo-600" : "bg-slate-200"}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${localTheme.darkMode ? "translate-x-5" : ""}`}/>
                    </button>
                </div>

                {/* Heading font */}
                <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Heading
                        Font</Label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {HEADING_FONTS.map((f) => (
                            <FontPill key={f} font={f} selected={localTheme.fontHeading === f}
                                      onClick={() => update({fontHeading: f})}/>
                        ))}
                    </div>
                </div>

                {/* Body font */}
                <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Body
                        Font</Label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {BODY_FONTS.map((f) => (
                            <FontPill key={f} font={f} selected={localTheme.fontBody === f}
                                      onClick={() => update({fontBody: f})}/>
                        ))}
                    </div>
                </div>

                {/* Border radius */}
                <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Border
                        Radius</Label>
                    <div className="grid grid-cols-5 gap-1.5 mt-2">
                        {RADIUS_OPTIONS.map((r) => (
                            <button key={r.value} onClick={() => update({borderRadius: r.value})}
                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all ${localTheme.borderRadius === r.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "hover:border-indigo-200"}`}>
                                <div className="h-7 w-7 border-2 border-current"
                                     style={{
                                         borderRadius: r.preview,
                                         opacity: localTheme.borderRadius === r.value ? 1 : 0.4
                                     }}/>
                                <p className="text-xs">{r.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shadow style */}
                <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shadow
                        Style</Label>
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                        {SHADOW_OPTIONS.map((s) => {
                            const shadows = {
                                none: "none",
                                sm: "0 1px 4px rgba(0,0,0,.08)",
                                md: "0 4px 16px rgba(0,0,0,.12)",
                                lg: "0 8px 32px rgba(0,0,0,.18)"
                            };
                            return (
                                <button key={s.value} onClick={() => update({shadowStyle: s.value})}
                                        className={`flex flex-col items-center gap-2 py-3 rounded-lg border transition-all ${localTheme.shadowStyle === s.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "hover:border-indigo-200"}`}>
                                    <div className="h-8 w-8 rounded-md bg-card" style={{boxShadow: shadows[s.value]}}/>
                                    <p className="text-xs">{s.label}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Live preview strip */}
                <div className="rounded-xl overflow-hidden border">
                    <div className="p-4 text-center" style={{background: localTheme.backgroundColor}}>
                        <p className="font-bold text-lg mb-1"
                           style={{fontFamily: `'${localTheme.fontHeading}', serif`, color: localTheme.primaryColor}}>
                            Preview Heading
                        </p>
                        <p className="text-sm mb-3"
                           style={{fontFamily: `'${localTheme.fontBody}', sans-serif`, color: localTheme.textColor}}>
                            Body text looks like this. Clear and readable.
                        </p>
                        <button className="px-4 py-1.5 text-sm text-white font-medium"
                                style={{
                                    background: localTheme.primaryColor,
                                    borderRadius: {
                                        none: "0",
                                        sm: "4px",
                                        md: "8px",
                                        lg: "16px",
                                        full: "999px"
                                    }[localTheme.borderRadius]
                                }}>
                            Button
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t shrink-0">
                <Button variant="gradient" className="w-full gap-2" onClick={onSave} isLoading={isSaving}>
                    <Check className="h-4 w-4"/> Apply Theme
                </Button>
            </div>
        </div>
    );
}