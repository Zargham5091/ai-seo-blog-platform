// components/marketing/SEIOBot.tsx
"use client";
import {useState, useEffect, useRef, useCallback} from "react";
import {usePathname, useRouter} from "next/navigation";
import {X, MessageCircle, ChevronRight} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MascotAction {
    label: string;
    type: "redirect" | "chat" | "tour" | "dismiss";
    href?: string;
}

interface MascotMessage {
    id: string;
    trigger: string;
    messages: string[];
    action?: MascotAction;
}

interface MascotConfig {
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    name: string;
    size: "sm" | "md" | "lg";
    enabledPages: string[];
    disabledPages: string[];
    isGloballyEnabled: boolean;
    showOnMobile: boolean;
    showOnTablet: boolean;
    autoGreetDelay: number;
    idleTimeout: number;
    messages: MascotMessage[];
}

// ── Default config (used before API loads) ────────────────────────────────────
const DEFAULT_CONFIG: MascotConfig = {
    primaryColor: "#4F46E5",
    secondaryColor: "#0EA5E9",
    glowColor: "#818CF8",
    name: "SEIO",
    size: "md",
    enabledPages: ["/", "/demo", "/pricing", "/features", "/register"],
    disabledPages: [],
    isGloballyEnabled: true,
    showOnMobile: true,
    showOnTablet: true,
    autoGreetDelay: 1500,
    idleTimeout: 8000,
    messages: [],
};

const SIZE_MAP = {sm: 64, md: 80, lg: 96};

// ── Scroll section detection ───────────────────────────────────────────────────
function getScrollSection(): string {
    const sections = [
        {id: "hero", trigger: "scroll_hero"},
        {id: "features", trigger: "scroll_features"},
        {id: "pricing", trigger: "scroll_pricing"},
        {id: "faq", trigger: "scroll_faq"},
        {id: "cta", trigger: "scroll_cta"},
    ];
    for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.6 && rect.bottom >= 0) return s.trigger;
        }
    }
    return "";
}

