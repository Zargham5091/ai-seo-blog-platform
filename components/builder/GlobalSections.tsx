"use client";
/**
 * components/builder/GlobalSections.tsx
 *
 * Lets users pick which navbar and footer component to use site-wide,
 * and configure nav links, CTA, social links, copyright text.
 *
 * Usage in builder:
 *   <GlobalSections site={site} library={library} onSave={handleSaveGlobal} onClose={...} />
 */

import {useState} from "react";
import {X, Navigation, PanelBottom, Plus, Trash2, Check, ExternalLink, GripVertical} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";

interface NavLink {
    label: string;
    href: string;
    order: number;
    openInNewTab?: boolean;
}

interface SocialLink {
    platform: string;
    url: string;
}

interface FooterColumn {
    heading: string;
    links: { label: string; href: string }[];
}

interface LibraryComponent {
    _id: string;
    key: string;
    name: string;
    category: string;
    previewImage?: string;
}

interface SiteNavbar {
    componentKey?: string;
    style: "sticky" | "static" | "floating" | "sidebar";
    isTransparent: boolean;
    links: NavLink[];
    ctaLabel?: string;
    ctaHref?: string;
    showThemeToggle: boolean;
}

interface SiteFooter {
    componentKey?: string;
    isEnabled: boolean;
    columns: FooterColumn[];
    bottomText: string;
    socialLinks: SocialLink[];
}

interface GlobalSectionsProps {
    navbar: SiteNavbar;
    footer: SiteFooter;
    library: LibraryComponent[];
    onSave: (navbar: SiteNavbar, footer: SiteFooter) => Promise<void>;
    onClose: () => void;
}

const NAV_STYLES: { value: SiteNavbar["style"]; label: string }[] = [
    {value: "sticky", label: "Sticky (follows scroll)"},
    {value: "static", label: "Static (stays at top)"},
    {value: "floating", label: "Floating (hovers above content)"},
    {value: "sidebar", label: "Sidebar (vertical nav)"},
];

const SOCIAL_PLATFORMS = ["twitter", "linkedin", "github", "instagram", "youtube", "facebook", "tiktok", "discord", "dribbble", "behance"];

