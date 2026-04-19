import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIBlogGenerationParams {
  topic: string;
  keywords: string[];
  tone?: string;
  wordCount?: number;
  language?: string;
}

export interface AIBlogResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  outline: string[];
}

export async function generateBlogPost(params: AIBlogGenerationParams): Promise<AIBlogResult> {
  const { topic, keywords, tone = "professional", wordCount = 1000 } = params;

  const prompt = `Generate a complete SEO-optimized blog post with the following specifications:
Topic: ${topic}
Target Keywords: ${keywords.join(", ")}
Tone: ${tone}
Target Word Count: ${wordCount} words

Return a JSON object with these exact fields:
{
  "title": "Engaging H1 title with primary keyword",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling meta excerpt under 160 chars",
  "content": "Full HTML blog content with proper heading hierarchy (H2, H3), paragraphs, and natural keyword integration",
  "metaTitle": "SEO meta title under 60 chars",
  "metaDescription": "Meta description under 160 chars with call-to-action",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "outline": ["Section 1", "Section 2", "Section 3"]
}

Requirements:
- Natural keyword density (1-2%)
- Engaging introduction and conclusion
- Proper HTML tags (h2, h3, p, ul, li, strong, em)
- Include internal linking placeholders [INTERNAL_LINK: anchor text]
- Include at least one FAQ section
- Schema-ready FAQ format`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 3000,
  });

  const result = JSON.parse(response.choices[0].message.content ?? "{}");
  return result as AIBlogResult;
}

export async function generateMetaTags(content: string, keywords: string[]): Promise<{ metaTitle: string; metaDescription: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Generate SEO meta tags for this content. Keywords: ${keywords.join(", ")}\n\nContent excerpt: ${content.slice(0, 500)}\n\nReturn JSON: {"metaTitle": "under 60 chars", "metaDescription": "under 160 chars with CTA"}`,
    }],
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 200,
  });

  return JSON.parse(response.choices[0].message.content ?? "{}");
}

export async function researchKeywords(seed: string, count = 10): Promise<{ keyword: string; searchVolume: number; difficulty: number; cpc: number; trend: string }[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Generate ${count} SEO keyword suggestions for: "${seed}". Return JSON array: [{"keyword": "exact phrase", "searchVolume": estimated_monthly_searches, "difficulty": 0-100, "cpc": estimated_usd, "trend": "up|down|stable"}]. Be realistic with estimates.`,
    }],
    response_format: { type: "json_object" },
    temperature: 0.6,
    max_tokens: 1000,
  });

  const result = JSON.parse(response.choices[0].message.content ?? "{}");
  return result.keywords ?? result ?? [];
}

export async function generateSchemaMarkup(page: { title: string; description: string; type: string; url: string }): Promise<Record<string, unknown>> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Generate appropriate JSON-LD schema markup for: ${JSON.stringify(page)}. Return only valid JSON-LD object.`,
    }],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content ?? "{}");
}

export async function analyzeSEOContent(content: string, targetKeyword: string): Promise<{
  score: number;
  readabilityScore: number;
  suggestions: string[];
  keywordDensity: number;
  wordCount: number;
}> {
  const wordCount = content.split(/\s+/).length;
  const keywordCount = (content.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), "g")) ?? []).length;
  const keywordDensity = parseFloat(((keywordCount / wordCount) * 100).toFixed(2));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Analyze this content for SEO quality. Target keyword: "${targetKeyword}". Word count: ${wordCount}. Keyword density: ${keywordDensity}%.\n\nContent: ${content.slice(0, 1000)}\n\nReturn JSON: {"score": 0-100, "readabilityScore": 0-100, "suggestions": ["up to 5 actionable suggestions"]}`,
    }],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 500,
  });

  const result = JSON.parse(response.choices[0].message.content ?? "{}");
  return { ...result, keywordDensity, wordCount };
}

export async function generateInternalLinkSuggestions(content: string, existingPosts: string[]): Promise<{ anchor: string; suggestedSlug: string; context: string }[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Suggest internal linking opportunities in this content.\n\nContent: ${content.slice(0, 800)}\n\nExisting posts: ${existingPosts.slice(0, 10).join(", ")}\n\nReturn JSON array: [{"anchor": "link text", "suggestedSlug": "post-slug", "context": "surrounding sentence"}]. Max 5 suggestions.`,
    }],
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 400,
  });

  const result = JSON.parse(response.choices[0].message.content ?? "{}");
  return result.suggestions ?? result ?? [];
}
