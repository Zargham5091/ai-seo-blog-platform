"use client";
import {useEffect, useState} from "react";
import {FileBarChart, Download, Sparkles, Calendar, Eye} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

interface ReportConfig {
    clientName: string;
    clientLogo: string;
    reportTitle: string;
    dateRange: string;
    includeSections: string[];
    primaryColor: string;
}

const SECTIONS = [
    {key: "overview", label: "Performance Overview", desc: "Total views, posts, SEO score"},
    {key: "seo", label: "SEO Analysis", desc: "Keyword rankings, scores"},
    {key: "topPosts", label: "Top Performing Posts", desc: "Best content by views"},
    {key: "keywords", label: "Keyword Rankings", desc: "Rank tracking data"},
    {key: "backlinks", label: "Backlink Summary", desc: "New and lost links"},
    {key: "traffic", label: "Traffic Breakdown", desc: "Views by source/page"},
    {key: "suggestions", label: "AI Recommendations", desc: "AI-powered action items"},
];

export default function ReportsPage() {
    const [config, setConfig] = useState<ReportConfig>({
        clientName: "",
        clientLogo: "",
        reportTitle: "SEO Performance Report",
        dateRange: "last-30-days",
        includeSections: ["overview", "seo", "topPosts"],
        primaryColor: "#4F46E5",
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportHtml, setReportHtml] = useState<string | null>(null);
    const [error, setError] = useState("");

    const toggleSection = (key: string) => {
        setConfig((c) => ({
            ...c,
            includeSections: c.includeSections.includes(key)
                ? c.includeSections.filter((s) => s !== key)
                : [...c.includeSections, key],
        }));
    };

    const generate = async () => {
        setIsGenerating(true);
        setError("");
        setReportHtml(null);
        try {
            const [statsRes, topRes] = await Promise.all([
                fetch("/api/analytics?type=dashboard").then((r) => r.json()),
                fetch("/api/analytics?type=top_posts").then((r) => r.json()),
            ]);

            const stats = statsRes.success ? statsRes.data : {};
            const topPosts = topRes.success ? topRes.data : [];

            const dateLabel = config.dateRange === "last-30-days" ? "Last 30 Days"
                : config.dateRange === "last-90-days" ? "Last 90 Days" : "Last 12 Months";

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
  .header { background: ${config.primaryColor}; color: white; padding: 40px 48px; }
  .logo { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .subtitle { opacity: 0.85; font-size: 15px; }
  .container { padding: 40px 48px; }
  .section { margin-bottom: 36px; }
  .section-title { font-size: 20px; font-weight: 700; color: ${config.primaryColor}; border-bottom: 2px solid ${config.primaryColor}20; padding-bottom: 8px; margin-bottom: 20px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
  .stat-value { font-size: 32px; font-weight: 800; color: ${config.primaryColor}; }
  .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
th { background: ${config.primaryColor} + '26'; padding: 10px 14px; text-align: left; font-size: 13px; font-weight: 600; }
  td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  .footer { margin-top: 48px; padding: 20px 48px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-good { background: #d1fae5; color: #065f46; }
  .badge-warn { background: #fef3c7; color: #92400e; }
  .badge-bad  { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
<div class="header">
  ${config.clientLogo ? `<img src="${config.clientLogo}" height="40" style="margin-bottom:12px;filter:brightness(0)invert(1)" alt="logo">` : ""}
  <div class="logo">${config.reportTitle}</div>
  <div class="subtitle">${config.clientName ? `Prepared for ${config.clientName} · ` : ""}${dateLabel} · Generated ${new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            })}</div>
</div>
<div class="container">
${config.includeSections.includes("overview") ? `
<div class="section">
  <div class="section-title">Performance Overview</div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-value">${stats.totalBlogs ?? 0}</div><div class="stat-label">Total Posts</div></div>
    <div class="stat-card"><div class="stat-value">${stats.publishedBlogs ?? 0}</div><div class="stat-label">Published</div></div>
    <div class="stat-card"><div class="stat-value">${(stats.totalViews ?? 0).toLocaleString()}</div><div class="stat-label">Total Views</div></div>
    <div class="stat-card"><div class="stat-value">${stats.avgSEOScore ?? 0}</div><div class="stat-label">Avg SEO Score</div></div>
  </div>
</div>` : ""}
${config.includeSections.includes("topPosts") && topPosts.length > 0 ? `
<div class="section">
  <div class="section-title">Top Performing Posts</div>
  <table>
    <thead><tr><th>Post Title</th><th>Views</th><th>SEO Score</th></tr></thead>
    <tbody>
      ${topPosts.slice(0, 10).map((p: Record<string, unknown>) => `<tr>
        <td>${p.title}</td>
        <td>${(p.viewCount as number ?? 0).toLocaleString()}</td>
        <td><span class="badge ${(p.seo as Record<string, number>)?.seoScore >= 70 ? "badge-good" : (p.seo as Record<string, number>)?.seoScore >= 40 ? "badge-warn" : "badge-bad"}">${(p.seo as Record<string, number>)?.seoScore ?? 0}/100</span></td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}
${config.includeSections.includes("suggestions") ? `
<div class="section">
  <div class="section-title">AI Recommendations</div>
  <ul style="space-y:8px;padding-left:20px;line-height:2">
    <li>Focus on improving SEO scores for posts below 50/100</li>
    <li>Publish at least 2 new posts per week to maintain momentum</li>
    <li>Add internal links between related posts to improve crawlability</li>
    <li>Research and target long-tail keywords with low difficulty scores</li>
    <li>Consider repurposing top posts into social media content</li>
  </ul>
</div>` : ""}
</div>
<div class="footer">
  Report generated by SEO Platform · ${new Date().getFullYear()}${config.clientName ? ` · ${config.clientName}` : ""}
</div>
</body>
</html>`;

            setReportHtml(html);
        } catch {
            setError("Failed to generate report. Please try again.");
        }
        setIsGenerating(false);
    };

    const download = () => {
        if (!reportHtml) return;
        const blob = new Blob([reportHtml], {type: "text/html"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `seo-report-${new Date().toISOString().slice(0, 10)}.html`;
        a.click();
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileBarChart className="h-6 w-6 text-indigo-500"/> White-Label Reports
                </h1>
                <p className="text-muted-foreground text-sm">Generate branded SEO performance reports for clients</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Config */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Report
                            Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Report Title</Label>
                                <Input value={config.reportTitle}
                                       onChange={(e) => setConfig({...config, reportTitle: e.target.value})}/>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Client Name (optional)</Label>
                                <Input value={config.clientName}
                                       onChange={(e) => setConfig({...config, clientName: e.target.value})}
                                       placeholder="Acme Corp"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Client Logo URL (optional)</Label>
                                <Input value={config.clientLogo}
                                       onChange={(e) => setConfig({...config, clientLogo: e.target.value})}
                                       placeholder="https://..."/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Date Range</Label>
                                    <select value={config.dateRange}
                                            onChange={(e) => setConfig({...config, dateRange: e.target.value})}
                                            className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                        <option value="last-30-days">Last 30 Days</option>
                                        <option value="last-90-days">Last 90 Days</option>
                                        <option value="last-12-months">Last 12 Months</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Brand Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <input type="color" value={config.primaryColor}
                                               onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                                               className="h-9 w-12 rounded cursor-pointer border"/>
                                        <Input value={config.primaryColor}
                                               onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                                               className="font-mono text-xs"/>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Include
                            Sections</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {SECTIONS.map((s) => (
                                    <label key={s.key}
                                           className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={config.includeSections.includes(s.key)}
                                            onChange={() => toggleSection(s.key)}
                                            className="mt-0.5 rounded"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">{s.label}</p>
                                            <p className="text-xs text-muted-foreground">{s.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button variant="gradient" className="w-full gap-2" onClick={generate} isLoading={isGenerating}>
                        <Sparkles className="h-4 w-4"/>
                        {isGenerating ? "Generating Report..." : "Generate Report"}
                    </Button>
                </div>

                {/* Preview */}
                <div>
                    {reportHtml ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">Preview</p>
                                <Button variant="gradient" size="sm" onClick={download} className="gap-1.5">
                                    <Download className="h-3.5 w-3.5"/> Download HTML
                                </Button>
                            </div>
                            <div className="border rounded-xl overflow-hidden shadow-lg">
                                <iframe
                                    srcDoc={reportHtml}
                                    className="w-full h-[600px]"
                                    title="Report Preview"
                                    sandbox="allow-same-origin"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Download the HTML file and print to PDF from your browser (Ctrl+P → Save as PDF)
                            </p>
                        </div>
                    ) : (
                        <div
                            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <FileBarChart className="h-10 w-10 mb-3 opacity-20"/>
                            <p className="text-sm font-medium">Report preview will appear here</p>
                            <p className="text-xs mt-1">Configure settings and click Generate</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// "use client";
// import {useEffect, useState, useRef} from "react";
// import {Download, FileText, TrendingUp, TrendingDown, Eye, BarChart3, Printer} from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {formatDate, formatNumber} from "@/lib/utils";
//
// interface ReportData {
//     generatedAt: string;
//     period: string;
//     siteName: string;
//     subdomain?: string;
//     plan: string;
//     summary: {
//         totalPosts: number;
//         publishedPosts: number;
//         draftPosts: number;
//         totalViews: number;
//         avgSEOScore: number;
//         trackedKeywords: number;
//         improvedKeywords: number;
//     };
//     topPosts: { title: string; slug: string; views: number; seoScore: number; publishedAt: string }[];
//     topKeywords: {
//         keyword: string;
//         position: number | null;
//         previousPosition: number | null;
//         bestPosition: number | null
//     }[];
//     recentPosts: { title: string; status: string; views: number; createdAt: string }[];
// }
//
// export default function ReportsPage() {
//     const [report, setReport] = useState<ReportData | null>(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const printRef = useRef<HTMLDivElement>(null);
//
//     useEffect(() => {
//         fetch("/api/reports")
//             .then((r) => r.json())
//             .then((d) => {
//                 if (d.success) setReport(d.data);
//             })
//             .finally(() => setIsLoading(false));
//     }, []);
//
//     const handlePrint = () => window.print();
//
//     if (isLoading) {
//         return (
//             <div className="space-y-4">
//                 <div className="h-8 skeleton rounded w-48"/>
//                 <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i}
//                                                                                           className="h-24 skeleton rounded-xl"/>)}</div>
//             </div>
//         );
//     }
//
//     if (!report) return <p className="text-muted-foreground">Failed to load report.</p>;
//
//     return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-2xl font-bold flex items-center gap-2">
//                         <FileText className="h-6 w-6 text-indigo-500"/> SEO Performance Report
//                     </h1>
//                     <p className="text-muted-foreground text-sm">
//                         {report.siteName} · Generated {formatDate(new Date(report.generatedAt))} · {report.period}
//                     </p>
//                 </div>
//                 <Button variant="gradient" className="gap-2" onClick={handlePrint}>
//                     <Printer className="h-4 w-4"/> Print / Download PDF
//                 </Button>
//             </div>
//
//             <div ref={printRef} className="space-y-6 print:text-black">
//                 {/* Summary metrics */}
//                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                     {[
//                         {
//                             label: "Published Posts",
//                             value: report.summary.publishedPosts,
//                             icon: FileText,
//                             color: "from-indigo-500 to-indigo-600"
//                         },
//                         {
//                             label: "Total Views",
//                             value: formatNumber(report.summary.totalViews),
//                             icon: Eye,
//                             color: "from-sky-500 to-sky-600"
//                         },
//                         {
//                             label: "Avg SEO Score",
//                             value: `${report.summary.avgSEOScore}/100`,
//                             icon: BarChart3,
//                             color: "from-emerald-500 to-emerald-600"
//                         },
//                         {
//                             label: "Keywords Tracked",
//                             value: report.summary.trackedKeywords,
//                             icon: TrendingUp,
//                             color: "from-purple-500 to-purple-600"
//                         },
//                     ].map((s) => (
//                         <Card key={s.label}>
//                             <CardContent className="p-4 flex items-center gap-3">
//                                 <div
//                                     className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shrink-0`}>
//                                     <s.icon className="h-5 w-5 text-white"/>
//                                 </div>
//                                 <div>
//                                     <p className="text-xs text-muted-foreground">{s.label}</p>
//                                     <p className="text-xl font-bold">{s.value}</p>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     ))}
//                 </div>
//
//                 <div className="grid lg:grid-cols-2 gap-6">
//                     {/* Top posts */}
//                     <Card>
//                         <CardHeader className="pb-3"><CardTitle className="text-sm">Top Performing
//                             Posts</CardTitle></CardHeader>
//                         <CardContent>
//                             {report.topPosts.length === 0 ? (
//                                 <p className="text-sm text-muted-foreground py-4 text-center">No published posts yet</p>
//                             ) : (
//                                 <div className="space-y-3">
//                                     {report.topPosts.map((post, i) => (
//                                         <div key={post.slug} className="flex items-center gap-3">
//                                             <span
//                                                 className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">{i + 1}</span>
//                                             <div className="flex-1 min-w-0">
//                                                 <p className="text-sm font-medium truncate">{post.title}</p>
//                                                 <div className="flex items-center gap-3 mt-0.5">
//                           <span className="text-xs text-muted-foreground flex items-center gap-1">
//                             <Eye className="h-3 w-3"/> {formatNumber(post.views)}
//                           </span>
//                                                     <span
//                                                         className="text-xs text-muted-foreground">SEO: {post.seoScore}/100</span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//
//                     {/* Keyword rankings */}
//                     <Card>
//                         <CardHeader className="pb-3"><CardTitle className="text-sm">Keyword
//                             Rankings</CardTitle></CardHeader>
//                         <CardContent>
//                             {report.topKeywords.length === 0 ? (
//                                 <p className="text-sm text-muted-foreground py-4 text-center">No keywords tracked
//                                     yet</p>
//                             ) : (
//                                 <div className="space-y-2">
//                                     {report.topKeywords.map((kw) => {
//                                         const diff = kw.previousPosition !== null && kw.position !== null
//                                             ? kw.previousPosition - kw.position
//                                             : 0;
//                                         return (
//                                             <div key={kw.keyword} className="flex items-center justify-between">
//                                                 <span className="text-sm truncate flex-1 mr-2">{kw.keyword}</span>
//                                                 <div className="flex items-center gap-2 shrink-0">
//                                                     {kw.position !== null ? (
//                                                         <span className="text-sm font-bold">#{kw.position}</span>
//                                                     ) : (
//                                                         <Badge variant="secondary" className="text-xs">N/R</Badge>
//                                                     )}
//                                                     {diff !== 0 && (
//                                                         <span
//                                                             className={`flex items-center gap-0.5 text-xs ${diff > 0 ? "text-emerald-500" : "text-red-500"}`}>
//                               {diff > 0 ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
//                                                             {Math.abs(diff)}
//                             </span>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//                 </div>
//
//                 {/* Recent activity */}
//                 <Card>
//                     <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Posts</CardTitle></CardHeader>
//                     <CardContent>
//                         <div className="overflow-x-auto">
//                             <table className="w-full text-sm">
//                                 <thead>
//                                 <tr className="border-b">
//                                     <th className="text-left py-2 text-muted-foreground font-medium">Title</th>
//                                     <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
//                                     <th className="text-left py-2 text-muted-foreground font-medium">Views</th>
//                                     <th className="text-left py-2 text-muted-foreground font-medium">Created</th>
//                                 </tr>
//                                 </thead>
//                                 <tbody className="divide-y">
//                                 {report.recentPosts.map((post) => (
//                                     <tr key={post.title + post.createdAt}>
//                                         <td className="py-2.5 pr-4 font-medium truncate max-w-xs">{post.title}</td>
//                                         <td className="py-2.5">
//                                             <Badge variant={post.status === "published" ? "success" : "secondary"}
//                                                    className="capitalize text-xs">
//                                                 {post.status}
//                                             </Badge>
//                                         </td>
//                                         <td className="py-2.5">{formatNumber(post.views)}</td>
//                                         <td className="py-2.5 text-muted-foreground">
//                                             {formatDate(new Date(post.createdAt), {month: "short", day: "numeric"})}
//                                         </td>
//                                     </tr>
//                                 ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </CardContent>
//                 </Card>
//
//                 {/* Footer */}
//                 <div className="text-center text-xs text-muted-foreground pt-4 border-t">
//                     Report generated by SEO Platform · {formatDate(new Date(report.generatedAt))}
//                 </div>
//             </div>
//
//             <style>{`
//         @media print {
//           body > *:not([data-print]) { display: none; }
//           .print\\:text-black { color: black !important; }
//           button { display: none !important; }
//         }
//       `}</style>
//         </div>
//     );
// }
