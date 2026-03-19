import type { ComponentType } from 'react';
import type { BlockRendererProps, BlockSettingsProps } from './block-registry';

// ── Layout ──
import SectionRenderer from './renderers/section-renderer';
import GridRenderer from './renderers/grid-renderer';
import SpacerRenderer from './renderers/spacer-renderer';
import DividerRenderer from './renderers/divider-renderer';
import ShapeDividerRenderer from './renderers/shape-divider-renderer';

import SectionSettings from './settings/section-settings';
import GridSettings from './settings/grid-settings';
import SpacerSettings from './settings/spacer-settings';
import DividerSettings from './settings/divider-settings';
import ShapeDividerSettings from './settings/shape-divider-settings';

// ── Content ──
import HeadingRenderer from './renderers/heading-renderer';
import TextRenderer from './renderers/text-renderer';
import ButtonRenderer from './renderers/button-renderer';
import HeroRenderer from './renderers/hero-renderer';
import CounterRenderer from './renderers/counter-renderer';
import IconBoxRenderer from './renderers/icon-box-renderer';
import TableRenderer from './renderers/table-renderer';
import AlertRenderer from './renderers/alert-renderer';
import CountdownRenderer from './renderers/countdown-renderer';
import CodeBlockRenderer from './renderers/code-block-renderer';
import BlockquoteRenderer from './renderers/blockquote-renderer';
import ListRenderer from './renderers/list-renderer';
import TeamMembersRenderer from './renderers/team-members-renderer';
import ProgressBarRenderer from './renderers/progress-bar-renderer';
import TimelineRenderer from './renderers/timeline-renderer';
import TocRenderer from './renderers/toc-renderer';

import HeadingSettings from './settings/heading-settings';
import TextSettings from './settings/text-settings';
import ButtonSettings from './settings/button-settings';
import HeroSettings from './settings/hero-settings';
import CounterSettings from './settings/counter-settings';
import IconBoxSettings from './settings/icon-box-settings';
import TableSettings from './settings/table-settings';
import AlertSettings from './settings/alert-settings';
import CountdownSettings from './settings/countdown-settings';
import CodeBlockSettings from './settings/code-block-settings';
import BlockquoteSettings from './settings/blockquote-settings';
import ListSettings from './settings/list-settings';
import TeamMembersSettings from './settings/team-members-settings';
import ProgressBarSettings from './settings/progress-bar-settings';
import TimelineSettings from './settings/timeline-settings';
import TocSettings from './settings/toc-settings';

// ── Media ──
import ImageRenderer from './renderers/image-renderer';
import VideoRenderer from './renderers/video-renderer';
import GalleryRenderer from './renderers/gallery-renderer';
import MapRenderer from './renderers/map-renderer';
import LogoGridRenderer from './renderers/logo-grid-renderer';
import EmbedRenderer from './renderers/embed-renderer';

import ImageSettings from './settings/image-settings';
import VideoSettings from './settings/video-settings';
import GallerySettings from './settings/gallery-settings';
import MapSettings from './settings/map-settings';
import LogoGridSettings from './settings/logo-grid-settings';
import EmbedSettings from './settings/embed-settings';

// ── Interactive ──
import AccordionRenderer from './renderers/accordion-renderer';
import TabsRenderer from './renderers/tabs-renderer';

import AccordionSettings from './settings/accordion-settings';
import TabsSettings from './settings/tabs-settings';

// ── Marketing ──
import TestimonialsRenderer from './renderers/testimonials-renderer';
import PricingTableRenderer from './renderers/pricing-table-renderer';
import CtaRenderer from './renderers/cta-renderer';

import TestimonialsSettings from './settings/testimonials-settings';
import PricingTableSettings from './settings/pricing-table-settings';
import CtaSettings from './settings/cta-settings';

// ── Data / E-commerce ──
import ProductCardRenderer from './renderers/product-card-renderer';
import ProductGridRenderer from './renderers/product-grid-renderer';
import CartWidgetRenderer from './renderers/cart-widget-renderer';
import CheckoutFormRenderer from './renderers/checkout-form-renderer';
import FeaturedProductsRenderer from './renderers/featured-products-renderer';
import FormBlockRenderer from './renderers/form-block-renderer';

import ProductCardSettings from './settings/product-card-settings';
import ProductGridSettings from './settings/product-grid-settings';
import CartWidgetSettings from './settings/cart-widget-settings';
import CheckoutFormSettings from './settings/checkout-form-settings';
import FeaturedProductsSettings from './settings/featured-products-settings';
import FormBlockSettings from './settings/form-block-settings';

// ────────────────────────────────────────────
// Block definition type and registry array
// ────────────────────────────────────────────

export interface CoreBlockDef {
    slug: string;
    label: string;
    icon: string;
    category: 'layout' | 'content' | 'media' | 'data' | 'interactive' | 'marketing';
    renderer: ComponentType<BlockRendererProps>;
    settings: ComponentType<BlockSettingsProps>;
}

