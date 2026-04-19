"use client";
import { useEffect, useState } from "react";
import { Search, Shield, Ban, CheckCircle, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Badge } from "@/components/ui/form-elements";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/misc";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User { _id: string; name: string; email: string; image?: string; role: string; plan: string; isActive: boolean; createdAt: string; subscriptionStatus: string; }

const PLAN_COLOR: Record<string, "secondary" | "info" | "warning" | "success"> = { free: "secondary", silver: "info", gold: "warning", diamond: "success" };
const ROLE_COLOR: Record<string, "secondary" | "info" | "destructive"> = { user: "secondary", product_admin: "info", super_admin: "destructive" };

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) qs.set("search", search);
    if (planFilter) qs.set("plan", planFilter);
    const res = await fetch(`/api/users?${qs}`);
    const d = await res.json();
    if (d.success) { setUsers(d.data); setTotal(d.pagination.total); }
    setIsLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search, planFilter]);

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !currentStatus }) });
    fetchUsers();
  };

  const changeRole = async (userId: string, role: string) => {
    await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">{total} total users</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["", "free", "silver", "gold", "diamond"].map((p) => (
            <Button key={p} variant={planFilter === p ? "default" : "outline"} size="sm" onClick={() => setPlanFilter(p)} className="capitalize">{p || "All"}</Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? [...Array(8)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-8 skeleton rounded" /></td></tr>)
                  : users.map((user) => (
                    <tr key={user._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image ?? ""} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-sky-400 text-white text-xs">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_COLOR[user.role] ?? "secondary"} className="capitalize text-xs">{user.role.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={PLAN_COLOR[user.plan] ?? "secondary"} className="capitalize text-xs">{user.plan}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.isActive
                          ? <span className="flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle className="h-3.5 w-3.5" />Active</span>
                          : <span className="flex items-center gap-1 text-red-500 text-xs"><Ban className="h-3.5 w-3.5" />Banned</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(user.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => changeRole(user._id, user.role === "product_admin" ? "user" : "product_admin")}>
                              <Shield className="h-4 w-4 mr-2" /> {user.role === "product_admin" ? "Remove Admin" : "Make Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(user._id, user.isActive)} className={user.isActive ? "text-destructive" : "text-emerald-600"}>
                              {user.isActive ? <><Ban className="h-4 w-4 mr-2" />Ban User</> : <><CheckCircle className="h-4 w-4 mr-2" />Unban User</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
