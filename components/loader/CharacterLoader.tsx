// app/components/CharacterLoader.tsx
"use client";

import React, {useEffect, useState} from "react";

interface SEIOCharacterProps {
    mood: "happy" | "thinking" | "excited" | "caring" | "sleepy" | "idle";
    size: number;
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    isWaving: boolean;
    isTalking: boolean;
    isSpinning?: boolean;
}

function SEIOCharacter({
                           mood,
                           size,
                           primaryColor,
                           secondaryColor,
                           glowColor,
                           isWaving,
                           isTalking,
                           isSpinning = false,
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
                animation: "none",
            }}
        >
            <defs>
                <radialGradient id="bodyGrad" cx="45%" cy="35%" r="60%">
                    <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.9"/>
                    <stop offset="100%" stopColor={primaryColor}/>
                </radialGradient>
                <radialGradient id="eyeGrad" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#ffffff"/>
                    <stop offset="60%" stopColor={secondaryColor} stopOpacity="0.8"/>
                    <stop offset="100%" stopColor={primaryColor}/>
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <radialGradient id="shimmer" cx="30%" cy="25%" r="30%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="white" stopOpacity="0"/>
                </radialGradient>
            </defs>

            <ellipse cx="40" cy="88" rx="22" ry="4" fill="black" opacity="0.12"/>

            {/* Antennas */}
            <g style={{
                transformOrigin: "22px 18px",
                animation: isTalking ? "antennaTalkLeft 0.4s ease-in-out infinite alternate" : "antennaIdleLeft 3s ease-in-out infinite",
            }}>
                <line x1="22" y1="18" x2="15" y2="6" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="14" cy="5" r="3.5" fill={glowColor} filter="url(#glow)"/>
                <circle cx="14" cy="5" r="2" fill="white" opacity="0.7"/>
            </g>

            <g style={{
                transformOrigin: "58px 18px",
                animation: isTalking ? "antennaTalkRight 0.4s ease-in-out infinite alternate" : "antennaIdleRight 3s ease-in-out infinite 0.5s",
            }}>
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

            {/* Arms */}
            <g style={{
                transformOrigin: "12px 52px",
                animation: isWaving ? "waveArm 0.5s ease-in-out infinite alternate" : isTalking ? "talkArm 0.6s ease-in-out infinite alternate" : "idleArm 4s ease-in-out infinite",
            }}>
                <ellipse cx="12" cy="55" rx="7" ry="9" fill={primaryColor} opacity="0.9"/>
                <ellipse cx="12" cy="55" rx="7" ry="9" fill="url(#shimmer)"/>
                <circle cx="10" cy="63" r="4" fill={primaryColor}/>
                <circle cx="10" cy="63" r="4" fill="url(#shimmer)"/>
            </g>

            <g style={{
                transformOrigin: "68px 52px",
                animation: isTalking ? "talkArmRight 0.6s ease-in-out infinite alternate" : "idleArmRight 4s ease-in-out infinite 1s",
            }}>
                <ellipse cx="68" cy="55" rx="7" ry="9" fill={primaryColor} opacity="0.9"/>
                <ellipse cx="68" cy="55" rx="7" ry="9" fill="url(#shimmer)"/>
                <circle cx="70" cy="63" r="4" fill={primaryColor}/>
                <circle cx="70" cy="63" r="4" fill="url(#shimmer)"/>
            </g>

            {/* Eye */}
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

            {/* Sparkles when excited - around head */}
            {mood === "excited" && (
                <>
                    <circle cx="15" cy="10" r="2.5" fill={glowColor} opacity="0.9"
                            style={{animation: "sparkle 1s infinite"}}/>
                    <circle cx="65" cy="8" r="2" fill={secondaryColor} opacity="0.9"
                            style={{animation: "sparkle 1s infinite 0.3s"}}/>
                    <circle cx="40" cy="5" r="1.5" fill={glowColor} opacity="0.8"
                            style={{animation: "sparkle 1s infinite 0.6s"}}/>
                    <circle cx="25" cy="18" r="1.5" fill={glowColor} opacity="0.7"
                            style={{animation: "sparkle 1s infinite 0.2s"}}/>
                    <circle cx="55" cy="15" r="1.5" fill={secondaryColor} opacity="0.7"
                            style={{animation: "sparkle 1s infinite 0.5s"}}/>
                </>
            )}

            <MouthComponent/>

            {/* Heart when caring */}
            {mood === "caring" && (
                <g style={{animation: "floatHeart 2s ease-in-out infinite"}}>
                    <path d="M 62 22 C 62 19 58 17 56 20 C 54 17 50 19 50 22 C 50 26 56 30 56 30 C 56 30 62 26 62 22 Z"
                          fill="#FF6B8A" opacity="0.9"/>
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

export default function CharacterLoader() {
    const [actionState, setActionState] = useState({
        mood: "happy" as "happy" | "thinking" | "excited" | "caring" | "sleepy" | "idle",
        isWaving: false,
        isTalking: false,
        isSpinning: false,
    });

    useEffect(() => {
        const actions = [
            {mood: "happy" as const, isWaving: true, isTalking: false, isSpinning: false, duration: 2000},
            {mood: "excited" as const, isWaving: true, isTalking: true, isSpinning: true, duration: 1500},
            {mood: "thinking" as const, isWaving: false, isTalking: false, isSpinning: false, duration: 2000},
            {mood: "caring" as const, isWaving: false, isTalking: false, isSpinning: false, duration: 2000},
            {mood: "sleepy" as const, isWaving: false, isTalking: false, isSpinning: false, duration: 1500},
            {mood: "excited" as const, isWaving: true, isTalking: true, isSpinning: true, duration: 1200},
            {mood: "idle" as const, isWaving: false, isTalking: false, isSpinning: false, duration: 2000},
            {mood: "happy" as const, isWaving: true, isTalking: false, isSpinning: true, duration: 1000},
        ];

        let index = 0;
        const interval = setInterval(() => {
            const next = actions[index % actions.length];
            setActionState({
                mood: next.mood,
                isWaving: next.isWaving,
                isTalking: next.isTalking,
                isSpinning: next.isSpinning,
            });
            index++;
        }, actions[index % actions.length].duration);

        return () => clearInterval(interval);
    }, []);

    const brandPrimary = "#4f46e5";
    const brandSecondary = "#0ea5e9";
    const brandGlow = "#38bdf8";

    // Responsive sizes
    const [windowSize, setWindowSize] = useState(110);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setWindowSize(80);
            else if (width < 768) setWindowSize(100);
            else setWindowSize(120);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className="flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 w-full h-full">
            {/* Animated rings */}
            <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping-slow opacity-20"
                     style={{border: `2px solid ${brandGlow}`, transform: 'scale(1.5)'}}/>
                <div className="absolute inset-0 rounded-full animate-ping-slower opacity-10"
                     style={{border: `2px solid ${brandPrimary}`, transform: 'scale(2)'}}/>

                {/* Character */}
                <div className="relative z-10">
                    <SEIOCharacter
                        mood={actionState.mood}
                        size={windowSize}
                        primaryColor={brandPrimary}
                        secondaryColor={brandSecondary}
                        glowColor={brandGlow}
                        isWaving={actionState.isWaving}
                        isTalking={actionState.isTalking}
                        isSpinning={actionState.isSpinning}
                    />
                </div>
            </div>

            {/* Loading text with dots animation */}
            <div className="flex items-center gap-1 text-sm sm:text-base md:text-lg font-medium text-white/80">
                <span>Loading</span>
                <span className="animate-bounce" style={{animationDelay: '0s'}}>.</span>
                <span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span>
                <span className="animate-bounce" style={{animationDelay: '0.4s'}}>.</span>
            </div>


            <style jsx>{`
                @keyframes ping-slow {
                    0% {
                        transform: scale(1);
                        opacity: 0.2;
                    }
                    50% {
                        transform: scale(1.8);
                        opacity: 0.05;
                    }
                    100% {
                        transform: scale(2.5);
                        opacity: 0;
                    }
                }

                .animate-ping-slow {
                    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                .animate-ping-slower {
                    animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s;
                }
            `}</style>
        </div>
    );
}