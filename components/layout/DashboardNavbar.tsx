"use client";
import {useEffect, useState} from "react";
import Link from "next/link";
import {useSession, signOut} from "next-auth/react";
import {Bell, Search, Moon, Sun, User, LogOut, Settings, CreditCard} from "lucide-react";
import {useTheme} from "next-themes";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";

export function DashboardNavbar() {
    const {data: session} = useSession();
    const {theme, setTheme} = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        // Poll for unread alerts every 60 seconds
        const fetchUnread = () => {
            fetch("/api/alerts?unread=true&limit=1")
                .then((r) => r.json())
                .then((d) => {
                    if (d.success) setUnreadCount(d.data.unreadCount ?? 0);
                })
                .catch(() => {
                });
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header
            className="h-14 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 gap-4">
            {/* Search hint */}
            <div className="flex-1 hidden md:flex">
                <div
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 h-8 w-64 cursor-pointer hover:bg-muted/70 transition-colors">
                    <Search className="h-3.5 w-3.5"/>
                    <span>Search...</span>
                    <kbd className="ml-auto text-xs bg-background border rounded px-1">⌘K</kbd>
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    {theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                </Button>

                {/* Alerts bell */}
                <Link href="/dashboard/admin/alerts"
                      className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors">
                    <Bell className="h-4 w-4"/>
                    {unreadCount > 0 && (
                        <span
                            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
                    )}
                </Link>

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-2 rounded-lg hover:bg-muted/50 transition-colors p-1.5"
                    >
                        {session?.user?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={session.user.image} alt="" className="h-7 w-7 rounded-full object-cover"/>
                        ) : (
                            <div
                                className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold">
                                {session?.user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="hidden md:block text-left">
                            <p className="text-xs font-medium leading-none">{session?.user?.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{session?.user?.plan ?? "free"} plan</p>
                        </div>
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}/>
                            <div
                                className="absolute right-0 top-10 z-50 w-52 bg-popover border rounded-xl shadow-xl overflow-hidden">
                                <div className="p-3 border-b">
                                    <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                                    <Badge variant="info"
                                           className="mt-1.5 capitalize text-xs">{session?.user?.plan ?? "free"} plan</Badge>
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                    <Link href="/dashboard/admin/settings" onClick={() => setShowMenu(false)}
                                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors">
                                        <Settings className="h-4 w-4 text-muted-foreground"/> Settings
                                    </Link>
                                    <Link href="/dashboard/admin/settings?tab=billing"
                                          onClick={() => setShowMenu(false)}
                                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors">
                                        <CreditCard className="h-4 w-4 text-muted-foreground"/> Billing
                                    </Link>
                                    <Link href="/dashboard/admin/alerts" onClick={() => setShowMenu(false)}
                                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors">
                                        <Bell className="h-4 w-4 text-muted-foreground"/>
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span
                                                className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                                        )}
                                    </Link>
                                    <hr className="my-1 border-border"/>
                                    <button
                                        onClick={() => signOut({callbackUrl: "/"})}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-destructive"
                                    >
                                        <LogOut className="h-4 w-4"/> Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

// "use client";
// import { useSession, signOut } from "next-auth/react";
// import { Moon, Sun, Bell, Search, LogOut, User, Settings, CreditCard } from "lucide-react";
// import { useTheme } from "next-themes";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/misc";
// import { Badge } from "@/components/ui/form-elements";
// import {
//   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
//   DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {AlertsBell} from "@/components/dashboard/AlertsBell";
//
// export function DashboardNavbar() {
//   const { data: session } = useSession();
//   const { theme, setTheme } = useTheme();
//   const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";
//
//   const planColors: Record<string, string> = {
//     free: "secondary",
//     silver: "info",
//     gold: "warning",
//     diamond: "success",
//   };
//
//   return (
//     <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
//       {/* Search */}
//       <div className="flex-1 max-w-sm">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <input
//             className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-transparent rounded-lg focus:outline-none focus:border-indigo-300 focus:bg-background transition-all"
//             placeholder="Search blogs, keywords..."
//           />
//         </div>
//       </div>
//
//       <div className="flex items-center gap-2 ml-auto">
//         {/* Plan badge */}
//         <Badge variant={planColors[session?.user?.plan ?? "free"] as "secondary" | "info" | "warning" | "success"} className="hidden sm:flex capitalize">
//           {session?.user?.plan ?? "free"}
//         </Badge>
//
//         {/* Theme toggle */}
//         <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
//           <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
//           <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
//           <span className="sr-only">Toggle theme</span>
//         </Button>
//
//         {/* Notifications */}
//         <AlertsBell/>
//             {/*<Button variant="ghost" size="icon" className="relative">*/}
//         {/*  <Bell className="h-4 w-4" />*/}
//         {/*  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500" />*/}
//         {/*</Button>*/}
//
//         {/* User menu */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
//               <Avatar className="h-9 w-9">
//                 <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? ""} />
//                 <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-xs">
//                   {initials}
//                 </AvatarFallback>
//               </Avatar>
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-56">
//             <DropdownMenuLabel>
//               <div className="flex flex-col space-y-1">
//                 <p className="text-sm font-medium">{session?.user?.name}</p>
//                 <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
//               </div>
//             </DropdownMenuLabel>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem asChild>
//               <Link href="/dashboard/admin/settings" className="flex items-center gap-2 cursor-pointer">
//                 <User className="h-4 w-4" /> Profile
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem asChild>
//               <Link href="/dashboard/admin/settings" className="flex items-center gap-2 cursor-pointer">
//                 <Settings className="h-4 w-4" /> Settings
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem asChild>
//               <Link href="/pricing" className="flex items-center gap-2 cursor-pointer">
//                 <CreditCard className="h-4 w-4" /> Upgrade Plan
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem
//               className="text-destructive focus:text-destructive cursor-pointer"
//               onClick={() => signOut({ callbackUrl: "/" })}
//             >
//               <LogOut className="h-4 w-4 mr-2" /> Sign Out
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>
//     </header>
//   );
// }
