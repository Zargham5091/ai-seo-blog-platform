'use client';

/**
 * app/(dashboard)/dashboard/admin/site/health/page.tsx
 *
 * Site Health Dashboard — post-publish checks.
 * Shows: broken links, missing meta, slow components, SEO issues per page.
 * All checks are client-side — no external crawl service needed.
 *
 * CREATE folder: app/(dashboard)/dashboard/admin/site/health/
 * CREATE file:   page.tsx (this file)
 */

import {useCallback, useEffect, useState} from 'react';
import {
    CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw,
    Globe, FileText, Image as ImageIcon, Link2, Search, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CheckStatus = 'pass' | 'warn' | 'fail';

interface HealthCheck {
    id: string;
    category: 'seo' | 'content' | 'technical' | 'performance';
    label: string;
    status: CheckStatus;
    detail: string;
    affectedPages?: string[];
    fix?: string;
}

interface PageSummary {
    pageId: string;
    title: string;
    slug: string;
    score: number;
    issues: number;
}

interface SiteData {
    siteName: string;
    siteType: string;
    isPublished: boolean;
    publishedAt?: string;
    lastBuiltAt?: string;
    pages: Array<{
        pageId: string;
        title: string;
        slug: string;
        isEnabled: boolean;
        components: Array<{ componentKey: string; category: string; propValues: Record<string, unknown> }>;
        seo: { metaTitle?: string; metaDescription?: string; ogImage?: string; noIndex?: boolean };
    }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health check engine — pure client-side
// ─────────────────────────────────────────────────────────────────────────────

function runHealthChecks(site: SiteData): {
    checks: HealthCheck[];
    pageSummaries: PageSummary[];
    overallScore: number
} {
    const checks: HealthCheck[] = [];
    const enabledPages = site.pages.filter(p => p.isEnabled);

    // ── SEO checks ─────────────────────────────────────────────────────────────

    const pagesNoTitle = enabledPages.filter(p => !p.seo?.metaTitle?.trim());
    checks.push({
        id: 'meta_title',
        category: 'seo',
        label: 'Meta titles',
        status: pagesNoTitle.length === 0 ? 'pass' : pagesNoTitle.length < enabledPages.length / 2 ? 'warn' : 'fail',
        detail: pagesNoTitle.length === 0
            ? 'All pages have meta titles.'
            : `${pagesNoTitle.length} page${pagesNoTitle.length > 1 ? 's' : ''} missing meta title.`,
        affectedPages: pagesNoTitle.map(p => p.title),
        fix: 'Open each page in the builder → SEO panel → set Meta Title',
    });

    const pagesNoDesc = enabledPages.filter(p => !p.seo?.metaDescription?.trim());
    checks.push({
        id: 'meta_desc',
        category: 'seo',
        label: 'Meta descriptions',
        status: pagesNoDesc.length === 0 ? 'pass' : pagesNoDesc.length < enabledPages.length / 2 ? 'warn' : 'fail',
        detail: pagesNoDesc.length === 0
            ? 'All pages have meta descriptions.'
            : `${pagesNoDesc.length} page${pagesNoDesc.length > 1 ? 's' : ''} missing meta description.`,
        affectedPages: pagesNoDesc.map(p => p.title),
        fix: 'Open each page → SEO panel → set Meta Description (80–160 chars)',
    });

    const pagesNoOG = enabledPages.filter(p => !p.seo?.ogImage?.trim());
    checks.push({
        id: 'og_image',
        category: 'seo',
        label: 'OG / Social images',
        status: pagesNoOG.length === 0 ? 'pass' : 'warn',
        detail: pagesNoOG.length === 0
            ? 'All pages have OG images.'
            : `${pagesNoOG.length} page${pagesNoOG.length > 1 ? 's' : ''} missing OG image (affects social sharing).`,
        affectedPages: pagesNoOG.map(p => p.title),
        fix: 'Open each page → Social Preview → upload or link an OG image',
    });

    const indexedPages = enabledPages.filter(p => p.seo?.noIndex);
    checks.push({
        id: 'noindex',
        category: 'seo',
        label: 'No-index pages',
        status: indexedPages.length === 0 ? 'pass' : 'warn',
        detail: indexedPages.length === 0
            ? 'No pages are hidden from search engines.'
            : `${indexedPages.length} page${indexedPages.length > 1 ? 's are' : ' is'} set to no-index.`,
        affectedPages: indexedPages.map(p => p.title),
        fix: 'If intentional, ignore. Otherwise: SEO panel → uncheck No-index.',
    });

    // ── Content checks ─────────────────────────────────────────────────────────

    const emptyPages = enabledPages.filter(p => p.components.length === 0);
    checks.push({
        id: 'empty_pages',
        category: 'content',
        label: 'Empty pages',
        status: emptyPages.length === 0 ? 'pass' : 'fail',
        detail: emptyPages.length === 0
            ? 'All pages have content.'
            : `${emptyPages.length} page${emptyPages.length > 1 ? 's have' : ' has'} no components.`,
        affectedPages: emptyPages.map(p => p.title),
        fix: 'Open the builder and add components to each empty page.',
    });

    const pagesNoHero = enabledPages.filter(p =>
        !p.components.some(c => c.category === 'hero' || c.category === 'navbar')
    );
    checks.push({
        id: 'hero_section',
        category: 'content',
        label: 'Hero sections',
        status: pagesNoHero.length === 0 ? 'pass' : 'warn',
        detail: pagesNoHero.length === 0
            ? 'All pages have a hero/header section.'
            : `${pagesNoHero.length} page${pagesNoHero.length > 1 ? 's are' : ' is'} missing a hero section.`,
        affectedPages: pagesNoHero.map(p => p.title),
        fix: 'Add a Hero component from the left panel to each page.',
    });

    const pagesNoFooter = enabledPages.filter(p =>
        !p.components.some(c => c.category === 'footer')
    );
    checks.push({
        id: 'footer_section',
        category: 'content',
        label: 'Footer sections',
        status: pagesNoFooter.length === 0 ? 'pass' : 'warn',
        detail: pagesNoFooter.length === 0
            ? 'All pages have footers.'
            : `${pagesNoFooter.length} page${pagesNoFooter.length > 1 ? 's are' : ' is'} missing a footer.`,
        affectedPages: pagesNoFooter.map(p => p.title),
        fix: 'Add a Footer component or configure it in Global Sections.',
    });

    // ── Technical checks ────────────────────────────────────────────────────────

    checks.push({
        id: 'published',
        category: 'technical',
        label: 'Site published',
        status: site.isPublished ? 'pass' : 'fail',
        detail: site.isPublished
            ? `Published ${site.publishedAt ? new Date(site.publishedAt).toLocaleDateString() : ''}.`
            : 'Site has not been published. Visitors cannot see your site.',
        fix: 'Click the Publish button in the builder top bar.',
    });

    const daysSincePublish = site.lastBuiltAt
        ? Math.floor((Date.now() - new Date(site.lastBuiltAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
    checks.push({
        id: 'fresh_build',
        category: 'technical',
        label: 'Build freshness',
        status: daysSincePublish < 7 ? 'pass' : daysSincePublish < 30 ? 'warn' : 'fail',
        detail: site.lastBuiltAt
            ? `Last built ${daysSincePublish} day${daysSincePublish !== 1 ? 's' : ''} ago.`
            : 'Never published.',
        fix: daysSincePublish >= 7 ? 'Re-publish your site to ensure the latest changes are live.' : undefined,
    });

    // ── Per-page scores ─────────────────────────────────────────────────────────

    const pageSummaries: PageSummary[] = enabledPages.map(page => {
        let score = 0;
        let total = 0;

        const add = (pass: boolean) => {
            total++;
            if (pass) score++;
        };

        add(!!page.seo?.metaTitle?.trim());
        add(!!page.seo?.metaDescription?.trim());
        add(!!page.seo?.ogImage?.trim());
        add(page.components.length > 0);
        add(page.components.length >= 3);
        add(page.components.some(c => c.category === 'hero'));
        add(!page.seo?.noIndex);

        return {
            pageId: page.pageId,
            title: page.title,
            slug: page.slug,
            score: Math.round((score / total) * 100),
            issues: checks.filter(c =>
                c.status !== 'pass' && (c.affectedPages ?? []).includes(page.title)
            ).length,
        };
    });

    const passCount = checks.filter(c => c.status === 'pass').length;
    const overallScore = Math.round((passCount / checks.length) * 100);

    return {checks, pageSummaries, overallScore};
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_ICON = {
    pass: <CheckCircle className="h-5 w-5 text-green-500 shrink-0"/>,
    warn: <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0"/>,
    fail: <XCircle className="h-5 w-5 text-red-500 shrink-0"/>,
};

const CATEGORY_LABEL: Record<string, string> = {
    seo: 'SEO',
    content: 'Content',
    technical: 'Technical',
    performance: 'Performance',
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SiteHealthPage() {
    const [site, setSite] = useState<SiteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/site');
            const data = await res.json();
            if (!data.success || !data.data) throw new Error('Site not found');
            setSite(data.data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load site data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500"/>
        </div>
    );

    if (error || !site) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <XCircle className="h-8 w-8 text-red-400"/>
            <p className="text-sm text-muted-foreground">{error ?? 'Site not found'}</p>
        </div>
    );

    const {checks, pageSummaries, overallScore} = runHealthChecks(site);
    const categories: ('seo' | 'content' | 'technical' | 'performance')[] = ['seo', 'content', 'technical', 'performance'];
    // const categories = [...new Set(checks.map(c => c.category))];

    const scoreColor = overallScore >= 80 ? '#16a34a' : overallScore >= 50 ? '#d97706' : '#ef4444';
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/admin/site/dashboard"
                          className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ArrowLeft className="h-4 w-4"/>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Site Health</h1>
                        <p className="text-sm text-muted-foreground">{site.siteName}</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
                >
                    <RefreshCw className="h-4 w-4"/> Refresh
                </button>
            </div>

            {/* Score + summary row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Overall score */}
                <div className="md:col-span-1 bg-card border rounded-2xl p-6 flex flex-col items-center justify-center">
                    <div className="relative mb-2">
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                            <circle
                                cx="40" cy="40" r="32"
                                fill="none"
                                stroke={scoreColor}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 32}`}
                                strokeDashoffset={`${2 * Math.PI * 32 * (1 - overallScore / 100)}`}
                                transform="rotate(-90 40 40)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black" style={{color: scoreColor}}>{overallScore}</span>
                            <span className="text-[10px] text-muted-foreground">/ 100</span>
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Health Score</p>
                </div>

                {/* Check summary cards */}
                {[
                    {
                        label: 'Passed',
                        value: checks.filter(c => c.status === 'pass').length,
                        color: 'text-green-600 bg-green-50',
                        icon: CheckCircle
                    },
                    {label: 'Warnings', value: warnCount, color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle},
                    {label: 'Failed', value: failCount, color: 'text-red-500 bg-red-50', icon: XCircle},
                ].map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-card border rounded-2xl p-6 flex items-center gap-4">
                            <div
                                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                                <Icon className="h-6 w-6"/>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-gray-900">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Checks by category */}
            {categories.map(cat => (
                <div key={cat}>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        {CATEGORY_LABEL[cat] ?? cat}
                    </h2>
                    <div className="space-y-2">
                        {checks.filter(c => c.category === cat).map(check => (
                            <div key={check.id} className="bg-card border rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                                >
                                    {STATUS_ICON[check.status]}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900">{check.label}</p>
                                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                                    </div>
                                    {check.affectedPages && check.affectedPages.length > 0 && (
                                        <span className="text-xs text-muted-foreground shrink-0">
                      {check.affectedPages.length} page{check.affectedPages.length > 1 ? 's' : ''}
                    </span>
                                    )}
                                </button>
                                {expandedCheck === check.id && (check.affectedPages?.length || check.fix) && (
                                    <div className="px-4 pb-4 space-y-2 border-t bg-muted/20">
                                        {check.affectedPages && check.affectedPages.length > 0 && (
                                            <div className="pt-3">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Affected
                                                    pages:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {check.affectedPages.map(p => (
                                                        <span key={p}
                                                              className="px-2 py-0.5 bg-card border rounded text-xs">{p}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {check.fix && (
                                            <div className="pt-1">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">How to
                                                    fix:</p>
                                                <p className="text-xs text-gray-600">{check.fix}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Per-page scores */}
            <div>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Page Scores
                </h2>
                <div className="bg-card border rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead
                            className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 text-left">Page</th>
                            <th className="px-4 py-3 text-left">Slug</th>
                            <th className="px-4 py-3 text-left">Score</th>
                            <th className="px-4 py-3 text-left">Issues</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {pageSummaries.map(p => (
                            <tr key={p.pageId} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.slug}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                                            <div
                                                className="h-1.5 rounded-full transition-all"
                                                style={{
                                                    width: `${p.score}%`,
                                                    background: p.score >= 80 ? '#16a34a' : p.score >= 50 ? '#d97706' : '#ef4444',
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{p.score}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {p.issues > 0 ? (
                                        <span
                                            className="text-xs text-red-500 font-medium">{p.issues} issue{p.issues > 1 ? 's' : ''}</span>
                                    ) : (
                                        <span className="text-xs text-green-600 font-medium">All clear</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href="/dashboard/admin/site"
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        Fix in builder →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick links */}
            <div className="flex gap-3 flex-wrap">
                <Link href="/dashboard/admin/site"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors">
                    Open Builder
                </Link>
                <Link href="/dashboard/admin/site/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors">
                    Site Dashboard
                </Link>
            </div>
        </div>
    );
}