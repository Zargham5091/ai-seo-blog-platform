"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
    /** Render as fixed full-page overlay */
    fullPage?: boolean;
    /** Dynamic label — "Loading blogs…", "Loading users…" etc. */
    text?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

/**
 * PageLoader — AI-themed loader with Google-Lens–style ripple wave effect.
 *
 * Usage:
 *   <PageLoader text="Loading blogs…" />
 *   <PageLoader fullPage size="lg" text="Analyzing content…" />
 *
 * The ripple/shimmer wave is injected as a one-time <style> tag into <head>.
 * In Next.js you can move the keyframes into your global CSS instead.
 */
export function PageLoader({
                               fullPage = false,
                               text,
                               size = "md",
                               className,
                           }: LoaderProps) {
    /* ─── inject global keyframes once ─────────────────────────── */
    React.useEffect(() => {
        const id = "ai-loader-styles";
        if (document.getElementById(id)) return;
        const style = document.createElement("style");
        style.id = id;
        style.textContent = `
      /* ── ripple wave (Google-Lens style) ── */
      @keyframes ai-ripple {
        0%   { transform: scale(0.3); opacity: 0.9; }
        100% { transform: scale(4.5); opacity: 0; }
      }
      /* ── orbital ring spin ── */
      @keyframes ai-orbit {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      /* ── counter-spin inner ring ── */
      @keyframes ai-orbit-rev {
        from { transform: rotate(0deg); }
        to   { transform: rotate(-360deg); }
      }
      /* ── core pulse ── */
      @keyframes ai-pulse {
        0%, 100% { transform: scale(1);   opacity: 1; }
        50%       { transform: scale(1.18); opacity: 0.75; }
      }
      /* ── shimmer sweep ── */
      @keyframes ai-shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      /* ── floating particles ── */
      @keyframes ai-float-1 {
        0%, 100% { transform: translateY(0)   translateX(0)   scale(1);   opacity: 0.7; }
        33%       { transform: translateY(-8px) translateX(4px)  scale(1.3); opacity: 1; }
        66%       { transform: translateY(4px)  translateX(-6px) scale(0.8); opacity: 0.5; }
      }
      @keyframes ai-float-2 {
        0%, 100% { transform: translateY(0)   translateX(0)   scale(1);   opacity: 0.6; }
        50%       { transform: translateY(6px)  translateX(-5px) scale(1.2); opacity: 0.9; }
      }
      @keyframes ai-float-3 {
        0%, 100% { transform: translateY(0)   translateX(0)   scale(1);   opacity: 0.5; }
        40%       { transform: translateY(-5px) translateX(7px)  scale(1.4); opacity: 1; }
      }
      /* ── text shimmer ── */
      @keyframes ai-text-shimmer {
        0%   { background-position: -300% 0; }
        100% { background-position: 300% 0; }
      }
    `;
        document.head.appendChild(style);
    }, []);

    /* ─── size tokens ─────────────────────────────────────────── */
    const tokens = {
        sm: { wrap: 56,  core: 10, ring1: 22, ring1w: 2,   ring2: 34, ring2w: 1.5, ripple: 38, text: "text-xs", gap: "gap-2" },
        md: { wrap: 80,  core: 14, ring1: 30, ring1w: 2.5, ring2: 46, ring2w: 2,   ripple: 54, text: "text-sm", gap: "gap-3" },
        lg: { wrap: 110, core: 18, ring1: 42, ring1w: 3,   ring2: 64, ring2w: 2.5, ripple: 76, text: "text-base", gap: "gap-4" },
    }[size];

    /* ─── ripple rings ────────────────────────────────────────── */
    const ripples = [0, 0.45, 0.9];

    /* ─── particle dots ──────────────────────────────────────── */
    const particles = [
        { anim: "ai-float-1 2.1s ease-in-out infinite", top: "10%",  left: "15%",  size: size === "lg" ? 5 : size === "md" ? 4 : 3 },
        { anim: "ai-float-2 2.6s ease-in-out infinite", top: "20%",  right: "12%", size: size === "lg" ? 4 : size === "md" ? 3 : 2 },
        { anim: "ai-float-3 1.9s ease-in-out infinite", bottom: "18%", left: "20%", size: size === "lg" ? 5 : size === "md" ? 3 : 2 },
        { anim: "ai-float-1 2.4s ease-in-out infinite 0.3s", bottom: "12%", right: "16%", size: size === "lg" ? 4 : size === "md" ? 3 : 2 },
    ];

    const inner = (
        <div className={cn(`flex flex-col items-center justify-center ${tokens.gap}`, className)}>
            {/* ── icon shell ── */}
            <div
                style={{
                    position: "relative",
                    width: tokens.wrap,
                    height: tokens.wrap,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* ripple waves — Google-Lens style */}
                {ripples.map((delay, i) => (
                    <span
                        key={i}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            border: "1.5px solid rgba(99,102,241,0.55)",
                            animation: `ai-ripple 2.2s cubic-bezier(0.2,0.6,0.4,1) ${delay}s infinite`,
                            pointerEvents: "none",
                        }}
                    />
                ))}

                {/* outer dashed orbit ring */}
                <div
                    style={{
                        position: "absolute",
                        width: tokens.ring2,
                        height: tokens.ring2,
                        borderRadius: "50%",
                        border: `${tokens.ring2w}px dashed rgba(56,189,248,0.35)`,
                        animation: "ai-orbit-rev 8s linear infinite",
                    }}
                />

                {/* inner solid orbit ring */}
                <div
                    style={{
                        position: "absolute",
                        width: tokens.ring1,
                        height: tokens.ring1,
                        borderRadius: "50%",
                        border: `${tokens.ring1w}px solid transparent`,
                        borderTopColor: "#6366f1",
                        borderRightColor: "rgba(99,102,241,0.3)",
                        animation: "ai-orbit 1.2s linear infinite",
                    }}
                />

                {/* core pulsing orb */}
                <div
                    style={{
                        width: tokens.core,
                        height: tokens.core,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle at 35% 35%, #818cf8, #6366f1 50%, #4f46e5)",
                        boxShadow:
                            "0 0 12px rgba(99,102,241,0.8), 0 0 24px rgba(99,102,241,0.4)",
                        animation: "ai-pulse 1.8s ease-in-out infinite",
                        position: "relative",
                        zIndex: 1,
                    }}
                />

                {/* floating particles */}
                {particles.map((p, i) => (
                    <span
                        key={i}
                        style={{
                            position: "absolute",
                            width: p.size,
                            height: p.size,
                            borderRadius: "50%",
                            background:
                                i % 2 === 0
                                    ? "rgba(99,102,241,0.9)"
                                    : "rgba(56,189,248,0.9)",
                            animation: p.anim,
                            top: p.top,
                            left: (p as any).left,
                            right: (p as any).right,
                            bottom: p.bottom,
                        }}
                    />
                ))}
            </div>

            {/* ── label ── */}
            {text && (
                <p
                    className={cn("font-medium tracking-widest uppercase", tokens.text)}
                    style={{
                        background:
                            "linear-gradient(90deg, #94a3b8 0%, #6366f1 30%, #38bdf8 60%, #94a3b8 100%)",
                        backgroundSize: "300% 100%",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        animation: "ai-text-shimmer 2.8s linear infinite",
                    }}
                >
                    {text}
                </p>
            )}

            <span className="sr-only">{text ?? "Loading…"}</span>
        </div>
    );

    if (fullPage) {
        return (
            <>
                {/* ── full-page backdrop with lens shimmer wave ── */}
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{
                        background: "rgba(2,4,18,0.82)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                    }}
                >
                    {/* radial shimmer sweep — the "Google Lens" full-screen wave */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(ellipse 120% 80% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)",
                            animation: "ai-pulse 2.8s ease-in-out infinite",
                            pointerEvents: "none",
                        }}
                    />
                    {/* horizontal shimmer bar */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(105deg, transparent 35%, rgba(99,102,241,0.07) 50%, rgba(56,189,248,0.07) 60%, transparent 70%)",
                            backgroundSize: "200% 100%",
                            animation: "ai-shimmer 3s linear infinite",
                            pointerEvents: "none",
                        }}
                    />
                    {inner}
                </div>
            </>
        );
    }

    return inner;
}