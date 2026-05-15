'use client';

/**
 * components/builder/MagicAIPanel.tsx
 *
 * Smart AI action buttons shown in the builder left panel.
 * Each button sends a specific prompt to /api/builder/ai and adds the
 * returned components onto the current canvas.
 *
 * PLACEMENT IN route.ts:
 *   1. Import: import { MagicAIPanel } from '@/components/builder/MagicAIPanel';
 *   2. Add to left panel JSX — below the component library search, as a new tab or section:
 *      <MagicAIPanel
 *        siteType={site.siteType}
 *        pageSlug={activePage?.slug ?? '/'}
 *        existingComponentKeys={components.map(c => c.componentKey)}
 *        onAddComponents={(comps) => {
 *          comps.forEach(c => addComp({ ...c, name: c.componentKey }));
 *        }}
 *      />
 */

import {useState} from 'react';
import {Sparkles, Loader2, Zap, TrendingUp, Layout, Wrench, MessageSquare} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AIComponent {
    componentKey: string;
    componentId: string;
    propValues: Record<string, unknown>;
}

interface MagicAIPanelProps {
    siteType: string;
    pageSlug: string;
    existingComponentKeys: string[];
    onAddComponents: (components: AIComponent[]) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart actions config
// ─────────────────────────────────────────────────────────────────────────────

const MAGIC_ACTIONS = [
    {
        id: 'converting',
        icon: TrendingUp,
        label: 'Add a converting section',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        prompt: 'Add a high-converting section with social proof, a clear value proposition, and a strong call-to-action button.',
    },
    {
        id: 'fill_empty',
        icon: Layout,
        label: 'Fill empty areas',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        prompt: 'Add complementary sections to fill gaps in the page — features, benefits, or testimonials that fit the existing content.',
    },
    {
        id: 'professional',
        icon: Zap,
        label: 'Make more professional',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        prompt: 'Add sections that increase credibility: client logos, team section, awards, or certifications — whatever fits this site type best.',
    },
    {
        id: 'fix_mobile',
        icon: Wrench,
        label: 'Improve engagement',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        prompt: 'Add sections that improve visitor engagement and time-on-page: an FAQ accordion, an interactive feature showcase, or a newsletter signup.',
    },
    {
        id: 'contact',
        icon: MessageSquare,
        label: 'Add contact & trust',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        prompt: 'Add a contact section with a form, and a trust-building section like testimonials or social proof stats.',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function MagicAIPanel({siteType, pageSlug, existingComponentKeys, onAddComponents}: MagicAIPanelProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function runAction(action: typeof MAGIC_ACTIONS[0]) {
        setLoadingId(action.id);
        setError(null);
        setLastResult(null);

        try {
            const res = await fetch('/api/builder/ai', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    prompt: action.prompt,
                    siteType,
                    pageSlug,
                    existingComponentKeys,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error ?? 'AI request failed');
            }

            if (!data.data?.length) {
                setLastResult('No suitable components found for this action.');
                return;
            }

            onAddComponents(data.data);
            setLastResult(`Added ${data.data.length} component${data.data.length !== 1 ? 's' : ''}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoadingId(null);
        }
    }

    return (
        <div className="p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-purple-500"/>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Magic AI</span>
            </div>

            {/* Action buttons */}
            {MAGIC_ACTIONS.map(action => {
                const Icon = action.icon;
                const isLoading = loadingId === action.id;
                return (
                    <button
                        key={action.id}
                        onClick={() => runAction(action)}
                        disabled={loadingId !== null}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin shrink-0"/>
                        ) : (
                            <Icon className="h-4 w-4 shrink-0"/>
                        )}
                        <span>{isLoading ? 'Working…' : action.label}</span>
                    </button>
                );
            })}

            {/* Feedback */}
            {lastResult && (
                <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 mt-2">
                    ✓ {lastResult}
                </p>
            )}
            {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-2">
                    {error}
                </p>
            )}
        </div>
    );
}