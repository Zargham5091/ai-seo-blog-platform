import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-black bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-3">
        <Button asChild variant="gradient"><Link href="/">Go Home</Link></Button>
        <Button asChild variant="outline"><Link href="/blog">Read Blog</Link></Button>
      </div>
    </div>
  );
}
