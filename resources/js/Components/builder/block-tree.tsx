import React, { memo, useCallback, useState } from 'react';
import { ChevronDown, ChevronRight, CopyPlus, Eye, EyeOff, Lock, Pencil, Save, Trash2, Unlock } from 'lucide-react';
import { useBuilderStore } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';
import { getBlockColorScheme } from './block-colors';
import type { BlockNode } from '@/types/cms';

interface TreeItemProps {
    block: BlockNode;
    depth: number;
    onSavePattern?: (blockId: string) => void;
}

function getBlockLabel(block: BlockNode): string {
    const customLabel = block.props.label as string | undefined;
    if (customLabel?.trim()) {
        return customLabel.trim();
    }

    const entry = getBlock(block.type);
    const baseLabel = entry?.label || block.type;

    if (block.type === 'heading' || block.type === 'text') {
        const text = (block.props.text as string) || (block.props.content as string) || '';
        if (text) {
            const clean = text.replace(/<[^>]*>/g, '').trim();
            if (clean) {
                const preview = clean.length > 24 ? `${clean.slice(0, 24)}...` : clean;
                return `${baseLabel} - ${preview}`;
            }
        }
    }

    if (block.type === 'grid') {
        const cols = Number(block.props.columns) || 2;
        return `${baseLabel} (${cols} col.)`;
    }

    return baseLabel;
}

const TreeItem = memo(function TreeItem({ block, depth, onSavePattern }: TreeItemProps) {
    const { selectedBlockId, hoveredBlockId, selectBlock, setHoveredBlock, updateBlock, duplicateBlock, setPendingDeleteId } = useBuilderStore();
    const hasChildren = (block.children?.length ?? 0) > 0;
    const isContainer = block.type === 'section' || block.type === 'grid' || block.type === 'row' || block.type === 'column';
    const [expanded, setExpanded] = useState(isContainer);
    const [isRenaming, setIsRenaming] = useState(false);
    const [draftLabel, setDraftLabel] = useState((block.props.label as string) || getBlockLabel(block));

    const isSelected = selectedBlockId === block.id;
    const isHovered = hoveredBlockId === block.id;
    const isHidden = Boolean(block.props.hidden);
    const isLocked = Boolean(block.props.locked);

    const entry = getBlock(block.type);
    const colors = getBlockColorScheme(entry?.category ?? 'content');
    const label = getBlockLabel(block);

    const handleToggle = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setExpanded((prev) => !prev);
    }, []);

    const handleClick = useCallback(() => {
        selectBlock(block.id);
    }, [selectBlock, block.id]);

    const commitRename = useCallback(() => {
        const value = draftLabel.trim();
        updateBlock(block.id, { label: value || undefined });
        setIsRenaming(false);
    }, [block.id, draftLabel, updateBlock]);

    const iconButtonClass = 'rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700';

    return (
        <div>
            <div
                className={`group/tree flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition ${
                    isSelected
                        ? 'bg-white font-medium text-slate-950 shadow-sm ring-1 ring-slate-200'
                        : isHovered
                            ? 'bg-white/80'
                            : 'hover:bg-white/70'
                }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
                onMouseEnter={() => setHoveredBlock(block.id)}
                onMouseLeave={() => setHoveredBlock(null)}
            >
                {hasChildren || isContainer ? (
                    <button onClick={handleToggle} className="shrink-0 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                        )}
                    </button>
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}

                <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />

                {isRenaming ? (
                    <input
                        value={draftLabel}
                        autoFocus
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => setDraftLabel(event.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') commitRename();
                            if (event.key === 'Escape') {
                                setDraftLabel((block.props.label as string) || getBlockLabel(block));
                                setIsRenaming(false);
                            }
                        }}
                        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-900 outline-none focus:border-slate-400"
                    />
                ) : (
                    <span className={`min-w-0 flex-1 truncate ${isSelected ? 'font-medium text-slate-950' : isHidden ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                        {label}
                    </span>
                )}

                <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover/tree:opacity-100">
                    {isHidden && <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    {isLocked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                    <button
                        type="button"
                        title="Renommer"
                        className={iconButtonClass}
                        onClick={(event) => {
                            event.stopPropagation();
                            setDraftLabel((block.props.label as string) || getBlockLabel(block));
                            setIsRenaming(true);
                        }}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        title={isHidden ? 'Afficher' : 'Masquer'}
                        className={iconButtonClass}
                        onClick={(event) => {
                            event.stopPropagation();
                            updateBlock(block.id, { hidden: !isHidden });
                        }}
                    >
                        {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        type="button"
                        title={isLocked ? 'Deverrouiller' : 'Verrouiller'}
                        className={iconButtonClass}
                        onClick={(event) => {
                            event.stopPropagation();
                            updateBlock(block.id, { locked: !isLocked });
                        }}
                    >
                        {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        type="button"
                        title="Dupliquer"
                        className={iconButtonClass}
                        onClick={(event) => {
                            event.stopPropagation();
                            duplicateBlock(block.id);
                        }}
                    >
                        <CopyPlus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        title="Sauvegarder comme pattern"
                        className={iconButtonClass}
                        onClick={(event) => {
                            event.stopPropagation();
                            onSavePattern?.(block.id);
                        }}
                    >
                        <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        title="Supprimer"
                        className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        onClick={(event) => {
                            event.stopPropagation();
                            if (!isLocked) setPendingDeleteId(block.id);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {expanded && block.children?.map((child) => (
                <TreeItem key={child.id} block={child} depth={depth + 1} onSavePattern={onSavePattern} />
            ))}
        </div>
    );
});

export default function BlockTree({ onSavePattern }: { onSavePattern?: (blockId: string) => void }) {
    const blocks = useBuilderStore((state) => state.blocks);

    if (!blocks.length) {
        return (
            <div className="mt-12 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                <p>Aucun bloc dans la page</p>
            </div>
        );
    }

    return (
        <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {blocks.map((block) => (
                <TreeItem key={block.id} block={block} depth={0} onSavePattern={onSavePattern} />
            ))}
        </div>
    );
}
