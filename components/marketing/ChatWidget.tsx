// components/marketing/ChatWidget.tsx
"use client";
import {useState, useEffect, useRef, useCallback} from "react";
import {MessageCircle, X, Send, Loader2, ChevronDown, Bot, User, AlertCircle, CheckCircle} from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
    escalated?: boolean;
    isAdminReply?: boolean;
}

function getSessionId(): string {
    if (typeof window === "undefined") return "";
    let id = sessionStorage.getItem("support_session_id");
    if (!id) {
        id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem("support_session_id", id);
    }
    return id;
}

const WELCOME: Message = {
    role: "assistant",
    content: "Hi! 👋 I'm the SEO Platform assistant. Ask me anything about features, pricing, or getting started. I'll escalate to our team if needed.",
    createdAt: new Date(),
};

const QUICK_QS = [
    "What's in the free plan?",
    "How does AI generation work?",
    "Can I use my own domain?",
    "Do you support teams?",
];

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([WELCOME]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isEscalated, setIsEscalated] = useState(false);
    const [visitorEmail, setVisitorEmail] = useState("");
    const [showEmailPrompt, setShowEmailPrompt] = useState(false);
    const [emailSaved, setEmailSaved] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasOpened, setHasOpened] = useState(false);
    const [lastMessageCount, setLastMessageCount] = useState(1);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const sessionId = useRef("");
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        sessionId.current = getSessionId();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setUnreadCount(0);
            setHasOpened(true);
        }
    }, [isOpen]);

    // Show unread dot after 30s to nudge user
    useEffect(() => {
        if (hasOpened) return;
        const t = setTimeout(() => setUnreadCount(1), 30000);
        return () => clearTimeout(t);
    }, [hasOpened]);

    // Poll for admin reply every 15s when escalated
    const pollForReply = useCallback(async () => {
        if (!sessionId.current || !isEscalated) return;
        try {
            const res = await fetch(`/api/support?sessionId=${sessionId.current}`);
            const d = await res.json();
            if (!d.success) return;

            const serverMsgs: { role: string; content: string; createdAt: string }[] = d.data.messages ?? [];
            if (serverMsgs.length > lastMessageCount) {
                // New messages arrived — check for admin replies
                const newMsgs = serverMsgs.slice(lastMessageCount);
                const adminReplies = newMsgs.filter(
                    (m) => m.role === "assistant" && m.content.startsWith("**Support Team Reply:**")
                );
                if (adminReplies.length > 0) {
                    setMessages((prev) => [
                        ...prev,
                        ...adminReplies.map((m) => ({
                            role: "assistant" as const,
                            content: m.content,
                            createdAt: new Date(m.createdAt),
                            isAdminReply: true,
                        })),
                    ]);
                    setLastMessageCount(serverMsgs.length);
                    // Show unread if widget is closed
                    if (!isOpen) setUnreadCount((c) => c + adminReplies.length);
                }
            }
        } catch { /* silent */
        }
    }, [isEscalated, lastMessageCount, isOpen]);

    // Start/stop polling
    useEffect(() => {
        if (isEscalated) {
            pollRef.current = setInterval(pollForReply, 15000);
        } else {
            if (pollRef.current) clearInterval(pollRef.current);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [isEscalated, pollForReply]);

    const sendMessage = useCallback(async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || isLoading) return;
        setInput("");
        const userMsg: Message = {role: "user", content: msg, createdAt: new Date()};
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: msg,
                    sessionId: sessionId.current,
                    visitorEmail: visitorEmail || undefined,
                }),
            });
            const d = await res.json();
            if (d.success) {
                const aMsg: Message = {
                    role: "assistant",
                    content: d.data.message,
                    createdAt: new Date(),
                    escalated: d.data.escalated,
                };
                setMessages((prev) => [...prev, aMsg]);
                setLastMessageCount((c) => c + 2);
                if (d.data.escalated && !isEscalated) {
                    setIsEscalated(true);
                    if (!visitorEmail) setTimeout(() => setShowEmailPrompt(true), 800);
                }
            }
        } catch {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Connection error. Please try again.",
                createdAt: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, visitorEmail, isEscalated]);

    const saveEmail = async () => {
        if (!visitorEmail.includes("@")) return;
        // Update ticket with email via support API
        try {
            await fetch("/api/support", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: `[System: User provided email for notifications: ${visitorEmail}]`,
                    sessionId: sessionId.current,
                    visitorEmail,
                }),
            });
        } catch { /* silent */
        }
        setShowEmailPrompt(false);
        setEmailSaved(true);
        setMessages((prev) => [...prev, {
            role: "assistant",
            content: `Got it! We'll email **${visitorEmail}** as soon as our team replies. You'll also see their reply here if you keep this chat open.`,
            createdAt: new Date(),
        }]);
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[560px] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white shrink-0">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="h-4 w-4"/>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">SEO Platform Support</p>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                                <p className="text-[11px] text-indigo-100">
                                    {isEscalated ? "Human support notified" : "AI Assistant · Usually instant"}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)}
                                className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
                            <X className="h-4 w-4"/>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.role === "assistant"
                                        ? msg.isAdminReply
                                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                                            : "bg-gradient-to-br from-indigo-500 to-sky-500 text-white"
                                        : "bg-muted text-muted-foreground"
                                }`}>
                                    {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5"/> :
                                        <User className="h-3.5 w-3.5"/>}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-sm"
                                        : msg.isAdminReply
                                            ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-tl-sm"
                                            : "bg-muted rounded-tl-sm"
                                }`}>
                                    {msg.isAdminReply && (
                                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                            <CheckCircle className="h-2.5 w-2.5"/> Support Team
                                        </p>
                                    )}
                                    {msg.content.split("**").map((part, j) =>
                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                                    )}
                                    {msg.escalated && (
                                        <div
                                            className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                                            <AlertCircle className="h-3 w-3 shrink-0"/>
                                            Ticket created — team notified
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2.5">
                                <div
                                    className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shrink-0">
                                    <Bot className="h-3.5 w-3.5 text-white"/>
                                </div>
                                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                    {[0, 150, 300].map((d) => (
                                        <div key={d}
                                             className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                                             style={{animationDelay: `${d}ms`}}/>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Email prompt */}
                        {showEmailPrompt && !emailSaved && (
                            <div
                                className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">
                                    📧 Get notified when our team replies
                                </p>
                                <div className="flex gap-2">
                                    <input type="email" value={visitorEmail}
                                           onChange={(e) => setVisitorEmail(e.target.value)}
                                           placeholder="your@email.com"
                                           className="flex-1 text-xs rounded-lg border px-2.5 py-1.5 bg-background focus:outline-none focus:border-indigo-500"
                                           onKeyDown={(e) => e.key === "Enter" && saveEmail()}/>
                                    <button onClick={saveEmail}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
                                        Notify me
                                    </button>
                                </div>
                                <button onClick={() => setShowEmailPrompt(false)}
                                        className="text-[10px] text-muted-foreground hover:underline mt-1">
                                    Skip — I'll check back here
                                </button>
                            </div>
                        )}

                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Quick questions */}
                    {messages.length <= 1 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                            {QUICK_QS.map((q) => (
                                <button key={q} onClick={() => sendMessage(q)}
                                        className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-3 py-3 border-t shrink-0">
                        <div className="flex gap-2 items-center">
                            <input ref={inputRef} type="text" value={input}
                                   onChange={(e) => setInput(e.target.value)}
                                   onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                   placeholder="Ask a question..."
                                   disabled={isLoading}
                                   className="flex-1 text-sm rounded-xl border bg-muted/30 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"/>
                            <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                                    className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                            AI answers instantly · Escalates to humans when needed
                        </p>
                    </div>
                </div>
            )}

            {/* Floating button */}
            <button onClick={() => setIsOpen((v) => !v)}
                    className="chat-widget-btn fixed bottom-6 right-4 sm:right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    aria-label="Open support chat">
                {isOpen ? <ChevronDown className="h-6 w-6"/> : (
                    <>
                        <MessageCircle className="h-6 w-6"/>
                        {unreadCount > 0 && (
                            <span
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
                        )}
                    </>
                )}
            </button>
        </>
    );
}

// "use client";
// import {useState, useEffect, useRef, useCallback} from "react";
// import {MessageCircle, X, Send, Loader2, ChevronDown, Bot, User, AlertCircle} from "lucide-react";
//
// interface Message {
//     role: "user" | "assistant";
//     content: string;
//     createdAt: Date;
//     escalated?: boolean;
// }
//
// // Generate a stable session ID per browser session
// function getSessionId(): string {
//     if (typeof window === "undefined") return "";
//     let id = sessionStorage.getItem("support_session_id");
//     if (!id) {
//         id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
//         sessionStorage.setItem("support_session_id", id);
//     }
//     return id;
// }
//
// const WELCOME_MESSAGE: Message = {
//     role: "assistant",
//     content: "Hi! 👋 I'm the SEO Platform assistant. Ask me anything about our features, pricing, or how to get started. If I can't help, I'll connect you with our team.",
//     createdAt: new Date(),
// };
//
// const QUICK_QUESTIONS = [
//     "What's included in the free plan?",
//     "How does AI blog generation work?",
//     "Can I use my own domain?",
//     "Do you support team collaboration?",
// ];
//
// export function ChatWidget() {
//     const [isOpen, setIsOpen] = useState(false);
//     const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
//     const [input, setInput] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [isEscalated, setIsEscalated] = useState(false);
//     const [visitorEmail, setVisitorEmail] = useState("");
//     const [showEmailPrompt, setShowEmailPrompt] = useState(false);
//     const [unreadCount, setUnreadCount] = useState(0);
//     const [hasOpened, setHasOpened] = useState(false);
//     const messagesEndRef = useRef<HTMLDivElement>(null);
//     const inputRef = useRef<HTMLInputElement>(null);
//     const sessionId = useRef<string>("");
//
//     useEffect(() => {
//         sessionId.current = getSessionId();
//     }, []);
//
//     // Auto-scroll to bottom
//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
//     }, [messages]);
//
//     // Focus input when opened
//     useEffect(() => {
//         if (isOpen) {
//             setTimeout(() => inputRef.current?.focus(), 100);
//             setUnreadCount(0);
//             setHasOpened(true);
//         }
//     }, [isOpen]);
//
//     // Show unread indicator after 30s if not opened
//     useEffect(() => {
//         if (hasOpened) return;
//         const timer = setTimeout(() => {
//             setUnreadCount(1);
//         }, 30000);
//         return () => clearTimeout(timer);
//     }, [hasOpened]);
//
//     const sendMessage = useCallback(async (text?: string) => {
//         const messageText = (text ?? input).trim();
//         if (!messageText || isLoading) return;
//
//         setInput("");
//         const userMessage: Message = {role: "user", content: messageText, createdAt: new Date()};
//         setMessages((prev) => [...prev, userMessage]);
//         setIsLoading(true);
//
//         try {
//             const res = await fetch("/api/support", {
//                 method: "POST",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({
//                     message: messageText,
//                     sessionId: sessionId.current,
//                     visitorEmail: visitorEmail || undefined,
//                 }),
//             });
//             const data = await res.json();
//
//             if (data.success) {
//                 const assistantMessage: Message = {
//                     role: "assistant",
//                     content: data.data.message,
//                     createdAt: new Date(),
//                     escalated: data.data.escalated,
//                 };
//                 setMessages((prev) => [...prev, assistantMessage]);
//
//                 if (data.data.escalated && !isEscalated) {
//                     setIsEscalated(true);
//                     if (!visitorEmail) {
//                         setTimeout(() => setShowEmailPrompt(true), 1000);
//                     }
//                 }
//             } else {
//                 setMessages((prev) => [...prev, {
//                     role: "assistant",
//                     content: "Sorry, something went wrong. Please try again or email us directly.",
//                     createdAt: new Date(),
//                 }]);
//             }
//         } catch {
//             setMessages((prev) => [...prev, {
//                 role: "assistant",
//                 content: "Connection error. Please check your internet and try again.",
//                 createdAt: new Date(),
//             }]);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [input, isLoading, visitorEmail, isEscalated]);
//
//     const handleKeyDown = (e: React.KeyboardEvent) => {
//         if (e.key === "Enter" && !e.shiftKey) {
//             e.preventDefault();
//             sendMessage();
//         }
//     };
//
//     const saveEmail = async () => {
//         if (!visitorEmail.includes("@")) return;
//         setShowEmailPrompt(false);
//         setMessages((prev) => [...prev, {
//             role: "assistant",
//             content: `Got it! We'll send our team's reply to **${visitorEmail}**. They typically respond within a few hours.`,
//             createdAt: new Date(),
//         }]);
//     };
//
//     return (
//         <>
//             {/* ── Chat window ── */}
//             {isOpen && (
//                 <div
//                     className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[560px] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
//                     {/* Header */}
//                     <div
//                         className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white shrink-0">
//                         <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
//                             <Bot className="h-4 w-4"/>
//                         </div>
//                         <div className="flex-1">
//                             <p className="font-semibold text-sm">SEO Platform Support</p>
//                             <div className="flex items-center gap-1.5">
//                                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
//                                 <p className="text-[11px] text-indigo-100">AI Assistant · Usually instant</p>
//                             </div>
//                         </div>
//                         <button onClick={() => setIsOpen(false)}
//                                 className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
//                             <X className="h-4 w-4"/>
//                         </button>
//                     </div>
//
//                     {/* Messages */}
//                     <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
//                         {messages.map((msg, i) => (
//                             <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
//                                 {/* Avatar */}
//                                 <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
//                                     msg.role === "assistant"
//                                         ? "bg-gradient-to-br from-indigo-500 to-sky-500 text-white"
//                                         : "bg-muted text-muted-foreground"
//                                 }`}>
//                                     {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5"/> :
//                                         <User className="h-3.5 w-3.5"/>}
//                                 </div>
//                                 {/* Bubble */}
//                                 <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
//                                     msg.role === "user"
//                                         ? "bg-indigo-600 text-white rounded-tr-sm"
//                                         : "bg-muted rounded-tl-sm"
//                                 }`}>
//                                     {msg.content.split("**").map((part, j) =>
//                                         j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
//                                     )}
//                                     {msg.escalated && (
//                                         <div
//                                             className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 dark:text-amber-400">
//                                             <AlertCircle className="h-3 w-3 shrink-0"/>
//                                             Ticket created — our team will follow up
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         ))}
//
//                         {/* Loading indicator */}
//                         {isLoading && (
//                             <div className="flex gap-2.5">
//                                 <div
//                                     className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shrink-0">
//                                     <Bot className="h-3.5 w-3.5 text-white"/>
//                                 </div>
//                                 <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
//                                     <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
//                                          style={{animationDelay: "0ms"}}/>
//                                     <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
//                                          style={{animationDelay: "150ms"}}/>
//                                     <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
//                                          style={{animationDelay: "300ms"}}/>
//                                 </div>
//                             </div>
//                         )}
//
//                         {/* Email prompt */}
//                         {showEmailPrompt && (
//                             <div
//                                 className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
//                                 <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">
//                                     Get notified when our team replies
//                                 </p>
//                                 <div className="flex gap-2">
//                                     <input
//                                         type="email"
//                                         value={visitorEmail}
//                                         onChange={(e) => setVisitorEmail(e.target.value)}
//                                         placeholder="your@email.com"
//                                         className="flex-1 text-xs rounded-lg border px-2.5 py-1.5 bg-background focus:outline-none focus:border-indigo-500"
//                                         onKeyDown={(e) => e.key === "Enter" && saveEmail()}
//                                     />
//                                     <button onClick={saveEmail}
//                                             className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
//                                         Notify me
//                                     </button>
//                                 </div>
//                                 <button onClick={() => setShowEmailPrompt(false)}
//                                         className="text-[10px] text-muted-foreground hover:underline mt-1">
//                                     Skip
//                                 </button>
//                             </div>
//                         )}
//
//                         <div ref={messagesEndRef}/>
//                     </div>
//
//                     {/* Quick questions (show only at start) */}
//                     {messages.length <= 1 && (
//                         <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
//                             {QUICK_QUESTIONS.map((q) => (
//                                 <button
//                                     key={q}
//                                     onClick={() => sendMessage(q)}
//                                     className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
//                                 >
//                                     {q}
//                                 </button>
//                             ))}
//                         </div>
//                     )}
//
//                     {/* Input */}
//                     <div className="px-3 py-3 border-t shrink-0">
//                         <div className="flex gap-2 items-end">
//                             <input
//                                 ref={inputRef}
//                                 type="text"
//                                 value={input}
//                                 onChange={(e) => setInput(e.target.value)}
//                                 onKeyDown={handleKeyDown}
//                                 placeholder="Ask a question..."
//                                 disabled={isLoading}
//                                 className="flex-1 text-sm rounded-xl border bg-muted/30 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50 transition-colors"
//                             />
//                             <button
//                                 onClick={() => sendMessage()}
//                                 disabled={!input.trim() || isLoading}
//                                 className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
//                             >
//                                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
//                             </button>
//                         </div>
//                         <p className="text-[10px] text-muted-foreground text-center mt-2">
//                             Powered by AI · Escalates to humans when needed
//                         </p>
//                     </div>
//                 </div>
//             )}
//
//             {/* ── Floating button ── */}
//             <button
//                 onClick={() => setIsOpen((v) => !v)}
//                 className="fixed bottom-6 right-4 sm:right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
//                 aria-label="Open support chat"
//             >
//                 {isOpen ? (
//                     <ChevronDown className="h-6 w-6"/>
//                 ) : (
//                     <>
//                         <MessageCircle className="h-6 w-6"/>
//                         {unreadCount > 0 && (
//                             <span
//                                 className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
//                 {unreadCount}
//               </span>
//                         )}
//                     </>
//                 )}
//             </button>
//         </>
//     );
// }