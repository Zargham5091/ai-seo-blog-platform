"use client";
import {useState} from "react";
import {Code, Copy, Check, Download} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";

type SchemaType =
    "Article"
    | "FAQPage"
    | "HowTo"
    | "Product"
    | "LocalBusiness"
    | "BreadcrumbList"
    | "WebSite"
    | "Person";

interface SchemaField {
    key: string;
    label: string;
    type: "text" | "url" | "textarea" | "number" | "array";
    placeholder?: string;
    required?: boolean;
}

const SCHEMA_FIELDS: Record<SchemaType, SchemaField[]> = {
    Article: [
        {key: "headline", label: "Headline", type: "text", required: true, placeholder: "Article title"},
        {key: "description", label: "Description", type: "textarea", placeholder: "Brief description"},
        {key: "authorName", label: "Author Name", type: "text", required: true},
        {key: "datePublished", label: "Date Published", type: "text", placeholder: "2026-04-21"},
        {key: "dateModified", label: "Date Modified", type: "text", placeholder: "2026-04-21"},
        {key: "image", label: "Image URL", type: "url"},
        {key: "publisherName", label: "Publisher Name", type: "text"},
        {key: "publisherLogo", label: "Publisher Logo URL", type: "url"},
    ],
    FAQPage: [
        {
            key: "faq",
            label: "FAQ Items (one Q|A per line: Question|Answer)",
            type: "textarea",
            required: true,
            placeholder: "What is SEO?|SEO is search engine optimization.\nHow does it work?|It improves rankings."
        },
    ],
    HowTo: [
        {key: "name", label: "How-To Name", type: "text", required: true, placeholder: "How to improve SEO"},
        {key: "description", label: "Description", type: "textarea"},
        {
            key: "steps",
            label: "Steps (one per line)",
            type: "textarea",
            required: true,
            placeholder: "Research keywords\nOptimize title tags\nBuild backlinks"
        },
        {key: "totalTime", label: "Total Time (ISO 8601)", type: "text", placeholder: "PT30M"},
    ],
    Product: [
        {key: "name", label: "Product Name", type: "text", required: true},
        {key: "description", label: "Description", type: "textarea"},
        {key: "image", label: "Image URL", type: "url"},
        {key: "price", label: "Price", type: "number", placeholder: "29.99"},
        {key: "currency", label: "Currency", type: "text", placeholder: "USD"},
        {key: "ratingValue", label: "Rating Value", type: "number", placeholder: "4.8"},
        {key: "reviewCount", label: "Review Count", type: "number", placeholder: "127"},
    ],
    LocalBusiness: [
        {key: "name", label: "Business Name", type: "text", required: true},
        {key: "address", label: "Street Address", type: "text"},
        {key: "city", label: "City", type: "text"},
        {key: "country", label: "Country", type: "text", placeholder: "US"},
        {key: "phone", label: "Phone", type: "text"},
        {key: "url", label: "Website URL", type: "url"},
        {key: "openingHours", label: "Opening Hours", type: "text", placeholder: "Mo-Fr 09:00-17:00"},
    ],
    BreadcrumbList: [
        {
            key: "breadcrumbs",
            label: "Breadcrumbs (one per line: Name|URL)",
            type: "textarea",
            required: true,
            placeholder: "Home|https://example.com\nBlog|https://example.com/blog\nSEO Tips|https://example.com/blog/seo-tips"
        },
    ],
    WebSite: [
        {key: "name", label: "Site Name", type: "text", required: true},
        {key: "url", label: "Site URL", type: "url", required: true},
        {key: "description", label: "Description", type: "text"},
        {
            key: "searchUrl",
            label: "Search URL (with {search_term_string})",
            type: "url",
            placeholder: "https://example.com/search?q={search_term_string}"
        },
    ],
    Person: [
        {key: "name", label: "Full Name", type: "text", required: true},
        {key: "url", label: "Profile URL", type: "url"},
        {key: "image", label: "Photo URL", type: "url"},
        {key: "jobTitle", label: "Job Title", type: "text"},
        {key: "worksFor", label: "Organization", type: "text"},
        {
            key: "sameAs",
            label: "Social Profiles (comma separated)",
            type: "text",
            placeholder: "https://twitter.com/you, https://linkedin.com/in/you"
        },
    ],
};

