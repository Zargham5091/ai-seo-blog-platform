'use client';

/**
 * app/(dashboard)/dashboard/admin/site/marketplace/page.tsx
 *
 * Component Marketplace — users browse all available components filtered by
 * category, site type, and plan. One-click adds to current page.
 *
 * Uses the existing /api/plan-components GET route (already built).
 * No new API needed — installs by calling /api/site/page/[pageId]/components
 * which already exists.
 *
 * CREATE folder: app/(dashboard)/dashboard/admin/site/marketplace/
 * CREATE file:   page.tsx (this file)
 */

import {useCallback, useEffect, useState} from 'react';
import {
    Search, Loader2, Plus, Check, Layers, Navigation, Layout,
    PanelBottom, Puzzle, Sparkles, Code, Settings, Star,
    Lock, ChevronRight, X, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {useSearchParams, useRouter} from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PlanLevel = 'free' | 'silver' | 'gold' | 'diamond';
type Category =
    'all'
    | 'navbar'
    | 'hero'
    | 'section'
    | 'footer'
    | 'layout'
    | 'widget'
    | 'animation'
    | 'template'
    | 'integration';

interface PlanComponent {
    _id: string;
    name: string;
    key: string;
    category: string;
    description: string;
    tags: string[];
    siteTypes: string[];
    previewImage?: string;
    availableTo: PlanLevel[];
    isFeatured: boolean;
    isPremium: boolean;
    defaultProps: Record<string, unknown>;
}

interface ActivePage {
    pageId: string;
    title: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: { value: Category; label: string; icon: React.ElementType }[] = [
    {value: 'all', label: 'All', icon: Layers},
    {value: 'navbar', label: 'Navbars', icon: Navigation},
    {value: 'hero', label: 'Heroes', icon: Layout},
    {value: 'section', label: 'Sections', icon: Layout},
    {value: 'footer', label: 'Footers', icon: PanelBottom},
    {value: 'widget', label: 'Widgets', icon: Puzzle},
    {value: 'animation', label: 'Animations', icon: Sparkles},
    {value: 'layout', label: 'Layouts', icon: Layout},
    {value: 'integration', label: 'Integrations', icon: Settings},
    {value: 'template', label: 'Templates', icon: Code},
];

const PLAN_ORDER: PlanLevel[] = ['free', 'silver', 'gold', 'diamond'];

function canAccess(component: PlanComponent, userPlan: PlanLevel): boolean {
    return component.availableTo.includes(userPlan) || component.availableTo.includes('free');
}

function getPlanBadge(component: PlanComponent, userPlan: PlanLevel): PlanLevel | null {
    if (canAccess(component, userPlan)) return null;
    // Return the minimum plan required
    for (const plan of PLAN_ORDER) {
        if (component.availableTo.includes(plan)) return plan;
    }
    return 'diamond';
}

const PLAN_COLORS: Record<PlanLevel, string> = {
    free: 'bg-gray-100 text-gray-600',
    silver: 'bg-slate-100 text-slate-600',
    gold: 'bg-amber-100 text-amber-700',
    diamond: 'bg-blue-100 text-blue-700',
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Card
// ─────────────────────────────────────────────────────────────────────────────

function ComponentCard({
                           component,
                           userPlan,
                           activePage,
                           onAdd,
                           isAdding,
                           isAdded,
                       }: {
    component: PlanComponent;
    userPlan: PlanLevel;
    activePage: ActivePage | null;
    onAdd: (component: PlanComponent) => void;
    isAdding: boolean;
    isAdded: boolean;
}) {
    const accessible = canAccess(component, userPlan);
    const requiredPlan = getPlanBadge(component, userPlan);
    const CatIcon = CATEGORY_CONFIG.find(c => c.value === component.category)?.icon ?? Layers;

    return (
        <div
            className={`group relative bg-card border rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md ${!accessible ? 'opacity-75' : ''}`}>
            {/* Preview image / placeholder */}
            <div
                className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 relative overflow-hidden">
                {component.previewImage ? (
                    <img
                        src={component.previewImage}
                        alt={component.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-indigo-200">
                        <CatIcon className="h-8 w-8"/>
                        <span className="text-xs font-medium text-indigo-300 capitalize">{component.category}</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {component.isFeatured && (
                        <span
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">
              <Star className="h-2.5 w-2.5"/> Featured
            </span>
                    )}
                    {requiredPlan && (
                        <span
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold capitalize ${PLAN_COLORS[requiredPlan]}`}>
              <Lock className="h-2.5 w-2.5"/> {requiredPlan}
            </span>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight">{component.name}</h3>
                    <span
                        className="text-[10px] text-muted-foreground capitalize shrink-0 mt-0.5">{component.category}</span>
                </div>

                {component.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1 line-clamp-2">
                        {component.description}
                    </p>
                )}

                {/* Tags */}
                {component.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {component.tags.slice(0, 3).map(tag => (
                            <span key={tag}
                                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] text-gray-500">
                {tag}
              </span>
                        ))}
                        {component.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{component.tags.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Add button */}
                {accessible ? (
                    <button
                        onClick={() => onAdd(component)}
                        disabled={isAdding || !activePage}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                            isAdded
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                        title={!activePage ? 'Open a page in the builder first' : ''}
                    >
                        {isAdding ? (
                            <Loader2 className="h-3 w-3 animate-spin"/>
                        ) : isAdded ? (
                            <Check className="h-3 w-3"/>
                        ) : (
                            <Plus className="h-3 w-3"/>
                        )}
                        {isAdded ? 'Added!' : isAdding ? 'Adding…' : activePage ? `Add to "${activePage.title}"` : 'Open builder first'}
                    </button>
                ) : (
                    <Link
                        href="/dashboard/billing"
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                        <Lock className="h-3 w-3"/>
                        Upgrade to {requiredPlan}
                    </Link>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [components, setComponents] = useState<PlanComponent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<Category>('all');
    const [activePage, setActivePage] = useState<ActivePage | null>(null);
    const [userPlan, setUserPlan] = useState<PlanLevel>('free');
    const [addingId, setAddingId] = useState<string | null>(null);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    // Load components + current session info
    useEffect(() => {
        async function init() {
            try {
                const [compRes, siteRes] = await Promise.all([
                    fetch('/api/plan-components').then(r => r.json()),
                    fetch('/api/site').then(r => r.json()),
                ]);
                if (compRes.success) setComponents(compRes.data ?? []);
                if (siteRes.success && siteRes.data) {
                    // Find active page from URL param or default to first page
                    const pageId = searchParams.get('pageId');
                    const pages = siteRes.data.pages ?? [];
                    const page = pages.find((p: ActivePage) => p.pageId === pageId) ?? pages[0] ?? null;
                    setActivePage(page);
                    setUserPlan(siteRes.data.userPlan ?? 'free');
                }
            } catch {
                setError('Failed to load components');
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [searchParams]);

    // Filter components
    const filtered = components.filter(c => {
        const matchCat = category === 'all' || c.category === category;
        const matchSearch = !search || [c.name, c.description, ...c.tags].some(
            s => s?.toLowerCase().includes(search.toLowerCase())
        );
        return matchCat && matchSearch;
    });

    // Featured first, then alphabetical
    const sorted = [...filtered].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.name.localeCompare(b.name);
    });

    const handleAdd = useCallback(async (component: PlanComponent) => {
        if (!activePage) return;
        setAddingId(component._id);
        try {
            // Build a new canvas component instance matching ICanvasComponent shape
            const instanceId = `${component.key}_${Date.now()}`;
            const res = await fetch(`/api/site/page/${activePage.pageId}/components`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    componentId: component._id,
                    componentKey: component.key,
                    instanceId,
                    name: component.name,
                    category: component.category,
                    propValues: {...component.defaultProps},
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error ?? 'Failed to add');
            setAddedIds(prev => {
                const newSet = new Set(prev);
                newSet.add(component._id);
                return newSet;
            });
            // setAddedIds(prev => new Set([...prev, component._id]));
            // Clear "added" badge after 3 seconds
            setTimeout(() => {
                setAddedIds(prev => {
                    const n = new Set(prev);
                    n.delete(component._id);
                    return n;
                });
            }, 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setAddingId(null);
        }
    }, [activePage]);

    const accessibleCount = sorted.filter(c => canAccess(c, userPlan)).length;
    const lockedCount = sorted.filter(c => !canAccess(c, userPlan)).length;

    return (
        <div className="flex flex-col h-screen overflow-hidden">

            {/* Header */}
            <div className="border-b bg-card px-6 py-4 shrink-0">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin/site"
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <ChevronRight className="h-4 w-4 rotate-180"/>
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-gray-900">Component Marketplace</h1>
                            <p className="text-xs text-muted-foreground">
                                {loading ? 'Loading…' : `${components.length} components — ${accessibleCount} available on your plan`}
                            </p>
                        </div>
                    </div>

                    {/* Active page badge */}
                    {activePage ? (
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <div className="h-2 w-2 rounded-full bg-indigo-500"/>
                            <span className="text-xs font-medium text-indigo-700">Adding to: {activePage.title}</span>
                            <button
                                onClick={() => router.push('/dashboard/admin/site')}
                                className="text-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                                <ExternalLink className="h-3.5 w-3.5"/>
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/dashboard/admin/site"
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                            Open builder to add components
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">

                {/* Sidebar — categories */}
                <aside className="w-48 border-r shrink-0 overflow-y-auto py-4 px-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Categories</p>
                    {CATEGORY_CONFIG.map(cat => {
                        const Icon = cat.icon;
                        const count = cat.value === 'all'
                            ? components.length
                            : components.filter(c => c.category === cat.value).length;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                                    category === cat.value
                                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                        : 'text-gray-600 hover:bg-muted'
                                }`}
                            >
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5"/>
                    {cat.label}
                </span>
                                <span className="text-[10px] text-muted-foreground">{count}</span>
                            </button>
                        );
                    })}

                    {lockedCount > 0 && (
                        <div className="mt-4 mx-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-xs font-semibold text-amber-700 mb-1">
                                🔒 {lockedCount} locked
                            </p>
                            <p className="text-[10px] text-amber-600 mb-2">
                                Upgrade to unlock premium components.
                            </p>
                            <Link
                                href="/dashboard/billing"
                                className="block text-center text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg py-1.5 transition-colors"
                            >
                                Upgrade Plan
                            </Link>
                        </div>
                    )}
                </aside>

                {/* Main — component grid */}
                <main className="flex-1 overflow-y-auto">
                    {/* Search bar */}
                    <div className="sticky top-0 z-10 bg-background border-b px-6 py-3">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <input
                                type="search"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search components…"
                                className="w-full h-9 pl-9 pr-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500"/>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                                {error}
                            </div>
                        ) : sorted.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                                <Search className="h-10 w-10 text-gray-200"/>
                                <p className="font-semibold text-gray-900">No components found</p>
                                <p className="text-sm text-muted-foreground">Try a different search or category</p>
                                <button onClick={() => {
                                    setSearch('');
                                    setCategory('all');
                                }} className="text-sm text-indigo-600 hover:underline">
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {sorted.map(comp => (
                                    <ComponentCard
                                        key={comp._id}
                                        component={comp}
                                        userPlan={userPlan}
                                        activePage={activePage}
                                        onAdd={handleAdd}
                                        isAdding={addingId === comp._id}
                                        isAdded={addedIds.has(comp._id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}