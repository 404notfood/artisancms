import { useBuilderStore } from '@/stores/builder-store';
import { findBlockInTree } from '@/stores/builder-tree-helpers';
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

/**
 * Build the transformed props for a given block type conversion.
 */
function buildTransformedProps(
    fromType: string,
    toType: string,
    currentProps: Record<string, unknown>,
): { type: string; props: Record<string, unknown> } {
    if (toType === 'gallery' && fromType === 'image') {
        return {
            type: toType,
            props: {
                images: currentProps.src ? [{ src: currentProps.src, alt: currentProps.alt }] : [],
            },
        };
    }
    // Default: keep existing props, just change the type
    return { type: toType, props: currentProps };
}

export default function BlockTransformMenu({ blockId, blockType, onClose }: BlockTransformMenuProps) {
    const available = TRANSFORMS.filter((t) => t.from === blockType);

    if (available.length === 0) return null;

    const handleTransform = (to: string) => {
        const store = useBuilderStore.getState();
        const block = store.findBlock(blockId);
        if (!block) return;

        const { type, props } = buildTransformedProps(blockType, to, block.props);

        store.pushHistory();

        // Use immer-compatible setState to mutate the block type + props in-place
        useBuilderStore.setState((state) => {
            const target = findBlockInTree(state.blocks, blockId);
            if (target) {
                target.type = type;
                if (props !== block.props) {
                    target.props = props;
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
