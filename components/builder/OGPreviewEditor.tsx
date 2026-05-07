'use client';

/**
 * components/builder/OGPreviewEditor.tsx
 *
 * Social preview (OG card) editor for the site builder.
 * Shows a live Facebook/Twitter card preview as the user edits fields.
 * Saves to /api/site/page/[pageId]/seo (your existing route).
 *
 * PLACEMENT IN page.tsx:
 *   In the right panel, add a new tab button (e.g. "OG" icon) and:
 *   {rightPanel === 'og' && activePage && (
 *     <OGPreviewEditor
 *       page={activePage}
 *       siteName={site.siteName}
 *       onSave={(seo) => handleSaveSEO(seo, activePage.customCSS ?? '')}
 *       onClose={() => setRightPanel(null)}
 *     />
 *   )}
 */

import {useState} from 'react';
import {Check, Loader2, Twitter, Facebook} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types — match your existing IUserPage.seo shape
// ─────────────────────────────────────────────────────────────────────────────

interface PageSEO {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
}

interface UserPage {
    pageId: string;
    title: string;
    slug: string;
    seo: PageSEO;
}

interface OGPreviewEditorProps {
    page: UserPage;
    siteName: string;
    onSave: (seo: PageSEO) => Promise<void>;
    onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function OGPreviewEditor({page, siteName, onSave, onClose}: OGPreviewEditorProps) {
    const [seo, setSeo] = useState<PageSEO>({...page.seo});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [preview, setPreview] = useState<'twitter' | 'facebook'>('twitter');

    const title = seo.metaTitle ?? page.title;
    const description = seo.metaDescription ?? '';
    const image = seo.ogImage ?? '';

    function update(key: keyof PageSEO, value: unknown) {
        setSeo(s => ({...s, [key]: value}));
        setSaved(false);
    }

    async function handleSave() {
        setSaving(true);
        try {
            await onSave(seo);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <div>
                    <p className="font-semibold text-sm">Social Preview</p>
                    <p className="text-xs text-muted-foreground capitalize">{page.title}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin"/>
                            : saved ? <Check className="h-3 w-3"/>
                                : null}
                        {saved ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

                {/* Preview toggle */}
                <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                    {(['twitter', 'facebook'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPreview(p)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                preview === p ? 'bg-card shadow-sm' : 'text-muted-foreground'
                            }`}
                        >
                            {p === 'twitter' ? <Twitter className="h-3 w-3"/> : <Facebook className="h-3 w-3"/>}
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Live preview card */}
                {preview === 'twitter' ? (
                    <div className="border rounded-2xl overflow-hidden text-sm shadow-sm">
                        <div className="aspect-[1.91/1] bg-gray-100 relative overflow-hidden">
                            {image ? (
                                <img src={image} alt="OG preview" className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                    No image set
                                </div>
                            )}
                        </div>
                        <div className="px-3 py-2 bg-white border-t">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">{siteName}</p>
                            <p className="font-bold text-gray-900 text-sm truncate mt-0.5">
                                {title || 'Page title'}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                {description || 'Page description will appear here.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="border rounded-xl overflow-hidden text-sm shadow-sm">
                        <div className="aspect-[1.91/1] bg-gray-100 relative overflow-hidden">
                            {image ? (
                                <img src={image} alt="OG preview" className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                    No image set
                                </div>
                            )}
                        </div>
                        <div className="px-3 py-3 bg-[#f0f2f5] border-t">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{siteName}</p>
                            <p className="font-bold text-gray-900 text-sm truncate">{title || 'Page title'}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{description || 'Page description'}</p>
                        </div>
                    </div>
                )}

                {/* Fields */}
                <div className="space-y-3">
                    <div>
                        <label
                            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            OG Title
                        </label>
                        <input
                            value={seo.metaTitle ?? ''}
                            onChange={e => update('metaTitle', e.target.value)}
                            placeholder={page.title}
                            maxLength={60}
                            className="w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <p className="text-right text-[10px] text-muted-foreground mt-0.5">
                            {(seo.metaTitle ?? '').length}/60
                        </p>
                    </div>

                    <div>
                        <label
                            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            OG Description
                        </label>
                        <textarea
                            value={seo.metaDescription ?? ''}
                            onChange={e => update('metaDescription', e.target.value)}
                            placeholder="A brief description that appears in link previews…"
                            maxLength={160}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <p className="text-right text-[10px] text-muted-foreground mt-0.5">
                            {(seo.metaDescription ?? '').length}/160
                        </p>
                    </div>

                    <div>
                        <label
                            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            OG Image URL
                        </label>
                        <input
                            value={seo.ogImage ?? ''}
                            onChange={e => update('ogImage', e.target.value)}
                            placeholder="https://… (1200×630px recommended)"
                            type="url"
                            className="w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Recommended: 1200×630px, under 8MB</p>
                    </div>

                    <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={seo.noIndex ?? false}
                                onChange={e => update('noIndex', e.target.checked)}
                                className="rounded h-4 w-4"
                            />
                            <div>
                                <span className="text-sm font-medium">No-index this page</span>
                                <p className="text-xs text-muted-foreground">Hides page from search engines</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}