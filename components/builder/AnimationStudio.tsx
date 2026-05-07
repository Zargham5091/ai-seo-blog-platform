'use client';

/**
 * components/builder/AnimationStudio.tsx
 *
 * Visual animation picker for the selected canvas component.
 * Writes to `animationPreset` field on ICanvasComponent (already in your model).
 * The renderer injects the preset class + IntersectionObserver JS into the iframe.
 *
 * PLACEMENT IN page.tsx:
 * 1. Import: import { AnimationStudio } from '@/components/builder/AnimationStudio';
 * 2. Add 'animation' to RightPanel type (already done in wiring patch)
 * 3. Add a wand icon button in the props panel header:
 *      <button onClick={() => setRightPanel('animation')} title="Animate">
 *        <Wand2 className="h-4 w-4"/>
 *      </button>
 * 4. Add right panel case:
 *      {rightPanel === 'animation' && selectedComp && (
 *        <AnimationStudio
 *          instanceId={selectedComp.instanceId}
 *          currentPreset={selectedComp.animationPreset ?? ''}
 *          onApply={(preset) => {
 *            updateComp(selectedComp.instanceId, { animationPreset: preset });
 *            setRightPanel('props');
 *          }}
 *          onClose={() => setRightPanel(null)}
 *        />
 *      )}
 *
 * NOTE: updateComp here means a targeted update — add this helper near your
 * existing updateComps (which replaces the full array):
 *   const updateComp = useCallback((instanceId: string, patch: Partial<ICanvasComponent>) => {
 *     const updated = components.map(c =>
 *       c.instanceId === instanceId ? { ...c, ...patch } : c
 *     );
 *     updateComps(updated);
 *   }, [components, updateComps]);
 */

import {useState} from 'react';
import {Check, X} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Animation presets
// Each preset maps to CSS classes injected by the renderer.
// The renderer already supports animationPreset via the existing cssCode field.
// ─────────────────────────────────────────────────────────────────────────────

interface AnimationPreset {
    id: string;
    label: string;
    emoji: string;
    description: string;
    cssClass: string;       // class added to the component wrapper
    previewStyle: string;   // inline style for demo box preview
}

const PRESETS: AnimationPreset[] = [
    {
        id: '',
        label: 'None',
        emoji: '🚫',
        description: 'No animation',
        cssClass: '',
        previewStyle: '',
    },
    {
        id: 'fade-up',
        label: 'Fade Up',
        emoji: '⬆️',
        description: 'Fades in from below',
        cssClass: 'sc-anim-fade-up',
        previewStyle: 'animation: fadeUp 0.6s ease forwards',
    },
    {
        id: 'fade-in',
        label: 'Fade In',
        emoji: '✨',
        description: 'Simple fade in',
        cssClass: 'sc-anim-fade-in',
        previewStyle: 'animation: fadeIn 0.6s ease forwards',
    },
    {
        id: 'slide-left',
        label: 'Slide Left',
        emoji: '⬅️',
        description: 'Slides in from right',
        cssClass: 'sc-anim-slide-left',
        previewStyle: 'animation: slideLeft 0.6s ease forwards',
    },
    {
        id: 'slide-right',
        label: 'Slide Right',
        emoji: '➡️',
        description: 'Slides in from left',
        cssClass: 'sc-anim-slide-right',
        previewStyle: 'animation: slideRight 0.6s ease forwards',
    },
    {
        id: 'zoom-in',
        label: 'Zoom In',
        emoji: '🔍',
        description: 'Scales up from small',
        cssClass: 'sc-anim-zoom-in',
        previewStyle: 'animation: zoomIn 0.5s ease forwards',
    },
    {
        id: 'bounce-in',
        label: 'Bounce',
        emoji: '🎾',
        description: 'Bouncy entrance',
        cssClass: 'sc-anim-bounce',
        previewStyle: 'animation: bounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards',
    },
    {
        id: 'flip-up',
        label: 'Flip Up',
        emoji: '🔄',
        description: 'Flips in from bottom',
        cssClass: 'sc-anim-flip-up',
        previewStyle: 'animation: flipUp 0.6s ease forwards',
    },
];

const DURATION_OPTIONS = [
    {value: '0.3s', label: 'Fast (0.3s)'},
    {value: '0.6s', label: 'Normal (0.6s)'},
    {value: '0.9s', label: 'Slow (0.9s)'},
    {value: '1.2s', label: 'Very slow (1.2s)'},
];

const DELAY_OPTIONS = [
    {value: '0s', label: 'No delay'},
    {value: '0.1s', label: '0.1s'},
    {value: '0.2s', label: '0.2s'},
    {value: '0.3s', label: '0.3s'},
    {value: '0.5s', label: '0.5s'},
    {value: '0.8s', label: '0.8s'},
];

// ─────────────────────────────────────────────────────────────────────────────
// The full animationPreset value stored is: "presetId|duration|delay"
// e.g. "fade-up|0.6s|0.2s"
// The renderer parses this and injects the correct CSS + JS.
// ─────────────────────────────────────────────────────────────────────────────

function parsePreset(raw: string): { id: string; duration: string; delay: string } {
    const [id = '', duration = '0.6s', delay = '0s'] = raw.split('|');
    return {id, duration, delay};
}

