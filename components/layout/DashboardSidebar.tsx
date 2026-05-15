"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useSession} from "next-auth/react";
import {
    LayoutDashboard, FileText, Search, BarChart3, Users, Settings,
    Globe, Tag, Sparkles, TrendingUp, Link2, Zap, FileBarChart,
    Gift, Calendar, Mail, FlaskConical, Layers, Star, Shield,
    CreditCard, Cpu, MessageSquare, Bell, Code, Repeat2, Activity,
    MessageCircle, Bot, ChevronDown, Heart, Store,
    BarChart2, Wrench, Menu, X,
} from "lucide-react";
import {cn} from "@/lib/utils";
import {useState, useEffect} from "react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    children?: NavItem[];
}

const ADMIN_NAV: NavItem[] = [
    {label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard},
    {label: "Blog Posts", href: "/dashboard/admin/blogs", icon: FileText},
    {label: "Categories", href: "/dashboard/admin/categories", icon: Tag},
    {label: "SEO Tools", href: "/dashboard/admin/seo", icon: Search},
    {label: "Keywords", href: "/dashboard/admin/seo/keywords", icon: TrendingUp},
    {label: "Schema Generator", href: "/dashboard/admin/seo/schema", icon: Code},
    {label: "AEO Optimizer", href: "/dashboard/admin/aeo", icon: Zap, badge: "AI"},
    {label: "A/B Testing", href: "/dashboard/admin/ab-test", icon: FlaskConical},
    {label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3},
    {label: "Rank Tracking", href: "/dashboard/admin/rank-tracking", icon: TrendingUp},
    {label: "Backlinks", href: "/dashboard/admin/backlinks", icon: Link2},
    {label: "Repurpose Content", href: "/dashboard/admin/repurpose", icon: Repeat2, badge: "AI"},
    {label: "Bulk Generate", href: "/dashboard/admin/bulk-generate", icon: Sparkles, badge: "💎"},
    {label: "Content Calendar", href: "/dashboard/admin/content-calendar", icon: Calendar},
    {label: "Newsletter", href: "/dashboard/admin/newsletter", icon: Mail},
    {label: "White-label Reports", href: "/dashboard/admin/reports", icon: FileBarChart},
    {label: "Media Library", href: "/dashboard/admin/media", icon: Layers},
    {label: "Team", href: "/dashboard/admin/team", icon: Users},
    {label: "My Domain", href: "/dashboard/admin/domain", icon: Globe},
    {
        label: "Site Builder", href: "/dashboard/admin/site", icon: Cpu,
        children: [
            {label: "My Websites", href: "/dashboard/admin/site/websites", icon: Globe},
            {label: "Builder", href: "/dashboard/admin/site", icon: Wrench},
            {label: "Site Dashboard", href: "/dashboard/admin/site/dashboard", icon: BarChart2},
            {label: "Site Health", href: "/dashboard/admin/site/health", icon: Heart},
            {label: "Marketplace", href: "/dashboard/admin/site/marketplace", icon: Store},
        ],
    },
    {label: "Referral Program", href: "/dashboard/admin/referral", icon: Gift},
    {label: "Notifications", href: "/dashboard/admin/alerts", icon: Bell},
    {label: "Settings", href: "/dashboard/admin/settings", icon: Settings},
];

const SUPER_ADMIN_NAV: NavItem[] = [
    {label: "Dashboard", href: "/dashboard/super-admin", icon: LayoutDashboard},
    {label: "Users", href: "/dashboard/super-admin/users", icon: Users},
    {label: "Plans", href: "/dashboard/super-admin/plans", icon: CreditCard},
    {label: "CMS Pages", href: "/dashboard/super-admin/cms", icon: FileText},
    {label: "Platform SEO", href: "/dashboard/super-admin/seo", icon: Search},
    {label: "Analytics", href: "/dashboard/super-admin/analytics", icon: BarChart3},
    {label: "Featured Posts", href: "/dashboard/super-admin/featured", icon: Star},
    {label: "Component Library", href: "/dashboard/super-admin/components", icon: Layers},
    {label: "SEIO Mascot", href: "/dashboard/super-admin/mascot", icon: Bot},
    {label: "Referral Payouts", href: "/dashboard/super-admin/referral", icon: Gift},
    {label: "Support Inbox", href: "/dashboard/super-admin/support", icon: MessageCircle},
    {label: "Activity Feed", href: "/dashboard/super-admin/activity", icon: Activity},
    {label: "Settings", href: "/dashboard/super-admin/settings", icon: Settings},
];

