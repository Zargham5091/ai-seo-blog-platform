// app/(dashboard)/dashboard/super-admin/support/route.ts
"use client";
import {useEffect, useState, useRef, useCallback} from "react";
import {
    MessageCircle, CheckCircle, Clock, AlertCircle,
    Send, X, User, Bot, RefreshCw, Filter,
} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/form-elements";
import {Button} from "@/components/ui/button";
import {formatDate} from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}

interface Ticket {
    _id: string;
    sessionId: string;
    visitorEmail?: string;
    subject?: string;
    status: "open" | "pending_admin" | "replied" | "closed";
    messages: Message[];
    createdAt: string;
    updatedAt: string;
    userId?: { name: string; email: string; plan: string };
}

const STATUS_CONFIG = {
    open: {label: "Open", color: "secondary" as const, icon: Clock},
    pending_admin: {label: "Needs Reply", color: "destructive" as const, icon: AlertCircle},
    replied: {label: "Replied", color: "success" as const, icon: CheckCircle},
    closed: {label: "Closed", color: "secondary" as const, icon: CheckCircle},
};

const PLAN_COLOR: Record<string, "secondary" | "info" | "warning" | "success"> = {
    free: "secondary", silver: "info", gold: "warning", diamond: "success",
};

export default function SuperAdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [statusFilter, setStatusFilter] = useState("pending_admin");
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── Fetch ticket list ────────────────────────────────────────────────────
    const fetchTickets = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const res = await fetch(`/api/super-admin/support?status=${statusFilter}&limit=50`);
            const d = await res.json();
            if (d.success) {
                setTickets(d.data ?? []);
                setPendingCount(d.pendingCount ?? 0);

                // If a ticket is selected, refresh its messages too
                setSelectedTicket((prev) => {
                    if (!prev) return prev;
                    const updated = (d.data as Ticket[]).find((t) => t._id === prev._id);
                    return updated ?? prev;
                });
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [statusFilter]);

    // ── Auto-poll every 10s ───────────────────────────────────────────────────
    useEffect(() => {
        fetchTickets();
        pollRef.current = setInterval(() => fetchTickets(true), 10000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchTickets]);

    // ── Scroll to bottom when messages change ────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [selectedTicket?.messages]);

    const sendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setIsSending(true);
        try {
            const res = await fetch("/api/super-admin/support", {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ticketId: selectedTicket._id, reply: replyText}),
            });
            const d = await res.json();
            if (d.success) {
                setReplyText("");
                // Immediately refresh to show the reply
                await fetchTickets(true);
            }
        } finally {
            setIsSending(false);
        }
    };

    const closeTicket = async (ticketId: string) => {
        await fetch("/api/super-admin/support", {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ticketId, status: "closed"}),
        });
        setSelectedTicket(null);
        fetchTickets(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-indigo-500"/> Support Inbox
                        {pendingCount > 0 && (
                            <Badge variant="destructive" className="ml-1 animate-pulse">{pendingCount} pending</Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Auto-refreshes every 10s · New messages appear automatically
                    </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchTickets()}>
                    <RefreshCw className="h-3.5 w-3.5"/> Refresh
                </Button>
            </div>

            {/* Status filters */}
            <div className="flex gap-2 flex-wrap">
                {[
                    {value: "pending_admin", label: `Needs Reply${pendingCount > 0 ? ` (${pendingCount})` : ""}`},
                    {value: "open", label: "Open"},
                    {value: "replied", label: "Replied"},
                    {value: "closed", label: "Closed"},
                    {value: "all", label: "All"},
                ].map((s) => (
                    <Button key={s.value} variant={statusFilter === s.value ? "default" : "outline"} size="sm"
                            onClick={() => setStatusFilter(s.value)}>
                        <Filter className="h-3 w-3 mr-1"/>{s.label}
                    </Button>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* ── Ticket list ── */}
                <div className="space-y-2">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl"/>)
                    ) : tickets.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                                <p className="font-semibold">No tickets</p>
                                <p className="text-sm text-muted-foreground">Support requests appear here</p>
                            </CardContent>
                        </Card>
                    ) : (
                        tickets.map((ticket) => {
                            const cfg = STATUS_CONFIG[ticket.status];
                            const StatusIcon = cfg.icon;
                            const lastUserMsg = [...ticket.messages].reverse().find((m) => m.role === "user");
                            const isSelected = selectedTicket?._id === ticket._id;
                            const hasNewMsg = isSelected && selectedTicket &&
                                ticket.messages.length > selectedTicket.messages.length;

                            return (
                                <Card key={ticket._id}
                                      className={`cursor-pointer transition-all hover:shadow-sm ${isSelected ? "border-indigo-500 shadow-sm" : ""} ${ticket.status === "pending_admin" ? "border-red-200 dark:border-red-800" : ""} ${hasNewMsg ? "ring-2 ring-indigo-400" : ""}`}
                                      onClick={() => {
                                          setSelectedTicket(ticket);
                                          setReplyText("");
                                      }}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{ticket.subject ?? "Support Request"}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    {ticket.visitorEmail && (
                                                        <span
                                                            className="text-xs text-muted-foreground">{ticket.visitorEmail}</span>
                                                    )}
                                                    {ticket.userId && (
                                                        <Badge variant={PLAN_COLOR[ticket.userId.plan] ?? "secondary"}
                                                               className="text-[10px] capitalize px-1.5 py-0">
                                                            {ticket.userId.plan}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={cfg.color} className="text-[10px] gap-1 shrink-0">
                                                <StatusIcon className="h-2.5 w-2.5"/>{cfg.label}
                                            </Badge>
                                        </div>
                                        {lastUserMsg && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{lastUserMsg.content}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <span
                                                className="text-[10px] text-muted-foreground">{ticket.messages.length} messages</span>
                                            <span className="text-[10px] text-muted-foreground">
                        {formatDate(new Date(ticket.updatedAt), {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        })}
                      </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* ── Ticket detail + reply ── */}
                {selectedTicket ? (
                    <Card className="flex flex-col" style={{maxHeight: "700px"}}>
                        <CardHeader className="pb-3 shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle
                                    className="text-sm truncate">{selectedTicket.subject ?? "Support Request"}</CardTitle>
                                <div className="flex gap-2 shrink-0">
                                    {selectedTicket.status !== "closed" && (
                                        <Button variant="outline" size="sm" className="text-xs gap-1"
                                                onClick={() => closeTicket(selectedTicket._id)}>
                                            <X className="h-3 w-3"/> Close
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedTicket.visitorEmail && (
                                    <span
                                        className="text-xs text-muted-foreground">📧 {selectedTicket.visitorEmail}</span>
                                )}
                                {selectedTicket.userId && (
                                    <span className="text-xs text-muted-foreground">
                    👤 {selectedTicket.userId.name} ({selectedTicket.userId.email})
                  </span>
                                )}
                                <Badge variant={STATUS_CONFIG[selectedTicket.status].color} className="text-[10px]">
                                    {STATUS_CONFIG[selectedTicket.status].label}
                                </Badge>
                            </div>
                            {/* Session ID for reference */}
                            <p className="text-[10px] text-muted-foreground font-mono">
                                Session: {selectedTicket.sessionId}
                            </p>
                        </CardHeader>

                        {/* Messages */}
                        <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0">
                            {selectedTicket.messages.map((msg, i) => {
                                const isAdminReply = msg.role === "assistant" && msg.content.startsWith("**Support Team Reply:**");
                                return (
                                    <div key={i}
                                         className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                        <div
                                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                                                msg.role === "assistant"
                                                    ? isAdminReply
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-gradient-to-br from-indigo-500 to-sky-500 text-white"
                                                    : "bg-muted"
                                            }`}>
                                            {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5"/> :
                                                <User className="h-3.5 w-3.5"/>}
                                        </div>
                                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                            msg.role === "user"
                                                ? "bg-indigo-600 text-white"
                                                : isAdminReply
                                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                                                    : "bg-muted"
                                        }`}>
                                            {isAdminReply && (
                                                <p className="text-[10px] font-semibold text-emerald-600 mb-1">👤 You
                                                    (Support Team)</p>
                                            )}
                                            <p>{msg.content.replace("**Support Team Reply:** ", "")}</p>
                                            <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-indigo-200" : "text-muted-foreground"}`}>
                                                {formatDate(new Date(msg.createdAt), {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef}/>
                        </CardContent>

                        {/* Reply box */}
                        {selectedTicket.status !== "closed" && (
                            <div className="border-t p-4 space-y-2 shrink-0">
                                <p className="text-xs font-medium text-muted-foreground">Reply to customer</p>
                                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                          placeholder="Type your reply..."
                                          rows={3}
                                          onKeyDown={(e) => {
                                              if (e.key === "Enter" && e.ctrlKey) sendReply();
                                          }}
                                          className="w-full text-sm rounded-xl border bg-muted/20 px-3 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"/>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-muted-foreground">Ctrl+Enter to send</p>
                                    <div className="flex items-center gap-2">
                                        {selectedTicket.visitorEmail ? (
                                            <span
                                                className="text-[10px] text-emerald-600">✓ Will email {selectedTicket.visitorEmail}</span>
                                        ) : (
                                            <span
                                                className="text-[10px] text-muted-foreground">No email — chat only</span>
                                        )}
                                        <Button variant="gradient" size="sm" className="gap-2"
                                                onClick={sendReply} isLoading={isSending} disabled={!replyText.trim()}>
                                            <Send className="h-3.5 w-3.5"/> Send Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                ) : (
                    <div
                        className="hidden lg:flex items-center justify-center rounded-xl border border-dashed h-64 text-muted-foreground">
                        <div className="text-center">
                            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30"/>
                            <p className="text-sm">Select a ticket to view conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// // app/(dashboard)/dashboard/super-admin/support/route.ts
// "use client";
// import {useEffect, useState} from "react";
// import {
//     MessageCircle, CheckCircle, Clock, AlertCircle,
//     Send, X, User, Bot, RefreshCw, Filter,
// } from "lucide-react";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {Badge} from "@/components/ui/form-elements";
// import {Button} from "@/components/ui/button";
// import {formatDate} from "@/lib/utils";
//
// interface Message {
//     role: "user" | "assistant";
//     content: string;
//     createdAt: string;
// }
//
// interface Ticket {
//     _id: string;
//     sessionId: string;
//     visitorEmail?: string;
//     subject?: string;
//     status: "open" | "pending_admin" | "replied" | "closed";
//     messages: Message[];
//     adminReply?: string;
//     adminRepliedAt?: string;
//     createdAt: string;
//     updatedAt: string;
//     userId?: { name: string; email: string; plan: string };
// }
//
// const STATUS_CONFIG = {
//     open: {label: "Open", color: "secondary" as const, icon: Clock},
//     pending_admin: {label: "Needs Reply", color: "destructive" as const, icon: AlertCircle},
//     replied: {label: "Replied", color: "success" as const, icon: CheckCircle},
//     closed: {label: "Closed", color: "secondary" as const, icon: CheckCircle},
// };
//
// const PLAN_COLOR: Record<string, "secondary" | "info" | "warning" | "success"> = {
//     free: "secondary", silver: "info", gold: "warning", diamond: "success",
// };
//
// export default function SuperAdminSupportPage() {
//     const [tickets, setTickets] = useState<Ticket[]>([]);
//     const [pendingCount, setPendingCount] = useState(0);
//     const [isLoading, setIsLoading] = useState(true);
//     const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
//     const [replyText, setReplyText] = useState("");
//     const [isSending, setIsSending] = useState(false);
//     const [statusFilter, setStatusFilter] = useState("pending_admin");
//
//     const fetchTickets = async () => {
//         setIsLoading(true);
//         try {
//             const res = await fetch(`/api/super-admin/support?status=${statusFilter}&limit=50`);
//             const d = await res.json();
//             if (d.success) {
//                 setTickets(d.data ?? []);
//                 setPendingCount(d.pendingCount ?? 0);
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     useEffect(() => {
//         fetchTickets();
//     }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
//
//     const sendReply = async () => {
//         if (!replyText.trim() || !selectedTicket) return;
//         setIsSending(true);
//         try {
//             const res = await fetch("/api/super-admin/support", {
//                 method: "PATCH",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({ticketId: selectedTicket._id, reply: replyText}),
//             });
//             const d = await res.json();
//             if (d.success) {
//                 setReplyText("");
//                 setSelectedTicket(null);
//                 fetchTickets();
//             }
//         } finally {
//             setIsSending(false);
//         }
//     };
//
//     const closeTicket = async (ticketId: string) => {
//         await fetch("/api/super-admin/support", {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({ticketId, status: "closed"}),
//         });
//         setSelectedTicket(null);
//         fetchTickets();
//     };
//
//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-2xl font-bold flex items-center gap-2">
//                         <MessageCircle className="h-6 w-6 text-indigo-500"/> Support Inbox
//                         {pendingCount > 0 && (
//                             <Badge variant="destructive" className="ml-1">{pendingCount} pending</Badge>
//                         )}
//                     </h1>
//                     <p className="text-muted-foreground text-sm">Customer support tickets from the chatbot</p>
//                 </div>
//                 <Button variant="outline" size="sm" className="gap-2" onClick={fetchTickets}>
//                     <RefreshCw className="h-3.5 w-3.5"/> Refresh
//                 </Button>
//             </div>
//
//             {/* Status filters */}
//             <div className="flex gap-2 flex-wrap">
//                 {[
//                     {value: "pending_admin", label: `Needs Reply${pendingCount > 0 ? ` (${pendingCount})` : ""}`},
//                     {value: "open", label: "Open"},
//                     {value: "replied", label: "Replied"},
//                     {value: "closed", label: "Closed"},
//                     {value: "all", label: "All"},
//                 ].map((s) => (
//                     <Button key={s.value} variant={statusFilter === s.value ? "default" : "outline"} size="sm"
//                             onClick={() => setStatusFilter(s.value)}>
//                         <Filter className="h-3 w-3 mr-1"/>{s.label}
//                     </Button>
//                 ))}
//             </div>
//
//             <div className="grid lg:grid-cols-2 gap-6">
//                 {/* Ticket list */}
//                 <div className="space-y-2">
//                     {isLoading ? (
//                         [...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl"/>)
//                     ) : tickets.length === 0 ? (
//                         <Card>
//                             <CardContent className="flex flex-col items-center py-12 text-center">
//                                 <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3"/>
//                                 <p className="font-semibold">No tickets found</p>
//                                 <p className="text-sm text-muted-foreground">Customer support requests will appear
//                                     here</p>
//                             </CardContent>
//                         </Card>
//                     ) : (
//                         tickets.map((ticket) => {
//                             const cfg = STATUS_CONFIG[ticket.status];
//                             const StatusIcon = cfg.icon;
//                             const lastUserMsg = [...ticket.messages].reverse().find((m) => m.role === "user");
//                             return (
//                                 <Card
//                                     key={ticket._id}
//                                     className={`cursor-pointer transition-all hover:shadow-sm ${selectedTicket?._id === ticket._id ? "border-indigo-500 shadow-sm" : ""} ${ticket.status === "pending_admin" ? "border-red-200 dark:border-red-800" : ""}`}
//                                     onClick={() => {
//                                         setSelectedTicket(ticket);
//                                         setReplyText("");
//                                     }}
//                                 >
//                                     <CardContent className="p-4">
//                                         <div className="flex items-start justify-between gap-2 mb-2">
//                                             <div className="flex-1 min-w-0">
//                                                 <p className="text-sm font-semibold truncate">
//                                                     {ticket.subject ?? "Support Request"}
//                                                 </p>
//                                                 <div className="flex items-center gap-2 mt-0.5 flex-wrap">
//                                                     {ticket.visitorEmail && (
//                                                         <span
//                                                             className="text-xs text-muted-foreground">{ticket.visitorEmail}</span>
//                                                     )}
//                                                     {ticket.userId && (
//                                                         <Badge variant={PLAN_COLOR[ticket.userId.plan] ?? "secondary"}
//                                                                className="text-[10px] capitalize px-1.5 py-0">
//                                                             {ticket.userId.plan}
//                                                         </Badge>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                             <Badge variant={cfg.color} className="text-[10px] gap-1 shrink-0">
//                                                 <StatusIcon className="h-2.5 w-2.5"/>{cfg.label}
//                                             </Badge>
//                                         </div>
//                                         {lastUserMsg && (
//                                             <p className="text-xs text-muted-foreground line-clamp-2">{lastUserMsg.content}</p>
//                                         )}
//                                         <div className="flex items-center justify-between mt-2">
//                       <span className="text-[10px] text-muted-foreground">
//                         {ticket.messages.length} messages
//                       </span>
//                                             <span className="text-[10px] text-muted-foreground">
//                         {formatDate(new Date(ticket.updatedAt), {
//                             month: "short",
//                             day: "numeric",
//                             hour: "2-digit",
//                             minute: "2-digit"
//                         })}
//                       </span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             );
//                         })
//                     )}
//                 </div>
//
//                 {/* Ticket detail + reply */}
//                 {selectedTicket ? (
//                     <Card className="flex flex-col h-fit max-h-[700px]">
//                         <CardHeader className="pb-3 shrink-0">
//                             <div className="flex items-center justify-between">
//                                 <CardTitle className="text-sm">{selectedTicket.subject ?? "Support Request"}</CardTitle>
//                                 <div className="flex gap-2">
//                                     {selectedTicket.status !== "closed" && (
//                                         <Button variant="outline" size="sm" className="text-xs gap-1"
//                                                 onClick={() => closeTicket(selectedTicket._id)}>
//                                             <X className="h-3 w-3"/> Close
//                                         </Button>
//                                     )}
//                                 </div>
//                             </div>
//                             {/* Visitor info */}
//                             <div className="flex items-center gap-2 flex-wrap">
//                                 {selectedTicket.visitorEmail && (
//                                     <span
//                                         className="text-xs text-muted-foreground">📧 {selectedTicket.visitorEmail}</span>
//                                 )}
//                                 {selectedTicket.userId && (
//                                     <span className="text-xs text-muted-foreground">
//                     👤 {selectedTicket.userId.name} ({selectedTicket.userId.email})
//                   </span>
//                                 )}
//                                 <Badge variant={STATUS_CONFIG[selectedTicket.status].color} className="text-[10px]">
//                                     {STATUS_CONFIG[selectedTicket.status].label}
//                                 </Badge>
//                             </div>
//                         </CardHeader>
//
//                         {/* Message thread */}
//                         <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0 max-h-[400px]">
//                             {selectedTicket.messages.map((msg, i) => (
//                                 <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
//                                     <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
//                                         msg.role === "assistant"
//                                             ? "bg-gradient-to-br from-indigo-500 to-sky-500 text-white"
//                                             : "bg-muted"
//                                     }`}>
//                                         {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5"/> :
//                                             <User className="h-3.5 w-3.5"/>}
//                                     </div>
//                                     <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
//                                         msg.role === "user" ? "bg-indigo-600 text-white" : "bg-muted"
//                                     }`}>
//                                         <p>{msg.content}</p>
//                                         <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-indigo-200" : "text-muted-foreground"}`}>
//                                             {formatDate(new Date(msg.createdAt), {hour: "2-digit", minute: "2-digit"})}
//                                         </p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </CardContent>
//
//                         {/* Reply box */}
//                         {selectedTicket.status !== "closed" && (
//                             <div className="border-t p-4 space-y-2 shrink-0">
//                                 <p className="text-xs font-medium text-muted-foreground">Reply to customer</p>
//                                 <textarea
//                                     value={replyText}
//                                     onChange={(e) => setReplyText(e.target.value)}
//                                     placeholder="Type your reply... This will be sent to the customer's email if they provided one."
//                                     rows={3}
//                                     className="w-full text-sm rounded-xl border bg-muted/20 px-3 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
//                                 />
//                                 <Button variant="gradient" size="sm" className="gap-2 w-full"
//                                         onClick={sendReply} isLoading={isSending} disabled={!replyText.trim()}>
//                                     <Send className="h-3.5 w-3.5"/> Send Reply
//                                 </Button>
//                                 {selectedTicket.visitorEmail ? (
//                                     <p className="text-[10px] text-emerald-600 text-center">
//                                         ✓ Reply will be emailed to {selectedTicket.visitorEmail}
//                                     </p>
//                                 ) : (
//                                     <p className="text-[10px] text-muted-foreground text-center">
//                                         No email on file — reply visible in chat only
//                                     </p>
//                                 )}
//                             </div>
//                         )}
//                     </Card>
//                 ) : (
//                     <div
//                         className="hidden lg:flex items-center justify-center rounded-xl border border-dashed h-64 text-muted-foreground">
//                         <div className="text-center">
//                             <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30"/>
//                             <p className="text-sm">Select a ticket to view conversation</p>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
// "use client";
// import {useEffect, useState} from "react";
// import {
//     MessageCircle, CheckCircle, Clock, AlertCircle,
//     Send, X, User, Bot, RefreshCw, Filter,
// } from "lucide-react";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {Badge} from "@/components/ui/form-elements";
// import {Button} from "@/components/ui/button";
// import {formatDate} from "@/lib/utils";
//
// interface Message {
//     role: "user" | "assistant";
//     content: string;
//     createdAt: string;
// }
//
// interface Ticket {
//     _id: string;
//     sessionId: string;
//     visitorEmail?: string;
//     subject?: string;
//     status: "open" | "pending_admin" | "replied" | "closed";
//     messages: Message[];
//     adminReply?: string;
//     adminRepliedAt?: string;
//     createdAt: string;
//     updatedAt: string;
//     userId?: { name: string; email: string; plan: string };
// }
//
// const STATUS_CONFIG = {
//     open: {label: "Open", color: "secondary" as const, icon: Clock},
//     pending_admin: {label: "Needs Reply", color: "destructive" as const, icon: AlertCircle},
//     replied: {label: "Replied", color: "success" as const, icon: CheckCircle},
//     closed: {label: "Closed", color: "secondary" as const, icon: CheckCircle},
// };
//
// const PLAN_COLOR: Record<string, "secondary" | "info" | "warning" | "success"> = {
//     free: "secondary", silver: "info", gold: "warning", diamond: "success",
// };
//
// export default function SuperAdminSupportPage() {
//     const [tickets, setTickets] = useState<Ticket[]>([]);
//     const [pendingCount, setPendingCount] = useState(0);
//     const [isLoading, setIsLoading] = useState(true);
//     const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
//     const [replyText, setReplyText] = useState("");
//     const [isSending, setIsSending] = useState(false);
//     const [statusFilter, setStatusFilter] = useState("pending_admin");
//
//     const fetchTickets = async () => {
//         setIsLoading(true);
//         try {
//             const res = await fetch(`/api/super-admin/support?status=${statusFilter}&limit=50`);
//             const d = await res.json();
//             if (d.success) {
//                 setTickets(d.data ?? []);
//                 setPendingCount(d.pendingCount ?? 0);
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     useEffect(() => {
//         fetchTickets();
//     }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
//
//     const sendReply = async () => {
//         if (!replyText.trim() || !selectedTicket) return;
//         setIsSending(true);
//         try {
//             const res = await fetch("/api/super-admin/support", {
//                 method: "PATCH",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({ticketId: selectedTicket._id, reply: replyText}),
//             });
//             const d = await res.json();
//             if (d.success) {
//                 setReplyText("");
//                 setSelectedTicket(null);
//                 fetchTickets();
//             }
//         } finally {
//             setIsSending(false);
//         }
//     };
//
//     const closeTicket = async (ticketId: string) => {
//         await fetch("/api/super-admin/support", {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({ticketId, status: "closed"}),
//         });
//         setSelectedTicket(null);
//         fetchTickets();
//     };
//
//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-2xl font-bold flex items-center gap-2">
//                         <MessageCircle className="h-6 w-6 text-indigo-500"/> Support Inbox
//                         {pendingCount > 0 && (
//                             <Badge variant="destructive" className="ml-1">{pendingCount} pending</Badge>
//                         )}
//                     </h1>
//                     <p className="text-muted-foreground text-sm">Customer support tickets from the chatbot</p>
//                 </div>
//                 <Button variant="outline" size="sm" className="gap-2" onClick={fetchTickets}>
//                     <RefreshCw className="h-3.5 w-3.5"/> Refresh
//                 </Button>
//             </div>
//
//             {/* Status filters */}
//             <div className="flex gap-2 flex-wrap">
//                 {[
//                     {value: "pending_admin", label: `Needs Reply${pendingCount > 0 ? ` (${pendingCount})` : ""}`},
//                     {value: "open", label: "Open"},
//                     {value: "replied", label: "Replied"},
//                     {value: "closed", label: "Closed"},
//                     {value: "all", label: "All"},
//                 ].map((s) => (
//                     <Button key={s.value} variant={statusFilter === s.value ? "default" : "outline"} size="sm"
//                             onClick={() => setStatusFilter(s.value)}>
//                         <Filter className="h-3 w-3 mr-1"/>{s.label}
//                     </Button>
//                 ))}
//             </div>
//
//             <div className="grid lg:grid-cols-2 gap-6">
//                 {/* Ticket list */}
//                 <div className="space-y-2">
//                     {isLoading ? (
//                         [...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl"/>)
//                     ) : tickets.length === 0 ? (
//                         <Card>
//                             <CardContent className="flex flex-col items-center py-12 text-center">
//                                 <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3"/>
//                                 <p className="font-semibold">No tickets found</p>
//                                 <p className="text-sm text-muted-foreground">Customer support requests will appear
//                                     here</p>
//                             </CardContent>
//                         </Card>
//                     ) : (
//                         tickets.map((ticket) => {
//                             const cfg = STATUS_CONFIG[ticket.status];
//                             const StatusIcon = cfg.icon;
//                             const lastUserMsg = [...ticket.messages].reverse().find((m) => m.role === "user");
//                             return (
//                                 <Card
//                                     key={ticket._id}
//                                     className={`cursor-pointer transition-all hover:shadow-sm ${selectedTicket?._id === ticket._id ? "border-indigo-500 shadow-sm" : ""} ${ticket.status === "pending_admin" ? "border-red-200 dark:border-red-800" : ""}`}
//                                     onClick={() => {
//                                         setSelectedTicket(ticket);
//                                         setReplyText("");
//                                     }}
//                                 >
//                                     <CardContent className="p-4">
//                                         <div className="flex items-start justify-between gap-2 mb-2">
//                                             <div className="flex-1 min-w-0">
//                                                 <p className="text-sm font-semibold truncate">
//                                                     {ticket.subject ?? "Support Request"}
//                                                 </p>
//                                                 <div className="flex items-center gap-2 mt-0.5 flex-wrap">
//                                                     {ticket.visitorEmail && (
//                                                         <span
//                                                             className="text-xs text-muted-foreground">{ticket.visitorEmail}</span>
//                                                     )}
//                                                     {ticket.userId && (
//                                                         <Badge variant={PLAN_COLOR[ticket.userId.plan] ?? "secondary"}
//                                                                className="text-[10px] capitalize px-1.5 py-0">
//                                                             {ticket.userId.plan}
//                                                         </Badge>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                             <Badge variant={cfg.color} className="text-[10px] gap-1 shrink-0">
//                                                 <StatusIcon className="h-2.5 w-2.5"/>{cfg.label}
//                                             </Badge>
//                                         </div>
//                                         {lastUserMsg && (
//                                             <p className="text-xs text-muted-foreground line-clamp-2">{lastUserMsg.content}</p>
//                                         )}
//                                         <div className="flex items-center justify-between mt-2">
//                       <span className="text-[10px] text-muted-foreground">
//                         {ticket.messages.length} messages
//                       </span>
//                                             <span className="text-[10px] text-muted-foreground">
//                         {formatDate(new Date(ticket.updatedAt), {
//                             month: "short",
//                             day: "numeric",
//                             hour: "2-digit",
//                             minute: "2-digit"
//                         })}
//                       </span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             );
//                         })
//                     )}
//                 </div>
//
//                 {/* Ticket detail + reply */}
//                 {selectedTicket ? (
//                     <Card className="flex flex-col h-fit max-h-[700px]">
//                         <CardHeader className="pb-3 shrink-0">
//                             <div className="flex items-center justify-between">
//                                 <CardTitle className="text-sm">{selectedTicket.subject ?? "Support Request"}</CardTitle>
//                                 <div className="flex gap-2">
//                                     {selectedTicket.status !== "closed" && (
//                                         <Button variant="outline" size="sm" className="text-xs gap-1"
//                                                 onClick={() => closeTicket(selectedTicket._id)}>
//                                             <X className="h-3 w-3"/> Close
//                                         </Button>
//                                     )}
//                                 </div>
//                             </div>
//                             {/* Visitor info */}
//                             <div className="flex items-center gap-2 flex-wrap">
//                                 {selectedTicket.visitorEmail && (
//                                     <span
//                                         className="text-xs text-muted-foreground">📧 {selectedTicket.visitorEmail}</span>
//                                 )}
//                                 {selectedTicket.userId && (
//                                     <span className="text-xs text-muted-foreground">
//                     👤 {selectedTicket.userId.name} ({selectedTicket.userId.email})
//                   </span>
//                                 )}
//                                 <Badge variant={STATUS_CONFIG[selectedTicket.status].color} className="text-[10px]">
//                                     {STATUS_CONFIG[selectedTicket.status].label}
//                                 </Badge>
//                             </div>
//                         </CardHeader>
//
//                         {/* Message thread */}
//                         <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0 max-h-[400px]">
//                             {selectedTicket.messages.map((msg, i) => (
//                                 <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
//                                     <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
//                                         msg.role === "assistant"
//                                             ? "bg-gradient-to-br from-indigo-500 to-sky-500 text-white"
//                                             : "bg-muted"
//                                     }`}>
//                                         {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5"/> :
//                                             <User className="h-3.5 w-3.5"/>}
//                                     </div>
//                                     <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
//                                         msg.role === "user" ? "bg-indigo-600 text-white" : "bg-muted"
//                                     }`}>
//                                         <p>{msg.content}</p>
//                                         <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-indigo-200" : "text-muted-foreground"}`}>
//                                             {formatDate(new Date(msg.createdAt), {hour: "2-digit", minute: "2-digit"})}
//                                         </p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </CardContent>
//
//                         {/* Reply box */}
//                         {selectedTicket.status !== "closed" && (
//                             <div className="border-t p-4 space-y-2 shrink-0">
//                                 <p className="text-xs font-medium text-muted-foreground">Reply to customer</p>
//                                 <textarea
//                                     value={replyText}
//                                     onChange={(e) => setReplyText(e.target.value)}
//                                     placeholder="Type your reply... This will be sent to the customer's email if they provided one."
//                                     rows={3}
//                                     className="w-full text-sm rounded-xl border bg-muted/20 px-3 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
//                                 />
//                                 <Button variant="gradient" size="sm" className="gap-2 w-full"
//                                         onClick={sendReply} isLoading={isSending} disabled={!replyText.trim()}>
//                                     <Send className="h-3.5 w-3.5"/> Send Reply
//                                 </Button>
//                                 {selectedTicket.visitorEmail ? (
//                                     <p className="text-[10px] text-emerald-600 text-center">
//                                         ✓ Reply will be emailed to {selectedTicket.visitorEmail}
//                                     </p>
//                                 ) : (
//                                     <p className="text-[10px] text-muted-foreground text-center">
//                                         No email on file — reply visible in chat only
//                                     </p>
//                                 )}
//                             </div>
//                         )}
//                     </Card>
//                 ) : (
//                     <div
//                         className="hidden lg:flex items-center justify-center rounded-xl border border-dashed h-64 text-muted-foreground">
//                         <div className="text-center">
//                             <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30"/>
//                             <p className="text-sm">Select a ticket to view conversation</p>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }