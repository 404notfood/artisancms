import { useBuilderStore } from '@/stores/builder-store';
import { findBlockInTree } from '@/stores/builder-tree-helpers';
import { ArrowRightLeft } from 'lucide-react';
import { getTransformEntries, applyTransform } from './block-transforms';

interface BlockTransformMenuProps {
    blockId: string;
    blockType: string;
    onClose: () => void;
}

export default function BlockTransformMenu({ blockId, blockType, onClose }: BlockTransformMenuProps) {
    const entries = getTransformEntries(blockType);

    if (entries.length === 0) return null;

    const handleTransform = (targetType: string) => {
        const store = useBuilderStore.getState();
        const block = store.findBlock(blockId);
        if (!block) return;

        const transformed = applyTransform(block, targetType);
        if (!transformed) return;

        store.pushHistory();

        useBuilderStore.setState((state) => {
            const target = findBlockInTree(state.blocks, blockId);
            if (target) {
                target.type = transformed.type;
                target.props = transformed.props;
                state.isDirty = true;
            }
        });

        onClose();
    };

    return (
        <div className="bg-white rounded-lg border shadow-lg py-1 min-w-[180px]">
            <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase">Transformer</p>
            {entries.map((entry) => (
                <button
                    key={entry.to}
                    onClick={() => handleTransform(entry.to)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {entry.label}
                </button>
            ))}
        </div>
    );
}
