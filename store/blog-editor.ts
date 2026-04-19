import { create } from "zustand";
import { IBlogBlock, BlogStatus } from "@/types";

interface BlogSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  seoScore: number;
  readabilityScore: number;
}

interface BlogEditorState {
  // Content
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  blocks: IBlogBlock[];
  coverImage: string;
  tags: string[];
  categories: string[];
  status: BlogStatus;
  scheduledAt: string;
  seo: BlogSEO;
  // UI state
  isDirty: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  lastSaved: Date | null;
  activeBlockId: string | null;
  previewMode: boolean;
  seoPanelOpen: boolean;
  // Actions
  setTitle: (title: string) => void;
  setSlug: (slug: string) => void;
  setExcerpt: (excerpt: string) => void;
  setContent: (content: string) => void;
  setBlocks: (blocks: IBlogBlock[]) => void;
  addBlock: (block: IBlogBlock) => void;
  updateBlock: (id: string, content: Record<string, unknown>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (blocks: IBlogBlock[]) => void;
  setCoverImage: (url: string) => void;
  setTags: (tags: string[]) => void;
  setCategories: (categories: string[]) => void;
  setStatus: (status: BlogStatus) => void;
  setScheduledAt: (date: string) => void;
  setSEO: (seo: Partial<BlogSEO>) => void;
  setIsDirty: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
  setIsGenerating: (v: boolean) => void;
  setLastSaved: (date: Date) => void;
  setActiveBlockId: (id: string | null) => void;
  togglePreviewMode: () => void;
  toggleSEOPanel: () => void;
  reset: () => void;
  hydrate: (data: Partial<BlogEditorState>) => void;
}

const defaultSEO: BlogSEO = {
  metaTitle: "",
  metaDescription: "",
  keywords: [],
  seoScore: 0,
  readabilityScore: 0,
};

export const useBlogEditorStore = create<BlogEditorState>((set) => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  blocks: [],
  coverImage: "",
  tags: [],
  categories: [],
  status: "draft",
  scheduledAt: "",
  seo: defaultSEO,
  isDirty: false,
  isSaving: false,
  isGenerating: false,
  lastSaved: null,
  activeBlockId: null,
  previewMode: false,
  seoPanelOpen: false,

  setTitle: (title) => set({ title, isDirty: true }),
  setSlug: (slug) => set({ slug, isDirty: true }),
  setExcerpt: (excerpt) => set({ excerpt, isDirty: true }),
  setContent: (content) => set({ content, isDirty: true }),
  setBlocks: (blocks) => set({ blocks, isDirty: true }),
  addBlock: (block) => set((s) => ({ blocks: [...s.blocks, block], isDirty: true })),
  updateBlock: (id, content) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, content } : b)),
      isDirty: true,
    })),
  removeBlock: (id) =>
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
      isDirty: true,
    })),
  reorderBlocks: (blocks) => set({ blocks, isDirty: true }),
  setCoverImage: (coverImage) => set({ coverImage, isDirty: true }),
  setTags: (tags) => set({ tags, isDirty: true }),
  setCategories: (categories) => set({ categories, isDirty: true }),
  setStatus: (status) => set({ status, isDirty: true }),
  setScheduledAt: (scheduledAt) => set({ scheduledAt, isDirty: true }),
  setSEO: (seo) => set((s) => ({ seo: { ...s.seo, ...seo }, isDirty: true })),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setLastSaved: (lastSaved) => set({ lastSaved, isDirty: false }),
  setActiveBlockId: (activeBlockId) => set({ activeBlockId }),
  togglePreviewMode: () => set((s) => ({ previewMode: !s.previewMode })),
  toggleSEOPanel: () => set((s) => ({ seoPanelOpen: !s.seoPanelOpen })),
  reset: () =>
    set({
      title: "", slug: "", excerpt: "", content: "", blocks: [],
      coverImage: "", tags: [], categories: [], status: "draft",
      scheduledAt: "", seo: defaultSEO, isDirty: false, isSaving: false,
      isGenerating: false, lastSaved: null, activeBlockId: null,
      previewMode: false, seoPanelOpen: false,
    }),
  hydrate: (data) => set((s) => ({ ...s, ...data, isDirty: false })),
}));
