"use client";
import { useEffect, useState } from "react";
import { Trash2, Search, TrendingUp, TrendingDown, Minus, BookmarkCheck, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Badge } from "@/components/ui/form-elements";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { InlineLoader } from "@/components/shared/PageLoader";

interface Keyword {
  _id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: "up" | "down" | "stable";
  createdAt: string;
}

const TREND_ICON = (t: string) =>
  t === "up" ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    : t === "down" ? <TrendingDown className="h-3.5 w-3.5 text-red-500" />
      : <Minus className="h-3.5 w-3.5 text-muted-foreground" />;

const DIFF_COLOR = (d: number) =>
  d >= 70 ? "text-red-500" : d >= 40 ? "text-yellow-500" : "text-emerald-500";

export default function SavedKeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/ai/keywords")
      .then((r) => r.json())
      .then((d) => { if (d.success) setKeywords(d.data); })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/ai/keywords?id=${id}`, { method: "DELETE" });
    setKeywords((prev) => prev.filter((k) => k._id !== id));
  };

  const filtered = keywords.filter((k) =>
    k.keyword.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Keywords</h1>
          <p className="text-muted-foreground text-sm">{keywords.length} keywords saved</p>
        </div>
        <Button asChild variant="gradient" className="gap-2">
          <Link href="/dashboard/admin/seo">
            <Plus className="h-4 w-4" /> Research More
          </Link>
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter keywords..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {isLoading ? (
        <InlineLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No saved keywords"
          description="Research keywords using AI and save the ones you want to target."
          action={{ label: "Research Keywords", href: "/dashboard/admin/seo" }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Keyword</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Volume</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Difficulty</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">CPC</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Trend</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((kw) => (
                    <tr key={kw._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {kw.searchVolume?.toLocaleString() ?? "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${DIFF_COLOR(kw.difficulty)}`}>
                        {kw.difficulty}/100
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ${kw.cpc?.toFixed(2) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center flex justify-center">
                        {TREND_ICON(kw.trend)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(kw._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
