"use client";
import { useState } from "react";
import { Code, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/form-elements";

const SCHEMA_TYPES = [
  { value: "Article", label: "Article", desc: "News, blog, or general article" },
  { value: "BlogPosting", label: "Blog Post", desc: "Blog post or entry" },
  { value: "FAQPage", label: "FAQ Page", desc: "Questions and answers" },
  { value: "HowTo", label: "How-To", desc: "Step-by-step guide" },
  { value: "Product", label: "Product", desc: "Product or service" },
  { value: "LocalBusiness", label: "Local Business", desc: "Physical business location" },
  { value: "WebPage", label: "Web Page", desc: "General web page" },
];

export default function SchemaGeneratorPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Article");
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ formatted: string; scriptTag: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"json" | "script" | null>(null);

  const handleGenerate = async () => {
    if (!title || !description) return;
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, type, url }),
      });
      const d = await res.json();
      if (d.success) setResult(d.data);
      else setError(d.error);
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copy = async (text: string, kind: "json" | "script") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Schema Markup Generator</h1>
        <p className="text-muted-foreground text-sm">
          Generate JSON-LD structured data to enhance your search engine visibility
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" /> Configure Schema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Schema Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {SCHEMA_TYPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setType(s.value)}
                    className={`text-left p-2.5 rounded-lg border text-sm transition-all ${
                      type === s.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                        : "border-border hover:border-indigo-200 hover:bg-muted/30"
                    }`}
                  >
                    <p className="font-medium text-xs">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Page Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Do Keyword Research"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Page Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the page content in 1-2 sentences..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Page URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourdomain.com/page"
              />
            </div>

            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              variant="gradient"
              className="w-full gap-2"
              disabled={!title || !description}
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Schema"}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* JSON output */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" /> JSON-LD Object
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => copy(result.formatted, "json")}
                    >
                      {copied === "json"
                        ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
                        : <><Copy className="h-3.5 w-3.5" /> Copy JSON</>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-zinc-950 text-emerald-400 text-xs rounded-lg p-4 overflow-x-auto max-h-64 font-mono">
                    {result.formatted}
                  </pre>
                </CardContent>
              </Card>

              {/* Script tag */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" /> HTML Script Tag
                      <Badge variant="success" className="text-xs">Ready to paste</Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => copy(result.scriptTag, "script")}
                    >
                      {copied === "script"
                        ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
                        : <><Copy className="h-3.5 w-3.5" /> Copy Tag</>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-zinc-950 text-sky-400 text-xs rounded-lg p-4 overflow-x-auto max-h-48 font-mono whitespace-pre-wrap">
                    {result.scriptTag}
                  </pre>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground px-1">
                Paste the script tag inside the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> of your page for best results.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed rounded-xl text-center p-8 text-muted-foreground">
              <Code className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">Schema will appear here</p>
              <p className="text-sm mt-1">Fill in the form and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
