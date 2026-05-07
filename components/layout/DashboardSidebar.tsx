"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useSession} from "next-auth/react";
import {
    LayoutDashboard, FileText, Search, BarChart3, Users, Settings,
    Globe, Tag, Sparkles, TrendingUp, Link2, Zap, FileBarChart,
    Gift, Calendar, Mail, FlaskConical, Layers, Star, Shield,
    CreditCard, Cpu, MessageSquare, Bell, Code, Repeat2, Activity, MessageCircle, Bot,
    ChevronLeft, ChevronRight, Menu, X,
} from "lucide-react";
import {cn} from "@/lib/utils";
import {useState, useEffect} from "react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
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
    {label: "Site Builder", href: "/dashboard/admin/site", icon: Cpu},
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
    super_admin: {
        label: "Super Admin",
        icon: Shield,
        color: "from-red-500 to-orange-500",
        items: SUPER_ADMIN_NAV,
    },
    product_admin: {
        label: "Admin Panel",
        icon: LayoutDashboard,
        color: "from-indigo-500 to-sky-500",
        items: ADMIN_NAV,
    },
    user: {
        label: "My Account",
        icon: Users,
        color: "from-emerald-500 to-teal-500",
        items: USER_NAV,
    },
};

// ── Mobile hamburger button (rendered outside the sidebar, in the top bar) ──
export function SidebarToggleButton({onClick}: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
            aria-label="Open navigation menu"
        >
            <Menu className="h-4 w-4"/>
        </button>
    );
}

