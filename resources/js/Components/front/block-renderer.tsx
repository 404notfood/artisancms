import type { BlockNode } from '@/types/cms';

// Reuse existing builder renderers
import SectionRenderer from '@/Components/builder/blocks/renderers/section-renderer';
import GridRenderer from '@/Components/builder/blocks/renderers/grid-renderer';
import HeadingRenderer from '@/Components/builder/blocks/renderers/heading-renderer';
import TextRenderer from '@/Components/builder/blocks/renderers/text-renderer';
import ImageRenderer from '@/Components/builder/blocks/renderers/image-renderer';
import ButtonRenderer from '@/Components/builder/blocks/renderers/button-renderer';
import HeroRenderer from '@/Components/builder/blocks/renderers/hero-renderer';
import SpacerRenderer from '@/Components/builder/blocks/renderers/spacer-renderer';
import DividerRenderer from '@/Components/builder/blocks/renderers/divider-renderer';
import VideoRenderer from '@/Components/builder/blocks/renderers/video-renderer';
import type { BlockRendererProps } from '@/Components/builder/blocks/block-registry';
import type { ComponentType } from 'react';

/**
 * Map of block type slugs to their renderer components.
 * All renderers are reused from the page builder.
 */
const rendererMap: Record<string, ComponentType<BlockRendererProps>> = {
    section: SectionRenderer,
    grid: GridRenderer,
    heading: HeadingRenderer,
    text: TextRenderer,
    image: ImageRenderer,
    button: ButtonRenderer,
    hero: HeroRenderer,
    spacer: SpacerRenderer,
    divider: DividerRenderer,
    video: VideoRenderer,
};

interface BlockRendererComponentProps {
    block: BlockNode;
}

/**
 * Public-facing block renderer.
 * Renders blocks recursively for the front-end site.
 * Passes isSelected=false and isEditing=false to all renderers
 * since the front-end is read-only.
 */
export default function BlockRenderer({ block }: BlockRendererComponentProps) {
    const Renderer = rendererMap[block.type];

    if (!Renderer) {
        // Unknown block type - skip silently on the public site
        return null;
    }

    // Recursively render children for container blocks (section, grid)
    const children = block.children?.length
        ? block.children.map((child) => (
              <BlockRenderer key={child.id} block={child} />
          ))
        : undefined;

    return (
        <Renderer
            block={block}
            isSelected={false}
            isEditing={false}
        >
            {children}
        </Renderer>
    );
}
