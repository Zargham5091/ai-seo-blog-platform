// Re-uses the same editor component. The [id] editor handles isNew detection.
export { default } from "@/app/(dashboard)/dashboard/admin/blogs/[id]/page";

// "use client";
// // /dashboard/admin/blogs/new → reuse the [id] editor with "new" as param
// import { useSearchParams } from "next/navigation";
// import BlogEditorPage from "@/app/(dashboard)/dashboard/admin/blogs/[id]/page";
//
// export default function NewBlogPage() {
//   return <BlogEditorPage />;
// }
