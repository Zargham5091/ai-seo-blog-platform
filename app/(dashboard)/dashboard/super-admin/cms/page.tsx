"use client";
import {useEffect, useState} from "react";
import {FileText, Edit, Save, Plus, Eye, CheckCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";

interface CMSPage {
    _id: string;
    slug: string;
    title: string;
    content: string;
    isPublished: boolean;
    updatedAt: string;
}

const PRESET_PAGES = [
    {slug: "home", title: "Home Hero Content", description: "Main hero section on the homepage"},
    {slug: "home-stats", title: "Homepage Stats", description: "JSON array: [{value,label}]"},
    {slug: "pricing-faqs", title: "Pricing FAQs", description: "JSON array: [{q,a}]"},
    {slug: "about", title: "About Page", description: "About us page content"},
    {slug: "features", title: "Features Page", description: "Features page content"},
    {slug: "contact-info", title: "Contact Info", description: "Contact details: email, address, social"},
    {slug: "footer-text", title: "Footer Content", description: "Footer description and links"},
    {slug: "announcement-bar", title: "Announcement Bar", description: "Top banner text (leave empty to hide)"},
    {slug: "seo-settings", title: "Global SEO Settings", description: "JSON: {siteTitle, siteDescription, ogImage}"},
];

export default function SuperAdminCMSPage() {
    const [pages, setPages] = useState<CMSPage[]>([]);
    const [editPage, setEditPage] = useState<CMSPage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const fetchPages = async () => {
        setIsLoading(true);
        const res = await fetch("/api/cms");
        const d = await res.json();
        if (d.success) setPages(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const openEdit = (preset: typeof PRESET_PAGES[0]) => {
        const existing = pages.find((p) => p.slug === preset.slug);
        setEditPage(existing ?? {
            _id: "",
            slug: preset.slug,
            title: preset.title,
            content: "",
            isPublished: true,
            updatedAt: "",
        });
    };

    const handleSave = async () => {
        if (!editPage) return;
        setIsSaving(true);
        const res = await fetch("/api/cms", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                slug: editPage.slug,
                title: editPage.title,
                content: editPage.content,
                isPublished: editPage.isPublished,
            }),
        });
        const d = await res.json();
        if (d.success) {
            setSaveMsg("Saved — changes are live immediately");
            setTimeout(() => {
                setSaveMsg("");
                setEditPage(null);
                fetchPages();
            }, 2000);
        }
        setIsSaving(false);
    };

    const getPageStatus = (slug: string) => {
        const page = pages.find((p) => p.slug === slug);
        return page ? (page.isPublished ? "published" : "draft") : "not-set";
    };

    const isJsonField = (slug: string) =>
        ["home-stats", "pricing-faqs", "seo-settings", "contact-info"].includes(slug);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-indigo-500"/> CMS Pages
                </h1>
                <p className="text-muted-foreground text-sm">
                    Edit all marketing page content. Changes go live immediately without a deployment.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_PAGES.map((preset) => {
                    const status = getPageStatus(preset.slug);
                    const page = pages.find((p) => p.slug === preset.slug);
                    return (
                        <Card key={preset.slug} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-sm">{preset.title}</h3>
                                        <p className="text-xs text-muted-foreground font-mono">/{preset.slug}</p>
                                    </div>
                                    <Badge
                                        variant={status === "published" ? "success" : status === "draft" ? "warning" : "secondary"}
                                        className="text-xs capitalize shrink-0"
                                    >
                                        {status === "not-set" ? "Empty" : status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">{preset.description}</p>
                                {page?.updatedAt && (
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                                    </p>
                                )}
                                <Button variant="outline" size="sm" className="w-full gap-1.5"
                                        onClick={() => openEdit(preset)}>
                                    <Edit className="h-3.5 w-3.5"/>
                                    {status === "not-set" ? "Create Content" : "Edit Content"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Custom page */}
                <Card className="border-dashed hover:border-indigo-300 hover:bg-muted/20 transition-all cursor-pointer"
                      onClick={() => setEditPage({
                          _id: "",
                          slug: "",
                          title: "",
                          content: "",
                          isPublished: true,
                          updatedAt: ""
                      })}>
                    <CardContent
                        className="flex flex-col items-center justify-center h-full min-h-[140px] text-muted-foreground">
                        <Plus className="h-8 w-8 mb-2 opacity-30"/>
                        <p className="text-sm font-medium">Custom Page</p>
                        <p className="text-xs">Create a new CMS page</p>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editPage} onOpenChange={(o) => !o && setEditPage(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-500"/>
                            {editPage?._id ? `Edit: ${editPage.title}` : "Create CMS Page"}
                        </DialogTitle>
                    </DialogHeader>
                    {editPage && (
                        <div className="space-y-4 py-2">
                            {saveMsg && (
                                <div
                                    className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-4 py-3">
                                    <CheckCircle className="h-4 w-4"/> {saveMsg}
                                </div>
                            )}
                            {!editPage._id && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Title</Label>
                                        <Input value={editPage.title}
                                               onChange={(e) => setEditPage({...editPage, title: e.target.value})}
                                               placeholder="Page title"/>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Slug (URL path)</Label>
                                        <Input
                                            value={editPage.slug}
                                            onChange={(e) => setEditPage({
                                                ...editPage,
                                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                                            })}
                                            placeholder="my-page-slug"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs flex items-center justify-between">
                                    <span>Content</span>
                                    {isJsonField(editPage.slug) && (
                                        <span className="text-indigo-600 font-mono text-xs">JSON format required</span>
                                    )}
                                </Label>
                                <textarea
                                    value={editPage.content}
                                    onChange={(e) => setEditPage({...editPage, content: e.target.value})}
                                    rows={isJsonField(editPage.slug) ? 8 : 14}
                                    placeholder={
                                        isJsonField(editPage.slug)
                                            ? editPage.slug === "home-stats"
                                                ? '[{"value":"10x","label":"Faster content"},{"value":"85%","label":"SEO improvement"}]'
                                                : editPage.slug === "pricing-faqs"
                                                    ? '[{"q":"Can I cancel?","a":"Yes, anytime."},{"q":"What are credits?","a":"Each AI action uses 1 credit."}]'
                                                    : '{"key": "value"}'
                                            : "Enter HTML content or plain text..."
                                    }
                                    className={`w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isJsonField(editPage.slug) ? "font-mono" : ""}`}
                                />
                                {isJsonField(editPage.slug) && (
                                    <p className="text-xs text-muted-foreground">
                                        Must be valid JSON. The platform reads this directly.
                                    </p>
                                )}
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editPage.isPublished}
                                    onChange={(e) => setEditPage({...editPage, isPublished: e.target.checked})}
                                    className="rounded"
                                />
                                Published (visible on site)
                            </label>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPage(null)}>Cancel</Button>
                        <Button variant="gradient" onClick={handleSave} isLoading={isSaving} className="gap-2">
                            <Save className="h-4 w-4"/> Save — Goes Live Instantly
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// "use client";
// import { useEffect, useState } from "react";
// import { Save, Globe, Eye } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input, Label, Badge } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { TiptapEditor } from "@/components/blog/TiptapEditor";
//
// const CMS_PAGES = [
//   { slug: "home", label: "Home Page" },
//   { slug: "about", label: "About Us" },
//   { slug: "features", label: "Features" },
//   { slug: "contact", label: "Contact Us" },
//   { slug: "privacy", label: "Privacy Policy" },
//   { slug: "terms", label: "Terms of Service" },
//   { slug: "faq", label: "FAQs" },
//   { slug: "documentation", label: "Documentation" },
// ];
//
// interface CMSPage {
//   slug: string;
//   title: string;
//   content: string;
//   isPublished: boolean;
//   seo: { metaTitle?: string; metaDescription?: string };
// }
//
// export default function CMSManagementPage() {
//   const [activePage, setActivePage] = useState("home");
//   const [pageData, setPageData] = useState<CMSPage>({ slug: "home", title: "", content: "", isPublished: false, seo: {} });
//   const [isSaving, setIsSaving] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [saved, setSaved] = useState(false);
//
//   const loadPage = async (slug: string) => {
//     setIsLoading(true);
//     const res = await fetch(`/api/cms?slug=${slug}`);
//     const d = await res.json();
//     if (d.success) {
//       setPageData(d.data);
//     } else {
//       setPageData({ slug, title: CMS_PAGES.find((p) => p.slug === slug)?.label ?? slug, content: "", isPublished: false, seo: {} });
//     }
//     setIsLoading(false);
//   };
//
//   useEffect(() => { loadPage(activePage); }, [activePage]);
//
//   const handleSave = async (publish = false) => {
//     setIsSaving(true);
//     const payload = { ...pageData, isPublished: publish ? true : pageData.isPublished };
//     await fetch("/api/cms", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });
//     if (publish) setPageData((p) => ({ ...p, isPublished: true }));
//     setSaved(true);
//     setTimeout(() => setSaved(false), 2000);
//     setIsSaving(false);
//   };
//
//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold">CMS Pages</h1>
//         <p className="text-muted-foreground text-sm">Edit and publish marketing pages</p>
//       </div>
//
//       <div className="grid lg:grid-cols-4 gap-6">
//         {/* Page list */}
//         <div className="space-y-1">
//           {CMS_PAGES.map((page) => (
//             <button
//               key={page.slug}
//               onClick={() => setActivePage(page.slug)}
//               className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
//                 activePage === page.slug
//                   ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
//                   : "text-muted-foreground hover:bg-muted hover:text-foreground"
//               }`}
//             >
//               {page.label}
//             </button>
//           ))}
//         </div>
//
//         {/* Editor */}
//         <div className="lg:col-span-3 space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <h2 className="font-semibold">{CMS_PAGES.find((p) => p.slug === activePage)?.label}</h2>
//               <Badge variant={pageData.isPublished ? "success" : "warning"}>
//                 {pageData.isPublished ? "Published" : "Draft"}
//               </Badge>
//             </div>
//             <div className="flex gap-2">
//               {pageData.isPublished && (
//                 <Button variant="outline" size="sm" asChild className="gap-1.5">
//                   <a href={`/${activePage === "home" ? "" : activePage}`} target="_blank">
//                     <Eye className="h-3.5 w-3.5" /> Preview
//                   </a>
//                 </Button>
//               )}
//               <Button variant="outline" size="sm" onClick={() => handleSave(false)} isLoading={isSaving} className="gap-1.5">
//                 <Save className="h-3.5 w-3.5" /> {saved ? "Saved!" : "Save Draft"}
//               </Button>
//               <Button variant="gradient" size="sm" onClick={() => handleSave(true)} isLoading={isSaving} className="gap-1.5">
//                 <Globe className="h-3.5 w-3.5" /> Publish
//               </Button>
//             </div>
//           </div>
//
//           <Card>
//             <CardContent className="p-4 space-y-4">
//               <div className="space-y-1.5">
//                 <Label className="text-xs">Page Title</Label>
//                 <Input value={pageData.title} onChange={(e) => setPageData((p) => ({ ...p, title: e.target.value }))} placeholder="Page title..." />
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Meta Title</Label>
//                   <Input value={pageData.seo?.metaTitle ?? ""} onChange={(e) => setPageData((p) => ({ ...p, seo: { ...p.seo, metaTitle: e.target.value } }))} placeholder="SEO title..." />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Meta Description</Label>
//                   <Input value={pageData.seo?.metaDescription ?? ""} onChange={(e) => setPageData((p) => ({ ...p, seo: { ...p.seo, metaDescription: e.target.value } }))} placeholder="SEO description..." />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//
//           {isLoading ? (
//             <div className="h-64 skeleton rounded-xl" />
//           ) : (
//             <TiptapEditor
//               content={pageData.content}
//               onChange={(c) => setPageData((p) => ({ ...p, content: c }))}
//               placeholder={`Start editing the ${CMS_PAGES.find((p) => p.slug === activePage)?.label} page...`}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
