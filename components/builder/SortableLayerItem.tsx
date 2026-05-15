'use client';

/**
 * components/builder/SortableLayerItem.tsx
 *
 * A single draggable item in the bottom layer strip of the site builder.
 * Uses @dnd-kit/sortable for horizontal drag-to-reorder.
 *
 * CAT_ICONS is defined here (single source of truth) and imported by route.ts
 * so both files stay in sync without circular imports.
 */

import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {
    GripVertical,
    EyeOff,
    Navigation,
    Layers,
    Layout,
    PanelBottom,
    Puzzle,
    Sparkles,
    Code,
    Settings,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CAT_ICONS — exported so route.ts imports from here (no duplication)
// ─────────────────────────────────────────────────────────────────────────────

export const CAT_ICONS: Record<string, React.ElementType> = {
    navbar: Navigation,
    hero: Layers,
    section: Layout,
    footer: PanelBottom,
    layout: Layout,
    widget: Puzzle,
    animation: Sparkles,
    template: Code,
    integration: Settings,
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SortableLayerItemProps {
    instanceId: string;
    name: string;
    category: string;
    isVisible: boolean;
    isSelected: boolean;
    onSelect: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SortableLayerItem({
                                      instanceId,
                                      name,
                                      category,
                                      isVisible,
                                      isSelected,
                                      onSelect,
                                  }: SortableLayerItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: instanceId});

    const Icon = CAT_ICONS[category] ?? Layers;

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-0.5 shrink-0">
            {/* Drag handle — touch-none prevents scroll interference on mobile */}
            <button
                className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground touch-none select-none"
                title="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-3 w-3"/>
            </button>

            {/* Select / label button */}
            <button
                onClick={onSelect}
                className={[
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap border transition-colors',
                    isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'hover:bg-muted border-transparent',
                    !isVisible ? 'opacity-40' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <Icon className="h-3 w-3"/>
                {name}
                {!isVisible && <EyeOff className="h-2.5 w-2.5"/>}
            </button>
        </div>
    );
}