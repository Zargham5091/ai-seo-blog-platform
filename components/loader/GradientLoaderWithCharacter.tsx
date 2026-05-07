// app/components/GradientLoaderWithCharacter.tsx
"use client";

import React, {useEffect, useState} from "react";

/* -------------------------------------------------------------------------- */
/*  SEIO CHARACTER Component (extracted from your code, with TS fixes)       */

/* -------------------------------------------------------------------------- */

interface SEIOCharacterProps {
    mood: "happy" | "thinking" | "excited" | "caring" | "sleepy" | "idle";
    size: number;
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    isWaving: boolean;
    isTalking: boolean;
}

function SEIOCharacter({
                           mood,
                           size,
                           primaryColor,
                           secondaryColor,
                           glowColor,
                           isWaving,
                           isTalking,
                       }: SEIOCharacterProps) {
    const eyeY = mood === "sleepy" ? 44 : 42;
    const pupilSize = mood === "excited" ? 7 : mood === "sleepy" ? 3 : 5;

    const mouthPath =
        mood === "happy" || mood === "excited"
            ? "M 30 58 Q 40 66 50 58"
            : mood === "caring"
                ? "M 32 60 Q 40 65 48 60"
                : mood === "thinking"
                    ? "M 33 61 Q 40 58 47 61"
                    : mood === "sleepy"
                        ? "M 34 62 Q 40 60 46 62"
                        : "M 31 60 Q 40 65 49 60";

    // For talk animation we need to handle the path transition carefully.
    // Since d attribute animation can be tricky, we'll use a simple scale transform on the mouth group.
    const MouthComponent = () => (
        <g
            style={{
                transformOrigin: "40px 62px",
                animation: isTalking ? "talkMouthScale 0.25s ease-in-out infinite alternate" : "none",
            }}
        >
            <path
                d={mouthPath}
                fill="none"
                stroke={isTalking ? glowColor : "white"}
                strokeWidth={isTalking ? "2.5" : "2"}
                strokeLinecap="round"
                opacity="0.9"
            />
        </g>
    );

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 80 90"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                overflow: "visible",
                filter: `drop-shadow(0 0 12px ${glowColor}88)`,
            }}
        >
            <defs>
                {/* Body gradient */}
                <radialGradient id="bodyGrad" cx="45%" cy="35%" r="60%">
                    <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.9"/>
                    <stop offset="100%" stopColor={primaryColor}/>
                </radialGradient>
                {/* Eye glow */}
                <radialGradient id="eyeGrad" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#ffffff"/>
                    <stop offset="60%" stopColor={secondaryColor} stopOpacity="0.8"/>
                    <stop offset="100%" stopColor={primaryColor}/>
                </radialGradient>
                {/* Inner glow filter */}
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                {/* Shimmer */}
                <radialGradient id="shimmer" cx="30%" cy="25%" r="30%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="white" stopOpacity="0"/>
                </radialGradient>
            </defs>

            {/* Shadow */}
            <ellipse cx="40" cy="88" rx="22" ry="4" fill="black" opacity="0.12"/>

            {/* Left antenna */}
            <g
                style={{
                    transformOrigin: "22px 18px",
                    animation: isTalking
                        ? "antennaTalkLeft 0.4s ease-in-out infinite alternate"
                        : "antennaIdleLeft 3s ease-in-out infinite",
                }}
            >
                <line x1="22" y1="18" x2="15" y2="6" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="14" cy="5" r="3.5" fill={glowColor} filter="url(#glow)"/>
                <circle cx="14" cy="5" r="2" fill="white" opacity="0.7"/>
            </g>

            {/* Right antenna */}
            <g
                style={{
                    transformOrigin: "58px 18px",
                    animation: isTalking
                        ? "antennaTalkRight 0.4s ease-in-out infinite alternate"
                        : "antennaIdleRight 3s ease-in-out infinite 0.5s",
                }}
            >
                <line x1="58" y1="18" x2="65" y2="6" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="66" cy="5" r="3.5" fill={glowColor} filter="url(#glow)"/>
                <circle cx="66" cy="5" r="2" fill="white" opacity="0.7"/>
            </g>

            {/* Body */}
            <ellipse cx="40" cy="55" rx="30" ry="32" fill="url(#bodyGrad)"/>
            <ellipse cx="40" cy="55" rx="30" ry="32" fill="url(#shimmer)"/>
            <ellipse cx="40" cy="55" rx="30" ry="32" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.2"/>

            {/* Chest panel */}
            <rect x="28" y="62" width="24" height="16" rx="5" fill="white" opacity="0.1"/>
            <rect x="30" y="64" width="8" height="3" rx="1.5" fill={glowColor} opacity="0.7"/>
            <rect x="42" y="64" width="8" height="3" rx="1.5" fill={secondaryColor} opacity="0.7"/>
            <rect x="30" y="70" width="20" height="2" rx="1" fill="white" opacity="0.2"/>
            <rect x="30" y="74" width="14" height="2" rx="1" fill="white" opacity="0.15"/>

            {/* Left arm */}
            <g
                style={{
                    transformOrigin: "12px 52px",
                    animation: isWaving
                        ? "waveArm 0.5s ease-in-out infinite alternate"
                        : isTalking
                            ? "talkArm 0.6s ease-in-out infinite alternate"
                            : "idleArm 4s ease-in-out infinite",
                }}
            >
                <ellipse cx="12" cy="55" rx="7" ry="9" fill={primaryColor} opacity="0.9"/>
                <ellipse cx="12" cy="55" rx="7" ry="9" fill="url(#shimmer)"/>
                <circle cx="10" cy="63" r="4" fill={primaryColor}/>
                <circle cx="10" cy="63" r="4" fill="url(#shimmer)"/>
            </g>

            {/* Right arm */}
            <g
                style={{
                    transformOrigin: "68px 52px",
                    animation: isTalking ? "talkArmRight 0.6s ease-in-out infinite alternate" : "idleArmRight 4s ease-in-out infinite 1s",
                }}
            >
                <ellipse cx="68" cy="55" rx="7" ry="9" fill={primaryColor} opacity="0.9"/>
                <ellipse cx="68" cy="55" rx="7" ry="9" fill="url(#shimmer)"/>
                <circle cx="70" cy="63" r="4" fill={primaryColor}/>
                <circle cx="70" cy="63" r="4" fill="url(#shimmer)"/>
            </g>

            {/* Big eye */}
            <circle cx="40" cy={eyeY} r="14" fill="white" opacity="0.95"/>
            <circle cx="40" cy={eyeY} r="14" fill="url(#eyeGrad)" opacity="0.3"/>
            <circle cx="40" cy={eyeY} r="14" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.4"/>

            {/* Pupil */}
            {mood === "sleepy" ? (
                <>
                    <ellipse cx="40" cy={eyeY + 2} rx="5" ry="3" fill={primaryColor}/>
                    <path d={`M 26 ${eyeY} Q 40 ${eyeY - 8} 54 ${eyeY}`} fill={secondaryColor}/>
                </>
            ) : (
                <>
                    <circle cx="40" cy={eyeY} r={pupilSize + 2} fill={primaryColor} opacity="0.15"/>
                    <circle cx="40" cy={eyeY} r={pupilSize} fill={primaryColor}/>
                    <circle cx="43" cy={eyeY - 2} r="2" fill="white" opacity="0.8"/>
                    <circle cx="38" cy={eyeY + 2} r="1" fill="white" opacity="0.4"/>
                </>
            )}

            {/* Excited sparkles */}
            {mood === "excited" && (
                <>
                    <circle cx="20" cy="28" r="2" fill={glowColor} opacity="0.9"
                            style={{animation: "sparkle 1s infinite"}}/>
                    <circle cx="60" cy="26" r="1.5" fill={secondaryColor} opacity="0.9"
                            style={{animation: "sparkle 1s infinite 0.3s"}}/>
                    <circle cx="65" cy="38" r="1" fill={glowColor} opacity="0.8"
                            style={{animation: "sparkle 1s infinite 0.6s"}}/>
                </>
            )}

            {/* Mouth */}
            <MouthComponent/>

            {/* Caring heart */}
            {mood === "caring" && (
                <g style={{animation: "floatHeart 2s ease-in-out infinite"}}>
                    <path
                        d="M 62 22 C 62 19 58 17 56 20 C 54 17 50 19 50 22 C 50 26 56 30 56 30 C 56 30 62 26 62 22 Z"
                        fill="#FF6B8A"
                        opacity="0.9"
                    />
                </g>
            )}

            <style jsx>{`
                @keyframes antennaIdleLeft {
                    0%, 100% {
                        transform: rotate(0deg);
                    }
                    50% {
                        transform: rotate(-8deg);
                    }
                }

                @keyframes antennaIdleRight {
                    0%, 100% {
                        transform: rotate(0deg);
                    }
                    50% {
                        transform: rotate(8deg);
                    }
                }

                @keyframes antennaTalkLeft {
                    0% {
                        transform: rotate(-5deg);
                    }
                    100% {
                        transform: rotate(10deg);
                    }
                }

                @keyframes antennaTalkRight {
                    0% {
                        transform: rotate(5deg);
                    }
                    100% {
                        transform: rotate(-10deg);
                    }
                }

                @keyframes waveArm {
                    0% {
                        transform: rotate(-20deg) translateY(-4px);
                    }
                    100% {
                        transform: rotate(20deg) translateY(-8px);
                    }
                }

                @keyframes idleArm {
                    0%, 100% {
                        transform: rotate(0deg);
                    }
                    50% {
                        transform: rotate(-5deg) translateY(-2px);
                    }
                }

                @keyframes idleArmRight {
                    0%, 100% {
                        transform: rotate(0deg);
                    }
                    50% {
                        transform: rotate(5deg) translateY(-2px);
                    }
                }

                @keyframes talkArm {
                    0% {
                        transform: rotate(-8deg);
                    }
                    100% {
                        transform: rotate(8deg);
                    }
                }

                @keyframes talkArmRight {
                    0% {
                        transform: rotate(8deg);
                    }
                    100% {
                        transform: rotate(-8deg);
                    }
                }

                @keyframes talkMouthScale {
                    0% {
                        transform: scaleY(1);
                    }
                    100% {
                        transform: scaleY(1.3);
                    }
                }

                @keyframes sparkle {
                    0%, 100% {
                        opacity: 0.9;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.3;
                        transform: scale(0.5);
                    }
                }

                @keyframes floatHeart {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        transform: translateY(-4px) scale(1.1);
                    }
                }
            `}</style>
        </svg>
    );
}

