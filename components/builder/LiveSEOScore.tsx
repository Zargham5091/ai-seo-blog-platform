'use client';

/**
 * components/builder/LiveSEOScore.tsx
 *
 * Live SEO score badge shown in the builder top bar.
 * Scores the ACTIVE page based on: title, meta description, OG image,
 * heading structure (inferred from components), and component completeness.
 * No API call needed — fully client-side calculation.
 *
 * PLACEMENT IN page.tsx top bar — after the publish button:
 *   import { LiveSEOScore } from '@/components/builder/LiveSEOScore';
 *
 *   <LiveSEOScore
 *     page={activePage}
 *     componentCount={components.length}
 *     hasHero={components.some(c => c.category === 'hero')}
 *     hasFooter={components.some(c => c.category === 'footer')}
 *   />
 */

import {useState} from 'react';
import {Search, X, CheckCircle, AlertCircle, XCircle} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PageSEO {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    noIndex?: boolean;
}

interface UserPage {
    title: string;
    slug: string;
    seo: PageSEO;
}

interface LiveSEOScoreProps {
    page: UserPage | null;
    componentCount: number;
    hasHero: boolean;
    hasFooter: boolean;
}

interface SEOCheck {
    label: string;
    pass: boolean;
    warn: boolean;
    tip: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score calculation
// ─────────────────────────────────────────────────────────────────────────────

function calculateSEO(page: UserPage, componentCount: number, hasHero: boolean, hasFooter: boolean): {
    score: number;
    checks: SEOCheck[];
} {
    const checks: SEOCheck[] = [];
    const seo = page.seo ?? {};

    const titleLen = (seo.metaTitle ?? page.title ?? '').length;
    checks.push({
        label: 'Page title',
        pass: titleLen >= 30 && titleLen <= 60,
        warn: titleLen > 0 && (titleLen < 30 || titleLen > 60),
        tip: titleLen === 0
            ? 'Add a meta title (30–60 characters)'
            : titleLen < 30
                ? `Title is too short (${titleLen} chars). Aim for 30–60.`
                : titleLen > 60
                    ? `Title is too long (${titleLen} chars). Keep under 60.`
                    : `Good length (${titleLen} chars)`,
    });

    const descLen = (seo.metaDescription ?? '').length;
    checks.push({
        label: 'Meta description',
        pass: descLen >= 80 && descLen <= 160,
        warn: descLen > 0 && (descLen < 80 || descLen > 160),
        tip: descLen === 0
            ? 'Add a meta description (80–160 characters)'
            : descLen < 80
                ? `Description too short (${descLen} chars). Aim for 80–160.`
                : descLen > 160
                    ? `Description too long (${descLen} chars). Keep under 160.`
                    : `Good length (${descLen} chars)`,
    });

    checks.push({
        label: 'OG image',
        pass: !!seo.ogImage,
        warn: false,
        tip: seo.ogImage ? 'OG image set ✓' : 'Add an OG image for better social sharing',
    });

    checks.push({
        label: 'Hero section',
        pass: hasHero,
        warn: false,
        tip: hasHero ? 'Hero section present ✓' : 'Add a hero section — search engines use it for context',
    });

    checks.push({
        label: 'Footer section',
        pass: hasFooter,
        warn: false,
        tip: hasFooter ? 'Footer present ✓' : 'Add a footer with links to improve crawlability',
    });

    checks.push({
        label: 'Content depth',
        pass: componentCount >= 4,
        warn: componentCount >= 2 && componentCount < 4,
        tip: componentCount < 2
            ? 'Add more sections — pages need content to rank'
            : componentCount < 4
                ? `${componentCount} sections — 4+ is better for SEO`
                : `${componentCount} sections ✓`,
    });

    checks.push({
        label: 'No-index off',
        pass: !seo.noIndex,
        warn: false,
        tip: seo.noIndex ? '⚠ This page is set to no-index — it won\'t appear in search results' : 'Page is indexable ✓',
    });

    const passCount = checks.filter(c => c.pass).length;
    const score = Math.round((passCount / checks.length) * 100);

    return {score, checks};
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LiveSEOScore({page, componentCount, hasHero, hasFooter}: LiveSEOScoreProps) {
    const [open, setOpen] = useState(false);

    if (!page) return null;

    const {score, checks} = calculateSEO(page, componentCount, hasHero, hasFooter);

    const color = score >= 80 ? 'text-green-600 bg-green-50 border-green-200'
        : score >= 50 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
            : 'text-red-500 bg-red-50 border-red-200';

    const ring = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#ef4444';

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${color}`}
                title="SEO Score"
            >
                <Search className="h-3 w-3"/>
                SEO {score}
            </button>

            {open && (
                <div className="absolute right-0 top-8 z-50 bg-card border rounded-2xl shadow-xl w-72 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-bold text-sm">SEO Score</p>
                        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                            <X className="h-3.5 w-3.5"/>
                        </button>
                    </div>

                    {/* Score ring */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                            <svg width="80" height="80" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                                <circle
                                    cx="40" cy="40" r="32"
                                    fill="none"
                                    stroke={ring}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 32}`}
                                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                                    transform="rotate(-90 40 40)"
                                    style={{transition: 'stroke-dashoffset 0.5s ease'}}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black" style={{color: ring}}>{score}</span>
                                <span className="text-[10px] text-muted-foreground">/ 100</span>
                            </div>
                        </div>
                    </div>

                    {/* Checks list */}
                    <div className="space-y-2">
                        {checks.map(c => (
                            <div key={c.label} className="flex items-start gap-2">
                                {c.pass
                                    ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/>
                                    : c.warn
                                        ? <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0"/>
                                        : <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0"/>
                                }
                                <div>
                                    <p className="text-xs font-medium text-gray-700">{c.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{c.tip}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}