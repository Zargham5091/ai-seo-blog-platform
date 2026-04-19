import { useEffect, useRef, useState } from "react";
import { useBlogEditorStore } from "@/store/blog-editor";

export function useAutoSave(initialBlogId: string | null, intervalMs = 30000) {
  const store = useBlogEditorStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Track the real blog ID — starts from URL param, gets set after first POST
  const [blogId, setBlogId] = useState<string | null>(initialBlogId);

  const save = async (): Promise<string | null> => {
    if (!store.isDirty || store.isSaving) return blogId;
    if (!store.title.trim()) return blogId; // don't save empty posts

    store.setIsSaving(true);
    try {
      const payload = {
        title: store.title,
        slug: store.slug,
        excerpt: store.excerpt,
        content: store.content,
        blocks: store.blocks,
        coverImage: store.coverImage,
        tags: store.tags,
        categories: store.categories,
        seo: store.seo,
        status: store.status,
      };

      // If we have an ID → PUT (update). If not → POST (create once)
      const url = blogId ? `/api/blog/${blogId}` : "/api/blog";
      const method = blogId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        store.setLastSaved(new Date());
        // If this was a new post, save the returned ID so all future saves use PUT
        if (!blogId && data.data?._id) {
          const newId = data.data._id.toString();
          setBlogId(newId);
          // Update browser URL without page reload so refresh doesn't create another
          window.history.replaceState(null, "", `/dashboard/admin/blogs/${newId}`);
          return newId;
        }
      }
    } catch {
      // Silent fail — don't show error for background auto-saves
    } finally {
      store.setIsSaving(false);
    }
    return blogId;
  };

  // Auto-save on a debounced timer whenever content changes
  useEffect(() => {
    if (!store.isDirty || !store.title.trim()) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, intervalMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isDirty, store.content, store.title, store.blocks, store.excerpt]);

  return {
    save,
    blogId,
    setBlogId,
    isSaving: store.isSaving,
    lastSaved: store.lastSaved,
  };
}

// import { useEffect, useRef } from "react";
// import { useBlogEditorStore } from "@/store/blog-editor";
//
// export function useAutoSave(blogId: string | null, intervalMs = 30000) {
//   const store = useBlogEditorStore();
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//
//   const save = async () => {
//     if (!store.isDirty || store.isSaving) return;
//     store.setIsSaving(true);
//     try {
//       const payload = {
//         title: store.title,
//         slug: store.slug,
//         excerpt: store.excerpt,
//         content: store.content,
//         blocks: store.blocks,
//         coverImage: store.coverImage,
//         tags: store.tags,
//         categories: store.categories,
//         seo: store.seo,
//         status: store.status,
//       };
//
//       const url = blogId ? `/api/blog/${blogId}` : "/api/blog";
//       const method = blogId ? "PUT" : "POST";
//
//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (data.success) {
//         store.setLastSaved(new Date());
//       }
//     } catch {
//       // Silent fail for auto-save
//     } finally {
//       store.setIsSaving(false);
//     }
//   };
//
//   useEffect(() => {
//     if (!store.isDirty) return;
//     timerRef.current = setTimeout(save, intervalMs);
//     return () => {
//       if (timerRef.current) clearTimeout(timerRef.current);
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [store.isDirty, store.content, store.title, store.blocks]);
//
//   return { save, isSaving: store.isSaving, lastSaved: store.lastSaved };
// }
