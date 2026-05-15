'use client';

/**
 * components/builder/VibeCheckPanel.tsx
 *
 * "Describe your audience → AI adjusts entire site theme."
 * User writes a sentence. Cloudflare AI picks the best palette + vibe.
 * Saves via /api/site/vibe-check which reuses your personality route logic.
 *
 * PLACEMENT IN route.ts:
 * 1. Import: import { VibeCheckPanel } from '@/components/builder/VibeCheckPanel';
 * 2. Add 'vibecheck' to RightPanel type
 * 3. Add button to top bar (beside Magic AI button):
 *      <button onClick={() => setRightPanel(p => p === 'vibecheck' ? null : 'vibecheck')}
 *              className={`p-1.5 rounded ${rightPanel === 'vibecheck' ? 'bg-pink-100 text-pink-600' : 'hover:bg-muted'}`}
 *              title="Vibe Check AI"><Sparkles className="h-3.5 w-3.5"/></button>
 * 4. Add right panel case:
 *      {rightPanel === 'vibecheck' && (
 *        <VibeCheckPanel
 *          siteType={site.siteType}
 *          onApplied={(updatedSite) => { setSite(updatedSite); setRightPanel(null); }}
 *          onClose={() => setRightPanel(null)}
 *        />
 *      )}
 */

import {useState} from 'react';
import {Sparkles, Loader2, Check, X, RefreshCw} from 'lucide-react';

interface VibeCheckPanelProps {
    siteType: string;
    onApplied: (updatedSite: unknown) => void;
    onClose: () => void;
}

const EXAMPLE_PROMPTS = [
    'Young professionals who love minimal design and productivity',
    'Small restaurant owners in Pakistan who want to look premium',
    'Tech-savvy developers who value clean, functional tools',
    'Creative freelancers who need to stand out in a crowded market',
    'Busy parents shopping for quality kids products',
];

export function VibeCheckPanel({siteType, onApplied, onClose}: VibeCheckPanelProps) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ vibe: string; palette: string; reason: string } | null>(null);

    async function handleAnalyze() {
        if (!description.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await fetch('/api/site/vibe-check', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({description: description.trim(), siteType}),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error ?? 'Analysis failed');
            setResult(data.suggestion);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    async function handleApply() {
        if (!result) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/site/personality', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({vibe: result.vibe, palette: result.palette, siteType}),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error ?? 'Apply failed');
            onApplied(data.data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Apply failed');
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <div>
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-pink-500"/> Vibe Check AI
                    </p>
                    <p className="text-xs text-muted-foreground">Describe your audience → AI sets the perfect theme</p>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4"/></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Describe your target audience
                    </label>
                    <textarea
                        value={description}
                        onChange={e => {
                            setDescription(e.target.value);
                            setResult(null);
                            setError('');
                        }}
                        rows={4}
                        placeholder="e.g. Young professionals who want a minimal, trustworthy brand..."
                        className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{description.length}/300</p>
                </div>

                {/* Example prompts */}
                {!result && (
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Examples</p>
                        <div className="space-y-1.5">
                            {EXAMPLE_PROMPTS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setDescription(p);
                                        setResult(null);
                                    }}
                                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-dashed hover:border-pink-300 hover:bg-pink-50 transition-colors text-gray-600"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Result */}
                {result && (
                    <div
                        className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100 p-4 space-y-3">
                        <p className="text-xs font-bold text-pink-700 uppercase tracking-wider">AI Recommendation</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white rounded-lg p-2.5 border">
                                <p className="text-muted-foreground mb-0.5">Vibe</p>
                                <p className="font-bold capitalize">{result.vibe}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border">
                                <p className="text-muted-foreground mb-0.5">Palette</p>
                                <p className="font-bold capitalize">{result.palette}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{result.reason}</p>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => {
                                    setResult(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
                            >
                                <RefreshCw className="h-3 w-3"/> Try again
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3"/>}
                                Apply to Site
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
            </div>

            {!result && (
                <div className="px-4 py-3 border-t shrink-0">
                    <button
                        onClick={handleAnalyze}
                        disabled={!description.trim() || loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 disabled:opacity-40 transition-colors"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                        {loading ? 'Analyzing…' : 'Analyze Audience'}
                    </button>
                </div>
            )}
        </div>
    );
}