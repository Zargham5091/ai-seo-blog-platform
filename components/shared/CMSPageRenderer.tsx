import { connectDB } from "@/lib/db";
import CMSPageModel from "@/models/CMSPage";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface CMSPageData {
  title: string;
  content: string;
  isPublished: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

export async function getCMSPage(slug: string): Promise<CMSPageData | null> {
  try {
    await connectDB();
    const page = await CMSPageModel.findOne({ slug, isPublished: true }).lean();
    if (!page) return null;
    return page as CMSPageData;
  } catch {
    return null;
  }
}

export async function generateCMSMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  const page = await getCMSPage(slug);
  if (!page) return { title: fallbackTitle };
  return {
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription,
    keywords: page.seo?.keywords,
    openGraph: {
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription,
      images: page.seo?.ogImage ? [page.seo.ogImage] : [],
    },
  };
}

interface CMSPageRendererProps {
  slug: string;
  fallbackTitle: string;
  fallbackContent: string;
  headerGradient?: string;
}

export async function CMSPageRenderer({ slug, fallbackTitle, fallbackContent, headerGradient = "from-indigo-600 to-sky-500" }: CMSPageRendererProps) {
  const page = await getCMSPage(slug);
  const title = page?.title || fallbackTitle;
  const content = page?.content || fallbackContent;

  return (
    <div className="py-16">
      {/* Hero header */}
      <div className={`bg-gradient-to-br ${headerGradient} text-white py-16 mb-12`}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl">
        {content ? (
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-code:bg-muted prose-code:rounded prose-code:px-1
              prose-pre:bg-zinc-950 prose-blockquote:border-l-indigo-500
              prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">This page is being prepared. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
