import OpenAI from "openai";

// ── Auto-switch: Groq in development, OpenAI in production ───────────────────
const isDev = process.env.NODE_ENV !== "production";

const openai = new OpenAI(
    isDev
        ? {apiKey: process.env.GROQ_API_KEY!, baseURL: "https://api.groq.com/openai/v1"}
        : {apiKey: process.env.OPENAI_API_KEY!}
);

const MODEL = isDev ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

// ─────────────────────────────────────────────────────────────────────────────

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
    readTime?: number;

}

export interface AEOAnalysisResult {
    aeoScore: number;
    geoScore: number;
    citationLikelihood: "high" | "medium" | "low";
    issues: { type: string; message: string; fix: string }[];
    suggestions: string[];
    optimizedSnippets: {
        directAnswer: string;
        featuredSnippet: string;
        faqPairs: { question: string; answer: string }[];
        definitionBlock: string;
    };
    missingEntities: string[];
    structureScore: {
        hasDirectAnswer: boolean;
        hasDefinition: boolean;
        hasExamples: boolean;
        hasFAQ: boolean;
        hasStatistics: boolean;
        hasAuthorInfo: boolean;
    };
}

export interface BacklinkResult {
    url: string;
    domainAuthority: number;
    spamScore: number;
    linkType: "dofollow" | "nofollow" | "unknown";
    anchorText: string;
    industry: string;
    isHighValue: boolean;
    recommendation: string;
}

export interface BacklinkAnalysis {
    targetUrl: string;
    totalEstimated: number;
    highValueCount: number;
    averageDA: number;
    topBacklinks: BacklinkResult[];
    insights: string[];
    outreachTargets: { domain: string; reason: string; contactHint: string }[];
}

export interface RepurposedContent {
    twitter_thread?: string[];
    linkedin_post?: string;
    instagram_caption?: string;
    newsletter?: string;
    facebook_post?: string;
    tiktok_script?: string;
}

export async function generateBlogPost(params: AIBlogGenerationParams): Promise<AIBlogResult> {
    const {topic, keywords, tone = "professional", wordCount = 1000} = params;

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
        model: MODEL,
        messages: [{role: "user", content: prompt}],
        response_format: {type: "json_object"},
        temperature: 0.7,
        max_tokens: 3000,
    });

    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return result as AIBlogResult;
}

export async function generateMetaTags(content: string, keywords: string[]): Promise<{
    metaTitle: string;
    metaDescription: string
}> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{
            role: "user",
            content: `Generate SEO meta tags for this content. Keywords: ${keywords.join(", ")}\n\nContent excerpt: ${content.slice(0, 500)}\n\nReturn JSON: {"metaTitle": "under 60 chars", "metaDescription": "under 160 chars with CTA"}`,
        }],
        response_format: {type: "json_object"},
        temperature: 0.5,
        max_tokens: 200,
    });

    return JSON.parse(response.choices[0].message.content ?? "{}");
}

export async function researchKeywords(
    seed: string,
    count = 10,
    niche?: string
): Promise<{
    keyword: string; searchVolume: number; difficulty: number;
    cpc: number; trend: string; intent: string; relatedKeywords: string[];
}[]> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{
            role: "user",
            content: `Generate ${count} SEO keyword suggestions for: "${seed}"${niche ? ` in the ${niche} niche` : ""}.
                    Return JSON: {
                      "keywords": [{"keyword": "phrase", "searchVolume": number, "difficulty": 0-100, "cpc": number, "trend": "rising|stable|declining", "intent": "informational|commercial|transactional|navigational", "relatedKeywords": ["r1","r2","r3"]}]
                    }
                    Be realistic with estimates. Mix long-tail and short-tail. Mix difficulty levels.`,
        }],
        response_format: {type: "json_object"},
        temperature: 0.6,
        max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return result.keywords ?? [];
}

