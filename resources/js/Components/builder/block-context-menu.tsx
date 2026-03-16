import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Copy, ClipboardPaste, CopyPlus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useBuilderStore, findParentInfo } from '@/stores/builder-store';

interface BlockContextMenuProps {
    blockId: string;
    x: number;
    y: number;
    onClose: () => void;
}

export default function BlockContextMenu({ blockId, x, y, onClose }: BlockContextMenuProps) {
    const { blocks, clipboard, copyBlock, pasteBlock, duplicateBlock, moveBlockUp, moveBlockDown, setPendingDeleteId } = useBuilderStore();
    const menuRef = useRef<HTMLDivElement>(null);

    const info = findParentInfo(blocks, blockId);
    const siblings = info
        ? (info.parentId
            ? useBuilderStore.getState().findBlock(info.parentId)?.children ?? []
            : blocks)
        : [];
    const isFirst = info?.index === 0;
    const isLast = info ? info.index >= siblings.length - 1 : true;

    // Clamp position to viewport
    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const rect = menu.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 8;
        const maxY = window.innerHeight - rect.height - 8;
        if (x > maxX) menu.style.left = `${maxX}px`;
        if (y > maxY) menu.style.top = `${maxY}px`;
    }, [x, y]);

    // Close on click outside or Escape
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    const items: Array<{ label: string; shortcut?: string; icon: React.ReactNode; action: () => void; disabled?: boolean; destructive?: boolean } | 'separator'> = [
        {
            label: 'Copier',
            shortcut: 'Ctrl+C',
            icon: <Copy className="w-3.5 h-3.5" />,
            action: () => { copyBlock(blockId); onClose(); },
        },
        {
            label: 'Coller en dessous',
            shortcut: 'Ctrl+V',
            icon: <ClipboardPaste className="w-3.5 h-3.5" />,
            disabled: !clipboard,
            action: () => {
                if (!info || !clipboard) return;
                pasteBlock(info.parentId, info.index + 1);
                onClose();
            },
        },
        {
            label: 'Dupliquer',
            shortcut: 'Ctrl+D',
            icon: <CopyPlus className="w-3.5 h-3.5" />,
            action: () => { duplicateBlock(blockId); onClose(); },
        },
        'separator',
        {
            label: 'Monter',
            icon: <ChevronUp className="w-3.5 h-3.5" />,
            disabled: isFirst,
            action: () => { moveBlockUp(blockId); onClose(); },
        },
        {
            label: 'Descendre',
            icon: <ChevronDown className="w-3.5 h-3.5" />,
            disabled: isLast,
            action: () => { moveBlockDown(blockId); onClose(); },
        },
        'separator',
        {
            label: 'Supprimer',
            shortcut: 'Suppr',
            icon: <Trash2 className="w-3.5 h-3.5" />,
            destructive: true,
            action: () => { setPendingDeleteId(blockId); onClose(); },
        },
    ];

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[100] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
            style={{ left: x, top: y }}
        >
            {items.map((item, i) => {
                if (item === 'separator') {
                    return <div key={i} className="h-px bg-gray-100 my-1" />;
                }
                return (
                    <button
                        key={i}
                        onClick={item.action}
                        disabled={item.disabled}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                            item.disabled
                                ? 'text-gray-300 cursor-not-allowed'
                                : item.destructive
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {item.icon}
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-xs text-gray-400 ml-4">{item.shortcut}</span>
                        )}
                    </button>
                );
            })}
        </div>,
        document.body,
    );
}
