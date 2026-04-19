import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "SEO Platform — AI-Powered SEO & Blog Builder", template: "%s | SEO Platform" },
  description: "Enterprise-grade AI-powered SEO platform. Generate content, research keywords, optimize rankings, and publish with our drag-and-drop blog builder.",
  keywords: ["SEO", "AI content generation", "blog builder", "keyword research", "content optimization"],
  authors: [{ name: "SEO Platform" }],
  creator: "SEO Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SEO Platform",
    title: "SEO Platform — AI-Powered SEO & Blog Builder",
    description: "Enterprise-grade AI-powered SEO platform with drag-and-drop blog builder.",
  },
  twitter: { card: "summary_large_image", title: "SEO Platform", description: "AI-Powered SEO & Blog Builder" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