export async function generateSchemaMarkup(page: {
    title: string;
    description: string;
    type: string;
    url: string
}): Promise<Record<string, unknown>> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{
            role: "user",
            content: `Generate appropriate JSON-LD schema markup for: ${JSON.stringify(page)}. Return only valid JSON-LD object.`,
        }],
        response_format: {type: "json_object"},
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
    const cleanContent = content.replace(/<[^>]*>/g, ""); // strip HTML first
    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;
    const keywordCount = (cleanContent.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), "g")) ?? []).length;
    const keywordDensity = parseFloat(((keywordCount / wordCount) * 100).toFixed(2));

    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{
            role: "user",
            content: `You are an SEO expert. Analyze this content strictly.
                    Target keyword: "${targetKeyword}"
                    Word count: ${wordCount}
                    Keyword density: ${keywordDensity}%
                    
                    Scoring criteria:
                    - Keyword in first 100 words: +15 points
                    - Keyword density between 1-2%: +15 points  
                    - Word count above 1000: +15 points
                    - Clear H2/H3 headings present: +15 points
                    - FAQ section present: +10 points
                    - Conclusion present: +10 points
                    - Natural readable writing: +20 points
                    
                    Content: ${cleanContent.slice(0, 3000)}
                    
                    Return JSON only: {
                      "score": 0-100,
                      "readabilityScore": 0-100,
                      "suggestions": ["up to 5 actionable suggestions"]
                    }`,
        }],
        response_format: {type: "json_object"},
        temperature: 0.3,
        max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return {...result, keywordDensity, wordCount};
}

export async function analyzeAEOContent(
    content: string,
    title: string,
    targetKeyword: string
): Promise<AEOAnalysisResult> {
    const strippedContent = content.replace(/<[^>]*>/g, "").slice(0, 3000);

    const prompt = `You are an Answer Engine Optimization (AEO) expert. Analyze this content for AI search engine citation potential.
                    
                    Title: ${title}
                    Target Keyword: ${targetKeyword}
                    Content: ${strippedContent}
                    
                    Analyze and return a JSON object:
                    {
                      "aeoScore": 0-100 (how likely AI engines will cite this),
                      "geoScore": 0-100 (Generative Engine Optimization score),
                      "citationLikelihood": "high"|"medium"|"low",
                      "issues": [{"type": "string", "message": "string", "fix": "string"}],
                      "suggestions": ["up to 5 specific improvements"],
                      "optimizedSnippets": {
                        "directAnswer": "One clear sentence answering '${targetKeyword}'",
                        "featuredSnippet": "40-60 word paragraph optimized for Google featured snippet",
                        "faqPairs": [{"question": "string", "answer": "string"}],
                        "definitionBlock": "${targetKeyword} is [clear definition]..."
                      },
                      "missingEntities": ["topics/entities missing from content that AI expects"],
                      "structureScore": {
                        "hasDirectAnswer": boolean,
                        "hasDefinition": boolean,
                        "hasExamples": boolean,
                        "hasFAQ": boolean,
                        "hasStatistics": boolean,
                        "hasAuthorInfo": boolean
                      }
                    }
                    
                    Key AEO factors to check:
                    - Does content directly answer the query in first paragraph?
                    - Are there clear definitions?
                    - Is there a FAQ section?
                    - Does it include statistics/data?
                    - Is it structured with clear headings?
                    - Would ChatGPT/Perplexity cite this as an authoritative source?`;

    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{role: "user", content: prompt}],
        response_format: {type: "json_object"},
        temperature: 0.3,
        max_tokens: 1500,
    });

    return JSON.parse(response.choices[0].message.content ?? "{}") as AEOAnalysisResult;
}