export function DashboardSidebar() {
    const {data: session} = useSession();
    const pathname = usePathname();
    const role = session?.user?.role ?? "user";
    const group = NAV_GROUPS[role as keyof typeof NAV_GROUPS] ?? NAV_GROUPS.user;

    // Desktop: collapsed (icon-only) vs expanded
    const [collapsed, setCollapsed] = useState(false);
    // Mobile: drawer open vs closed
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Close mobile drawer on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const NavContent = (
        <>
            {/* Logo */}
            <div className={cn("p-4 border-b flex items-center", collapsed && "justify-center p-3")}>
                {collapsed ? (
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${group.color}`}>
                        <group.icon className="h-4 w-4 text-white"/>
                    </div>
                ) : (
                    <Link href="/" className="flex items-center gap-2.5">
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${group.color}`}>
                            <group.icon className="h-4 w-4 text-white"/>
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-none">SEO Platform</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{group.label}</p>
                        </div>
                    </Link>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {group.items.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard/admin" &&
                            item.href !== "/dashboard/super-admin" &&
                            item.href !== "/dashboard/user" &&
                            pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                collapsed && "justify-center px-2",
                                isActive
                                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-500" : "")}/>
                            {!collapsed && (
                                <>
                                    <span className="truncate flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Plan badge at bottom */}
            {role === "product_admin" && !collapsed && (
                <div className="p-3 border-t">
                    <div
                        className="rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800 p-3">
                        <p className="text-xs font-semibold capitalize">
                            {session?.user?.plan ?? "free"} Plan
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {session?.user?.plan === "free" ? "Upgrade to unlock all features" : "Active subscription"}
                        </p>
                        {session?.user?.plan === "free" && (
                            <Link
                                href="/dashboard/admin/settings"
                                className="text-xs text-indigo-600 font-medium hover:underline mt-1 block"
                            >
                                Upgrade now →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* ── Mobile: floating hamburger button ── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center h-10 w-10 rounded-lg border bg-background shadow-md hover:bg-muted/50 transition-colors"
                aria-label="Open navigation menu"
            >
                <Menu className="h-4 w-4"/>
            </button>

            {/* ── Mobile: backdrop ── */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Mobile: slide-in drawer ── */}
            <aside
                className={cn(
                    "md:hidden fixed inset-y-0 left-0 z-50 w-64 border-r bg-background flex flex-col h-screen overflow-y-auto transition-transform duration-300 ease-in-out",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Sidebar navigation"
            >
                {/* Close button inside drawer */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                    aria-label="Close navigation menu"
                >
                    <X className="h-4 w-4"/>
                </button>
                {NavContent}
            </aside>

            {/* ── Desktop: sticky sidebar ── */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r bg-background h-screen sticky top-0 transition-all duration-300 ease-in-out relative",
                    collapsed ? "w-16" : "w-64"
                )}
                aria-label="Sidebar navigation"
            >
                {NavContent}

                {/* Desktop collapse toggle */}
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="absolute -right-3 top-20 h-6 w-6 flex items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted/50 transition-colors z-20"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="h-3 w-3"/> : <ChevronLeft className="h-3 w-3"/>}
                </button>
            </aside>
        </>
    );
}

// "use client";
// import Link from "next/link";
// import {usePathname} from "next/navigation";
// import {useSession} from "next-auth/react";
// import {
//     LayoutDashboard, FileText, Search, BarChart3, Users, Settings,
//     Globe, Tag, Sparkles, TrendingUp, Link2, Zap, FileBarChart,
//     Gift, Calendar, Mail, FlaskConical, Layers, Star, Shield,
//     CreditCard, Cpu, MessageSquare, Bell, Code, Repeat2, Activity, MessageCircle, Bot,
// } from "lucide-react";
// import {cn} from "@/lib/utils";
//
// interface NavItem {
//     label: string;
//     href: string;
//     icon: React.ElementType;
//     badge?: string;
// }
//
// const ADMIN_NAV: NavItem[] = [
//     {label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard},
//     {label: "Blog Posts", href: "/dashboard/admin/blogs", icon: FileText},
//     {label: "Categories", href: "/dashboard/admin/categories", icon: Tag},
//     {label: "SEO Tools", href: "/dashboard/admin/seo", icon: Search},
//     {label: "Keywords", href: "/dashboard/admin/seo/keywords", icon: TrendingUp},
//     {label: "Schema Generator", href: "/dashboard/admin/seo/schema", icon: Code},
//     {label: "AEO Optimizer", href: "/dashboard/admin/aeo", icon: Zap, badge: "AI"},
//     {label: "A/B Testing", href: "/dashboard/admin/ab-test", icon: FlaskConical},
//     {label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3},
//     {label: "Rank Tracking", href: "/dashboard/admin/rank-tracking", icon: TrendingUp},
//     {label: "Backlinks", href: "/dashboard/admin/backlinks", icon: Link2},
//     {label: "Repurpose Content", href: "/dashboard/admin/repurpose", icon: Repeat2, badge: "AI"},
//     {label: "Bulk Generate", href: "/dashboard/admin/bulk-generate", icon: Sparkles, badge: "💎"},
//     {label: "Content Calendar", href: "/dashboard/admin/content-calendar", icon: Calendar},
//     {label: "Newsletter", href: "/dashboard/admin/newsletter", icon: Mail},
//     {label: "White-label Reports", href: "/dashboard/admin/reports", icon: FileBarChart},
//     {label: "Media Library", href: "/dashboard/admin/media", icon: Layers},
//     {label: "Team", href: "/dashboard/admin/team", icon: Users},
//     {label: "My Domain", href: "/dashboard/admin/domain", icon: Globe},
//     {label: "Site Builder", href: "/dashboard/admin/site", icon: Cpu},
//     {label: "Referral Program", href: "/dashboard/admin/referral", icon: Gift},
//     {label: "Notifications", href: "/dashboard/admin/alerts", icon: Bell},
//     {label: "Settings", href: "/dashboard/admin/settings", icon: Settings},
// ];
//
// const SUPER_ADMIN_NAV: NavItem[] = [
//     {label: "Dashboard", href: "/dashboard/super-admin", icon: LayoutDashboard},
//     {label: "Users", href: "/dashboard/super-admin/users", icon: Users},
//     {label: "Plans", href: "/dashboard/super-admin/plans", icon: CreditCard},
//     {label: "CMS Pages", href: "/dashboard/super-admin/cms", icon: FileText},
//     {label: "Platform SEO", href: "/dashboard/super-admin/seo", icon: Search},
//     {label: "Analytics", href: "/dashboard/super-admin/analytics", icon: BarChart3},
//     {label: "Featured Posts", href: "/dashboard/super-admin/featured", icon: Star},
//     {label: "Component Library", href: "/dashboard/super-admin/components", icon: Layers},
//     {label: "SEIO Mascot", href: "/dashboard/super-admin/mascot", icon: Bot},
//     {label: "Referral Payouts", href: "/dashboard/super-admin/referral", icon: Gift},
//     {label: "Support Inbox", href: "/dashboard/super-admin/support", icon: MessageCircle},
//     {label: "Activity Feed", href: "/dashboard/super-admin/activity", icon: Activity},
//     {label: "Settings", href: "/dashboard/super-admin/settings", icon: Settings},
// ];
//
// const USER_NAV: NavItem[] = [
//     {label: "Dashboard", href: "/dashboard/user", icon: LayoutDashboard},
//     {label: "Settings", href: "/dashboard/user/settings", icon: Settings},
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
// export function DashboardSidebar() {
//     const {data: session} = useSession();
//     const pathname = usePathname();
//     const role = session?.user?.role ?? "user";
//     const group = NAV_GROUPS[role as keyof typeof NAV_GROUPS] ?? NAV_GROUPS.user;
//
//     return (
//         <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-screen sticky top-0 overflow-y-auto">
//             {/* Logo */}
//             <div className="p-4 border-b">
//                 <Link href="/" className="flex items-center gap-2.5">
//                     <div
//                         className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${group.color}`}>
//                         <group.icon className="h-4 w-4 text-white"/>
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
//                 {group.items.map((item) => {
//                     const isActive = pathname === item.href || (item.href !== "/dashboard/admin" && item.href !== "/dashboard/super-admin" && item.href !== "/dashboard/user" && pathname.startsWith(item.href));
//                     return (
//                         <Link
//                             key={item.href}
//                             href={item.href}
//                             className={cn(
//                                 "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
//                                 isActive
//                                     ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
//                                     : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
//                             )}
//                         >
//                             <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-500" : "")}/>
//                             <span className="truncate flex-1">{item.label}</span>
//                             {item.badge && (
//                                 <span
//                                     className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
//                   {item.badge}
//                 </span>
//                             )}
//                         </Link>
//                     );
//                 })}
//             </nav>
//
//             {/* Plan badge at bottom */}
//             {role === "product_admin" && (
//                 <div className="p-3 border-t">
//                     <div
//                         className="rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800 p-3">
//                         <p className="text-xs font-semibold capitalize">
//                             {session?.user?.plan ?? "free"} Plan
//                         </p>
//                         <p className="text-xs text-muted-foreground mt-0.5">
//                             {session?.user?.plan === "free" ? "Upgrade to unlock all features" : "Active subscription"}
//                         </p>
//                         {session?.user?.plan === "free" && (
//                             <Link href="/dashboard/admin/settings"
//                                   className="text-xs text-indigo-600 font-medium hover:underline mt-1 block">
//                                 Upgrade now →
//                             </Link>
//                         )}
//                     </div>
//                 </div>
//             )}
//         </aside>
//     );
// }
