import { ChevronRight } from 'lucide-react';
import { useBuilderStore, findBlockInTree } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';

export default function BlockBreadcrumb() {
    const { selectedBlockId, blocks, selectBlock, getBlockPath } = useBuilderStore();

    if (!selectedBlockId) return null;

    const path = getBlockPath(selectedBlockId);
    if (!path.length) return null;

    return (
        <div className="flex items-center gap-0.5 text-xs mb-3 flex-wrap">
            {path.map((id, i) => {
                const block = findBlockInTree(blocks, id);
                if (!block) return null;
                const entry = getBlock(block.type);
                const label = entry?.label || block.type;
                const isLast = i === path.length - 1;

                return (
                    <span key={id} className="flex items-center gap-0.5">
                        {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />}
                        <button
                            onClick={() => selectBlock(id)}
                            className={`hover:underline ${isLast ? 'text-gray-800 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {label}
                        </button>
                    </span>
                );
            })}
        </div>
    );
}
