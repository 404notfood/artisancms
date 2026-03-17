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
import EmbedRenderer from '@/Components/builder/blocks/renderers/embed-renderer';
import GalleryRenderer from '@/Components/builder/blocks/renderers/gallery-renderer';
import AccordionRenderer from '@/Components/builder/blocks/renderers/accordion-renderer';
import TabsRenderer from '@/Components/builder/blocks/renderers/tabs-renderer';
import TestimonialsRenderer from '@/Components/builder/blocks/renderers/testimonials-renderer';
import PricingTableRenderer from '@/Components/builder/blocks/renderers/pricing-table-renderer';
import CounterRenderer from '@/Components/builder/blocks/renderers/counter-renderer';
import IconBoxRenderer from '@/Components/builder/blocks/renderers/icon-box-renderer';
import CtaRenderer from '@/Components/builder/blocks/renderers/cta-renderer';
import MapRenderer from '@/Components/builder/blocks/renderers/map-renderer';
import TableRenderer from '@/Components/builder/blocks/renderers/table-renderer';
import AlertRenderer from '@/Components/builder/blocks/renderers/alert-renderer';
import CountdownRenderer from '@/Components/builder/blocks/renderers/countdown-renderer';
import CodeBlockRenderer from '@/Components/builder/blocks/renderers/code-block-renderer';
import BlockquoteRenderer from '@/Components/builder/blocks/renderers/blockquote-renderer';
import ListRenderer from '@/Components/builder/blocks/renderers/list-renderer';
import LogoGridRenderer from '@/Components/builder/blocks/renderers/logo-grid-renderer';
import TeamMembersRenderer from '@/Components/builder/blocks/renderers/team-members-renderer';
import ProgressBarRenderer from '@/Components/builder/blocks/renderers/progress-bar-renderer';
import TimelineRenderer from '@/Components/builder/blocks/renderers/timeline-renderer';
import FormBlockRenderer from '@/Components/builder/blocks/renderers/form-block-renderer';
import ProductCardRenderer from '@/Components/builder/blocks/renderers/product-card-renderer';
import ProductGridRenderer from '@/Components/builder/blocks/renderers/product-grid-renderer';
import CartWidgetRenderer from '@/Components/builder/blocks/renderers/cart-widget-renderer';
import CheckoutFormRenderer from '@/Components/builder/blocks/renderers/checkout-form-renderer';
import FeaturedProductsRenderer from '@/Components/builder/blocks/renderers/featured-products-renderer';
import TocRenderer from '@/Components/builder/blocks/renderers/toc-renderer';
import ShapeDividerRenderer from '@/Components/builder/blocks/renderers/shape-divider-renderer';
import AnimateOnScroll from './animate-on-scroll';
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
    embed: EmbedRenderer,
    gallery: GalleryRenderer,
    accordion: AccordionRenderer,
    tabs: TabsRenderer,
    testimonials: TestimonialsRenderer,
    'pricing-table': PricingTableRenderer,
    counter: CounterRenderer,
    'icon-box': IconBoxRenderer,
    cta: CtaRenderer,
    map: MapRenderer,
    table: TableRenderer,
    alert: AlertRenderer,
    countdown: CountdownRenderer,
    'code-block': CodeBlockRenderer,
    blockquote: BlockquoteRenderer,
    list: ListRenderer,
    'logo-grid': LogoGridRenderer,
    'team-members': TeamMembersRenderer,
    'progress-bar': ProgressBarRenderer,
    timeline: TimelineRenderer,
    'form-block': FormBlockRenderer,
    'product-card': ProductCardRenderer,
    'product-grid': ProductGridRenderer,
    'cart-widget': CartWidgetRenderer,
    'checkout-form': CheckoutFormRenderer,
    'featured-products': FeaturedProductsRenderer,
    toc: TocRenderer,
    'shape-divider': ShapeDividerRenderer,
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

    const animation = block.props?.animation as { type?: string; duration?: number; delay?: number; easing?: string } | undefined;
    const hasAnimation = animation && animation.type && animation.type !== 'none';

    const rendered = (
        <Renderer
            block={block}
            isSelected={false}
            isEditing={false}
        >
            {children}
        </Renderer>
    );

    if (hasAnimation) {
        return <AnimateOnScroll animation={animation}>{rendered}</AnimateOnScroll>;
    }

    return rendered;
}
