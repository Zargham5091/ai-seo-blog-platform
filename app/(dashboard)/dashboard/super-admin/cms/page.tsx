"use client";
import { useEffect, useState } from "react";
import { Save, Globe, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Badge } from "@/components/ui/form-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapEditor } from "@/components/blog/TiptapEditor";

const CMS_PAGES = [
  { slug: "home", label: "Home Page" },
  { slug: "about", label: "About Us" },
  { slug: "features", label: "Features" },
  { slug: "contact", label: "Contact Us" },
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "terms", label: "Terms of Service" },
  { slug: "faq", label: "FAQs" },
  { slug: "documentation", label: "Documentation" },
];

interface CMSPage {
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  seo: { metaTitle?: string; metaDescription?: string };
}

export default function CMSManagementPage() {
  const [activePage, setActivePage] = useState("home");
  const [pageData, setPageData] = useState<CMSPage>({ slug: "home", title: "", content: "", isPublished: false, seo: {} });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadPage = async (slug: string) => {
    setIsLoading(true);
    const res = await fetch(`/api/cms?slug=${slug}`);
    const d = await res.json();
    if (d.success) {
      setPageData(d.data);
    } else {
      setPageData({ slug, title: CMS_PAGES.find((p) => p.slug === slug)?.label ?? slug, content: "", isPublished: false, seo: {} });
    }
    setIsLoading(false);
  };

  useEffect(() => { loadPage(activePage); }, [activePage]);

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    const payload = { ...pageData, isPublished: publish ? true : pageData.isPublished };
    await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (publish) setPageData((p) => ({ ...p, isPublished: true }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CMS Pages</h1>
        <p className="text-muted-foreground text-sm">Edit and publish marketing pages</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Page list */}
        <div className="space-y-1">
          {CMS_PAGES.map((page) => (
            <button
              key={page.slug}
              onClick={() => setActivePage(page.slug)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activePage === page.slug
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{CMS_PAGES.find((p) => p.slug === activePage)?.label}</h2>
              <Badge variant={pageData.isPublished ? "success" : "warning"}>
                {pageData.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <div className="flex gap-2">
              {pageData.isPublished && (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <a href={`/${activePage === "home" ? "" : activePage}`} target="_blank">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handleSave(false)} isLoading={isSaving} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> {saved ? "Saved!" : "Save Draft"}
              </Button>
              <Button variant="gradient" size="sm" onClick={() => handleSave(true)} isLoading={isSaving} className="gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Publish
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Page Title</Label>
                <Input value={pageData.title} onChange={(e) => setPageData((p) => ({ ...p, title: e.target.value }))} placeholder="Page title..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Meta Title</Label>
                  <Input value={pageData.seo?.metaTitle ?? ""} onChange={(e) => setPageData((p) => ({ ...p, seo: { ...p.seo, metaTitle: e.target.value } }))} placeholder="SEO title..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Meta Description</Label>
                  <Input value={pageData.seo?.metaDescription ?? ""} onChange={(e) => setPageData((p) => ({ ...p, seo: { ...p.seo, metaDescription: e.target.value } }))} placeholder="SEO description..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <TiptapEditor
              content={pageData.content}
              onChange={(c) => setPageData((p) => ({ ...p, content: c }))}
              placeholder={`Start editing the ${CMS_PAGES.find((p) => p.slug === activePage)?.label} page...`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