export async function analyzeBacklinks(url: string): Promise<BacklinkAnalysis> {
    const prompt = `You are an SEO backlink analysis expert. Analyze the backlink profile for: ${url}

Based on the domain and URL structure, provide a realistic backlink analysis.

Return JSON:
{
  "targetUrl": "${url}",
  "totalEstimated": number (estimated backlinks),
  "highValueCount": number,
  "averageDA": number (0-100),
  "topBacklinks": [
    {
      "url": "https://example.com/page",
      "domainAuthority": number,
      "spamScore": number (0-10),
      "linkType": "dofollow"|"nofollow",
      "anchorText": "example anchor text",
      "industry": "technology|marketing|news|etc",
      "isHighValue": boolean,
      "recommendation": "keep|disavow|monitor"
    }
  ] (5 realistic examples),
  "insights": ["3-5 actionable insights about the backlink profile"],
  "outreachTargets": [
    {
      "domain": "highda-site.com",
      "reason": "why they should link to you",
      "contactHint": "how to find contact"
    }
  ] (3 outreach opportunities)
}`;

    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{role: "user", content: prompt}],
        response_format: {type: "json_object"},
        temperature: 0.4,
        max_tokens: 1200,
    });

    return JSON.parse(response.choices[0].message.content ?? "{}") as BacklinkAnalysis;
}


export async function repurposeContent(
    content: string,
    title: string,
    formats: string[],
    tone: string = "professional",
    brandName?: string
): Promise<RepurposedContent> {
    const brand = brandName ? `Brand: ${brandName}. ` : "";
    const strippedContent = content.replace(/<[^>]*>/g, "").slice(0, 2000);

    const formatInstructions = formats.map((f) => {
        switch (f) {
            case "twitter_thread":
                return `"twitter_thread": array of 5-8 tweets, each max 280 chars. Start with a hook. End with a CTA.`;
            case "linkedin_post":
                return `"linkedin_post": 150-300 word professional post with line breaks, 3 relevant hashtags at end.`;
            case "instagram_caption":
                return `"instagram_caption": engaging 100-150 word caption with emojis, 10 relevant hashtags at end.`;
            case "newsletter":
                return `"newsletter": 200-300 word email newsletter excerpt with subject line at top as "Subject: ...".`;
            case "facebook_post":
                return `"facebook_post": conversational 100-200 word post, end with a question to drive engagement.`;
            case "tiktok_script":
                return `"tiktok_script": 150-200 word spoken script for a 60s TikTok video. Include [PAUSE], [SHOW TEXT], [B-ROLL] cues.`;
            default:
                return "";
        }
    }).join("\n");

    const prompt = `You are a social media content expert. ${brand}
Repurpose this blog post into multiple formats. Use a ${tone} tone.

Blog Title: ${title}
Blog Content: ${strippedContent}

Create ONLY these formats (return as JSON object):
${formatInstructions}

Return ONLY a valid JSON object with exactly the keys specified above. No extra text.`;

    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{role: "user", content: prompt}],
        response_format: {type: "json_object"},
        temperature: 0.8,
        max_tokens: 2000,
    });

    return JSON.parse(response.choices[0].message.content ?? "{}") as RepurposedContent;
}

export async function generateInternalLinkSuggestions(content: string, existingPosts: string[]): Promise<{
    anchor: string;
    suggestedSlug: string;
    context: string
}[]> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{
            role: "user",
            content: `Suggest internal linking opportunities in this content.\n\nContent: ${content.slice(0, 800)}\n\nExisting posts: ${existingPosts.slice(0, 10).join(", ")}\n\nReturn JSON array: [{"anchor": "link text", "suggestedSlug": "post-slug", "context": "surrounding sentence"}]. Max 5 suggestions.`,
        }],
        response_format: {type: "json_object"},
        temperature: 0.5,
        max_tokens: 400,
    });

    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return result.suggestions ?? result ?? [];
}