function buildPreset(id: string, duration: string, delay: string): string {
    if (!id) return '';
    return `${id}|${duration}|${delay}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface AnimationStudioProps {
    instanceId: string;
    currentPreset: string;
    onApply: (preset: string) => void;
    onClose: () => void;
}

export function AnimationStudio({currentPreset, onApply, onClose}: AnimationStudioProps) {
    const parsed = parsePreset(currentPreset);
    const [selectedId, setSelectedId] = useState(parsed.id);
    const [duration, setDuration] = useState(parsed.duration || '0.6s');
    const [delay, setDelay] = useState(parsed.delay || '0s');
    const [previewing, setPreviewing] = useState<string | null>(null);

    function handleApply() {
        onApply(buildPreset(selectedId, duration, delay));
    }

    function triggerPreview(id: string) {
        setPreviewing(null);
        setTimeout(() => setPreviewing(id), 50); // remount to restart animation
    }

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <div>
                    <p className="font-semibold text-sm">Animation Studio</p>
                    <p className="text-xs text-muted-foreground">Entrance animation on scroll</p>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-muted">
                    <X className="h-4 w-4"/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

                {/* Preset grid */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Effect</p>
                    <div className="grid grid-cols-2 gap-2">
                        {PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => {
                                    setSelectedId(preset.id);
                                    triggerPreview(preset.id);
                                }}
                                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all hover:shadow-sm ${
                                    selectedId === preset.id
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                                        : 'border-border bg-card hover:border-gray-300'
                                }`}
                            >
                                {selectedId === preset.id && (
                                    <div
                                        className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-white"/>
                                    </div>
                                )}

                                {/* Mini preview box */}
                                <div
                                    className="h-8 w-12 bg-indigo-100 rounded overflow-hidden flex items-center justify-center">
                                    {previewing === preset.id && preset.id ? (
                                        <div
                                            key={previewing}
                                            className="h-5 w-8 bg-indigo-500 rounded-sm"
                                            style={{animationFillMode: 'forwards', ...parseAnimStyle(preset.previewStyle)}}
                                        />
                                    ) : (
                                        <div
                                            className={`h-5 w-8 rounded-sm ${preset.id ? 'bg-indigo-400' : 'bg-gray-300'}`}/>
                                    )}
                                </div>

                                <span className="text-xs font-medium text-gray-700">{preset.emoji} {preset.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                {selectedId && (
                    <>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Duration</p>
                            <div className="grid grid-cols-2 gap-2">
                                {DURATION_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDuration(opt.value)}
                                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                                            duration === opt.value
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-border hover:border-gray-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Delay</p>
                            <div className="grid grid-cols-3 gap-2">
                                {DELAY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDelay(opt.value)}
                                        className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                                            delay === opt.value
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-border hover:border-gray-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Apply button */}
            <div className="px-4 py-3 border-t shrink-0 flex gap-2">
                <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

// Parse inline style string into React style object (for preview only)
function parseAnimStyle(style: string): React.CSSProperties {
    if (!style) return {};
    const result: Record<string, string> = {};
    style.split(';').forEach(part => {
        const [k, v] = part.split(':').map(s => s.trim());
        if (k && v) {
            const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            result[camel] = v;
        }
    });
    return result as React.CSSProperties;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDERER INTEGRATION — add to lib/builder/renderer.ts
//
// In buildIframeDocument(), after injecting Tailwind CDN, add this CSS block:
//
// const ANIMATION_CSS = `
// <style>
// .sc-anim-fade-up    { opacity:0; transform:translateY(32px); }
// .sc-anim-fade-in    { opacity:0; }
// .sc-anim-slide-left { opacity:0; transform:translateX(40px); }
// .sc-anim-slide-right{ opacity:0; transform:translateX(-40px); }
// .sc-anim-zoom-in    { opacity:0; transform:scale(0.85); }
// .sc-anim-bounce     { opacity:0; transform:scale(0.7); }
// .sc-anim-flip-up    { opacity:0; transform:perspective(400px) rotateX(30deg) translateY(20px); }
// [class*="sc-anim-"] { transition-property:opacity,transform; transition-timing-function:ease; }
// [class*="sc-anim-"].sc-visible { opacity:1; transform:none; }
// </style>
// `;
//
// And this JS block just before </body>:
//
// const ANIMATION_JS = `
// <script>
// (function(){
//   var els = document.querySelectorAll('[data-anim]');
//   if (!els.length) return;
//   var io = new IntersectionObserver(function(entries){
//     entries.forEach(function(e){
//       if(e.isIntersecting){
//         var el = e.target;
//         var parts = (el.dataset.anim||'').split('|');
//         var dur = parts[1]||'0.6s', del = parts[2]||'0s';
//         el.style.transitionDuration = dur;
//         el.style.transitionDelay = del;
//         el.classList.add('sc-visible');
//         io.unobserve(el);
//       }
//     });
//   },{threshold:0.1});
//   els.forEach(function(el){ io.observe(el); });
// })();
// </script>
// `;
//
// Then when rendering each CanvasComponent, if animationPreset is set:
// wrap the component HTML with:
//   <div class="sc-anim-{presetId}" data-anim="{fullPresetString}">
//     {componentHtml}
//   </div>
// ─────────────────────────────────────────────────────────────────────────────