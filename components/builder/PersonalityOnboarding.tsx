'use client';

/**
 * components/builder/PersonalityOnboarding.tsx
 *
 * Step 2 of onboarding — shown AFTER site type is selected, BEFORE the builder loads.
 * Collects: vibe words, color palette preference, target audience description.
 * Calls /api/site/personality to apply AI-configured theme + returns to builder.
 *
 * PLACEMENT IN page.tsx:
 *   1. Import this component at top of page.tsx
 *   2. Add state: const [showPersonality, setShowPersonality] = useState(false);
 *   3. In handleOnboarding(), after setSite(d.data), instead of setShowOnboarding(false):
 *        setSite(d.data); setShowOnboarding(false); setShowPersonality(true);
 *   4. Add render guard after `if (showOnboarding)` line:
 *        if (showPersonality) return (
 *          <PersonalityOnboarding
 *            siteType={site?.siteType ?? 'custom'}
 *            onComplete={(updatedSite) => { setSite(updatedSite); setShowPersonality(false); }}
 *            onSkip={() => setShowPersonality(false)}
 *          />
 *        );
 */

import {useState} from 'react';
import {Sparkles, Loader2, ArrowRight, Check} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PersonalityOnboardingProps {
    siteType: string;
    onComplete: (updatedSite: unknown) => void;
    onSkip: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static config
// ─────────────────────────────────────────────────────────────────────────────

const VIBE_OPTIONS = [
    {id: 'bold', label: 'Bold & Confident', emoji: '💪', desc: 'Strong, impactful, makes a statement'},
    {id: 'minimal', label: 'Clean & Minimal', emoji: '✨', desc: 'Simple, elegant, lets content breathe'},
    {id: 'playful', label: 'Fun & Playful', emoji: '🎉', desc: 'Energetic, colorful, approachable'},
    {id: 'professional', label: 'Trustworthy & Pro', emoji: '🤝', desc: 'Corporate, serious, builds credibility'},
    {id: 'creative', label: 'Creative & Artistic', emoji: '🎨', desc: 'Unique, expressive, visually driven'},
    {id: 'warm', label: 'Warm & Friendly', emoji: '☀️', desc: 'Welcoming, personal, community feel'},
];

const PALETTE_OPTIONS = [
    {id: 'indigo', label: 'Indigo', colors: ['#4F46E5', '#818CF8', '#E0E7FF']},
    {id: 'rose', label: 'Rose', colors: ['#E11D48', '#FB7185', '#FFE4E6']},
    {id: 'emerald', label: 'Emerald', colors: ['#059669', '#34D399', '#D1FAE5']},
    {id: 'amber', label: 'Amber', colors: ['#D97706', '#FCD34D', '#FEF3C7']},
    {id: 'sky', label: 'Sky', colors: ['#0284C7', '#38BDF8', '#E0F2FE']},
    {id: 'violet', label: 'Violet', colors: ['#7C3AED', '#A78BFA', '#EDE9FE']},
    {id: 'slate', label: 'Slate', colors: ['#0F172A', '#475569', '#F1F5F9']},
    {id: 'pink', label: 'Pink', colors: ['#BE185D', '#F472B6', '#FCE7F3']},
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PersonalityOnboarding({siteType, onComplete, onSkip}: PersonalityOnboardingProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
    const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
    const [audience, setAudience] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleApply() {
        if (!selectedVibe || !selectedPalette) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/site/personality', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({vibe: selectedVibe, palette: selectedPalette, audience, siteType}),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error ?? 'Failed');
            onComplete(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
            <div className="max-w-2xl w-full">

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`h-2 rounded-full transition-all ${
                                s === step ? 'w-8 bg-indigo-600' : s < step ? 'w-2 bg-indigo-400' : 'w-2 bg-gray-200'
                            }`}
                        />
                    ))}
                </div>

                {/* Step 1 — Vibe */}
                {step === 1 && (
                    <div>
                        <div className="text-center mb-8">
              <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                <Sparkles className="h-3.5 w-3.5"/> Personality Setup
              </span>
                            <h1 className="text-3xl font-black text-gray-900 mb-2">What's your vibe?</h1>
                            <p className="text-gray-500">This shapes your typography, spacing, and overall feel.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            {VIBE_OPTIONS.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVibe(v.id)}
                                    className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                                        selectedVibe === v.id
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                                            : 'border-border bg-card hover:border-indigo-200'
                                    }`}
                                >
                                    {selectedVibe === v.id && (
                                        <div
                                            className="absolute top-2 right-2 h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white"/>
                                        </div>
                                    )}
                                    <span className="text-2xl mb-2">{v.emoji}</span>
                                    <p className="font-semibold text-sm">{v.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{v.desc}</p>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={onSkip}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Skip setup →
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!selectedVibe}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                            >
                                Continue <ArrowRight className="h-4 w-4"/>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2 — Color palette */}
                {step === 2 && (
                    <div>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-gray-900 mb-2">Pick your colors</h1>
                            <p className="text-gray-500">We'll use this as your primary color palette.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                            {PALETTE_OPTIONS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPalette(p.id)}
                                    className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
                                        selectedPalette === p.id
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                                            : 'border-border bg-card hover:border-gray-300'
                                    }`}
                                >
                                    {selectedPalette === p.id && (
                                        <div
                                            className="absolute top-2 right-2 h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white"/>
                                        </div>
                                    )}
                                    <div className="flex gap-1">
                                        {p.colors.map((c, i) => (
                                            <div key={i} className="h-7 w-7 rounded-full border border-white shadow-sm"
                                                 style={{background: c}}/>
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{p.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(1)}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!selectedPalette}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                            >
                                Continue <ArrowRight className="h-4 w-4"/>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 — Audience */}
                {step === 3 && (
                    <div>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-gray-900 mb-2">Who's your audience?</h1>
                            <p className="text-gray-500">Optional — helps us write better placeholder copy for your
                                site.</p>
                        </div>
                        <div className="bg-card rounded-2xl border p-6 mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Describe your target audience (optional)
                            </label>
                            <textarea
                                value={audience}
                                onChange={e => setAudience(e.target.value)}
                                rows={3}
                                placeholder={`e.g. "Small business owners who need affordable marketing help" or "Tech-savvy developers looking for productivity tools"`}
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mb-4">{error}</p>
                        )}

                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(2)}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                ← Back
                            </button>
                            <div className="flex items-center gap-3">
                                <button onClick={onSkip}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Skip
                                </button>
                                <button
                                    onClick={handleApply}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-60 hover:bg-indigo-700 transition-colors"
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin"/> Applying magic…</>
                                    ) : (
                                        <><Sparkles className="h-4 w-4"/> Build My Site</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}