export async function generateEmailContent(
    subject: string,
    tone: string,
    purpose: string
): Promise<{ subject: string; htmlContent: string; previewText: string }> {
    const prompt = `Write a ${tone} ${purpose} email. Subject: "${subject}"

RETURN ONLY VALID JSON with this exact structure:
{
  "subject": "Enhanced subject line",
  "previewText": "40-60 char preview",
  "htmlContent": "FULL HTML WITH INLINE STYLES"
}

CRITICAL: The htmlContent MUST include these inline styles exactly as shown:

<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 30px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">SUBJECT_HERE</h1>
  </div>
  <div style="padding: 30px 20px; background: white;">
    <p style="margin-bottom: 16px; line-height: 1.5;">Hi {name},</p>
    <p style="margin-bottom: 16px; line-height: 1.5;">Write 2-3 engaging paragraphs about ${subject}.</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Point 1</li>
      <li style="margin-bottom: 8px;">Point 2</li>
      <li style="margin-bottom: 8px;">Point 3</li>
    </ul>
    <a href="#" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">Read More →</a>
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0;">Follow us: Twitter | Facebook | Instagram</p>
    <p style="margin: 8px 0 0;">© ${new Date().getFullYear()} SEO Platform. All rights reserved.</p>
  </div>
</div>

Write specific content about: ${subject}
Keep it ${tone} tone.
Make the content interesting and detailed.
Replace SUBJECT_HERE with actual subject.

Return ONLY valid JSON. No explanations.`;

    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{role: "user", content: prompt}],
        response_format: {type: "json_object"},
        temperature: 0.3, // Lowered from 0.8 to enforce formatting
        max_tokens: 2500,
    });

    return JSON.parse(response.choices[0].message.content ?? "{}");
}

// export async function generateEmailContent(
//     subject: string,
//     tone: string,
//     purpose: string
// ): Promise<{ subject: string; htmlContent: string; previewText: string }> {
//     const prompt = `You are an expert email marketer. Write a ${tone} ${purpose} email with this subject line: "${subject}"
//
// Return a JSON object:
// {
//   "subject": "Optimized subject line",
//   "previewText": "40-60 character preview text",
//   "htmlContent": "HTML email body with inline styles"
// }
//
// CRITICAL REQUIREMENTS for htmlContent:
// - Use inline styles ONLY (no classes, no CSS files)
// - Add proper spacing: margin-bottom, padding
// - Style the button with: background:#4F46E5, color:white, padding:12px 24px, border-radius:8px, text-decoration:none, display:inline-block
// - Style list items with margin-bottom:8px
// - Wrap everything in a container with max-width:600px, margin:0 auto
// - Use a clean font-family: Arial, sans-serif
// - Add a subtle border or background for the main content area
// - Make it mobile responsive
// - Add social media links placeholder
//
// Example structure:
// <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//   <div style="background: linear-gradient(135deg, #4F46E5, #0EA5E9); padding: 30px; text-align: center; color: white;">
//     <h1 style="margin: 0;">${subject}</h1>
//   </div>
//   <div style="padding: 30px;">
//     <p>Hi {name},</p>
//     <p>Your content here...</p>
//     <a href="#" style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0;">Read More →</a>
//   </div>
//   <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
//     <p>© ${new Date().getFullYear()} SEO Platform. All rights reserved.</p>
//   </div>
// </div>
//
// Make it look professional, visually appealing, and email-client friendly.
// Return ONLY valid JSON. No extra text.`;
//
//     const response = await openai.chat.completions.create({
//         model: MODEL,
//         messages: [{role: "user", content: prompt}],
//         response_format: {type: "json_object"},
//         temperature: 0.8,
//         max_tokens: 2000,
//     });
//
//     return JSON.parse(response.choices[0].message.content ?? "{}");
// }