function buildSchema(type: SchemaType, fields: Record<string, string>): Record<string, unknown> {
    const base: Record<string, unknown> = {"@context": "https://schema.org", "@type": type};

    switch (type) {
        case "Article":
            return {
                ...base,
                headline: fields.headline,
                description: fields.description,
                author: {"@type": "Person", name: fields.authorName},
                datePublished: fields.datePublished,
                dateModified: fields.dateModified || fields.datePublished,
                image: fields.image || undefined,
                publisher: fields.publisherName
                    ? {
                        "@type": "Organization",
                        name: fields.publisherName,
                        logo: fields.publisherLogo ? {"@type": "ImageObject", url: fields.publisherLogo} : undefined
                    }
                    : undefined,
            };
        case "FAQPage": {
            const faqs = (fields.faq ?? "").split("\n").filter(Boolean).map((line) => {
                const [q, a] = line.split("|");
                return {"@type": "Question", name: q?.trim(), acceptedAnswer: {"@type": "Answer", text: a?.trim()}};
            });
            return {...base, mainEntity: faqs};
        }
        case "HowTo": {
            const steps = (fields.steps ?? "").split("\n").filter(Boolean).map((s, i) => ({
                "@type": "HowToStep", position: i + 1, name: s.trim(),
            }));
            return {
                ...base,
                name: fields.name,
                description: fields.description,
                totalTime: fields.totalTime || undefined,
                step: steps
            };
        }
        case "Product":
            return {
                ...base, name: fields.name, description: fields.description, image: fields.image || undefined,
                offers: {
                    "@type": "Offer",
                    price: fields.price,
                    priceCurrency: fields.currency || "USD",
                    availability: "https://schema.org/InStock"
                },
                aggregateRating: fields.ratingValue ? {
                    "@type": "AggregateRating",
                    ratingValue: Number(fields.ratingValue),
                    reviewCount: Number(fields.reviewCount || 0)
                } : undefined,
            };
        case "LocalBusiness":
            return {
                ...base, name: fields.name, url: fields.url,
                address: {
                    "@type": "PostalAddress",
                    streetAddress: fields.address,
                    addressLocality: fields.city,
                    addressCountry: fields.country
                },
                telephone: fields.phone, openingHours: fields.openingHours,
            };
        case "BreadcrumbList": {
            const items = (fields.breadcrumbs ?? "").split("\n").filter(Boolean).map((line, i) => {
                const [name, url] = line.split("|");
                return {"@type": "ListItem", position: i + 1, name: name?.trim(), item: url?.trim()};
            });
            return {...base, itemListElement: items};
        }
        case "WebSite":
            return {
                ...base, name: fields.name, url: fields.url, description: fields.description,
                potentialAction: fields.searchUrl ? {
                    "@type": "SearchAction",
                    target: {"@type": "EntryPoint", urlTemplate: fields.searchUrl},
                    "query-input": "required name=search_term_string"
                } : undefined,
            };
        case "Person":
            return {
                ...base, name: fields.name, url: fields.url, image: fields.image, jobTitle: fields.jobTitle,
                worksFor: fields.worksFor ? {"@type": "Organization", name: fields.worksFor} : undefined,
                sameAs: fields.sameAs ? fields.sameAs.split(",").map((s) => s.trim()) : undefined,
            };
        default:
            return base;
    }
}

const SCHEMA_TYPES: SchemaType[] = ["Article", "FAQPage", "HowTo", "Product", "LocalBusiness", "BreadcrumbList", "WebSite", "Person"];

