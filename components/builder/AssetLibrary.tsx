'use client';

/**
 * components/builder/AssetLibrary.tsx
 *
 * Searchable Unsplash image browser for the site builder.
 * User searches → picks image → URL is returned to the calling prop field.
 *
 * Uses Unsplash Source API (no auth required for display, free tier).
 * For production volume, use the official Unsplash API with your key.
 *
 * ALSO NEEDS: app/api/assets/unsplash/route.ts (provided below as separate file)
 *
 * USAGE — called from ImagePropField in page.tsx when user clicks "Browse Library":
 *   <AssetLibrary onSelect={(url) => onChange(url)} onClose={() => setShowLibrary(false)} />
 *
 * OR as a right panel tab: add rightPanel === 'assets' case.
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import {Search, X, Loader2, Download} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UnsplashPhoto {
    id: string;
    urls: { small: string; regular: string; full: string };
    alt_description: string | null;
    user: { name: string; links: { html: string } };
}

interface AssetLibraryProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AssetLibrary({onSelect, onClose}: AssetLibraryProps) {
    const [query, setQuery] = useState('');
    const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = useCallback(async (q: string, pageNum: number, append = false) => {
        if (!q.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/assets/unsplash?q=${encodeURIComponent(q.trim())}&page=${pageNum}`);
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error ?? 'Search failed');
            if (append) {
                setPhotos(prev => [...prev, ...data.results]);
            } else {
                setPhotos(data.results ?? []);
            }
            setHasMore(data.hasMore ?? false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search as user types
    useEffect(() => {
        if (!query.trim()) {
            setPhotos([]);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            search(query, 1, false);
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, search]);

    function handleSelect(photo: UnsplashPhoto) {
        setSelectedId(photo.id);
        // Use regular (1080px) size — good balance of quality and load time
        onSelect(photo.urls.regular);
    }

    function loadMore() {
        const next = page + 1;
        setPage(next);
        search(query, next, true);
    }

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <p className="font-semibold text-sm">Image Library</p>
                <button onClick={onClose} className="p-1 rounded hover:bg-muted">
                    <X className="h-4 w-4"/>
                </button>
            </div>

            {/* Search input */}
            <div className="px-3 py-2 border-b shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground"/>
                    <input
                        type="search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search photos…"
                        autoFocus
                        className="w-full h-9 pl-8 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-3">
                {!query.trim() && (
                    <div
                        className="flex flex-col items-center justify-center h-32 text-center text-sm text-muted-foreground gap-2">
                        <Search className="h-6 w-6 opacity-30"/>
                        <p>Search for images above</p>
                        <p className="text-xs opacity-60">Photos from Unsplash</p>
                    </div>
                )}

                {loading && photos.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500"/>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-red-500 text-center py-4">{error}</p>
                )}

                {photos.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            {photos.map(photo => (
                                <button
                                    key={photo.id}
                                    onClick={() => handleSelect(photo)}
                                    className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                                        selectedId === photo.id ? 'border-indigo-500' : 'border-transparent hover:border-indigo-300'
                                    }`}
                                >
                                    <img
                                        src={photo.urls.small}
                                        alt={photo.alt_description ?? photo.user.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {selectedId === photo.id && (
                                        <div
                                            className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                            <div
                                                className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">Selected
                                            </div>
                                        </div>
                                    )}
                                    {/* Photo credit on hover */}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={`${photo.user.links.html}?utm_source=sitecraft&utm_medium=referral`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="text-white text-[10px] hover:underline"
                                        >
                                            {photo.user.name}
                                        </a>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {hasMore && (
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="w-full mt-3 py-2 text-xs font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin"/> :
                                    <Download className="h-3 w-3"/>}
                                Load more
                            </button>
                        )}

                        <p className="text-[10px] text-center text-muted-foreground mt-3">
                            Photos from{' '}
                            <a href="https://unsplash.com?utm_source=sitecraft&utm_medium=referral" target="_blank"
                               rel="noopener noreferrer" className="underline">
                                Unsplash
                            </a>
                        </p>
                    </>
                )}

                {query.trim() && !loading && photos.length === 0 && !error && (
                    <p className="text-sm text-center text-muted-foreground py-8">No results for "{query}"</p>
                )}
            </div>

            {/* Use selected button */}
            {selectedId && (
                <div className="px-3 py-2 border-t shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Use selected image
                    </button>
                </div>
            )}
        </div>
    );
}