// export async function generateEmailContent(
//     subject: string,
//     tone: string,
//     purpose: string
// ): Promise<{ subject: string; htmlContent: string; previewText: string }> {
//     const prompt = `You are an expert email marketer. Write a ${tone} ${purpose} email with this subject line: "${subject}"
//
// Return a JSON object:
// {
//   "subject": "Optimized subject line (keep original or enhance slightly)",
//   "previewText": "40-60 character preview text that makes people want to open",
//   "htmlContent": "Clean HTML email body with proper formatting"
// }
//
// Requirements for htmlContent:
// - Use simple HTML tags: <h2>, <p>, <ul>, <li>, <a href="#">
// - Include a clear CTA button as <a class="btn" href="#">Click Here</a>
// - Keep paragraphs short and scannable
// - Add {name} placeholder for personalization
// - NO CSS styles, NO inline styles, NO tables
// - Just semantic HTML that can be pasted into any email editor
// - Include a simple signature with "-- Team" at the end
//
// Example format:
// <h2>Welcome!</h2>
// <p>Hi {name},</p>
// <p>Short paragraph here...</p>
// <a href="#">Read More →</a>
// <p>Best regards,<br/>The Team</p>
//
// Return ONLY valid JSON. No extra text.`;
//
//     const response = await openai.chat.completions.create({
//         model: MODEL,
//         messages: [{role: "user", content: prompt}],
//         response_format: {type: "json_object"},
//         temperature: 0.8,
//         max_tokens: 1500,
//     });
//
//     return JSON.parse(response.choices[0].message.content ?? "{}");
// }

// export async function generateEmailContent(
//     subject: string,
//     tone: string,
//     purpose: string
// ): Promise<{ subject: string; htmlContent: string; previewText: string }> {
//     const prompt = `You are an expert email marketer. Write a ${tone} ${purpose} email with this subject line: "${subject}"
//
// Return a JSON object:
// {
//   "subject": "Optimized subject line (keep original or enhance slightly)",
//   "previewText": "40-60 character preview text that makes people want to open",
//   "htmlContent": "Full HTML email body with proper formatting, headings, buttons, and clear CTA"
// }
//
// Requirements:
// - Use modern email HTML (table-based or simple divs with inline styles)
// - Include a clear call-to-action button
// - Keep paragraphs short and scannable
// - Add personalization placeholder like {name}
// - Mobile responsive
// - Professional signature at bottom
//
// Return ONLY valid JSON. No extra text.`;
//
//     const response = await openai.chat.completions.create({
//         model: MODEL,
//         messages: [{role: "user", content: prompt}],
//         response_format: {type: "json_object"},
//         temperature: 0.8,
//         max_tokens: 1500,
//     });
//
//     return JSON.parse(response.choices[0].message.content ?? "{}");
// }


