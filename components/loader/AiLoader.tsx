"use client";

import {useEffect, useRef} from "react";
import {cn} from "@/lib/utils";

interface AILoaderProps {
    isGenerating: boolean;
    /** Dynamic text shown center screen e.g. "Writing your blog post…" */
    title?: string;
    /** Smaller subtitle */
    subtitle?: string;
    className?: string;
}

/**
 * AILoader — full-screen transparent cloth wave overlay.
 * Canvas fills 100% width/height, grid is oversized so waves
 * never leave empty edges. The surface breathes in/out and
 * ripples across the whole screen like a hanging silk cloth.
 *
 * Usage:
 *   <AILoader isGenerating={isWriting} title="Writing your blog post…" subtitle="Hang tight" />
 */
export function AILoader({isGenerating, title = "AI is generating…", subtitle, className}: AILoaderProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        if (!isGenerating) return;
        const canvas = canvasRef.current as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        if (!ctx) return;

        const COLS = 55, ROWS = 32;
        // oversample beyond screen edges so waves never leave gaps
        const OVERFLOW = 0.18;
        let t = 0;

        const C1 = [99, 102, 241], C2 = [56, 189, 248], C3 = [139, 92, 246], C4 = [14, 165, 233];

        function mix(a: number[], b: number[], f: number) {
            return a.map((v, i) => v + (b[i] - v) * f);
        }

        function getCol(nx: number, ny: number, time: number) {
            const f1 = (Math.sin(nx * 4.2 + time * 0.8) + 1) * 0.5;
            const f2 = (Math.cos(ny * 3.8 - time * 0.7) + 1) * 0.5;
            const f3 = (Math.sin((nx + ny) * 3.2 + time * 0.55) + 1) * 0.5;
            let col = mix(C1, C2, f1);
            col = mix(col, C3, f2 * 0.65);
            col = mix(col, C4, f3 * 0.35);
            return col;
        }

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        resize();
        window.addEventListener("resize", resize);

        function draw() {
            t += 0.007;
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            const breathe = (Math.sin(t * 0.85) + 1) * 0.5;

            // grid goes -OVERFLOW to 1+OVERFLOW so edges always covered
            const pts: { x: number; y: number; z: number; color: number[] }[][] = [];

            for (let r = 0; r <= ROWS; r++) {
                pts[r] = [];
                for (let cl = 0; cl <= COLS; cl++) {
                    // extend grid beyond screen bounds
                    const nx = -OVERFLOW + (cl / COLS) * (1 + OVERFLOW * 2);
                    const ny = -OVERFLOW + (r / ROWS) * (1 + OVERFLOW * 2);

                    const bx = nx * W;
                    const by = ny * H;

                    const breatheZ = breathe * 38;

                    // multiple wave frequencies for organic feel
                    const z =
                        Math.sin(nx * 6 + t * 1.3) * 34 +
                        Math.cos(ny * 5.2 - t * 1.1) * 30 +
                        Math.sin((nx + ny) * 4.2 + t * 0.8) * 22 +
                        Math.cos(nx * 8.5 - ny * 3.8 + t * 1.6) * 14 +
                        Math.sin(nx * 2.8 - ny * 6.5 + t * 0.6) * 18 +
                        breatheZ;

                    // z → visible y displacement (the wave you see)
                    const yOff = z * 0.52;

                    const light = Math.min(1, (z + 100) / 200);
                    const color = getCol(nx, ny, t);
                    // transparent: base alpha ~0.55, lit parts slightly more
                    const lit = color.map(v => Math.min(255, v + light * 50));

                    pts[r][cl] = {x: bx, y: by + yOff, z, color: lit};
                }
            }

            for (let r = 0; r < ROWS; r++) {
                for (let cl = 0; cl < COLS; cl++) {
                    const p00 = pts[r][cl], p10 = pts[r][cl + 1];
                    const p01 = pts[r + 1][cl], p11 = pts[r + 1][cl + 1];
                    const ac = p00.color.map((_, i) =>
                        (p00.color[i] + p10.color[i] + p01.color[i] + p11.color[i]) / 4
                    );
                    const avgZ = (p00.z + p10.z + p01.z + p11.z) / 4;
                    // transparent — max alpha 0.68 so background shows through
                    // const alpha = 0.45 + Math.min(0.23, (avgZ + 100) / 600);
                    const alpha = 0.8 + Math.min(0.2, (avgZ + 100) / 600);


                    ctx.beginPath();
                    ctx.moveTo(p00.x, p00.y);
                    ctx.lineTo(p10.x, p10.y);
                    ctx.lineTo(p11.x, p11.y);
                    ctx.lineTo(p01.x, p01.y);
                    ctx.closePath();
                    ctx.fillStyle = `rgba(${ac.map(v => Math.round(Math.min(255, v))).join(",")},${alpha.toFixed(2)})`;
                    ctx.fill();
                }
            }

            // shimmer sweep
            const sx = ((t * 52) % (W + 280)) - 140;
            const sg = ctx.createLinearGradient(sx, 0, sx + 200, 0);
            sg.addColorStop(0, "rgba(255,255,255,0)");
            sg.addColorStop(0.5, "rgba(255,255,255,0.1)");
            sg.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = sg;
            ctx.fillRect(0, 0, W, H);

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resize);
        };
    }, [isGenerating]);

    if (!isGenerating) return null;

    return (
        <div
            role="status"
            aria-label={title}
            className={cn("fixed inset-0 z-50 overflow-hidden", className)}
        >
            {/* canvas fills 100% */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* glitter sparks */}
            <Glitter/>

            {/* dynamic text — centered, sits on top of canvas */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <p className="text-lg font-semibold text-white drop-shadow-[0_2px_12px_rgba(99,102,241,0.8)] tracking-wide">
                    {title}
                </p>
                {subtitle && (
                    <p className="text-sm text-white/70 drop-shadow-[0_1px_8px_rgba(56,189,248,0.6)]">
                        {subtitle}
                    </p>
                )}
            </div>

            <span className="sr-only">{title}</span>
        </div>
    );
}

