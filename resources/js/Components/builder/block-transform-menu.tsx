import { useBuilderStore } from '@/stores/builder-store';
import { ArrowRightLeft } from 'lucide-react';

interface TransformOption {
    from: string;
    to: string;
    label: string;
}

const TRANSFORMS: TransformOption[] = [
    { from: 'heading', to: 'text', label: 'Convertir en texte' },
    { from: 'text', to: 'heading', label: 'Convertir en titre' },
    { from: 'heading', to: 'blockquote', label: 'Convertir en citation' },
    { from: 'text', to: 'blockquote', label: 'Convertir en citation' },
    { from: 'blockquote', to: 'text', label: 'Convertir en texte' },
    { from: 'blockquote', to: 'heading', label: 'Convertir en titre' },
    { from: 'image', to: 'gallery', label: 'Convertir en galerie' },
    { from: 'list', to: 'text', label: 'Convertir en paragraphes' },
];

interface BlockTransformMenuProps {
    blockId: string;
    blockType: string;
    onClose: () => void;
}

export default function BlockTransformMenu({ blockId, blockType, onClose }: BlockTransformMenuProps) {
    const { findBlock, updateBlock } = useBuilderStore();
    const available = TRANSFORMS.filter((t) => t.from === blockType);

    if (available.length === 0) return null;

    const handleTransform = (to: string) => {
        const block = findBlock(blockId);
        if (!block) return;

        // Keep the content/text props and change the type
        const store = useBuilderStore.getState();
        store.pushHistory();

        useBuilderStore.setState((state) => {
            const target = findBlockInDraft(state.blocks, blockId);
            if (target) {
                target.type = to;
                // Adapt props for the new type
                if (to === 'gallery' && block.type === 'image') {
                    target.props = {
                        images: block.props.src ? [{ src: block.props.src, alt: block.props.alt }] : [],
                    };
                }
                state.isDirty = true;
            }
        });

        onClose();
    };

    return (
        <div className="bg-white rounded-lg border shadow-lg py-1 min-w-[180px]">
            <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase">Transformer</p>
            {available.map((opt) => (
                <button
                    key={opt.to}
                    onClick={() => handleTransform(opt.to)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// Internal helper to find block in immer draft
function findBlockInDraft(blocks: any[], id: string): any | null {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children?.length) {
            const found = findBlockInDraft(block.children, id);
            if (found) return found;
        }
    }
    return null;
}
