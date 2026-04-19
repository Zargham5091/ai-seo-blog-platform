"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useSession} from "next-auth/react";
import {
    LayoutDashboard, FileText, Search, BarChart3, Users, Settings,
    CreditCard, Image, Globe, Shield, ChevronLeft, ChevronRight,
    Sparkles, BookOpen, Tag, Layers, Bell, HelpCircle,
} from "lucide-react";
import {cn} from "@/lib/utils";
import {useUIStore} from "@/store/ui";
import {Button} from "@/components/ui/button";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    roles?: string[];
}

const adminNav: NavItem[] = [
    {label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard},
    {label: "Blog Builder", href: "/dashboard/admin/blogs", icon: FileText},
    {label: "AI Generator", href: "/dashboard/admin/blogs/new", icon: Sparkles},
    {label: "Categories", href: "/dashboard/admin/categories", icon: Tag},
    {label: "SEO Tools", href: "/dashboard/admin/seo", icon: Search},
    {label: "Keywords", href: "/dashboard/admin/seo/keywords", icon: Tag},
    {label: "Schema", href: "/dashboard/admin/seo/schema", icon: Layers},
    {label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3},
    {label: "Media", href: "/dashboard/admin/media", icon: Image},
    {label: "Team", href: "/dashboard/admin/team", icon: Users},
    {label: "Settings", href: "/dashboard/admin/settings", icon: Settings},
    {label: "My Domain", href: "/dashboard/admin/domain", icon: Globe},
];

const superAdminNav: NavItem[] = [
    {label: "Overview", href: "/dashboard/super-admin", icon: LayoutDashboard},
    {label: "Users", href: "/dashboard/super-admin/users", icon: Users},
    {label: "Plans", href: "/dashboard/super-admin/plans", icon: CreditCard},
    {label: "Analytics", href: "/dashboard/super-admin/analytics", icon: BarChart3},
    {label: "CMS Pages", href: "/dashboard/super-admin/cms", icon: BookOpen},
    {label: "Platform SEO", href: "/dashboard/super-admin/seo", icon: Globe},
    {label: "Settings", href: "/dashboard/super-admin/settings", icon: Settings},

];

export function DashboardSidebar() {
    const {data: session} = useSession();
    const pathname = usePathname();
    const {sidebarOpen, toggleSidebar} = useUIStore();
    const isSuperAdmin = session?.user?.role === "super_admin";
    const nav = isSuperAdmin ? superAdminNav : adminNav;

    return (
        <aside
            className={cn(
                "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
                sidebarOpen ? "w-64" : "w-16"
            )}
        >
            {/* Logo */}
            <div className={cn("flex items-center gap-3 px-4 py-5 border-b", !sidebarOpen && "justify-center px-2")}>
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500">
                    <Layers className="h-4 w-4 text-white"/>
                </div>
                {sidebarOpen && (
                    <span
                        className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            SEO Platform
          </span>
                )}
            </div>

            {/* Role Badge */}
            {sidebarOpen && (
                <div className="px-4 py-2">
          <span className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              isSuperAdmin
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
          )}>
            {isSuperAdmin ? "⚡ Super Admin" : "🚀 " + (session?.user?.plan?.toUpperCase() ?? "FREE")}
          </span>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
                <ul className="space-y-1">
                    {nav.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard/admin" && item.href !== "/dashboard/super-admin" && pathname.startsWith(item.href));
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                                        isActive
                                            ? "bg-gradient-to-r from-indigo-600/10 to-sky-500/10 text-indigo-600 dark:text-indigo-400 border-r-2 border-indigo-600"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                        !sidebarOpen && "justify-center px-2"
                                    )}
                                    title={!sidebarOpen ? item.label : undefined}
                                >
                                    <item.icon
                                        className={cn("shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "", sidebarOpen ? "h-4 w-4" : "h-5 w-5")}/>
                                    {sidebarOpen && <span>{item.label}</span>}
                                    {sidebarOpen && item.badge && (
                                        <span
                                            className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom actions */}
            {sidebarOpen && (
                <div className="p-4 border-t space-y-1">
                    <Link href="/dashboard/admin/settings"
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-accent">
                        <HelpCircle className="h-3.5 w-3.5"/> Help & Support
                    </Link>
                    {!isSuperAdmin && (
                        <Link href="/pricing"
                              className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                            <Shield className="h-3.5 w-3.5"/> Upgrade Plan
                        </Link>
                    )}
                </div>
            )}

            {/* Collapse toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
            >
                {sidebarOpen ? <ChevronLeft className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
            </Button>
        </aside>
    );
}