// ── Glitter layer ─────────────────────────────────────────────────────────────

function Glitter() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = ref.current;
        if (!container) return;
        let alive = true;

        function spawn() {
            if (!alive || !container) return;
            const el = document.createElement("div");
            const isStar = Math.random() < 0.3;
            const x = Math.random() * 100;
            const y = Math.random() * 95;
            el.style.cssText = `position:absolute;left:${x}%;top:${y}%;pointer-events:none;`;
            if (isStar) {
                el.textContent = "✦";
                el.style.fontSize = `${7 + Math.random() * 5}px`;
                el.style.color = "rgba(255,255,255,0)";
            } else {
                const s = `${1.5 + Math.random() * 2.5}px`;
                el.style.cssText += `width:${s};height:${s};border-radius:50%;background:rgba(255,255,255,.92);opacity:0;`;
            }
            container.appendChild(el);

            let f = 0, py = y;
            const max = 55 + Math.random() * 40;

            (function tick() {
                f++;
                const op = f < max * 0.25
                    ? f / (max * 0.25)
                    : Math.max(0, 1 - (f - max * 0.25) / (max * 0.75));
                py -= 0.09;
                if (isStar) el.style.color = `rgba(255,255,255,${(op * 0.85).toFixed(2)})`;
                else el.style.opacity = String(op);
                el.style.top = py + "%";
                if (f < max) requestAnimationFrame(tick);
                else el.remove();
            })();

            setTimeout(spawn, 130 + Math.random() * 280);
        }

        // start 5 independent chains
        for (let i = 0; i < 5; i++) setTimeout(spawn, i * 120);

        return () => {
            alive = false;
        };
    }, []);

    return <div ref={ref} className="absolute inset-0 pointer-events-none"/>;
}