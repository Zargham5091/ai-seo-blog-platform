"use client";
import React, {useState} from "react";
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
    useSortable, arrayMove,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {
    GripVertical, Trash2, Plus, Type, Image, Code, Quote,
    List, Table, Video, Minus, ListOrdered, AlignLeft,
} from "lucide-react";
import {cn, generateId} from "@/lib/utils";
import {IBlogBlock} from "@/types";
import {useBlogEditorStore} from "@/store/blog-editor";
import {Button} from "@/components/ui/button";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string {
    if (!url) return "";
    // Handles all YouTube URL formats:
    // youtube.com/watch?v=ID
    // youtube.com/watch?v=ID&list=...
    // youtu.be/ID
    // youtube.com/embed/ID
    // youtube.com/shorts/ID
    const patterns = [
        /[?&]v=([^&#]+)/,
        /youtu\.be\/([^?&#]+)/,
        /youtube\.com\/embed\/([^?&#]+)/,
        /youtube\.com\/shorts\/([^?&#]+)/,
        /youtube\.com\/v\/([^?&#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
    }
    return "";
}

// ─── Block type definitions ───────────────────────────────────────────────────

const BLOCK_TYPES = [
    {type: "paragraph", label: "Text", icon: Type, description: "Rich text paragraph"},
    {type: "image", label: "Image", icon: Image, description: "Image with caption"},
    {type: "quote", label: "Quote", icon: Quote, description: "Blockquote"},
    {type: "list", label: "Bullet List", icon: List, description: "Unordered list"},
    {type: "ordered_list", label: "Numbered List", icon: ListOrdered, description: "Ordered list"},
    {type: "table", label: "Table", icon: Table, description: "Data table"},
    {type: "video", label: "YouTube", icon: Video, description: "YouTube embed"},
    {type: "code", label: "Code", icon: Code, description: "Code snippet"},
    {type: "divider", label: "Divider", icon: Minus, description: "Horizontal rule"},
];

// ─── Default content for each block type ─────────────────────────────────────

function getDefaultContent(type: string): IBlogBlock["content"] {
    switch (type) {
        case "paragraph":
            return {text: ""};
        case "image":
            return {url: "", caption: ""};
        case "quote":
            return {text: "", author: ""};
        case "list":
            return {items: [""], style: "unordered"};
        case "ordered_list":
            return {items: [""], style: "ordered"};
        case "table":
            return {
                headers: ["Column 1", "Column 2", "Column 3"],
                rows: [["", "", ""], ["", "", ""]],
            };
        case "video":
            return {url: ""};
        case "code":
            return {code: "", lang: "javascript"};
        case "divider":
            return {};
        default:
            return {};
    }
}

// Ensure block has valid content — fills in missing keys with defaults
function ensureContent(block: IBlogBlock): IBlogBlock["content"] {
    const defaults = getDefaultContent(block.type);
    return {...defaults, ...(block.content ?? {})};
}

// ─── Individual block renderers ───────────────────────────────────────────────

function BlockRenderer({
                           block,
                           onUpdate,
                       }: {
    block: IBlogBlock;
    onUpdate: (id: string, content: Record<string, unknown>) => void;
}) {
    const content = ensureContent(block);
    const update = (patch: Record<string, unknown>) => onUpdate(block.id, {...content, ...patch});

    switch (block.type) {
        case "paragraph":
            return (
                <textarea
                    className="w-full min-h-[80px] bg-transparent text-sm resize-none focus:outline-none focus:ring-0 border-0 p-0 placeholder:text-muted-foreground"
                    placeholder="Write something..."
                    value={(content.text as string) ?? ""}
                    onChange={(e) => update({text: e.target.value})}
                    rows={3}
                />
            );

        case "image":
            return (
                <div className="space-y-2">
                    <input
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Image URL (https://...)..."
                        value={(content.url) ?? ""}
                        onChange={(e) => update({url: e.target.value})}
                    />
                    {content.url && (
                        <img
                            src={content.url}
                            alt="block"
                            className="max-h-64 rounded-lg object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    )}
                    <input
                        className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Caption (optional)"
                        value={(content.caption as string) ?? ""}
                        onChange={(e) => update({caption: e.target.value})}
                    />
                </div>
            );

        case "quote":
            return (
                <blockquote className="border-l-4 border-indigo-500 pl-4">
          <textarea
              className="w-full bg-transparent text-base italic resize-none focus:outline-none border-0 placeholder:text-muted-foreground"
              placeholder="Enter quote text..."
              rows={3}
              value={(content.text as string) ?? ""}
              onChange={(e) => update({text: e.target.value})}
          />
                    <input
                        className="w-full bg-transparent text-sm text-muted-foreground focus:outline-none border-0 mt-1"
                        placeholder="— Author (optional)"
                        value={(content.author as string) ?? ""}
                        onChange={(e) => update({author: e.target.value})}
                    />
                </blockquote>
            );

        case "list":
        case "ordered_list": {
            const items = (content.items as string[]) ?? [""];
            const isOrdered = block.type === "ordered_list";
            return (
                <div className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm shrink-0 w-5 text-center">
                {isOrdered ? `${i + 1}.` : "•"}
              </span>
                            <input
                                className="flex-1 bg-transparent text-sm focus:outline-none border-b border-transparent hover:border-border focus:border-indigo-300 transition-colors py-0.5"
                                placeholder={`Item ${i + 1}`}
                                value={item}
                                onChange={(e) => {
                                    const newItems = [...items];
                                    newItems[i] = e.target.value;
                                    update({items: newItems});
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        const newItems = [...items];
                                        newItems.splice(i + 1, 0, "");
                                        update({items: newItems});
                                    }
                                    if (e.key === "Backspace" && item === "" && items.length > 1) {
                                        e.preventDefault();
                                        const newItems = items.filter((_, idx) => idx !== i);
                                        update({items: newItems});
                                    }
                                }}
                            />
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => update({items: items.filter((_, idx) => idx !== i)})}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5"/>
                                </button>
                            )}
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => update({items: [...items, ""]})}
                        className="gap-1.5 h-7 text-xs text-muted-foreground"
                    >
                        <Plus className="h-3 w-3"/> Add item
                    </Button>
                </div>
            );
        }

        case "table": {
            const headers = (content.headers as string[]) ?? ["Column 1", "Column 2"];
            const rows = (content.rows as string[][]) ?? [["", ""]];

            const updateHeader = (i: number, val: string) => {
                const newH = [...headers];
                newH[i] = val;
                update({headers: newH, rows});
            };

            const updateCell = (r: number, c: number, val: string) => {
                const newRows = rows.map((row, ri) =>
                    ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : row
                );
                update({headers, rows: newRows});
            };

            const addColumn = () => {
                update({
                    headers: [...headers, `Column ${headers.length + 1}`],
                    rows: rows.map((row) => [...row, ""]),
                });
            };

            const addRow = () => {
                update({headers, rows: [...rows, headers.map(() => "")]});
            };

            const removeRow = (r: number) => {
                if (rows.length <= 1) return;
                update({headers, rows: rows.filter((_, ri) => ri !== r)});
            };

            return (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="border border-border p-0">
                                    <input
                                        className="w-full bg-muted/50 px-3 py-2 font-semibold text-center focus:outline-none focus:bg-indigo-50 dark:focus:bg-indigo-950/30 transition-colors"
                                        value={h}
                                        onChange={(e) => updateHeader(i, e.target.value)}
                                        placeholder={`Header ${i + 1}`}
                                    />
                                </th>
                            ))}
                            <th className="border border-border p-1 w-8">
                                <button
                                    type="button"
                                    onClick={addColumn}
                                    className="text-muted-foreground hover:text-indigo-600 transition-colors"
                                    title="Add column"
                                >
                                    <Plus className="h-3.5 w-3.5"/>
                                </button>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, r) => (
                            <tr key={r}>
                                {row.map((cell, c) => (
                                    <td key={c} className="border border-border p-0">
                                        <input
                                            className="w-full px-3 py-2 focus:outline-none focus:bg-indigo-50/50 dark:focus:bg-indigo-950/20 transition-colors"
                                            value={cell}
                                            onChange={(e) => updateCell(r, c, e.target.value)}
                                            placeholder="..."
                                        />
                                    </td>
                                ))}
                                <td className="border border-border p-1 w-8 text-center">
                                    <button
                                        type="button"
                                        onClick={() => removeRow(r)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                        title="Remove row"
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addRow}
                        className="gap-1.5 h-7 text-xs text-muted-foreground mt-1"
                    >
                        <Plus className="h-3 w-3"/> Add row
                    </Button>
                </div>
            );
        }

        case "video": {
            const videoUrl = (content.url as string) ?? "";
            const videoId = getYouTubeId(videoUrl);
            return (
                <div className="space-y-2">
                    <input
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                        value={videoUrl}
                        onChange={(e) => update({url: e.target.value})}
                    />
                    {videoId ? (
                        <div className="relative rounded-xl overflow-hidden bg-black" style={{paddingTop: "56.25%"}}>
                            <iframe
                                className="absolute inset-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : videoUrl ? (
                        <div
                            className="rounded-xl bg-muted/50 border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                            Could not parse YouTube ID from this URL. Make sure it&apos;s a valid YouTube link.
                        </div>
                    ) : null}
                </div>
            );
        }

        case "code":
            return (
                <div className="rounded-lg bg-zinc-950 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            className="bg-transparent text-xs text-zinc-400 focus:outline-none border-0 w-32"
                            placeholder="Language (e.g. javascript)"
                            value={(content.lang as string) ?? ""}
                            onChange={(e) => update({lang: e.target.value})}
                        />
                        <span className="text-zinc-600 text-xs ml-auto">code block</span>
                    </div>
                    <textarea
                        className="w-full bg-transparent font-mono text-sm text-emerald-400 resize-none focus:outline-none border-0 min-h-[120px]"
                        placeholder="// Paste your code here..."
                        rows={8}
                        value={(content.code as string) ?? ""}
                        onChange={(e) => update({code: e.target.value})}
                    />
                </div>
            );

        case "divider":
            return (
                <div className="flex items-center gap-3 py-2">
                    <hr className="flex-1 border-border"/>
                    <span className="text-xs text-muted-foreground">divider</span>
                    <hr className="flex-1 border-border"/>
                </div>
            );

        default:
            // Should never reach here with the updated BLOCK_TYPES list
            return (
                <div className="text-muted-foreground text-sm p-4 border-2 border-dashed rounded-lg bg-muted/20">
                    Unknown block type: <code className="bg-muted px-1 rounded">{block.type}</code>
                </div>
            );
    }
}

// ─── Sortable block wrapper ───────────────────────────────────────────────────

function SortableBlock({
                           block,
                           onUpdate,
                           onRemove,
                       }: {
    block: IBlogBlock;
    onUpdate: (id: string, content: Record<string, unknown>) => void;
    onRemove: (id: string) => void;
}) {
    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging,
    } = useSortable({id: block.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const typeLabel = BLOCK_TYPES.find((b) => b.type === block.type)?.label ?? block.type;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex gap-2 p-2 rounded-xl border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all",
                isDragging && "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 shadow-lg z-50"
            )}
        >
            {/* Drag handle + block label */}
            <div className="flex flex-col items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                    title="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground"/>
                </div>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide writing-mode-vertical">
          {typeLabel}
        </span>
            </div>

            {/* Block content */}
            <div className="flex-1 min-w-0">
                <BlockRenderer block={block} onUpdate={onUpdate}/>
            </div>

            {/* Remove button */}
            <button
                type="button"
                onClick={() => onRemove(block.id)}
                className="flex items-start pt-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                title="Remove block"
            >
                <Trash2 className="h-4 w-4"/>
            </button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BlogBlockBuilder() {
    const {blocks, addBlock, updateBlock, removeBlock, reorderBlocks} = useBlogEditorStore();
    const [showBlockMenu, setShowBlockMenu] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
    );

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            reorderBlocks(
                arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({...b, order: i}))
            );
        }
    }

    function addNewBlock(type: string) {
        addBlock({
            id: generateId(),
            type: type as IBlogBlock["type"],
            content: getDefaultContent(type),
            order: blocks.length,
        });
        setShowBlockMenu(false);
    }

    return (
        <div className="space-y-2">
            {blocks.length === 0 && (
                <div
                    className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                    <AlignLeft className="h-8 w-8 mb-3 opacity-30"/>
                    <p className="text-sm font-medium">No blocks yet</p>
                    <p className="text-xs mt-1">Click &quot;Add Block&quot; below to start building</p>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {blocks.map((block) => (
                        <SortableBlock
                            key={block.id}
                            block={block}
                            onUpdate={updateBlock}
                            onRemove={removeBlock}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {/* Add block */}
            <div className="relative">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed gap-2 text-muted-foreground hover:text-foreground hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
                    onClick={() => setShowBlockMenu((v) => !v)}
                >
                    <Plus className="h-4 w-4"/> Add Block
                </Button>

                {showBlockMenu && (
                    <>
                        {/* Backdrop to close menu */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowBlockMenu(false)}
                        />
                        <div
                            className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-xl shadow-xl p-2 z-50 grid grid-cols-2 sm:grid-cols-3 gap-1">
                            {BLOCK_TYPES.map(({type, label, icon: Icon, description}) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => addNewBlock(type)}
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent text-left transition-colors"
                                >
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                                        <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400"/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


// "use client";
// import {
//   DndContext, closestCenter, KeyboardSensor, PointerSensor,
//   useSensor, useSensors, DragEndEvent,
// } from "@dnd-kit/core";
// import {
//   SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
//   useSortable, arrayMove,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { GripVertical, Trash2, Plus, Type, Image, Code, Quote, List, Table, Video, Minus } from "lucide-react";
// import { cn, generateId } from "@/lib/utils";
// import { IBlogBlock } from "@/types";
// import { useBlogEditorStore } from "@/store/blog-editor";
// import { Button } from "@/components/ui/button";
// import { TiptapEditor } from "./TiptapEditor";
//
// const BLOCK_TYPES = [
//   { type: "paragraph", label: "Text", icon: Type, description: "Rich text paragraph" },
//   { type: "image", label: "Image", icon: Image, description: "Image with caption" },
//   { type: "code", label: "Code", icon: Code, description: "Code snippet" },
//   { type: "quote", label: "Quote", icon: Quote, description: "Blockquote" },
//   { type: "list", label: "List", icon: List, description: "Bullet or numbered list" },
//   { type: "table", label: "Table", icon: Table, description: "Data table" },
//   { type: "video", label: "Video", icon: Video, description: "YouTube embed" },
//   { type: "divider", label: "Divider", icon: Minus, description: "Horizontal rule" },
// ];
//
// function SortableBlock({ block, onUpdate, onRemove }: {
//   block: IBlogBlock;
//   onUpdate: (id: string, content: Record<string, unknown>) => void;
//   onRemove: (id: string) => void;
// }) {
//   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
//
//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.5 : 1,
//   };
//
//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       className={cn(
//         "group relative flex gap-2 p-1 rounded-lg border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all",
//         isDragging && "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 shadow-lg"
//       )}
//     >
//       {/* Drag handle */}
//       <div
//         {...attributes}
//         {...listeners}
//         className="flex items-start pt-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
//       >
//         <GripVertical className="h-4 w-4 text-muted-foreground" />
//       </div>
//
//       {/* Block content */}
//       <div className="flex-1 min-w-0">
//         <BlockRenderer block={block} onUpdate={onUpdate} />
//       </div>
//
//       {/* Remove button */}
//       <button
//         onClick={() => onRemove(block.id)}
//         className="flex items-start pt-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
//       >
//         <Trash2 className="h-4 w-4" />
//       </button>
//     </div>
//   );
// }
//
// function BlockRenderer({ block, onUpdate }: { block: IBlogBlock; onUpdate: (id: string, content: Record<string, unknown>) => void }) {
//   switch (block.type) {
//     case "paragraph":
//     case "heading":
//       return (
//         <TiptapEditor
//           content={(block.content.html as string) ?? ""}
//           onChange={(html) => onUpdate(block.id, { ...block.content, html })}
//           placeholder="Type something..."
//           className="border-0"
//         />
//       );
//
//     case "image":
//       return (
//         <div className="space-y-2">
//           <input
//             className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
//             placeholder="Image URL..."
//             value={(block.content.url as string) ?? ""}
//             onChange={(e) => onUpdate(block.id, { ...block.content, url: e.target.value })}
//           />
//           {block.content.url && (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img src={block.content.url as string} alt="block" className="max-h-64 rounded-lg object-cover" />
//           )}
//           <input
//             className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background"
//             placeholder="Caption (optional)..."
//             value={(block.content.caption as string) ?? ""}
//             onChange={(e) => onUpdate(block.id, { ...block.content, caption: e.target.value })}
//           />
//         </div>
//       );
//
//     case "quote":
//       return (
//         <blockquote className="border-l-4 border-indigo-500 pl-4">
//           <textarea
//             className="w-full bg-transparent text-lg italic resize-none focus:outline-none"
//             placeholder="Enter quote..."
//             rows={3}
//             value={(block.content.text as string) ?? ""}
//             onChange={(e) => onUpdate(block.id, { ...block.content, text: e.target.value })}
//           />
//           <input
//             className="w-full bg-transparent text-sm text-muted-foreground focus:outline-none"
//             placeholder="— Author"
//             value={(block.content.author as string) ?? ""}
//             onChange={(e) => onUpdate(block.id, { ...block.content, author: e.target.value })}
//           />
//         </blockquote>
//       );
//
//     case "code":
//       return (
//         <div className="rounded-lg bg-zinc-950 p-4">
//           <input
//             className="w-full bg-transparent text-xs text-zinc-400 focus:outline-none mb-2"
//             placeholder="Language (e.g. javascript)"
//             value={(block.content.lang as string) ?? ""}
//             onChange={(e) => onUpdate(block.id, { ...block.content, lang: e.target.value })}
//           />
//           <textarea
//             className="w-full bg-transparent font-mono text-sm text-emerald-400 resize-none focus:outline-none"
//             placeholder="// Your code here..."
//             rows={8}
//             value={(block.content.code as string) ?? ""}
//             onChange={(e) => onUpdate(block.id, { ...block.content, code: e.target.value })}
//           />
//         </div>
//       );
//
//     case "video":
//       return (
//         <div>
//           <input
//             className="w-full px-3 py-2 text-sm border rounded-lg bg-background mb-2"
//             placeholder="YouTube URL..."
//             value={(block.content.url as string) ?? ""}
//             onChange={(e) => onUpdate(block.id, { ...block.content, url: e.target.value })}
//           />
//           {block.content.url && (
//             <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-black">
//               <iframe
//                 className="absolute inset-0 w-full h-full"
//                 src={`https://www.youtube.com/embed/${getYouTubeId(block.content.url as string)}`}
//                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                 allowFullScreen
//               />
//             </div>
//           )}
//         </div>
//       );
//
//     case "divider":
//       return <hr className="my-2 border-border" />;
//
//     default:
//       return <div className="text-muted-foreground text-sm p-4 border-2 border-dashed rounded-lg">Unsupported block type: {block.type}</div>;
//   }
// }
//
// function getYouTubeId(url: string): string {
//   const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
//   return match?.[1] ?? "";
// }
//
// export function BlogBlockBuilder() {
//   const { blocks, addBlock, updateBlock, removeBlock, reorderBlocks } = useBlogEditorStore();
//   const [showBlockMenu, setShowBlockMenu] = React.useState(false);
//
//   const sensors = useSensors(
//     useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
//     useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
//   );
//
//   function handleDragEnd(event: DragEndEvent) {
//     const { active, over } = event;
//     if (over && active.id !== over.id) {
//       const oldIndex = blocks.findIndex((b) => b.id === active.id);
//       const newIndex = blocks.findIndex((b) => b.id === over.id);
//       reorderBlocks(arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i })));
//     }
//   }
//
//   function addNewBlock(type: string) {
//     addBlock({ id: generateId(), type: type as IBlogBlock["type"], content: {}, order: blocks.length });
//     setShowBlockMenu(false);
//   }
//
//   return (
//     <div className="space-y-2">
//       <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
//         <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
//           {blocks.map((block) => (
//             <SortableBlock key={block.id} block={block} onUpdate={updateBlock} onRemove={removeBlock} />
//           ))}
//         </SortableContext>
//       </DndContext>
//
//       {/* Add block button */}
//       <div className="relative">
//         <Button
//           type="button"
//           variant="outline"
//           className="w-full border-dashed gap-2 text-muted-foreground hover:text-foreground hover:border-indigo-400"
//           onClick={() => setShowBlockMenu((v) => !v)}
//         >
//           <Plus className="h-4 w-4" /> Add Block
//         </Button>
//
//         {showBlockMenu && (
//           <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-xl shadow-xl p-2 z-50 grid grid-cols-2 gap-1">
//             {BLOCK_TYPES.map(({ type, label, icon: Icon, description }) => (
//               <button
//                 key={type}
//                 type="button"
//                 onClick={() => addNewBlock(type)}
//                 className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent text-left transition-colors"
//               >
//                 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
//                   <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium">{label}</p>
//                   <p className="text-xs text-muted-foreground">{description}</p>
//                 </div>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
//
// // Need React import for useState
// import React from "react";
