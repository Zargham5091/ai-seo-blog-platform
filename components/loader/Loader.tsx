"use client";

import * as React from "react";
import {cn} from "@/lib/utils";

// Add these keyframes to your globals.css:
//
// @keyframes loader-tail {
//   0%,100% { stroke-dashoffset: 56; opacity: .15; }
//   50%      { stroke-dashoffset: 8;  opacity: 1;   }
// }
// @keyframes loader-dot {
//   0%,100% { transform: scale(.4); opacity: .2; }
//   50%      { transform: scale(1);  opacity: 1;  }
// }
// @keyframes loader-glit1 {
//   0%,100% { opacity:0; transform:translate(0,0) scale(0); }
//   30%     { opacity:1; transform:translate(-4px,-6px) scale(1); }
//   70%     { opacity:.2; }
// }
// @keyframes loader-glit2 {
//   0%,100% { opacity:0; transform:translate(0,0) scale(0); }
//   35%     { opacity:.9; transform:translate(5px,-5px) scale(1); }
//   70%     { opacity:.1; }
// }
// @keyframes loader-glit3 {
//   0%,100% { opacity:0; transform:translate(0,0) scale(0); }
//   40%     { opacity:.7; transform:translate(-3px,4px) scale(1); }
//   70%     { opacity:.1; }
// }

interface LoaderProps {
    /** Render as fixed full-page overlay */
    fullPage?: boolean;
    /** Dynamic label — "Loading blogs…", "Loading users…" etc. */
    text?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

const SIZES = {
    sm: {svg: 20, dot: 4},
    md: {svg: 24, dot: 5},
    lg: {svg: 32, dot: 6},
};

const TEXT_CLS = {sm: "text-xs", md: "text-sm", lg: "text-base"};

function SpinnerSVG({size, gradId}: { size: number; gradId: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="animate-[spin_1s_linear_infinite]"
        >
            {/* outer track */}
            <circle
                cx="12" cy="12" r="10"
                stroke="#6366f1"
                strokeWidth="4"
                style={{opacity: 0.18}}
            />
            {/* glitter tail arc */}
            <circle
                cx="12" cy="12" r="10"
                stroke={`url(#${gradId})`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="56"
                strokeDashoffset="8"
                className="animate-[loader-tail_1.5s_ease-in-out_infinite]"
            />
            <defs>
                <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="12" y1="2" x2="24" y2="24">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0"/>
                    <stop offset="55%" stopColor="#818cf8"/>
                    <stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
            </defs>
        </svg>
    );
}

function GlitterSparks({scale}: { scale: number }) {
    const s = scale;
    return (
        <>
            <div className="absolute rounded-full bg-indigo-200 animate-[loader-glit1_2s_ease-in-out_infinite]"
                 style={{width: 3 * s, height: 3 * s, top: -3 * s, right: -2 * s}}/>
            <div className="absolute rounded-full bg-sky-200 animate-[loader-glit2_2s_ease-in-out_infinite]"
                 style={{width: 2 * s, height: 2 * s, top: 0, right: -4 * s, animationDelay: ".35s"}}/>
            <div className="absolute rounded-full bg-indigo-100 animate-[loader-glit3_2s_ease-in-out_infinite]"
                 style={{width: 2 * s, height: 2 * s, bottom: -1 * s, right: -2 * s, animationDelay: ".7s"}}/>
        </>
    );
}

export function Loader({fullPage = false, text, size = "md", className}: LoaderProps) {
    const {svg, dot} = SIZES[size];
    const gradId = `loader-grad-${size}`;

    const inner = (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div className="flex items-center gap-2">
                {/* spinner with sparks */}
                <div className="relative flex-shrink-0" style={{width: svg, height: svg}}>
                    <SpinnerSVG size={svg} gradId={gradId}/>
                    <GlitterSparks scale={size === "sm" ? 0.75 : size === "lg" ? 1.2 : 1}/>
                </div>

                {/* dots inline right after circle */}
                <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="rounded-full animate-[loader-dot_1.2s_ease-in-out_infinite]"
                            style={{
                                width: dot,
                                height: dot,
                                background: i === 0 ? "#6366f1" : i === 1 ? "#818cf8" : "#38bdf8",
                                animationDelay: `${i * 0.18}s`,
                            }}
                        />
                    ))}
                </div>

                {/* text inline */}
                {text && (
                    <p className={cn("text-muted-foreground font-medium", TEXT_CLS[size])}>
                        {text}
                    </p>
                )}
            </div>
            <span className="sr-only">{text ?? "Loading…"}</span>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                {inner}
            </div>
        );
    }

    return inner;
}