/* -------------------------------------------------------------------------- */
/*  MAIN LOADER COMPONENT with Starry Background + Character Animation       */
/* -------------------------------------------------------------------------- */
export default function GradientLoaderWithCharacter() {
    const [actionState, setActionState] = useState<{
        mood: SEIOCharacterProps["mood"];
        isWaving: boolean;
        isTalking: boolean;
    }>({
        mood: "happy",
        isWaving: false,
        isTalking: false,
    });

    useEffect(() => {
        const actions: Array<{
            mood: SEIOCharacterProps["mood"];
            isWaving: boolean;
            isTalking: boolean;
            duration: number;
        }> = [
            {mood: "happy", isWaving: true, isTalking: false, duration: 2000},
            {mood: "excited", isWaving: true, isTalking: true, duration: 2500},
            {mood: "thinking", isWaving: false, isTalking: false, duration: 2000},
            {mood: "caring", isWaving: false, isTalking: false, duration: 2000},
            {mood: "sleepy", isWaving: false, isTalking: false, duration: 2000},
            {mood: "idle", isWaving: false, isTalking: false, duration: 1500},
            {mood: "excited", isWaving: false, isTalking: true, duration: 2000},
        ];

        let index = 0;
        const interval = setInterval(() => {
            const next = actions[index % actions.length];
            setActionState({
                mood: next.mood,
                isWaving: next.isWaving,
                isTalking: next.isTalking,
            });
            index++;
        }, actions[index % actions.length].duration);

        return () => clearInterval(interval);
    }, []);

    const {mood, isWaving, isTalking} = actionState;

    const brandPrimary = "#4f46e5";
    const brandSecondary = "#0ea5e9";
    const brandGlow = "#38bdf8";

    return (
        <div className="relative flex items-center justify-center w-full h-full bg-black overflow-hidden">
            {/* Animated Starfield */}
            <div className="absolute inset-0">
                {[...Array(200)].map((_, i) => (
                    <div
                        key={i}
                        className="star"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${1 + Math.random() * 3}s`,
                            width: `${1 + Math.random() * 2}px`,
                            height: `${1 + Math.random() * 2}px`,
                        }}
                    />
                ))}
            </div>

            {/* Shooting Stars */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={`shooting-${i}`}
                        className="shooting-star"
                        style={{
                            top: `${Math.random() * 50}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 10}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Loader Content */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-8 p-8">
                <div className="loader-wrapper">
                    <div className="loader">
                        <div className="box"></div>
                        <div className="box"></div>
                        <div className="box"></div>
                        <div className="box"></div>
                        <div className="box"></div>
                    </div>
                </div>

                <div
                    className="character-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <SEIOCharacter
                        mood={mood}
                        size={110}
                        primaryColor={brandPrimary}
                        secondaryColor={brandSecondary}
                        glowColor={brandGlow}
                        isWaving={isWaving}
                        isTalking={isTalking}
                    />
                </div>
            </div>

            <style jsx>{`
                .star {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    animation: twinkle ease-in-out infinite;
                }

                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }

                .shooting-star {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: white;
                    border-radius: 50%;
                    animation: shoot linear infinite;
                }

                .shooting-star::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100px;
                    height: 1px;
                    background: linear-gradient(90deg, white, transparent);
                    transform: translateX(-100px);
                }

                @keyframes shoot {
                    0% {
                        transform: translateX(0) translateY(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    20% {
                        transform: translateX(-300px) translateY(100px);
                        opacity: 0;
                    }
                    100% {
                        opacity: 0;
                    }
                }

                .loader-wrapper {
                    position: relative;
                    width: 260px;
                    height: 260px;
                    filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.2));
                }

                .loader {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .loader .box {
                    position: absolute;
                    border-radius: 50%;
                    backdrop-filter: blur(5px);
                    animation: ripple 2s infinite ease-in-out;
                    background: linear-gradient(135deg, rgba(79, 70, 229, 0.22), rgba(14, 165, 233, 0.22));
                    border-top: 2px solid;
                    box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.08);
                }

                .loader .box:nth-child(1) {
                    inset: 40%;
                    z-index: 99;
                    border-top-color: #4f46e5;
                    animation-delay: 0s;
                }

                .loader .box:nth-child(2) {
                    inset: 30%;
                    z-index: 98;
                    border-top-color: #6366f1;
                    animation-delay: 0.2s;
                }

                .loader .box:nth-child(3) {
                    inset: 20%;
                    z-index: 97;
                    border-top-color: #0ea5e9;
                    animation-delay: 0.4s;
                }

                .loader .box:nth-child(4) {
                    inset: 10%;
                    z-index: 96;
                    border-top-color: #38bdf8;
                    animation-delay: 0.6s;
                }

                .loader .box:nth-child(5) {
                    inset: 0%;
                    z-index: 95;
                    border-top-color: #7dd3fc;
                    animation-delay: 0.8s;
                }

                @keyframes ripple {
                    0% {
                        transform: scale(1);
                        box-shadow: 0 5px 14px -2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.2);
                    }
                    50% {
                        transform: scale(1.28);
                        box-shadow: 0 18px 28px -6px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(14, 165, 233, 0.4);
                    }
                    100% {
                        transform: scale(1);
                        box-shadow: 0 5px 14px -2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.2);
                    }
                }

                .character-center {
                    width: 140px;
                    height: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
}
//
// export default function GradientLoaderWithCharacter() {
//     // Cycle through different actions every few seconds to showcase the character
//     const [actionState, setActionState] = useState<{
//         mood: SEIOCharacterProps["mood"];
//         isWaving: boolean;
//         isTalking: boolean;
//     }>({
//         mood: "happy",
//         isWaving: false,
//         isTalking: false,
//     });
//
//     // Rotate through different moods and actions
//     useEffect(() => {
//         const actions: Array<{
//             mood: SEIOCharacterProps["mood"];
//             isWaving: boolean;
//             isTalking: boolean;
//             duration: number;
//         }> = [
//             {mood: "happy", isWaving: true, isTalking: false, duration: 2000},
//             {mood: "excited", isWaving: true, isTalking: true, duration: 2500},
//             {mood: "thinking", isWaving: false, isTalking: false, duration: 2000},
//             {mood: "caring", isWaving: false, isTalking: false, duration: 2000},
//             {mood: "sleepy", isWaving: false, isTalking: false, duration: 2000},
//             {mood: "idle", isWaving: false, isTalking: false, duration: 1500},
//             {mood: "excited", isWaving: false, isTalking: true, duration: 2000},
//         ];
//
//         let index = 0;
//         const interval = setInterval(() => {
//             const next = actions[index % actions.length];
//             setActionState({
//                 mood: next.mood,
//                 isWaving: next.isWaving,
//                 isTalking: next.isTalking,
//             });
//             index++;
//         }, actions[index % actions.length].duration);
//
//         return () => clearInterval(interval);
//     }, []);
//
//     const {mood, isWaving, isTalking} = actionState;
//
//     // Brand colors (indigo to sky gradient)
//     const brandPrimary = "#4f46e5"; // indigo-600
//     const brandSecondary = "#0ea5e9"; // sky-500
//     const brandGlow = "#38bdf8"; // sky-400
//
//     return (
//         <div
//             className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-900/30 via-slate-900/40 to-indigo-900/30 backdrop-blur-sm overflow-hidden">
//             {/* ========== STARFIELD BACKGROUND ========== */}
//             <div className="absolute inset-0 z-0">
//                 <div className="stars"></div>
//                 <div className="stars-small"></div>
//                 <div className="stars-medium"></div>
//                 <div className="shooting-stars"></div>
//             </div>
//
//             {/* ========== LOADER + CHARACTER (centered) ========== */}
//             <div className="relative z-10 flex flex-col items-center justify-center gap-8 p-8">
//                 {/* Ripple Loader Container (no text/logo inside) */}
//                 <div className="loader-wrapper">
//                     <div className="loader">
//                         <div className="box"></div>
//                         <div className="box"></div>
//                         <div className="box"></div>
//                         <div className="box"></div>
//                         <div className="box"></div>
//                     </div>
//                 </div>
//
//                 {/* Character placed in the exact center (where logo/text used to be) */}
//                 <div
//                     className="character-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
//                     <SEIOCharacter
//                         mood={mood}
//                         size={110}
//                         primaryColor={brandPrimary}
//                         secondaryColor={brandSecondary}
//                         glowColor={brandGlow}
//                         isWaving={isWaving}
//                         isTalking={isTalking}
//                     />
//                 </div>
//             </div>
//
//             {/* ========== TAILWIND + CUSTOM STYLES ========== */}
//             <style jsx>{`
//                 /* ----- STARFIELD (pure CSS stars) ----- */
//                 .stars, .stars-small, .stars-medium {
//                     position: absolute;
//                     top: 0;
//                     left: 0;
//                     width: 100%;
//                     height: 100%;
//                     pointer-events: none;
//                 }
//
//                 .stars {
//                     background: transparent;
//                     box-shadow: 2px 3px 2px #fff, 50px 120px 3px #fff, 120px 70px 2px #fff,
//                     250px 160px 3px #fff, 380px 90px 2px #fff, 520px 190px 3px #fff,
//                     700px 80px 1px #fff, 850px 210px 2px #fff, 980px 140px 3px #fff,
//                     120px 400px 2px #fff, 300px 480px 3px #fff, 550px 520px 2px #fff,
//                     780px 620px 3px #fff, 920px 450px 2px #fff, 1100px 680px 3px #fff;
//                     animation: starFloat 80s linear infinite;
//                 }
//
//                 .stars-small {
//                     background: transparent;
//                     box-shadow: 10px 20px 1px rgba(255, 255, 255, 0.6), 90px 180px 1px rgba(255, 255, 255, 0.5),
//                     210px 90px 1px rgba(255, 255, 255, 0.6), 350px 260px 1px rgba(255, 255, 255, 0.4),
//                     480px 130px 1px rgba(255, 255, 255, 0.7), 620px 310px 1px rgba(255, 255, 255, 0.5),
//                     790px 160px 1px rgba(255, 255, 255, 0.6), 970px 380px 1px rgba(255, 255, 255, 0.5),
//                     1140px 240px 1px rgba(255, 255, 255, 0.6), 70px 540px 1px rgba(255, 255, 255, 0.5),
//                     280px 620px 1px rgba(255, 255, 255, 0.7), 460px 710px 1px rgba(255, 255, 255, 0.4),
//                     680px 590px 1px rgba(255, 255, 255, 0.6), 880px 820px 1px rgba(255, 255, 255, 0.5),
//                     1050px 680px 1px rgba(255, 255, 255, 0.6);
//                     animation: starFloat 120s linear infinite reverse;
//                 }
//
//                 .stars-medium {
//                     background: transparent;
//                     box-shadow: 45px 65px 2px rgba(255, 255, 255, 0.7), 165px 215px 2px rgba(255, 255, 255, 0.6),
//                     315px 145px 2px rgba(255, 255, 255, 0.5), 460px 325px 2px rgba(255, 255, 255, 0.7),
//                     605px 235px 2px rgba(255, 255, 255, 0.6), 750px 415px 2px rgba(255, 255, 255, 0.5),
//                     900px 295px 2px rgba(255, 255, 255, 0.7), 1090px 460px 2px rgba(255, 255, 255, 0.6),
//                     125px 715px 2px rgba(255, 255, 255, 0.5), 390px 825px 2px rgba(255, 255, 255, 0.7),
//                     610px 930px 2px rgba(255, 255, 255, 0.6), 835px 755px 2px rgba(255, 255, 255, 0.5);
//                     animation: starFloat 140s linear infinite;
//                 }
//
//                 @keyframes starFloat {
//                     0% {
//                         transform: translateY(0px) translateX(0px);
//                         opacity: 0.2;
//                     }
//                     50% {
//                         opacity: 0.8;
//                         transform: translateY(-15px) translateX(8px);
//                     }
//                     100% {
//                         transform: translateY(0px) translateX(0px);
//                         opacity: 0.2;
//                     }
//                 }
//
//                 /* Shooting stars effect */
//                 .shooting-stars {
//                     position: absolute;
//                     top: 0;
//                     left: 0;
//                     width: 100%;
//                     height: 100%;
//                     pointer-events: none;
//                 }
//
//                 .shooting-stars::before, .shooting-stars::after {
//                     content: '';
//                     position: absolute;
//                     top: 10%;
//                     left: 80%;
//                     width: 120px;
//                     height: 2px;
//                     background: linear-gradient(90deg, #fff, transparent);
//                     border-radius: 4px;
//                     opacity: 0;
//                     animation: shoot 8s linear infinite;
//                 }
//
//                 .shooting-stars::after {
//                     top: 60%;
//                     left: 20%;
//                     animation-delay: 4s;
//                     width: 80px;
//                 }
//
//                 @keyframes shoot {
//                     0% {
//                         transform: translateX(0) translateY(0) rotate(15deg);
//                         opacity: 0;
//                     }
//                     10% {
//                         opacity: 1;
//                     }
//                     20% {
//                         transform: translateX(-300px) translateY(100px) rotate(15deg);
//                         opacity: 0;
//                     }
//                     100% {
//                         opacity: 0;
//                     }
//                 }
//
//                 /* ----- RIPPLE LOADER (your refined version, no text/logo) ----- */
//                 .loader-wrapper {
//                     position: relative;
//                     width: 260px;
//                     height: 260px;
//                     filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.2));
//                 }
//
//                 .loader {
//                     position: relative;
//                     width: 100%;
//                     height: 100%;
//                 }
//
//                 .loader .box {
//                     position: absolute;
//                     border-radius: 50%;
//                     backdrop-filter: blur(5px);
//                     animation: ripple 2s infinite ease-in-out;
//                     background: linear-gradient(135deg, rgba(79, 70, 229, 0.22), rgba(14, 165, 233, 0.22));
//                     border-top: 2px solid;
//                     box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.08);
//                 }
//
//                 .loader .box:nth-child(1) {
//                     inset: 40%;
//                     z-index: 99;
//                     border-top-color: #4f46e5;
//                     animation-delay: 0s;
//                 }
//
//                 .loader .box:nth-child(2) {
//                     inset: 30%;
//                     z-index: 98;
//                     border-top-color: #6366f1;
//                     animation-delay: 0.2s;
//                 }
//
//                 .loader .box:nth-child(3) {
//                     inset: 20%;
//                     z-index: 97;
//                     border-top-color: #0ea5e9;
//                     animation-delay: 0.4s;
//                 }
//
//                 .loader .box:nth-child(4) {
//                     inset: 10%;
//                     z-index: 96;
//                     border-top-color: #38bdf8;
//                     animation-delay: 0.6s;
//                 }
//
//                 .loader .box:nth-child(5) {
//                     inset: 0%;
//                     z-index: 95;
//                     border-top-color: #7dd3fc;
//                     animation-delay: 0.8s;
//                 }
//
//                 @keyframes ripple {
//                     0% {
//                         transform: scale(1);
//                         box-shadow: 0 5px 14px -2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.2);
//                     }
//                     50% {
//                         transform: scale(1.28);
//                         box-shadow: 0 18px 28px -6px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(14, 165, 233, 0.4);
//                     }
//                     100% {
//                         transform: scale(1);
//                         box-shadow: 0 5px 14px -2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.2);
//                     }
//                 }
//
//                 .character-center {
//                     width: 140px;
//                     height: 140px;
//                     display: flex;
//                     align-items: center;
//                     justify-content: center;
//                 }
//             `}</style>
//         </div>
//     );
// }