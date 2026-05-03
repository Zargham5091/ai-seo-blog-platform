"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useSession} from "next-auth/react";
import {
    LayoutDashboard, FileText, Search, BarChart3, Users, Settings,
    Globe, Tag, Sparkles, TrendingUp, Link2, Zap, FileBarChart,
    Gift, Calendar, Mail, FlaskConical, Layers, Star, Shield,
    CreditCard, Cpu, MessageSquare, Bell, Code, Repeat2, Activity, MessageCircle, Bot,
} from "lucide-react";
import {cn} from "@/lib/utils";

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

export function DashboardSidebar() {
    const {data: session} = useSession();
    const pathname = usePathname();
    const role = session?.user?.role ?? "user";
    const group = NAV_GROUPS[role as keyof typeof NAV_GROUPS] ?? NAV_GROUPS.user;

    return (
        <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-screen sticky top-0 overflow-y-auto">
            {/* Logo */}
            <div className="p-4 border-b">
                <Link href="/" className="flex items-center gap-2.5">
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

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5">
                {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard/admin" && item.href !== "/dashboard/super-admin" && item.href !== "/dashboard/user" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-500" : "")}/>
                            <span className="truncate flex-1">{item.label}</span>
                            {item.badge && (
                                <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                  {item.badge}
                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Plan badge at bottom */}
            {role === "product_admin" && (
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
                            <Link href="/dashboard/admin/settings"
                                  className="text-xs text-indigo-600 font-medium hover:underline mt-1 block">
                                Upgrade now →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}

// "use client";
// import Link from "next/link";
// import {usePathname} from "next/navigation";
// import {useSession} from "next-auth/react";
// import {
//     LayoutDashboard, FileText, Search, BarChart3, Users, Settings,
//     CreditCard, Image, Globe, Shield, ChevronLeft, ChevronRight,
//     Sparkles, BookOpen, Tag, Layers, Bell, HelpCircle, Star, TrendingUp, Link2, Zap,
// } from "lucide-react";
// import {cn} from "@/lib/utils";
// import {useUIStore} from "@/store/ui";
// import {Button} from "@/components/ui/button";
//
// interface NavItem {
//     label: string;
//     href: string;
//     icon: React.ElementType;
//     badge?: string;
//     roles?: string[];
// }
//
// const adminNav: NavItem[] = [
//     {label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard},
//     {label: "Blog Builder", href: "/dashboard/admin/blogs", icon: FileText},
//     {label: "AI Generator", href: "/dashboard/admin/blogs/new", icon: Sparkles},
//     {label: "Categories", href: "/dashboard/admin/categories", icon: Tag},
//     {label: "SEO Tools", href: "/dashboard/admin/seo", icon: Search},
//     {label: "Keywords", href: "/dashboard/admin/seo/keywords", icon: Tag},
//     {label: "Schema", href: "/dashboard/admin/seo/schema", icon: Layers},
//     {label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3},
//     {label: "Media", href: "/dashboard/admin/media", icon: Image},
//     {label: "Team", href: "/dashboard/admin/team", icon: Users},
//     {label: "Repurpose Content", href: "/dashboard/admin/repurpose", icon: Sparkles},
//     {label: "Rank Tracking", href: "/dashboard/admin/rank-tracking", icon: TrendingUp},
//     {label: "Backlinks", href: "/dashboard/admin/backlinks", icon: Link2},
//     {label: "AEO Optimizer", href: "/dashboard/admin/aeo", icon: Zap},
//     {label: "Reports", href: "/dashboard/admin/reports", icon: FileText},
//     {label: "Referral Program", href: "/dashboard/admin/referral", icon: Users},
//     {label: "Settings", href: "/dashboard/admin/settings", icon: Settings},
//     {label: "My Domain", href: "/dashboard/admin/domain", icon: Globe},
// ];
//
// const superAdminNav: NavItem[] = [
//     {label: "Overview", href: "/dashboard/super-admin", icon: LayoutDashboard},
//     {label: "Users", href: "/dashboard/super-admin/users", icon: Users},
//     {label: "Plans", href: "/dashboard/super-admin/plans", icon: CreditCard},
//     {label: "Analytics", href: "/dashboard/super-admin/analytics", icon: BarChart3},
//     {label: "CMS Pages", href: "/dashboard/super-admin/cms", icon: BookOpen},
//     {label: "Platform SEO", href: "/dashboard/super-admin/seo", icon: Globe},
//     {label: "Settings", href: "/dashboard/super-admin/settings", icon: Settings},
//     {label: "Featured Requests", href: "/dashboard/super-admin/featured", icon: Star},
//     {label: "Component Library", href: "/dashboard/super-admin/components", icon: Layers},
// ];
//
// export function DashboardSidebar() {
//     const {data: session} = useSession();
//     const pathname = usePathname();
//     const {sidebarOpen, toggleSidebar} = useUIStore();
//     const isSuperAdmin = session?.user?.role === "super_admin";
//     const nav = isSuperAdmin ? superAdminNav : adminNav;
//
//     return (
//         <aside
//             className={cn(
//                 "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
//                 sidebarOpen ? "w-64" : "w-16"
//             )}
//         >
//             {/* Logo */}
//             <div className={cn("flex items-center gap-3 px-4 py-5 border-b", !sidebarOpen && "justify-center px-2")}>
//                 <div
//                     className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500">
//                     <Layers className="h-4 w-4 text-white"/>
//                 </div>
//                 {sidebarOpen && (
//                     <span
//                         className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
//             SEO Platform
//           </span>
//                 )}
//             </div>
//
//             {/* Role Badge */}
//             {sidebarOpen && (
//                 <div className="px-4 py-2">
//           <span className={cn(
//               "text-xs font-semibold px-2 py-1 rounded-full",
//               isSuperAdmin
//                   ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
//                   : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
//           )}>
//             {isSuperAdmin ? "⚡ Super Admin" : "🚀 " + (session?.user?.plan?.toUpperCase() ?? "FREE")}
//           </span>
//                 </div>
//             )}
//
//             {/* Navigation */}
//             <nav className="flex-1 overflow-y-auto py-4 px-2">
//                 <ul className="space-y-1">
//                     {nav.map((item) => {
//                         const isActive = pathname === item.href || (item.href !== "/dashboard/admin" && item.href !== "/dashboard/super-admin" && pathname.startsWith(item.href));
//                         return (
//                             <li key={item.href}>
//                                 <Link
//                                     href={item.href}
//                                     className={cn(
//                                         "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
//                                         isActive
//                                             ? "bg-gradient-to-r from-indigo-600/10 to-sky-500/10 text-indigo-600 dark:text-indigo-400 border-r-2 border-indigo-600"
//                                             : "text-muted-foreground hover:bg-accent hover:text-foreground",
//                                         !sidebarOpen && "justify-center px-2"
//                                     )}
//                                     title={!sidebarOpen ? item.label : undefined}
//                                 >
//                                     <item.icon
//                                         className={cn("shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "", sidebarOpen ? "h-4 w-4" : "h-5 w-5")}/>
//                                     {sidebarOpen && <span>{item.label}</span>}
//                                     {sidebarOpen && item.badge && (
//                                         <span
//                                             className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
//                       {item.badge}
//                     </span>
//                                     )}
//                                 </Link>
//                             </li>
//                         );
//                     })}
//                 </ul>
//             </nav>
//
//             {/* Bottom actions */}
//             {sidebarOpen && (
//                 <div className="p-4 border-t space-y-1">
//                     <Link href="/dashboard/admin/settings"
//                           className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-accent">
//                         <HelpCircle className="h-3.5 w-3.5"/> Help & Support
//                     </Link>
//                     {!isSuperAdmin && (
//                         <Link href="/pricing"
//                               className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
//                             <Shield className="h-3.5 w-3.5"/> Upgrade Plan
//                         </Link>
//                     )}
//                 </div>
//             )}
//
//             {/* Collapse toggle */}
//             <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={toggleSidebar}
//                 className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
//             >
//                 {sidebarOpen ? <ChevronLeft className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
//             </Button>
//         </aside>
//     );
// }