export const CORE_BLOCKS: CoreBlockDef[] = [
    // Layout
    { slug: 'section', label: 'Section', icon: 'LayoutTemplate', category: 'layout', renderer: SectionRenderer, settings: SectionSettings },
    { slug: 'grid', label: 'Grille', icon: 'Grid3X3', category: 'layout', renderer: GridRenderer, settings: GridSettings },
    { slug: 'spacer', label: 'Espacement', icon: 'ArrowUpDown', category: 'layout', renderer: SpacerRenderer, settings: SpacerSettings },
    { slug: 'divider', label: 'Separateur', icon: 'Minus', category: 'layout', renderer: DividerRenderer, settings: DividerSettings },
    { slug: 'shape-divider', label: 'Separateur SVG', icon: 'Waves', category: 'layout', renderer: ShapeDividerRenderer, settings: ShapeDividerSettings },

    // Content
    { slug: 'heading', label: 'Titre', icon: 'Heading', category: 'content', renderer: HeadingRenderer, settings: HeadingSettings },
    { slug: 'text', label: 'Texte', icon: 'Type', category: 'content', renderer: TextRenderer, settings: TextSettings },
    { slug: 'button', label: 'Bouton', icon: 'MousePointerClick', category: 'content', renderer: ButtonRenderer, settings: ButtonSettings },
    { slug: 'hero', label: 'Hero', icon: 'Sparkles', category: 'content', renderer: HeroRenderer, settings: HeroSettings },
    { slug: 'counter', label: 'Compteur', icon: 'Hash', category: 'content', renderer: CounterRenderer, settings: CounterSettings },
    { slug: 'icon-box', label: 'Boite icone', icon: 'Box', category: 'content', renderer: IconBoxRenderer, settings: IconBoxSettings },
    { slug: 'table', label: 'Tableau', icon: 'Table', category: 'content', renderer: TableRenderer, settings: TableSettings },
    { slug: 'alert', label: 'Alerte', icon: 'AlertTriangle', category: 'content', renderer: AlertRenderer, settings: AlertSettings },
    { slug: 'countdown', label: 'Compte a rebours', icon: 'Timer', category: 'content', renderer: CountdownRenderer, settings: CountdownSettings },
    { slug: 'code-block', label: 'Bloc de code', icon: 'Code', category: 'content', renderer: CodeBlockRenderer, settings: CodeBlockSettings },
    { slug: 'blockquote', label: 'Citation', icon: 'TextQuote', category: 'content', renderer: BlockquoteRenderer, settings: BlockquoteSettings },
    { slug: 'list', label: 'Liste', icon: 'List', category: 'content', renderer: ListRenderer, settings: ListSettings },
    { slug: 'team-members', label: 'Equipe', icon: 'Users', category: 'content', renderer: TeamMembersRenderer, settings: TeamMembersSettings },
    { slug: 'progress-bar', label: 'Barre de progression', icon: 'BarChart', category: 'content', renderer: ProgressBarRenderer, settings: ProgressBarSettings },
    { slug: 'timeline', label: 'Chronologie', icon: 'GitBranch', category: 'content', renderer: TimelineRenderer, settings: TimelineSettings },
    { slug: 'toc', label: 'Table des matieres', icon: 'ListOrdered', category: 'content', renderer: TocRenderer, settings: TocSettings },

    // Media
    { slug: 'image', label: 'Image', icon: 'Image', category: 'media', renderer: ImageRenderer, settings: ImageSettings },
    { slug: 'video', label: 'Video', icon: 'Play', category: 'media', renderer: VideoRenderer, settings: VideoSettings },
    { slug: 'gallery', label: 'Galerie', icon: 'Images', category: 'media', renderer: GalleryRenderer, settings: GallerySettings },
    { slug: 'map', label: 'Carte', icon: 'MapPin', category: 'media', renderer: MapRenderer, settings: MapSettings },
    { slug: 'logo-grid', label: 'Grille de logos', icon: 'LayoutGrid', category: 'media', renderer: LogoGridRenderer, settings: LogoGridSettings },
    { slug: 'embed', label: 'Integration', icon: 'Link', category: 'media', renderer: EmbedRenderer, settings: EmbedSettings },

    // Interactive
    { slug: 'accordion', label: 'Accordeon', icon: 'ChevronsDown', category: 'interactive', renderer: AccordionRenderer, settings: AccordionSettings },
    { slug: 'tabs', label: 'Onglets', icon: 'PanelTop', category: 'interactive', renderer: TabsRenderer, settings: TabsSettings },

    // Marketing
    { slug: 'testimonials', label: 'Temoignages', icon: 'Quote', category: 'marketing', renderer: TestimonialsRenderer, settings: TestimonialsSettings },
    { slug: 'pricing-table', label: 'Tableau de prix', icon: 'CreditCard', category: 'marketing', renderer: PricingTableRenderer, settings: PricingTableSettings },
    { slug: 'cta', label: "Appel a l'action", icon: 'Megaphone', category: 'marketing', renderer: CtaRenderer, settings: CtaSettings },

    // Data / E-commerce
    { slug: 'product-card', label: 'Fiche produit', icon: 'ShoppingBag', category: 'data', renderer: ProductCardRenderer, settings: ProductCardSettings },
    { slug: 'product-grid', label: 'Grille produits', icon: 'LayoutGrid', category: 'data', renderer: ProductGridRenderer, settings: ProductGridSettings },
    { slug: 'cart-widget', label: 'Panier', icon: 'ShoppingCart', category: 'data', renderer: CartWidgetRenderer, settings: CartWidgetSettings },
    { slug: 'checkout-form', label: 'Formulaire commande', icon: 'CreditCard', category: 'data', renderer: CheckoutFormRenderer, settings: CheckoutFormSettings },
    { slug: 'featured-products', label: 'Produits vedettes', icon: 'Star', category: 'data', renderer: FeaturedProductsRenderer, settings: FeaturedProductsSettings },
    { slug: 'form-block', label: 'Formulaire', icon: 'ClipboardList', category: 'data', renderer: FormBlockRenderer, settings: FormBlockSettings },
];
