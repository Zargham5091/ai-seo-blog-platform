"use client";
import {useEffect, useState, useRef} from "react";
import {Upload, Trash2, Copy, Check, Image as ImageIcon, Loader2, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {ConfirmDialog} from "@/components/shared/ConfirmDialog";

interface MediaItem {
    id: string;
    url: string;
    width: number;
    height: number;
    size: number;
    format: string;
    name: string;
    createdAt: string;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function MediaPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [selected, setSelected] = useState<MediaItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const fetchMedia = async (cursor?: string) => {
        if (!cursor) setIsLoading(true);
        const url = cursor ? `/api/media?cursor=${cursor}` : "/api/media";
        const res = await fetch(url);
        const d = await res.json();
        if (d.success) {
            setMedia((prev) => cursor ? [...prev, ...d.data.media] : d.data.media);
            setNextCursor(d.data.nextCursor);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const upload = async (files: FileList) => {
        setIsUploading(true);
        setUploadError("");
        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/media", {method: "POST", body: fd});
            const d = await res.json();
            if (!d.success) {
                setUploadError(d.error);
                break;
            }
        }
        await fetchMedia();
        setIsUploading(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        await fetch("/api/media", {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({id: deleteId}),
        });
        setMedia((prev) => prev.filter((m) => m.id !== deleteId));
        if (selected?.id === deleteId) setSelected(null);
        setDeleteId(null);
        setIsDeleting(false);
    };

    const copyUrl = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Media Library</h1>
                    <p className="text-muted-foreground text-sm">Upload and manage your images</p>
                </div>
                <Button variant="gradient" className="gap-2" onClick={() => fileRef.current?.click()}
                        isLoading={isUploading}>
                    <Upload className="h-4 w-4"/> {isUploading ? "Uploading..." : "Upload"}
                </Button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && upload(e.target.files)}
                />
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    upload(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" : "border-border hover:border-indigo-300 hover:bg-muted/20"}`}
                onClick={() => fileRef.current?.click()}
            >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                <p className="text-sm font-medium">Drop images here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP, GIF, SVG · Max 10MB</p>
            </div>

            {uploadError && (
                <div
                    className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 flex items-center gap-2">
                    <X className="h-4 w-4 shrink-0"/> {uploadError}
                </div>
            )}

            <div className="grid lg:grid-cols-4 gap-4">
                {/* Grid */}
                <div className="lg:col-span-3">
                    {isLoading ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {[...Array(12)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-xl"/>)}
                        </div>
                    ) : media.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mb-3 opacity-20"/>
                            <p className="font-medium">No media uploaded yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {media.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelected(item)}
                                        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selected?.id === item.id ? "border-indigo-500 shadow-md shadow-indigo-500/20" : "border-transparent hover:border-indigo-200"}`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover"/>
                                        <div
                                            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"/>
                                    </div>
                                ))}
                            </div>
                            {nextCursor && (
                                <Button variant="outline" className="w-full mt-4"
                                        onClick={() => fetchMedia(nextCursor)}>
                                    Load More
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {/* Detail panel */}
                <div>
                    {selected ? (
                        <Card className="sticky top-24">
                            <CardContent className="p-4 space-y-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={selected.url} alt={selected.name}
                                     className="w-full rounded-lg object-cover max-h-48"/>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold truncate">{selected.name}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <Badge variant="secondary"
                                               className="text-xs">{selected.format.toUpperCase()}</Badge>
                                        <Badge variant="secondary"
                                               className="text-xs">{selected.width}×{selected.height}</Badge>
                                        <Badge variant="secondary"
                                               className="text-xs">{formatBytes(selected.size)}</Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-2"
                                        onClick={() => copyUrl(selected.url, selected.id)}
                                    >
                                        {copiedId === selected.id
                                            ? <><Check className="h-3.5 w-3.5 text-emerald-500"/> Copied!</>
                                            : <><Copy className="h-3.5 w-3.5"/> Copy URL</>}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                                        onClick={() => setDeleteId(selected.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/> Delete
                                    </Button>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Direct URL</p>
                                    <p className="text-xs bg-muted rounded p-2 break-all font-mono">{selected.url}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div
                            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                            <ImageIcon className="h-6 w-6 mb-2 opacity-30"/>
                            Select an image
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(o) => !o && setDeleteId(null)}
                title="Delete Image"
                description="This will permanently delete the image from Cloudinary. Any posts using this image will show a broken image."
                confirmLabel="Delete Image"
                onConfirm={handleDelete}
                isLoading={isDeleting}
                variant="destructive"
            />
        </div>
    );
}


// "use client";
// import {useState, useRef, useCallback, useEffect} from "react";
// import {Upload, Trash2, Copy, Image as ImageIcon, FileText, Search, Grid, List} from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Input, Badge} from "@/components/ui/form-elements";
// import {Card, CardContent} from "@/components/ui/card";
// import {cn} from "@/lib/utils";
//
// interface MediaFile {
//     id: string;
//     url: string;
//     publicId: string;
//     name: string;
//     size: number;
//     type: string;
//     uploadedAt: Date;
// }
//
// export default function MediaPage() {
//     const [files, setFiles] = useState<MediaFile[]>([]);
//     const [isUploading, setIsUploading] = useState(false);
//     const [search, setSearch] = useState("");
//     const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
//     const [copiedId, setCopiedId] = useState<string | null>(null);
//     const [isDragging, setIsDragging] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//
//     const uploadFile = async (file: File) => {
//         setIsUploading(true);
//
//         try {
//             const reader = new FileReader();
//
//             reader.onloadend = async () => {
//                 try {
//                     const base64 = reader.result as string;
//
//                     const res = await fetch("/api/media", {
//                         method: "POST",
//                         headers: {"Content-Type": "application/json"},
//                         body: JSON.stringify({
//                             file: base64,
//                             name: file.name,
//                             type: file.type,
//                         }),
//                     });
//
//                     const data = await res.json();
//
//                     if (data.success) {
//                         setFiles((prev) => [data.data, ...prev]);
//                     }
//                 } finally {
//                     setIsUploading(false);
//                 }
//             };
//
//             reader.readAsDataURL(file);
//         } catch {
//             setIsUploading(false);
//         }
//     };
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selected = Array.from(e.target.files ?? []);
//         selected.forEach(uploadFile);
//     };
//
//     const handleDrop = useCallback((e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragging(false);
//         const dropped = Array.from(e.dataTransfer.files);
//         dropped.forEach(uploadFile);
//     }, []);
//
//     const handleDelete = async (id: string, publicId: string) => {
//         if (!confirm("Delete this file permanently?")) return;
//         await fetch(`/api/media?publicId=${encodeURIComponent(publicId)}`, {method: "DELETE"});
//         setFiles((prev) => prev.filter((f) => f.id !== id));
//     };
//
//     const copyUrl = (url: string, id: string) => {
//         navigator.clipboard.writeText(url);
//         setCopiedId(id);
//         setTimeout(() => setCopiedId(null), 2000);
//     };
//     useEffect(() => {
//         (async () => {
//             const res = await fetch("/api/media");
//             const data = await res.json();
//             if (data.success) setFiles(data.data);
//         })();
//     }, []);
//     const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
//
//     return (
//         <div className="space-y-6">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                 <div>
//                     <h1 className="text-2xl font-bold">Media Library</h1>
//                     <p className="text-muted-foreground text-sm">{files.length} files · Powered by Cloudinary</p>
//                 </div>
//                 <Button
//                     variant="gradient"
//                     className="gap-2"
//                     onClick={() => fileInputRef.current?.click()}
//                     isLoading={isUploading}
//                 >
//                     <Upload className="h-4 w-4"/> Upload Files
//                 </Button>
//                 <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden"
//                        onChange={handleFileChange}/>
//             </div>
//
//             {/* Search + view toggle */}
//             <div className="flex gap-3">
//                 <div className="relative flex-1 max-w-sm">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
//                     <Input placeholder="Search files..." className="pl-9" value={search}
//                            onChange={(e) => setSearch(e.target.value)}/>
//                 </div>
//                 <div className="flex border rounded-lg overflow-hidden">
//                     <button onClick={() => setViewMode("grid")}
//                             className={cn("px-3 py-2 transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
//                         <Grid className="h-4 w-4"/>
//                     </button>
//                     <button onClick={() => setViewMode("list")}
//                             className={cn("px-3 py-2 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
//                         <List className="h-4 w-4"/>
//                     </button>
//                 </div>
//             </div>
//
//             {/* Drop zone */}
//             <div
//                 onDragOver={(e) => {
//                     e.preventDefault();
//                     setIsDragging(true);
//                 }}
//                 onDragLeave={() => setIsDragging(false)}
//                 onDrop={handleDrop}
//                 className={cn(
//                     "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
//                     isDragging
//                         ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
//                         : "border-border hover:border-indigo-300 hover:bg-muted/30"
//                 )}
//                 onClick={() => fileInputRef.current?.click()}
//             >
//                 <Upload
//                     className={cn("h-10 w-10 mx-auto mb-3 transition-colors", isDragging ? "text-indigo-500" : "text-muted-foreground")}/>
//                 <p className="font-medium">{isDragging ? "Drop files here" : "Drag & drop files, or click to upload"}</p>
//                 <p className="text-sm text-muted-foreground mt-1">Supports images, videos, and PDFs</p>
//                 {isUploading && <p className="text-sm text-indigo-600 mt-2 animate-pulse">Uploading...</p>}
//             </div>
//
//             {/* Files grid/list */}
//             {filtered.length === 0 ? (
//                 <Card>
//                     <CardContent className="flex flex-col items-center justify-center py-16 text-center">
//                         <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-4"/>
//                         <h3 className="font-semibold mb-2">No files yet</h3>
//                         <p className="text-muted-foreground text-sm">Upload your first file by dragging it here or
//                             clicking Upload.</p>
//                     </CardContent>
//                 </Card>
//             ) : viewMode === "grid" ? (
//                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
//                     {filtered.map((file) => (
//                         <Card key={file.id} className="group overflow-hidden hover:shadow-md transition-all">
//                             <div className="relative aspect-square bg-muted">
//                                 {file.type.startsWith("image/") ? (
//                                     // eslint-disable-next-line @next/next/no-img-element
//                                     <img src={file.url} alt={file.name} className="w-full h-full object-cover"/>
//                                 ) : (
//                                     <div className="w-full h-full flex items-center justify-center">
//                                         <FileText className="h-10 w-10 text-muted-foreground"/>
//                                     </div>
//                                 )}
//                                 <div
//                                     className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
//                                     <button onClick={() => copyUrl(file.url, file.id)}
//                                             className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
//                                         <Copy className="h-4 w-4"/>
//                                     </button>
//                                     <button onClick={() => handleDelete(file.id, file.publicId)}
//                                             className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/80 text-white transition-colors">
//                                         <Trash2 className="h-4 w-4"/>
//                                     </button>
//                                 </div>
//                                 {copiedId === file.id && (
//                                     <div
//                                         className="absolute top-2 left-2 right-2 bg-emerald-500 text-white text-xs rounded px-2 py-1 text-center">Copied!</div>
//                                 )}
//                             </div>
//                             <CardContent className="p-2">
//                                 <p className="text-xs font-medium truncate">{file.name}</p>
//                                 <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
//                             </CardContent>
//                         </Card>
//                     ))}
//                 </div>
//             ) : (
//                 <Card>
//                     <CardContent className="p-0">
//                         <table className="w-full text-sm">
//                             <thead className="border-b bg-muted/30">
//                             <tr>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">File</th>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Size</th>
//                                 <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
//                             </tr>
//                             </thead>
//                             <tbody className="divide-y">
//                             {filtered.map((file) => (
//                                 <tr key={file.id} className="hover:bg-muted/20">
//                                     <td className="px-4 py-3 flex items-center gap-3">
//                                         {file.type.startsWith("image/")
//                                             // eslint-disable-next-line @next/next/no-img-element
//                                             ? <img src={file.url} alt="" className="h-8 w-8 rounded object-cover"/>
//                                             : <FileText className="h-8 w-8 text-muted-foreground"/>}
//                                         <span className="font-medium truncate max-w-[200px]">{file.name}</span>
//                                     </td>
//                                     <td className="px-4 py-3"><Badge variant="secondary"
//                                                                      className="text-xs">{file.type.split("/")[1]}</Badge>
//                                     </td>
//                                     <td className="px-4 py-3 text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</td>
//                                     <td className="px-4 py-3 text-right">
//                                         <div className="flex items-center justify-end gap-1">
//                                             <Button variant="ghost" size="icon" className="h-7 w-7"
//                                                     onClick={() => copyUrl(file.url, file.id)}>
//                                                 <Copy className="h-3.5 w-3.5"/>
//                                             </Button>
//                                             <Button variant="ghost" size="icon"
//                                                     className="h-7 w-7 text-destructive hover:text-destructive"
//                                                     onClick={() => handleDelete(file.id, file.publicId)}>
//                                                 <Trash2 className="h-3.5 w-3.5"/>
//                                             </Button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                             </tbody>
//                         </table>
//                     </CardContent>
//                 </Card>
//             )}
//         </div>
//     );
// }