const USER_NAV: NavItem[] = [
    {label: "Dashboard", href: "/dashboard/user", icon: LayoutDashboard},
    {label: "Settings", href: "/dashboard/user/settings", icon: Settings},
];

const NAV_GROUPS = {
    super_admin: {label: "Super Admin", icon: Shield, color: "from-red-500 to-orange-500", items: SUPER_ADMIN_NAV},
    product_admin: {label: "Admin Panel", icon: LayoutDashboard, color: "from-indigo-500 to-sky-500", items: ADMIN_NAV},
    user: {label: "My Account", icon: Users, color: "from-emerald-500 to-teal-500", items: USER_NAV},
};

function NavItemRow({item, onNavigate}: { item: NavItem; onNavigate?: () => void }) {
    const pathname = usePathname();
    const isActive = pathname === item.href ||
        (item.href !== "/dashboard/admin" && item.href !== "/dashboard/super-admin" &&
            item.href !== "/dashboard/user" && pathname.startsWith(item.href));
    const isGroupActive = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href));
    const [open, setOpen] = useState(isGroupActive ?? false);

    if (item.children) {
        return (
            <div>
                <button onClick={() => setOpen(v => !v)}
                        className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            isGroupActive ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                    <item.icon className={cn("h-4 w-4 shrink-0", isGroupActive ? "text-indigo-500" : "")}/>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.badge && <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-semibold shrink-0">{item.badge}</span>}
                    <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open ? "rotate-180" : "")}/>
                </button>
                {open && (
                    <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                        {item.children.map(child => {
                            const childActive = pathname === child.href || (child.href !== item.href && pathname.startsWith(child.href));
                            return (
                                <Link key={child.href} href={child.href} onClick={onNavigate}
                                      className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                                          childActive ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                                    <child.icon
                                        className={cn("h-3.5 w-3.5 shrink-0", childActive ? "text-indigo-500" : "")}/>
                                    <span className="truncate">{child.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link href={item.href} onClick={onNavigate}
              className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-500" : "")}/>
            <span className="truncate flex-1">{item.label}</span>
            {item.badge && <span
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">{item.badge}</span>}
        </Link>
    );
}

function SidebarContent({group, role, session, onNavigate}: {
    group: typeof NAV_GROUPS[keyof typeof NAV_GROUPS];
    role: string;
    session: ReturnType<typeof useSession>["data"];
    onNavigate?: () => void;
}) {
    return (
        <>
            <div className="p-4 border-b shrink-0">
                <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${group.color}`}>
                        <group.icon className="h-4 w-4 text-white"/>
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-none">SEO Platform</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{group.label}</p>
                    </div>
                </Link>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {group.items.map(item => <NavItemRow key={item.href} item={item} onNavigate={onNavigate}/>)}
            </nav>
            {role === "product_admin" && (
                <div className="p-3 border-t shrink-0">
                    <div
                        className="rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800 p-3">
                        <p className="text-xs font-semibold capitalize">{session?.user?.plan ?? "free"} Plan</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {session?.user?.plan === "free" ? "Upgrade to unlock all features" : "Active subscription"}
                        </p>
                        {session?.user?.plan === "free" && (
                            <Link href="/dashboard/admin/settings" onClick={onNavigate}
                                  className="text-xs text-indigo-600 font-medium hover:underline mt-1 block">
                                Upgrade now →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export function DashboardSidebar() {
    const {data: session, status} = useSession();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileOpen(false);
        };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, []);
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    if (status === "loading") {
        return (
            <>
                <aside className="hidden md:flex w-64 shrink-0 border-r bg-background flex-col h-screen sticky top-0">
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-muted animate-pulse"/>
                            <div className="space-y-1">
                                <div className="h-3 w-24 rounded bg-muted animate-pulse"/>
                                <div className="h-2 w-16 rounded bg-muted animate-pulse"/>
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 p-3 space-y-1">
                        {[...Array(6)].map((_, i) => <div key={i}
                                                          className="h-9 rounded-lg bg-muted/50 animate-pulse"/>)}
                    </nav>
                </aside>
                <button className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg border bg-background shadow-sm">
                    <Menu className="h-5 w-5"/>
                </button>
            </>
        );
    }

    const role = session?.user?.role ?? "user";
    const group = NAV_GROUPS[role as keyof typeof NAV_GROUPS] ?? NAV_GROUPS.user;

    return (
        <>
            {/* Desktop */}
            <aside className="hidden md:flex w-64 shrink-0 border-r bg-background flex-col h-screen sticky top-0">
                <SidebarContent group={group} role={role} session={session}/>
            </aside>

            {/* Mobile burger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-3 left-3 z-50 flex items-center justify-center h-9 w-9 rounded-lg border bg-background shadow-sm hover:bg-muted transition-colors"
                aria-label="Open menu"
            >
                <Menu className="h-5 w-5"/>
            </button>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                     onClick={() => setMobileOpen(false)}/>
            )}

            {/* Mobile drawer */}
            <aside className={cn(
                "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-background border-r flex flex-col h-screen transition-transform duration-300 ease-in-out shadow-2xl",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <button onClick={() => setMobileOpen(false)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors z-10"
                        aria-label="Close menu">
                    <X className="h-5 w-5"/>
                </button>
                <SidebarContent group={group} role={role} session={session} onNavigate={() => setMobileOpen(false)}/>
            </aside>
        </>
    );
}

// "use client";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useSession } from "next-auth/react";
// import {
//     LayoutDashboard, FileText, Search, BarChart3, Users, Settings,
//     Globe, Tag, Sparkles, TrendingUp, Link2, Zap, FileBarChart,
//     Gift, Calendar, Mail, FlaskConical, Layers, Star, Shield,
//     CreditCard, Cpu, MessageSquare, Bell, Code, Repeat2, Activity,
//     MessageCircle, Bot, ChevronDown, ShoppingCart, Heart, Store,
//     BarChart2, Wrench,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useState } from "react";
//
// interface NavItem {
//     label: string;
//     href: string;
//     icon: React.ElementType;
//     badge?: string;
//     children?: NavItem[];
// }
//
// const ADMIN_NAV: NavItem[] = [
//     { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
//     { label: "Blog Posts", href: "/dashboard/admin/blogs", icon: FileText },
//     { label: "Categories", href: "/dashboard/admin/categories", icon: Tag },
//     { label: "SEO Tools", href: "/dashboard/admin/seo", icon: Search },
//     { label: "Keywords", href: "/dashboard/admin/seo/keywords", icon: TrendingUp },
//     { label: "Schema Generator", href: "/dashboard/admin/seo/schema", icon: Code },
//     { label: "AEO Optimizer", href: "/dashboard/admin/aeo", icon: Zap, badge: "AI" },
//     { label: "A/B Testing", href: "/dashboard/admin/ab-test", icon: FlaskConical },
//     { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
//     { label: "Rank Tracking", href: "/dashboard/admin/rank-tracking", icon: TrendingUp },
//     { label: "Backlinks", href: "/dashboard/admin/backlinks", icon: Link2 },
//     { label: "Repurpose Content", href: "/dashboard/admin/repurpose", icon: Repeat2, badge: "AI" },
//     { label: "Bulk Generate", href: "/dashboard/admin/bulk-generate", icon: Sparkles, badge: "💎" },
//     { label: "Content Calendar", href: "/dashboard/admin/content-calendar", icon: Calendar },
//     { label: "Newsletter", href: "/dashboard/admin/newsletter", icon: Mail },
//     { label: "White-label Reports", href: "/dashboard/admin/reports", icon: FileBarChart },
//     { label: "Media Library", href: "/dashboard/admin/media", icon: Layers },
//     { label: "Team", href: "/dashboard/admin/team", icon: Users },
//     { label: "My Domain", href: "/dashboard/admin/domain", icon: Globe },
//     // ── Site Builder group ────────────────────────────────────────────────
//     {
//         label: "Site Builder",
//         href: "/dashboard/admin/site",
//         icon: Cpu,
//         children: [
//             { label: "My Websites", href: "/dashboard/admin/site/websites", icon: Globe },
//             { label: "Builder", href: "/dashboard/admin/site", icon: Wrench },
//             { label: "Site Dashboard", href: "/dashboard/admin/site/dashboard", icon: BarChart2 },
//             { label: "Site Health", href: "/dashboard/admin/site/health", icon: Heart },
//             { label: "Marketplace", href: "/dashboard/admin/site/marketplace", icon: Store },
//         ],
//     },
//     { label: "Referral Program", href: "/dashboard/admin/referral", icon: Gift },
//     { label: "Notifications", href: "/dashboard/admin/alerts", icon: Bell },
//     { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
// ];
//
// const SUPER_ADMIN_NAV: NavItem[] = [
//     { label: "Dashboard", href: "/dashboard/super-admin", icon: LayoutDashboard },
//     { label: "Users", href: "/dashboard/super-admin/users", icon: Users },
//     { label: "Plans", href: "/dashboard/super-admin/plans", icon: CreditCard },
//     { label: "CMS Pages", href: "/dashboard/super-admin/cms", icon: FileText },
//     { label: "Platform SEO", href: "/dashboard/super-admin/seo", icon: Search },
//     { label: "Analytics", href: "/dashboard/super-admin/analytics", icon: BarChart3 },
//     { label: "Featured Posts", href: "/dashboard/super-admin/featured", icon: Star },
//     { label: "Component Library", href: "/dashboard/super-admin/components", icon: Layers },
//     { label: "SEIO Mascot", href: "/dashboard/super-admin/mascot", icon: Bot },
//     { label: "Referral Payouts", href: "/dashboard/super-admin/referral", icon: Gift },
//     { label: "Support Inbox", href: "/dashboard/super-admin/support", icon: MessageCircle },
//     { label: "Activity Feed", href: "/dashboard/super-admin/activity", icon: Activity },
//     { label: "Settings", href: "/dashboard/super-admin/settings", icon: Settings },
// ];
//
// const USER_NAV: NavItem[] = [
//     { label: "Dashboard", href: "/dashboard/user", icon: LayoutDashboard },
//     { label: "Settings", href: "/dashboard/user/settings", icon: Settings },
// ];
//
// const NAV_GROUPS = {
//     super_admin: {
//         label: "Super Admin",
//         icon: Shield,
//         color: "from-red-500 to-orange-500",
//         items: SUPER_ADMIN_NAV,
//     },
//     product_admin: {
//         label: "Admin Panel",
//         icon: LayoutDashboard,
//         color: "from-indigo-500 to-sky-500",
//         items: ADMIN_NAV,
//     },
//     user: {
//         label: "My Account",
//         icon: Users,
//         color: "from-emerald-500 to-teal-500",
//         items: USER_NAV,
//     },
// };
//
// // ─────────────────────────────────────────────────────────────────────────────
// // NavItemRow — handles both flat items and expandable groups
// // ─────────────────────────────────────────────────────────────────────────────
//
// function NavItemRow({ item }: { item: NavItem }) {
//     const pathname = usePathname();
//     const isActive = pathname === item.href ||
//         (item.href !== "/dashboard/admin" &&
//             item.href !== "/dashboard/super-admin" &&
//             item.href !== "/dashboard/user" &&
//             pathname.startsWith(item.href));
//
//     const isGroupActive = item.children?.some(c =>
//         pathname === c.href || pathname.startsWith(c.href)
//     );
//
//     // Auto-expand if any child is active
//     const [open, setOpen] = useState(isGroupActive ?? false);
//
//     if (item.children) {
//         return (
//             <div>
//                 <button
//                     onClick={() => setOpen(v => !v)}
//                     className={cn(
//                         "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
//                         isGroupActive
//                             ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
//                             : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
//                     )}
//                 >
//                     <item.icon className={cn("h-4 w-4 shrink-0", isGroupActive ? "text-indigo-500" : "")} />
//                     <span className="truncate flex-1 text-left">{item.label}</span>
//                     {item.badge && (
//                         <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-semibold shrink-0">
//                             {item.badge}
//                         </span>
//                     )}
//                     <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open ? "rotate-180" : "")} />
//                 </button>
//
//                 {open && (
//                     <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
//                         {item.children.map(child => {
//                             const childActive = pathname === child.href ||
//                                 (child.href !== item.href && pathname.startsWith(child.href));
//                             return (
//                                 <Link
//                                     key={child.href}
//                                     href={child.href}
//                                     className={cn(
//                                         "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
//                                         childActive
//                                             ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
//                                             : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
//                                     )}
//                                 >
//                                     <child.icon className={cn("h-3.5 w-3.5 shrink-0", childActive ? "text-indigo-500" : "")} />
//                                     <span className="truncate">{child.label}</span>
//                                 </Link>
//                             );
//                         })}
//                     </div>
//                 )}
//             </div>
//         );
//     }
//
//     return (
//         <Link
//             href={item.href}
//             className={cn(
//                 "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
//                 isActive
//                     ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
//                     : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
//             )}
//         >
//             <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-500" : "")} />
//             <span className="truncate flex-1">{item.label}</span>
//             {item.badge && (
//                 <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
//                     {item.badge}
//                 </span>
//             )}
//         </Link>
//     );
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // DashboardSidebar
// // ─────────────────────────────────────────────────────────────────────────────
//
// export function DashboardSidebar() {
//     const { data: session , status} = useSession();
//     if (status === "loading") {
//         return (
//             <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-screen sticky top-0">
//                 <div className="p-4 border-b">
//                     <div className="flex items-center gap-2.5">
//                         <div className="h-8 w-8 rounded-xl bg-muted animate-pulse" />
//                         <div className="space-y-1">
//                             <div className="h-3 w-24 rounded bg-muted animate-pulse" />
//                             <div className="h-2 w-16 rounded bg-muted animate-pulse" />
//                         </div>
//                     </div>
//                 </div>
//                 <nav className="flex-1 p-3 space-y-1">
//                     {[...Array(6)].map((_, i) => (
//                         <div key={i} className="h-9 rounded-lg bg-muted/50 animate-pulse" />
//                     ))}
//                 </nav>
//             </aside>
//         );
//     }
//     const role = session?.user?.role ?? "user";
//     const group = NAV_GROUPS[role as keyof typeof NAV_GROUPS] ?? NAV_GROUPS.user;
//
//     return (
//         <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-screen sticky top-0 overflow-y-auto">
//             {/* Logo */}
//             <div className="p-4 border-b">
//                 <Link href="/" className="flex items-center gap-2.5">
//                     <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${group.color}`}>
//                         <group.icon className="h-4 w-4 text-white" />
//                     </div>
//                     <div>
//                         <p className="font-bold text-sm leading-none">SEO Platform</p>
//                         <p className="text-xs text-muted-foreground mt-0.5">{group.label}</p>
//                     </div>
//                 </Link>
//             </div>
//
//             {/* Nav */}
//             <nav className="flex-1 p-3 space-y-0.5">
//                 {group.items.map(item => (
//                     <NavItemRow key={item.href} item={item} />
//                 ))}
//             </nav>
//
//             {/* Plan badge */}
//             {role === "product_admin" && (
//                 <div className="p-3 border-t">
//                     <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800 p-3">
//                         <p className="text-xs font-semibold capitalize">
//                             {session?.user?.plan ?? "free"} Plan
//                         </p>
//                         <p className="text-xs text-muted-foreground mt-0.5">
//                             {session?.user?.plan === "free" ? "Upgrade to unlock all features" : "Active subscription"}
//                         </p>
//                         {session?.user?.plan === "free" && (
//                             <Link href="/dashboard/admin/settings" className="text-xs text-indigo-600 font-medium hover:underline mt-1 block">
//                                 Upgrade now →
//                             </Link>
//                         )}
//                     </div>
//                 </div>
//             )}
//         </aside>
//     );
// }