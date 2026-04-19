import Link from "next/link";
import { Layers } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-600 flex-col justify-between p-12 text-white">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Layers className="h-4 w-4 text-white" />
          </div>
          SEO Platform
        </Link>
        <div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Supercharge your SEO with the power of AI
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Generate optimized content, research keywords, and publish beautiful blogs — all powered by artificial intelligence.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { value: "10x", label: "Faster content" },
              { value: "85%", label: "SEO improvement" },
              { value: "50+", label: "SEO checks" },
              { value: "Free", label: "To start" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-indigo-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-sm">© {new Date().getFullYear()} SEO Platform. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 font-bold text-lg mb-8">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500">
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">SEO Platform</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