// import OpenAI from "openai";
//
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//
// export interface AIBlogGenerationParams {
//   topic: string;
//   keywords: string[];
//   tone?: string;
//   wordCount?: number;
//   language?: string;
// }
//
// export interface AIBlogResult {
//   title: string;
//   slug: string;
//   excerpt: string;
//   content: string;
//   metaTitle: string;
//   metaDescription: string;
//   tags: string[];
//   outline: string[];
// }
//
// export async function generateBlogPost(params: AIBlogGenerationParams): Promise<AIBlogResult> {
//   const { topic, keywords, tone = "professional", wordCount = 1000 } = params;
//
//   const prompt = `Generate a complete SEO-optimized blog post with the following specifications:
// Topic: ${topic}
// Target Keywords: ${keywords.join(", ")}
// Tone: ${tone}
// Target Word Count: ${wordCount} words
//
// Return a JSON object with these exact fields:
// {
//   "title": "Engaging H1 title with primary keyword",
//   "slug": "url-friendly-slug",
//   "excerpt": "Compelling meta excerpt under 160 chars",
//   "content": "Full HTML blog content with proper heading hierarchy (H2, H3), paragraphs, and natural keyword integration",
//   "metaTitle": "SEO meta title under 60 chars",
//   "metaDescription": "Meta description under 160 chars with call-to-action",
//   "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
//   "outline": ["Section 1", "Section 2", "Section 3"]
// }
//
// Requirements:
// - Natural keyword density (1-2%)
// - Engaging introduction and conclusion
// - Proper HTML tags (h2, h3, p, ul, li, strong, em)
// - Include internal linking placeholders [INTERNAL_LINK: anchor text]
// - Include at least one FAQ section
// - Schema-ready FAQ format`;
//
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{ role: "user", content: prompt }],
//     response_format: { type: "json_object" },
//     temperature: 0.7,
//     max_tokens: 3000,
//   });
//
//   const result = JSON.parse(response.choices[0].message.content ?? "{}");
//   return result as AIBlogResult;
// }
//
// export async function generateMetaTags(content: string, keywords: string[]): Promise<{ metaTitle: string; metaDescription: string }> {
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{
//       role: "user",
//       content: `Generate SEO meta tags for this content. Keywords: ${keywords.join(", ")}\n\nContent excerpt: ${content.slice(0, 500)}\n\nReturn JSON: {"metaTitle": "under 60 chars", "metaDescription": "under 160 chars with CTA"}`,
//     }],
//     response_format: { type: "json_object" },
//     temperature: 0.5,
//     max_tokens: 200,
//   });
//
//   return JSON.parse(response.choices[0].message.content ?? "{}");
// }
//
// export async function researchKeywords(seed: string, count = 10): Promise<{ keyword: string; searchVolume: number; difficulty: number; cpc: number; trend: string }[]> {
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{
//       role: "user",
//       content: `Generate ${count} SEO keyword suggestions for: "${seed}". Return JSON array: [{"keyword": "exact phrase", "searchVolume": estimated_monthly_searches, "difficulty": 0-100, "cpc": estimated_usd, "trend": "up|down|stable"}]. Be realistic with estimates.`,
//     }],
//     response_format: { type: "json_object" },
//     temperature: 0.6,
//     max_tokens: 1000,
//   });
//
//   const result = JSON.parse(response.choices[0].message.content ?? "{}");
//   return result.keywords ?? result ?? [];
// }
//
// export async function generateSchemaMarkup(page: { title: string; description: string; type: string; url: string }): Promise<Record<string, unknown>> {
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{
//       role: "user",
//       content: `Generate appropriate JSON-LD schema markup for: ${JSON.stringify(page)}. Return only valid JSON-LD object.`,
//     }],
//     response_format: { type: "json_object" },
//     temperature: 0.3,
//     max_tokens: 500,
//   });
//
//   return JSON.parse(response.choices[0].message.content ?? "{}");
// }
//
// export async function analyzeSEOContent(content: string, targetKeyword: string): Promise<{
//   score: number;
//   readabilityScore: number;
//   suggestions: string[];
//   keywordDensity: number;
//   wordCount: number;
// }> {
//   const wordCount = content.split(/\s+/).length;
//   const keywordCount = (content.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), "g")) ?? []).length;
//   const keywordDensity = parseFloat(((keywordCount / wordCount) * 100).toFixed(2));
//
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{
//       role: "user",
//       content: `Analyze this content for SEO quality. Target keyword: "${targetKeyword}". Word count: ${wordCount}. Keyword density: ${keywordDensity}%.\n\nContent: ${content.slice(0, 1000)}\n\nReturn JSON: {"score": 0-100, "readabilityScore": 0-100, "suggestions": ["up to 5 actionable suggestions"]}`,
//     }],
//     response_format: { type: "json_object" },
//     temperature: 0.3,
//     max_tokens: 500,
//   });
//
//   const result = JSON.parse(response.choices[0].message.content ?? "{}");
//   return { ...result, keywordDensity, wordCount };
// }
//
// export async function generateInternalLinkSuggestions(content: string, existingPosts: string[]): Promise<{ anchor: string; suggestedSlug: string; context: string }[]> {
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{
//       role: "user",
//       content: `Suggest internal linking opportunities in this content.\n\nContent: ${content.slice(0, 800)}\n\nExisting posts: ${existingPosts.slice(0, 10).join(", ")}\n\nReturn JSON array: [{"anchor": "link text", "suggestedSlug": "post-slug", "context": "surrounding sentence"}]. Max 5 suggestions.`,
//     }],
//     response_format: { type: "json_object" },
//     temperature: 0.5,
//     max_tokens: 400,
//   });
//
//   const result = JSON.parse(response.choices[0].message.content ?? "{}");
//   return result.suggestions ?? result ?? [];
// }