export default function SchemaPage() {
    const [type, setType] = useState<SchemaType>("Article");
    const [fields, setFields] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);

    const schema = buildSchema(type, fields);
    const json = JSON.stringify(schema, null, 2);
    const scriptTag = `<script type="application/ld+json">\n${json}\n</script>`;

    const copy = () => {
        navigator.clipboard.writeText(scriptTag);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const download = () => {
        const blob = new Blob([scriptTag], {type: "text/html"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `schema-${type.toLowerCase()}.html`;
        a.click();
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Code className="h-6 w-6 text-indigo-500"/> Schema Generator
                </h1>
                <p className="text-muted-foreground text-sm">Generate JSON-LD structured data for rich search
                    results</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Schema Type</Label>
                        <div className="flex flex-wrap gap-2">
                            {SCHEMA_TYPES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setType(t);
                                        setFields({});
                                    }}
                                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${type === t ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300" : "border-border hover:border-indigo-200 text-muted-foreground hover:text-foreground"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle
                            className="text-sm">{type} Fields</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {SCHEMA_FIELDS[type].map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                    <Label className="text-xs flex items-center gap-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                    </Label>
                                    {field.type === "textarea" ? (
                                        <textarea
                                            value={fields[field.key] ?? ""}
                                            onChange={(e) => setFields({...fields, [field.key]: e.target.value})}
                                            placeholder={field.placeholder}
                                            rows={4}
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    ) : (
                                        <Input
                                            type={field.type === "number" ? "number" : "text"}
                                            value={fields[field.key] ?? ""}
                                            onChange={(e) => setFields({...fields, [field.key]: e.target.value})}
                                            placeholder={field.placeholder}
                                        />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Output */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Generated Schema</Label>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
                                {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500"/> Copied</> : <><Copy
                                    className="h-3.5 w-3.5"/> Copy</>}
                            </Button>
                            <Button variant="outline" size="sm" onClick={download} className="gap-1.5">
                                <Download className="h-3.5 w-3.5"/> Download
                            </Button>
                        </div>
                    </div>
                    <Tabs defaultValue="script">
                        <TabsList><TabsTrigger value="script">Script Tag</TabsTrigger><TabsTrigger value="json">JSON
                            Only</TabsTrigger></TabsList>
                        <TabsContent value="script">
              <pre
                  className="bg-zinc-950 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-auto max-h-[500px] whitespace-pre-wrap break-all">
                {scriptTag}
              </pre>
                        </TabsContent>
                        <TabsContent value="json">
              <pre
                  className="bg-zinc-950 text-sky-400 font-mono text-xs p-4 rounded-xl overflow-auto max-h-[500px] whitespace-pre-wrap">
                {json}
              </pre>
                        </TabsContent>
                    </Tabs>
                    <div
                        className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 p-3">
                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">How to use</p>
                        <p className="text-xs text-muted-foreground">Paste the script tag inside the <code
                            className="bg-muted px-1 rounded">&lt;head&gt;</code> section of the page you want to
                            enrich.
                            For blog posts, it&apos;s already injected automatically via the blog post page.</p>
                    </div>
                </div>
            </div>
        </div>);
}

// "use client";
// import { useState } from "react";
// import { Code, Copy, Check, Sparkles } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input, Label } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/form-elements";
//
// const SCHEMA_TYPES = [
//   { value: "Article", label: "Article", desc: "News, blog, or general article" },
//   { value: "BlogPosting", label: "Blog Post", desc: "Blog post or entry" },
//   { value: "FAQPage", label: "FAQ Page", desc: "Questions and answers" },
//   { value: "HowTo", label: "How-To", desc: "Step-by-step guide" },
//   { value: "Product", label: "Product", desc: "Product or service" },
//   { value: "LocalBusiness", label: "Local Business", desc: "Physical business location" },
//   { value: "WebPage", label: "Web Page", desc: "General web page" },
// ];
//
// export default function SchemaGeneratorPage() {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [type, setType] = useState("Article");
//   const [url, setUrl] = useState("");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [result, setResult] = useState<{ formatted: string; scriptTag: string } | null>(null);
//   const [error, setError] = useState("");
//   const [copied, setCopied] = useState<"json" | "script" | null>(null);
//
//   const handleGenerate = async () => {
//     if (!title || !description) return;
//     setIsGenerating(true);
//     setError("");
//     try {
//       const res = await fetch("/api/ai/schema", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ title, description, type, url }),
//       });
//       const d = await res.json();
//       if (d.success) setResult(d.data);
//       else setError(d.error);
//     } catch {
//       setError("Generation failed. Please try again.");
//     } finally {
//       setIsGenerating(false);
//     }
//   };
//
//   const copy = async (text: string, kind: "json" | "script") => {
//     await navigator.clipboard.writeText(text);
//     setCopied(kind);
//     setTimeout(() => setCopied(null), 2000);
//   };
//
//   return (
//     <div className="space-y-6 max-w-4xl">
//       <div>
//         <h1 className="text-2xl font-bold">Schema Markup Generator</h1>
//         <p className="text-muted-foreground text-sm">
//           Generate JSON-LD structured data to enhance your search engine visibility
//         </p>
//       </div>
//
//       <div className="grid lg:grid-cols-2 gap-6">
//         {/* Input form */}
//         <Card>
//           <CardHeader className="pb-3">
//             <CardTitle className="text-base flex items-center gap-2">
//               <Sparkles className="h-4 w-4 text-indigo-500" /> Configure Schema
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {error && (
//               <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
//                 {error}
//               </div>
//             )}
//
//             <div className="space-y-1.5">
//               <Label>Schema Type</Label>
//               <div className="grid grid-cols-2 gap-2">
//                 {SCHEMA_TYPES.map((s) => (
//                   <button
//                     key={s.value}
//                     onClick={() => setType(s.value)}
//                     className={`text-left p-2.5 rounded-lg border text-sm transition-all ${
//                       type === s.value
//                         ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
//                         : "border-border hover:border-indigo-200 hover:bg-muted/30"
//                     }`}
//                   >
//                     <p className="font-medium text-xs">{s.label}</p>
//                     <p className="text-xs text-muted-foreground">{s.desc}</p>
//                   </button>
//                 ))}
//               </div>
//             </div>
//
//             <div className="space-y-1.5">
//               <Label>Page Title</Label>
//               <Input
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 placeholder="e.g. How to Do Keyword Research"
//               />
//             </div>
//
//             <div className="space-y-1.5">
//               <Label>Page Description</Label>
//               <textarea
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 placeholder="Describe the page content in 1-2 sentences..."
//                 rows={3}
//                 className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//               />
//             </div>
//
//             <div className="space-y-1.5">
//               <Label>Page URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
//               <Input
//                 value={url}
//                 onChange={(e) => setUrl(e.target.value)}
//                 placeholder="https://yourdomain.com/page"
//               />
//             </div>
//
//             <Button
//               onClick={handleGenerate}
//               isLoading={isGenerating}
//               variant="gradient"
//               className="w-full gap-2"
//               disabled={!title || !description}
//             >
//               <Sparkles className="h-4 w-4" />
//               {isGenerating ? "Generating..." : "Generate Schema"}
//             </Button>
//           </CardContent>
//         </Card>
//
//         {/* Output */}
//         <div className="space-y-4">
//           {result ? (
//             <>
//               {/* JSON output */}
//               <Card>
//                 <CardHeader className="pb-2">
//                   <div className="flex items-center justify-between">
//                     <CardTitle className="text-sm flex items-center gap-2">
//                       <Code className="h-4 w-4" /> JSON-LD Object
//                     </CardTitle>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="gap-1.5 text-xs"
//                       onClick={() => copy(result.formatted, "json")}
//                     >
//                       {copied === "json"
//                         ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
//                         : <><Copy className="h-3.5 w-3.5" /> Copy JSON</>}
//                     </Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <pre className="bg-zinc-950 text-emerald-400 text-xs rounded-lg p-4 overflow-x-auto max-h-64 font-mono">
//                     {result.formatted}
//                   </pre>
//                 </CardContent>
//               </Card>
//
//               {/* Script tag */}
//               <Card>
//                 <CardHeader className="pb-2">
//                   <div className="flex items-center justify-between">
//                     <CardTitle className="text-sm flex items-center gap-2">
//                       <Code className="h-4 w-4" /> HTML Script Tag
//                       <Badge variant="success" className="text-xs">Ready to paste</Badge>
//                     </CardTitle>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="gap-1.5 text-xs"
//                       onClick={() => copy(result.scriptTag, "script")}
//                     >
//                       {copied === "script"
//                         ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
//                         : <><Copy className="h-3.5 w-3.5" /> Copy Tag</>}
//                     </Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <pre className="bg-zinc-950 text-sky-400 text-xs rounded-lg p-4 overflow-x-auto max-h-48 font-mono whitespace-pre-wrap">
//                     {result.scriptTag}
//                   </pre>
//                 </CardContent>
//               </Card>
//
//               <p className="text-xs text-muted-foreground px-1">
//                 Paste the script tag inside the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> of your page for best results.
//               </p>
//             </>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed rounded-xl text-center p-8 text-muted-foreground">
//               <Code className="h-10 w-10 mb-3 opacity-30" />
//               <p className="font-medium">Schema will appear here</p>
//               <p className="text-sm mt-1">Fill in the form and click Generate</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