export default function GlobalSections({navbar, footer, library, onSave, onClose}: GlobalSectionsProps) {
    const [nav, setNav] = useState<SiteNavbar>({...navbar, style: navbar.style as SiteNavbar["style"]});    const [foot, setFoot] = useState<SiteFooter>({...footer});
    const [tab, setTab] = useState<"navbar" | "footer">("navbar");
    const [saving, setSaving] = useState(false);

    const navbarComponents = library.filter((c) => c.category === "navbar");
    const footerComponents = library.filter((c) => c.category === "footer");

    // Nav link helpers
    const addNavLink = () => setNav((n) => ({
        ...n,
        links: [...n.links, {label: "New Link", href: "/", order: n.links.length}]
    }));
    const updateNavLink = (i: number, patch: Partial<NavLink>) => setNav((n) => {
        const links = [...n.links];
        links[i] = {...links[i], ...patch};
        return {...n, links};
    });
    const removeNavLink = (i: number) => setNav((n) => ({
        ...n,
        links: n.links.filter((_, idx) => idx !== i).map((l, idx) => ({...l, order: idx}))
    }));

    // Social link helpers
    const addSocial = () => setFoot((f) => ({...f, socialLinks: [...f.socialLinks, {platform: "twitter", url: ""}]}));
    const updateSocial = (i: number, patch: Partial<SocialLink>) => setFoot((f) => {
        const sl = [...f.socialLinks];
        sl[i] = {...sl[i], ...patch};
        return {...f, socialLinks: sl};
    });
    const removeSocial = (i: number) => setFoot((f) => ({
        ...f,
        socialLinks: f.socialLinks.filter((_, idx) => idx !== i)
    }));

    // Footer column helpers
    const addColumn = () => setFoot((f) => ({...f, columns: [...f.columns, {heading: "Links", links: []}]}));
    const updateColumn = (i: number, patch: Partial<FooterColumn>) => setFoot((f) => {
        const cols = [...f.columns];
        cols[i] = {...cols[i], ...patch};
        return {...f, columns: cols};
    });
    const removeColumn = (i: number) => setFoot((f) => ({...f, columns: f.columns.filter((_, idx) => idx !== i)}));
    const addColumnLink = (ci: number) => updateColumn(ci, {
        links: [...foot.columns[ci].links, {
            label: "Link",
            href: "/"
        }]
    });
    const updateColumnLink = (ci: number, li: number, patch: Partial<{ label: string; href: string }>) => {
        const col = {...foot.columns[ci]};
        col.links = col.links.map((l, idx) => idx === li ? {...l, ...patch} : l);
        updateColumn(ci, col);
    };
    const removeColumnLink = (ci: number, li: number) => {
        const col = {...foot.columns[ci]};
        col.links = col.links.filter((_, idx) => idx !== li);
        updateColumn(ci, col);
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(nav, foot);
        setSaving(false);
        onClose();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <p className="font-semibold text-sm">Global Sections</p>
                <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4"/></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b shrink-0">
                {(["navbar", "footer"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${tab === t ? "border-indigo-500 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        {t === "navbar" ? <Navigation className="h-3.5 w-3.5"/> :
                            <PanelBottom className="h-3.5 w-3.5"/>}
                        {t === "navbar" ? "Navbar" : "Footer"}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

                {tab === "navbar" && (
                    <>
                        {/* Navbar component picker */}
                        <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navbar
                                Style</Label>
                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                                {navbarComponents.length === 0 && (
                                    <p className="text-xs text-muted-foreground py-2">No navbar components yet. Add some
                                        in Super Admin → Components.</p>
                                )}
                                {navbarComponents.map((c) => (
                                    <button key={c.key} onClick={() => setNav((n) => ({...n, componentKey: c.key}))}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm text-left transition-all ${nav.componentKey === c.key ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "hover:border-indigo-200"}`}>
                                        {c.previewImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={c.previewImage} alt={c.name}
                                                 className="h-8 w-16 object-cover rounded"/>
                                        ) : (
                                            <div className="h-8 w-16 bg-muted rounded flex items-center justify-center">
                                                <Navigation className="h-4 w-4 text-muted-foreground"/>
                                            </div>
                                        )}
                                        <span className="font-medium text-xs">{c.name}</span>
                                        {nav.componentKey === c.key &&
                                            <Check className="h-4 w-4 text-indigo-500 ml-auto"/>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nav style */}
                        <div>
                            <Label
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Behavior</Label>
                            <select value={nav.style} onChange={(e) => setNav((n) => ({
                                ...n,
                                style: e.target.value as SiteNavbar["style"]
                            }))}
                                    className="w-full h-8 rounded-md border bg-background px-2 text-sm mt-2">
                                {NAV_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2">
                            {[
                                {
                                    key: "isTransparent",
                                    label: "Transparent on hero",
                                    desc: "Navbar overlaps hero, becomes solid on scroll"
                                },
                                {
                                    key: "showThemeToggle",
                                    label: "Show dark mode toggle",
                                    desc: "Adds a sun/moon icon to the navbar"
                                },
                            ].map(({key, label, desc}) => (
                                <label key={key}
                                       className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                                    <input type="checkbox" checked={Boolean(nav[key as keyof SiteNavbar])}
                                           onChange={(e) => setNav((n) => ({...n, [key]: e.target.checked}))}
                                           className="rounded h-4 w-4"/>
                                    <div>
                                        <p className="text-sm font-medium">{label}</p>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA
                                Button</Label>
                            <Input value={nav.ctaLabel ?? ""}
                                   onChange={(e) => setNav((n) => ({...n, ctaLabel: e.target.value}))}
                                   placeholder="Button label (leave blank to hide)" className="h-8 text-sm"/>
                            <Input value={nav.ctaHref ?? ""}
                                   onChange={(e) => setNav((n) => ({...n, ctaHref: e.target.value}))}
                                   placeholder="/get-started or https://..." className="h-8 text-sm font-mono"/>
                        </div>

                        {/* Nav links */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigation
                                    Links</Label>
                                <button onClick={addNavLink}
                                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                    <Plus className="h-3 w-3"/> Add Link
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                {nav.links.sort((a, b) => a.order - b.order).map((link, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0"/>
                                        <Input value={link.label}
                                               onChange={(e) => updateNavLink(i, {label: e.target.value})}
                                               placeholder="Label" className="h-7 text-xs flex-1"/>
                                        <Input value={link.href}
                                               onChange={(e) => updateNavLink(i, {href: e.target.value})}
                                               placeholder="/path" className="h-7 text-xs flex-1 font-mono"/>
                                        <button onClick={() => removeNavLink(i)}
                                                className="p-1 text-red-400 hover:text-red-600">
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </div>
                                ))}
                                {nav.links.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-3">No nav links yet</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {tab === "footer" && (
                    <>
                        {/* Footer enable toggle */}
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border">
                            <input type="checkbox" checked={foot.isEnabled}
                                   onChange={(e) => setFoot((f) => ({...f, isEnabled: e.target.checked}))}
                                   className="rounded h-4 w-4"/>
                            <div>
                                <p className="text-sm font-medium">Show Footer</p>
                                <p className="text-xs text-muted-foreground">Display footer on all pages</p>
                            </div>
                        </label>

                        {foot.isEnabled && (
                            <>
                                {/* Footer component picker */}
                                <div>
                                    <Label
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Footer
                                        Style</Label>
                                    <div className="grid grid-cols-1 gap-1.5 mt-2">
                                        {footerComponents.length === 0 && (
                                            <p className="text-xs text-muted-foreground py-2">No footer components
                                                yet.</p>
                                        )}
                                        {footerComponents.map((c) => (
                                            <button key={c.key}
                                                    onClick={() => setFoot((f) => ({...f, componentKey: c.key}))}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm text-left transition-all ${foot.componentKey === c.key ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "hover:border-indigo-200"}`}>
                                                <PanelBottom className="h-4 w-4 text-muted-foreground"/>
                                                <span className="font-medium text-xs">{c.name}</span>
                                                {foot.componentKey === c.key &&
                                                    <Check className="h-4 w-4 text-indigo-500 ml-auto"/>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Copyright */}
                                <div>
                                    <Label
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Copyright
                                        Text</Label>
                                    <Input value={foot.bottomText}
                                           onChange={(e) => setFoot((f) => ({...f, bottomText: e.target.value}))}
                                           placeholder="© 2025 My Site. All rights reserved."
                                           className="h-8 text-sm mt-2"/>
                                </div>

                                {/* Social links */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label
                                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Social
                                            Links</Label>
                                        <button onClick={addSocial}
                                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                            <Plus className="h-3 w-3"/> Add
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        {foot.socialLinks.map((s, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <select value={s.platform}
                                                        onChange={(e) => updateSocial(i, {platform: e.target.value})}
                                                        className="h-7 rounded border bg-background px-1.5 text-xs w-28">
                                                    {SOCIAL_PLATFORMS.map((p) => <option key={p}
                                                                                         value={p}>{p}</option>)}
                                                </select>
                                                <Input value={s.url}
                                                       onChange={(e) => updateSocial(i, {url: e.target.value})}
                                                       placeholder="https://..."
                                                       className="h-7 text-xs flex-1 font-mono"/>
                                                <button onClick={() => removeSocial(i)}
                                                        className="p-1 text-red-400 hover:text-red-600">
                                                    <X className="h-3 w-3"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer columns */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label
                                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link
                                            Columns</Label>
                                        <button onClick={addColumn}
                                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                            <Plus className="h-3 w-3"/> Add Column
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {foot.columns.map((col, ci) => (
                                            <div key={ci} className="border rounded-lg p-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Input value={col.heading}
                                                           onChange={(e) => updateColumn(ci, {heading: e.target.value})}
                                                           placeholder="Column Heading"
                                                           className="h-7 text-xs flex-1 font-semibold"/>
                                                    <button onClick={() => removeColumn(ci)}
                                                            className="p-1 text-red-400 hover:text-red-600">
                                                        <Trash2 className="h-3.5 w-3.5"/>
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    {col.links.map((link, li) => (
                                                        <div key={li} className="flex items-center gap-1">
                                                            <Input value={link.label}
                                                                   onChange={(e) => updateColumnLink(ci, li, {label: e.target.value})}
                                                                   placeholder="Label" className="h-6 text-xs flex-1"/>
                                                            <Input value={link.href}
                                                                   onChange={(e) => updateColumnLink(ci, li, {href: e.target.value})}
                                                                   placeholder="/path"
                                                                   className="h-6 text-xs flex-1 font-mono"/>
                                                            <button onClick={() => removeColumnLink(ci, li)}
                                                                    className="p-0.5 text-red-400 hover:text-red-600">
                                                                <X className="h-3 w-3"/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addColumnLink(ci)}
                                                            className="w-full text-xs text-muted-foreground hover:text-indigo-600 py-1 border border-dashed rounded flex items-center justify-center gap-1">
                                                        <Plus className="h-3 w-3"/> Add link
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3 shrink-0">
                <Button variant="gradient" className="w-full gap-2" onClick={handleSave} isLoading={saving}>
                    <Check className="h-4 w-4"/> Save Global Sections
                </Button>
            </div>
        </div>
    );
}