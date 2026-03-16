import React, { useState, useCallback, memo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useBuilderStore } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';
import { getBlockColorScheme } from './block-colors';
import type { BlockNode } from '@/types/cms';

interface TreeItemProps {
    block: BlockNode;
    depth: number;
}

function getBlockLabel(block: BlockNode): string {
    const entry = getBlock(block.type);
    const baseLabel = entry?.label || block.type;

    // Show a preview of text content for content blocks
    if (block.type === 'heading' || block.type === 'text') {
        const text = (block.props.text as string) || (block.props.content as string) || '';
        if (text) {
            const clean = text.replace(/<[^>]*>/g, '').trim();
            if (clean) {
                const preview = clean.length > 24 ? clean.slice(0, 24) + '...' : clean;
                return `${baseLabel} — ${preview}`;
            }
        }
    }

    if (block.type === 'grid') {
        const cols = Number(block.props.columns) || 2;
        return `${baseLabel} (${cols} col.)`;
    }

    return baseLabel;
}

const TreeItem = memo(function TreeItem({ block, depth }: TreeItemProps) {
    const { selectedBlockId, hoveredBlockId, selectBlock, setHoveredBlock } = useBuilderStore();
    const hasChildren = (block.children?.length ?? 0) > 0;
    const isContainer = block.type === 'section' || block.type === 'grid';

    // Containers start expanded by default
    const [expanded, setExpanded] = useState(isContainer);

    const isSelected = selectedBlockId === block.id;
    const isHovered = hoveredBlockId === block.id;

    const entry = getBlock(block.type);
    const colors = getBlockColorScheme(entry?.category ?? 'content');
    const label = getBlockLabel(block);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded((prev) => !prev);
    }, []);

    const handleClick = useCallback(() => {
        selectBlock(block.id);
    }, [selectBlock, block.id]);

    return (
        <div>
            <div
                className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer text-xs transition-colors ${
                    isSelected
                        ? 'bg-blue-50 ring-1 ring-blue-200'
                        : isHovered
                            ? 'bg-gray-50'
                            : 'hover:bg-gray-50'
                }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
                onMouseEnter={() => setHoveredBlock(block.id)}
                onMouseLeave={() => setHoveredBlock(null)}
            >
                {/* Collapse/expand toggle */}
                {hasChildren || isContainer ? (
                    <button onClick={handleToggle} className="shrink-0 text-gray-400 hover:text-gray-600">
                        {expanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </button>
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}

                {/* Color dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />

                {/* Label */}
                <span className={`truncate ${isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {label}
                </span>
            </div>

            {/* Children */}
            {expanded && block.children?.map((child) => (
                <TreeItem key={child.id} block={child} depth={depth + 1} />
            ))}
        </div>
    );
});

export default function BlockTree() {
    const blocks = useBuilderStore((s) => s.blocks);

    if (!blocks.length) {
        return (
            <div className="text-center text-gray-400 text-sm mt-12">
                <p>Aucun bloc dans la page</p>
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            {blocks.map((block) => (
                <TreeItem key={block.id} block={block} depth={0} />
            ))}
        </div>
    );
}