// ── SEIO SVG Character ────────────────────────────────────────────────────────
function SEIOCharacter({
                           mood, size, primaryColor, secondaryColor, glowColor, isWaving, isTalking,
                       }: {
    mood: "happy" | "thinking" | "excited" | "caring" | "sleepy" | "idle";
    size: number;
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    isWaving: boolean;
    isTalking: boolean;
}) {
    const eyeY = mood === "sleepy" ? 44 : 42;
    const pupilSize = mood === "excited" ? 7 : mood === "sleepy" ? 3 : 5;
    const mouthPath = mood === "happy" || mood === "excited"
        ? "M 30 58 Q 40 66 50 58"
        : mood === "caring"
            ? "M 32 60 Q 40 65 48 60"
            : mood === "thinking"
                ? "M 33 61 Q 40 58 47 61"
                : mood === "sleepy"
                    ? "M 34 62 Q 40 60 46 62"
                    : "M 31 60 Q 40 65 49 60";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 80 90"
            xmlns="http://www.w3.org/2000/svg"
            style={{overflow: "visible", filter: `drop-shadow(0 0 12px ${glowColor}88)`}}
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

            {/* ── Shadow ── */}
            <ellipse cx="40" cy="88" rx="22" ry="4" fill="black" opacity="0.12"/>

            {/* ── Left antenna ── */}
            <g style={{
                transformOrigin: "22px 18px",
                animation: isTalking ? "antennaTalkLeft 0.4s ease-in-out infinite alternate" : "antennaIdleLeft 3s ease-in-out infinite",
            }}>
                <line x1="22" y1="18" x2="15" y2="6" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="14" cy="5" r="3.5" fill={glowColor} filter="url(#glow)"/>
                <circle cx="14" cy="5" r="2" fill="white" opacity="0.7"/>
            </g>

            {/* ── Right antenna ── */}
            <g style={{
                transformOrigin: "58px 18px",
                animation: isTalking ? "antennaTalkRight 0.4s ease-in-out infinite alternate" : "antennaIdleRight 3s ease-in-out infinite 0.5s",
            }}>
                <line x1="58" y1="18" x2="65" y2="6" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="66" cy="5" r="3.5" fill={glowColor} filter="url(#glow)"/>
                <circle cx="66" cy="5" r="2" fill="white" opacity="0.7"/>
            </g>

            {/* ── Body ── */}
            <ellipse cx="40" cy="55" rx="30" ry="32" fill="url(#bodyGrad)"/>
            {/* Body shimmer */}
            <ellipse cx="40" cy="55" rx="30" ry="32" fill="url(#shimmer)"/>
            {/* Body outline */}
            <ellipse cx="40" cy="55" rx="30" ry="32" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.2"/>

            {/* ── Chest panel ── */}
            <rect x="28" y="62" width="24" height="16" rx="5" fill="white" opacity="0.1"/>
            <rect x="30" y="64" width="8" height="3" rx="1.5" fill={glowColor} opacity="0.7"/>
            <rect x="42" y="64" width="8" height="3" rx="1.5" fill={secondaryColor} opacity="0.7"/>
            <rect x="30" y="70" width="20" height="2" rx="1" fill="white" opacity="0.2"/>
            <rect x="30" y="74" width="14" height="2" rx="1" fill="white" opacity="0.15"/>

            {/* ── Left arm ── */}
            <g style={{
                transformOrigin: "12px 52px",
                animation: isWaving
                    ? "waveArm 0.5s ease-in-out infinite alternate"
                    : isTalking
                        ? "talkArm 0.6s ease-in-out infinite alternate"
                        : "idleArm 4s ease-in-out infinite",
            }}>
                <ellipse cx="12" cy="55" rx="7" ry="9" fill={primaryColor} opacity="0.9"/>
                <ellipse cx="12" cy="55" rx="7" ry="9" fill="url(#shimmer)"/>
                {/* Hand */}
                <circle cx="10" cy="63" r="4" fill={primaryColor}/>
                <circle cx="10" cy="63" r="4" fill="url(#shimmer)"/>
            </g>

            {/* ── Right arm ── */}
            <g style={{
                transformOrigin: "68px 52px",
                animation: isTalking
                    ? "talkArmRight 0.6s ease-in-out infinite alternate"
                    : "idleArmRight 4s ease-in-out infinite 1s",
            }}>
                <ellipse cx="68" cy="55" rx="7" ry="9" fill={primaryColor} opacity="0.9"/>
                <ellipse cx="68" cy="55" rx="7" ry="9" fill="url(#shimmer)"/>
                <circle cx="70" cy="63" r="4" fill={primaryColor}/>
                <circle cx="70" cy="63" r="4" fill="url(#shimmer)"/>
            </g>

            {/* ── Big eye (main feature) ── */}
            <circle cx="40" cy={eyeY} r="14" fill="white" opacity="0.95"/>
            <circle cx="40" cy={eyeY} r="14" fill="url(#eyeGrad)" opacity="0.3"/>
            {/* Eye ring */}
            <circle cx="40" cy={eyeY} r="14" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.4"/>

            {/* Pupil */}
            {mood === "sleepy" ? (
                <>
                    <ellipse cx="40" cy={eyeY + 2} rx="5" ry="3" fill={primaryColor}/>
                    {/* Sleepy eyelid */}
                    <path d={`M 26 ${eyeY} Q 40 ${eyeY - 8} 54 ${eyeY}`} fill={secondaryColor}/>
                </>
            ) : (
                <>
                    <circle cx="40" cy={eyeY} r={pupilSize + 2} fill={primaryColor} opacity="0.15"/>
                    <circle cx="40" cy={eyeY} r={pupilSize} fill={primaryColor}/>
                    {/* Pupil highlight */}
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

            {/* ── Mouth ── */}
            <path
                d={mouthPath}
                fill="none"
                stroke={isTalking ? glowColor : "white"}
                strokeWidth={isTalking ? "2.5" : "2"}
                strokeLinecap="round"
                opacity="0.9"
                style={isTalking ? {animation: "talkMouth 0.2s ease-in-out infinite alternate"} : {}}
            />

            {/* ── Caring heart ── */}
            {mood === "caring" && (
                <g style={{animation: "floatHeart 2s ease-in-out infinite"}}>
                    <path d="M 62 22 C 62 19 58 17 56 20 C 54 17 50 19 50 22 C 50 26 56 30 56 30 C 56 30 62 26 62 22 Z"
                          fill="#FF6B8A" opacity="0.9"/>
                </g>
            )}

            {/* CSS Animations */}
            <style>{`
        @keyframes antennaIdleLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        @keyframes antennaIdleRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes antennaTalkLeft {
          0% { transform: rotate(-5deg); }
          100% { transform: rotate(10deg); }
        }
        @keyframes antennaTalkRight {
          0% { transform: rotate(5deg); }
          100% { transform: rotate(-10deg); }
        }
        @keyframes waveArm {
          0% { transform: rotate(-20deg) translateY(-4px); }
          100% { transform: rotate(20deg) translateY(-8px); }
        }
        @keyframes idleArm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg) translateY(-2px); }
        }
        @keyframes idleArmRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg) translateY(-2px); }
        }
        @keyframes talkArm {
          0% { transform: rotate(-8deg); }
          100% { transform: rotate(8deg); }
        }
        @keyframes talkArmRight {
          0% { transform: rotate(8deg); }
          100% { transform: rotate(-8deg); }
        }
        @keyframes talkMouth {
          0% { d: path("${mouthPath}"); }
          100% { transform: scaleY(1.3); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.5); }
        }
        @keyframes floatHeart {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.1); }
        }
      `}</style>
        </svg>
    );
}

// ── Speech bubble ─────────────────────────────────────────────────────────────
function SpeechBubble({
                          message, action, onAction, onDismiss, primaryColor, name,
                      }: {
    message: string;
    action?: MascotAction;
    onAction: (action: MascotAction) => void;
    onDismiss: () => void;
    primaryColor: string;
    name: string;
}) {
    return (
        <div
            className="absolute bottom-full mb-3 right-0 w-64 sm:w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            style={{animation: "bubbleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards"}}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800"
                 style={{background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`}}>
                <span className="text-xs font-bold" style={{color: primaryColor}}>{name}</span>
                <button onClick={onDismiss}
                        className="h-5 w-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <X className="h-3 w-3"/>
                </button>
            </div>

            {/* Message */}
            <div className="px-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>
            </div>

            {/* Action */}
            {action && (
                <div className="px-4 pb-3">
                    <button
                        onClick={() => onAction(action)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-all hover:scale-105 active:scale-95"
                        style={{background: `linear-gradient(135deg, ${primaryColor}, #0EA5E9)`}}
                    >
                        {action.type === "chat" && <MessageCircle className="h-3 w-3"/>}
                        {action.label}
                        {action.type !== "chat" && <ChevronRight className="h-3 w-3"/>}
                    </button>
                </div>
            )}

            {/* Tail */}
            <div
                className="absolute bottom-[-8px] right-10 w-4 h-4 bg-white dark:bg-gray-900 border-r border-b border-gray-100 dark:border-gray-800 rotate-45"/>

            <style>{`
        @keyframes bubbleIn {
          0% { opacity: 0; transform: scale(0.8) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </div>
    );
}

// ── Tour steps ────────────────────────────────────────────────────────────────
const TOUR_STEPS = [
    {
        section: "hero",
        msg: "👋 Welcome! This is the hero — your first impression. See that 'Start Free' button? No credit card needed!"
    },
    {
        section: "features",
        msg: "✨ Here are all the animated features. Every animation shows the REAL interface you'll use!"
    },
    {section: "pricing", msg: "💰 Transparent pricing — Free plan is genuinely free. Silver is most popular for teams!"},
    {section: "faq", msg: "❓ Great questions in here. Then scroll down for the final CTA!"},
    {
        section: null,
        msg: "🎉 Tour complete! Ready to start? Hit that 'Start Free' button. I'll be here if you need me! 😊",
        href: "/register"
    },
];

// ── Main SEIO component ───────────────────────────────────────────────────────
export function SEIOBot() {
    const pathname = usePathname();
    const router = useRouter();

    const [config, setConfig] = useState<MascotConfig>(DEFAULT_CONFIG);
    const [isVisible, setIsVisible] = useState(false);
    const [mood, setMood] = useState<"happy" | "thinking" | "excited" | "caring" | "sleepy" | "idle">("happy");
    const [isWaving, setIsWaving] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [bubble, setBubble] = useState<{ message: string; action?: MascotAction } | null>(null);
    const [isTourActive, setIsTourActive] = useState(false);
    const [tourStep, setTourStep] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({x: -1, y: -1}); // -1 = use default CSS
    const [isMinimized, setIsMinimized] = useState(false);

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const seenTriggers = useRef<Set<string>>(new Set());
    const dragOffset = useRef({x: 0, y: 0});
    const botRef = useRef<HTMLDivElement>(null);

    const size = SIZE_MAP[config.size] ?? 80;

    // ── Load config ───────────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/mascot")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setConfig(d.data);
            })
            .catch(() => {
            }); // use default if fails
    }, []);

    // ── Visibility check ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!config.isGloballyEnabled) {
            setIsVisible(false);
            return;
        }
        if (config.disabledPages.some((p) => pathname.startsWith(p))) {
            setIsVisible(false);
            return;
        }
        const enabled = config.enabledPages.some((p) => pathname === p || pathname.startsWith(p));
        setIsVisible(enabled);
    }, [pathname, config]);

    // ── Show bubble with talking animation ───────────────────────────────────
    const showBubble = useCallback((message: string, action?: MascotAction, moodOverride?: typeof mood) => {
        setBubble({message, action});
        setIsTalking(true);
        if (moodOverride) setMood(moodOverride);
        setTimeout(() => setIsTalking(false), 2000);
    }, []);

    // ── Pick message for trigger ──────────────────────────────────────────────
    const triggerMessage = useCallback((trigger: string, force = false) => {
        if (!force && seenTriggers.current.has(trigger)) return;
        const msgConfig = config.messages.find((m) => m.trigger === trigger);
        if (!msgConfig) return;
        seenTriggers.current.add(trigger);
        const msg = msgConfig.messages[Math.floor(Math.random() * msgConfig.messages.length)];
        const moodMap: Record<string, typeof mood> = {
            page_load: "happy", idle: "caring", scroll_hero: "excited",
            scroll_features: "excited", scroll_pricing: "thinking",
            scroll_faq: "caring", demo_page: "excited",
            pricing_page: "happy", register_page: "excited", emotional: "caring",
        };
        showBubble(msg, msgConfig.action, moodMap[trigger] ?? "happy");
        setIsWaving(trigger === "page_load");
        if (trigger === "page_load") setTimeout(() => setIsWaving(false), 3000);
    }, [config.messages, showBubble]);

    // ── Initial greeting ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!isVisible) return;
        seenTriggers.current.clear();

        const pageToTrigger: Record<string, string> = {
            "/demo": "demo_page",
            "/pricing": "pricing_page",
            "/register": "register_page",
        };
        const trigger = pageToTrigger[pathname] ?? "page_load";

        const t = setTimeout(() => {
            triggerMessage(trigger, true);
        }, config.autoGreetDelay);

        return () => clearTimeout(t);
    }, [isVisible, pathname, config.autoGreetDelay, triggerMessage]);

    // ── Idle timer ────────────────────────────────────────────────────────────
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (!bubble) {
                const emotional = Math.random() > 0.6;
                triggerMessage(emotional ? "emotional" : "idle");
                setMood(emotional ? "caring" : "idle");
            }
        }, config.idleTimeout);
    }, [bubble, config.idleTimeout, triggerMessage]);

    useEffect(() => {
        window.addEventListener("mousemove", resetIdleTimer);
        window.addEventListener("keydown", resetIdleTimer);
        window.addEventListener("touchstart", resetIdleTimer);
        resetIdleTimer();
        return () => {
            window.removeEventListener("mousemove", resetIdleTimer);
            window.removeEventListener("keydown", resetIdleTimer);
            window.removeEventListener("touchstart", resetIdleTimer);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [resetIdleTimer]);

    // ── Scroll detection ──────────────────────────────────────────────────────
    useEffect(() => {
        if (pathname !== "/") return;
        const handleScroll = () => {
            const section = getScrollSection();
            if (section) triggerMessage(section);
        };
        window.addEventListener("scroll", handleScroll, {passive: true});
        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname, triggerMessage]);

    // ── Tour ──────────────────────────────────────────────────────────────────
    const startTour = () => {
        setIsTourActive(true);
        setTourStep(0);
        runTourStep(0);
    };

    // const runTourStep = (step: number) => {
    //     const s = TOUR_STEPS[step];
    //     if (!s) {
    //         setIsTourActive(false);
    //         return;
    //     }
    //     if (s.section) {
    //         document.getElementById(s.section)?.scrollIntoView({behavior: "smooth", block: "center"});
    //     }
    //     setTimeout(() => {
    //         showBubble(s.msg, s.href
    //                 ? {label: "Let's go!", type: "redirect", href: s.href}
    //                 : step < TOUR_STEPS.length - 1
    //                     ? {label: "Next →", type: "tour"}
    //                     : undefined,
    //             "excited"
    //         );
    //     }, s.section ? 700 : 0);
    // };
    // Replace the runTourStep function:
    const runTourStep = useCallback((step: number) => {
        console.log("🤖 runTourStep called, step:", step, "TOUR_STEPS[step]:", TOUR_STEPS[step]); // ADD THIS

        const s = TOUR_STEPS[step];
        if (!s) {
            setIsTourActive(false);
            return;
        }

        if (s.section) {
            const el = document.getElementById(s.section);
            console.log("🤖 section element found:", s.section, el); // ADD THIS

            if (el) el.scrollIntoView({behavior: "smooth", block: "center"});
        }

        const delay = s.section ? 800 : 0;
        setTimeout(() => {
            const hasNext = step < TOUR_STEPS.length - 1;
            showBubble(
                s.msg,
                s.href
                    ? {label: "Let's go! 🚀", type: "redirect", href: s.href}
                    : hasNext
                        ? {label: "Next →", type: "tour"}
                        : undefined,
                "excited"
            );
            setTourStep(step);
        }, delay);
    }, [showBubble]);
    const handleAction = (action: MascotAction) => {
        console.log("🤖 SEIO handleAction called:", action); // ADD THIS

        setBubble(null);
        if (action.type === "redirect" && action.href) {
            router.push(action.href);
        } else if (action.type === "chat") {
            // Open the ChatWidget
            const chatBtn =
                document.querySelector("[aria-label='Open support chat']") as HTMLButtonElement ||
                document.querySelector(".chat-widget-btn") as HTMLButtonElement;
            if (chatBtn) {
                chatBtn.click();
            } else {
                // Fallback — scroll to bottom where chat widget is
                window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"});
            }
        } else if (action.type === "tour") {
            if (!isTourActive) {
                setIsTourActive(true);
                setTourStep(0);
                runTourStep(0);
            } else {
                const next = tourStep + 1;
                runTourStep(next);
            }
        } else if (action.type === "dismiss") {
            setBubble(null);
        }
    };

    // ── Drag (mouse + touch) ──────────────────────────────────────────────────
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!botRef.current) return;
        setIsDragging(true);
        setBubble(null);
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        const rect = botRef.current.getBoundingClientRect();
        dragOffset.current = {x: clientX - rect.left, y: clientY - rect.top};
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
            const newX = clientX - dragOffset.current.x;
            const newY = clientY - dragOffset.current.y;
            // Clamp to viewport
            const clampedX = Math.max(0, Math.min(window.innerWidth - size, newX));
            const clampedY = Math.max(0, Math.min(window.innerHeight - size, newY));
            setPosition({x: clampedX, y: clampedY});
        };
        const handleEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("touchmove", handleMove, {passive: false});
            window.addEventListener("mouseup", handleEnd);
            window.addEventListener("touchend", handleEnd);
        }
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging, size]);

    // ── Click SEIO ────────────────────────────────────────────────────────────
    // Replace handleClick:
    const handleClick = () => {
        console.log("🤖 SEIO clicked, isDragging:", isDragging, "isMinimized:", isMinimized, "bubble:", !!bubble); // ADD THIS

        if (isDragging) return;
        if (isMinimized) {
            setIsMinimized(false);
            return;
        }
        if (bubble) {
            setBubble(null);
            return;
        }
        setMood("excited");
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 2000);

        // Randomly pick between tour offer and chat offer
        const offers = [
            {
                msg: "Hey! 👋 Want me to give you a tour of the platform?",
                action: {label: "Give me a tour! 🗺️", type: "tour" as const},
            },
            {
                msg: "Hi there! 😄 Got questions? I can help or connect you with our team!",
                action: {label: "Open chat 💬", type: "chat" as const},
            },
            {
                msg: "Ooh you clicked me! 🎉 Want to try the real AI demo?",
                action: {label: "Try demo! ✨", type: "redirect" as const, href: "/demo"},
            },
            {
                msg: "You found me! 🥳 Want a quick tour or shall we chat?",
                action: {label: "Tour please! 🗺️", type: "tour" as const},
            },
        ];
        const pick = offers[Math.floor(Math.random() * offers.length)];
        showBubble(pick.msg, pick.action, "excited");
    };
    // const handleClick = () => {
    //     if (isDragging) return;
    //     if (isMinimized) {
    //         setIsMinimized(false);
    //         return;
    //     }
    //     if (bubble) {
    //         setBubble(null);
    //         return;
    //     }
    //     setMood("excited");
    //     setIsWaving(true);
    //     setTimeout(() => setIsWaving(false), 2000);
    //     const randomMsgs = [
    //         "Hey! You clicked me! 😄 Want a tour of the platform?",
    //         "Ooh! I love being clicked! 🎉 Want to see the demo?",
    //         "Hi hi hi! 👋 Shall I show you around?",
    //         "You found me! 🥳 Want 3 free AI credits? Try the demo!",
    //     ];
    //     showBubble(
    //         randomMsgs[Math.floor(Math.random() * randomMsgs.length)],
    //         {label: "Give me a tour!", type: "tour"},
    //         "excited"
    //     );
    // };

    if (!isVisible) return null;

    const hasCustomPos = position.x >= 0 && position.y >= 0;

    return (
        <>
            {/* Global styles */}
            <style>{`
        .seio-bot {
          position: fixed;
          z-index: 9999;
          ${hasCustomPos
                ? `left: ${position.x}px; top: ${position.y}px;`
                : "right: 20px; bottom: 100px;"}
          cursor: ${isDragging ? "grabbing" : "grab"};
          user-select: none;
          touch-action: none;
          transition: ${isDragging ? "none" : "filter 0.2s"};
        }
        .seio-bot:hover .seio-body {
          filter: drop-shadow(0 0 20px ${config.glowColor}aa);
        }
        .seio-bounce {
          animation: seioFloat 3s ease-in-out infinite;
        }
        @keyframes seioFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .seio-minimize-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background: white;
          border: 2px solid ${config.primaryColor}40;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 8px;
          color: ${config.primaryColor};
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s;
          z-index: 10;
        }
        .seio-minimize-btn:hover {
          background: ${config.primaryColor};
          color: white;
          transform: scale(1.1);
        }
        .seio-minimized {
          opacity: 0.6;
          transform: scale(0.7);
          transition: all 0.3s;
        }
        .seio-minimized:hover {
          opacity: 1;
          transform: scale(0.8);
        }
        .seio-name-tag {
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          font-weight: 700;
          color: ${config.primaryColor};
          white-space: nowrap;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.7;
        }
      `}</style>

            <div
                ref={botRef}
                className={`seio-bot ${isMinimized ? "seio-minimized" : ""}`}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onClick={handleClick}
                title={`${config.name} — Click me!`}
            >
                {/* Minimize button */}
                {!isMinimized && (
                    <button
                        className="seio-minimize-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(true);
                            setBubble(null);
                        }}
                        title="Minimize"
                    >
                        −
                    </button>
                )}

                {/* Speech bubble */}
                {bubble && !isMinimized && (
                    <SpeechBubble
                        message={bubble.message}
                        action={bubble.action}
                        onAction={handleAction}
                        onDismiss={() => setBubble(null)}
                        primaryColor={config.primaryColor}
                        name={config.name}
                    />
                )}

                {/* Character */}
                <div className={isMinimized ? "" : "seio-bounce seio-body"}>
                    <SEIOCharacter
                        mood={mood}
                        size={isMinimized ? size * 0.6 : size}
                        primaryColor={config.primaryColor}
                        secondaryColor={config.secondaryColor}
                        glowColor={config.glowColor}
                        isWaving={isWaving}
                        isTalking={isTalking}
                    />
                </div>

                {/* Name tag */}
                {!isMinimized && (
                    <div className="seio-name-tag">{config.name}</div>
                )}
            </div>
        </>
    );
}