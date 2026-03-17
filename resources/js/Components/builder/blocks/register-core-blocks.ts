import { registerBlock } from './block-registry';

import SectionRenderer from './renderers/section-renderer';
import GridRenderer from './renderers/grid-renderer';
import HeadingRenderer from './renderers/heading-renderer';
import TextRenderer from './renderers/text-renderer';
import ImageRenderer from './renderers/image-renderer';
import ButtonRenderer from './renderers/button-renderer';
import HeroRenderer from './renderers/hero-renderer';
import SpacerRenderer from './renderers/spacer-renderer';
import DividerRenderer from './renderers/divider-renderer';
import VideoRenderer from './renderers/video-renderer';
import ProductCardRenderer from './renderers/product-card-renderer';
import ProductGridRenderer from './renderers/product-grid-renderer';
import CartWidgetRenderer from './renderers/cart-widget-renderer';
import CheckoutFormRenderer from './renderers/checkout-form-renderer';
import FeaturedProductsRenderer from './renderers/featured-products-renderer';

import SectionSettings from './settings/section-settings';
import GridSettings from './settings/grid-settings';
import HeadingSettings from './settings/heading-settings';
import TextSettings from './settings/text-settings';
import ImageSettings from './settings/image-settings';
import ButtonSettings from './settings/button-settings';
import HeroSettings from './settings/hero-settings';
import SpacerSettings from './settings/spacer-settings';
import DividerSettings from './settings/divider-settings';
import VideoSettings from './settings/video-settings';
import ProductCardSettings from './settings/product-card-settings';
import ProductGridSettings from './settings/product-grid-settings';
import CartWidgetSettings from './settings/cart-widget-settings';
import CheckoutFormSettings from './settings/checkout-form-settings';
import FeaturedProductsSettings from './settings/featured-products-settings';

// Batch 1 - New blocks
import GalleryRenderer from './renderers/gallery-renderer';
import AccordionRenderer from './renderers/accordion-renderer';
import TabsRenderer from './renderers/tabs-renderer';
import TestimonialsRenderer from './renderers/testimonials-renderer';
import PricingTableRenderer from './renderers/pricing-table-renderer';
import CounterRenderer from './renderers/counter-renderer';
import IconBoxRenderer from './renderers/icon-box-renderer';
import CtaRenderer from './renderers/cta-renderer';
import MapRenderer from './renderers/map-renderer';
import TableRenderer from './renderers/table-renderer';
import AlertRenderer from './renderers/alert-renderer';

import GallerySettings from './settings/gallery-settings';
import AccordionSettings from './settings/accordion-settings';
import TabsSettings from './settings/tabs-settings';
import TestimonialsSettings from './settings/testimonials-settings';
import PricingTableSettings from './settings/pricing-table-settings';
import CounterSettings from './settings/counter-settings';
import IconBoxSettings from './settings/icon-box-settings';
import CtaSettings from './settings/cta-settings';
import MapSettings from './settings/map-settings';
import TableSettings from './settings/table-settings';
import AlertSettings from './settings/alert-settings';

// Batch 2 - New blocks
import CountdownRenderer from './renderers/countdown-renderer';
import CodeBlockRenderer from './renderers/code-block-renderer';
import BlockquoteRenderer from './renderers/blockquote-renderer';
import ListRenderer from './renderers/list-renderer';
import LogoGridRenderer from './renderers/logo-grid-renderer';
import TeamMembersRenderer from './renderers/team-members-renderer';
import ProgressBarRenderer from './renderers/progress-bar-renderer';
import TimelineRenderer from './renderers/timeline-renderer';
import EmbedRenderer from './renderers/embed-renderer';
import FormBlockRenderer from './renderers/form-block-renderer';

import CountdownSettings from './settings/countdown-settings';
import CodeBlockSettings from './settings/code-block-settings';
import BlockquoteSettings from './settings/blockquote-settings';
import ListSettings from './settings/list-settings';
import LogoGridSettings from './settings/logo-grid-settings';
import TeamMembersSettings from './settings/team-members-settings';
import ProgressBarSettings from './settings/progress-bar-settings';
import TimelineSettings from './settings/timeline-settings';
import EmbedSettings from './settings/embed-settings';
import FormBlockSettings from './settings/form-block-settings';

// Batch 3 - TOC & Shape Divider
import TocRenderer from './renderers/toc-renderer';
import TocSettings from './settings/toc-settings';
import ShapeDividerRenderer from './renderers/shape-divider-renderer';
import ShapeDividerSettings from './settings/shape-divider-settings';

let registered = false;

export function registerCoreBlocks() {
    if (registered) return;
    registered = true;

    registerBlock('section', {
        renderer: SectionRenderer,
        settings: SectionSettings,
        label: 'Section',
        icon: 'LayoutTemplate',
        category: 'layout',
    });

    registerBlock('grid', {
        renderer: GridRenderer,
        settings: GridSettings,
        label: 'Grille',
        icon: 'Grid3X3',
        category: 'layout',
    });

    registerBlock('heading', {
        renderer: HeadingRenderer,
        settings: HeadingSettings,
        label: 'Titre',
        icon: 'Heading',
        category: 'content',
    });

    registerBlock('text', {
        renderer: TextRenderer,
        settings: TextSettings,
        label: 'Texte',
        icon: 'Type',
        category: 'content',
    });

    registerBlock('image', {
        renderer: ImageRenderer,
        settings: ImageSettings,
        label: 'Image',
        icon: 'Image',
        category: 'media',
    });

    registerBlock('button', {
        renderer: ButtonRenderer,
        settings: ButtonSettings,
        label: 'Bouton',
        icon: 'MousePointerClick',
        category: 'content',
    });

    registerBlock('hero', {
        renderer: HeroRenderer,
        settings: HeroSettings,
        label: 'Hero',
        icon: 'Sparkles',
        category: 'content',
    });

    registerBlock('spacer', {
        renderer: SpacerRenderer,
        settings: SpacerSettings,
        label: 'Espacement',
        icon: 'ArrowUpDown',
        category: 'layout',
    });

    registerBlock('divider', {
        renderer: DividerRenderer,
        settings: DividerSettings,
        label: 'Separateur',
        icon: 'Minus',
        category: 'layout',
    });

    registerBlock('video', {
        renderer: VideoRenderer,
        settings: VideoSettings,
        label: 'Video',
        icon: 'Play',
        category: 'media',
    });

    registerBlock('product-card', {
        renderer: ProductCardRenderer,
        settings: ProductCardSettings,
        label: 'Fiche produit',
        icon: 'ShoppingBag',
        category: 'data',
    });

    registerBlock('product-grid', {
        renderer: ProductGridRenderer,
        settings: ProductGridSettings,
        label: 'Grille produits',
        icon: 'LayoutGrid',
        category: 'data',
    });

    registerBlock('cart-widget', {
        renderer: CartWidgetRenderer,
        settings: CartWidgetSettings,
        label: 'Panier',
        icon: 'ShoppingCart',
        category: 'data',
    });

    registerBlock('checkout-form', {
        renderer: CheckoutFormRenderer,
        settings: CheckoutFormSettings,
        label: 'Formulaire commande',
        icon: 'CreditCard',
        category: 'data',
    });

    registerBlock('featured-products', {
        renderer: FeaturedProductsRenderer,
        settings: FeaturedProductsSettings,
        label: 'Produits vedettes',
        icon: 'Star',
        category: 'data',
    });

    // ---- Batch 1: Interactive & marketing blocks ----

    registerBlock('gallery', {
        renderer: GalleryRenderer,
        settings: GallerySettings,
        label: 'Galerie',
        icon: 'Images',
        category: 'media',
    });

    registerBlock('accordion', {
        renderer: AccordionRenderer,
        settings: AccordionSettings,
        label: 'Accordéon',
        icon: 'ChevronsDown',
        category: 'interactive',
    });

    registerBlock('tabs', {
        renderer: TabsRenderer,
        settings: TabsSettings,
        label: 'Onglets',
        icon: 'PanelTop',
        category: 'interactive',
    });

    registerBlock('testimonials', {
        renderer: TestimonialsRenderer,
        settings: TestimonialsSettings,
        label: 'Témoignages',
        icon: 'Quote',
        category: 'marketing',
    });

    registerBlock('pricing-table', {
        renderer: PricingTableRenderer,
        settings: PricingTableSettings,
        label: 'Tableau de prix',
        icon: 'CreditCard',
        category: 'marketing',
    });

    registerBlock('counter', {
        renderer: CounterRenderer,
        settings: CounterSettings,
        label: 'Compteur',
        icon: 'Hash',
        category: 'content',
    });

    registerBlock('icon-box', {
        renderer: IconBoxRenderer,
        settings: IconBoxSettings,
        label: 'Boîte icône',
        icon: 'Box',
        category: 'content',
    });

    registerBlock('cta', {
        renderer: CtaRenderer,
        settings: CtaSettings,
        label: 'Appel à l\'action',
        icon: 'Megaphone',
        category: 'marketing',
    });

    registerBlock('map', {
        renderer: MapRenderer,
        settings: MapSettings,
        label: 'Carte',
        icon: 'MapPin',
        category: 'media',
    });

    registerBlock('table', {
        renderer: TableRenderer,
        settings: TableSettings,
        label: 'Tableau',
        icon: 'Table',
        category: 'content',
    });

    registerBlock('alert', {
        renderer: AlertRenderer,
        settings: AlertSettings,
        label: 'Alerte',
        icon: 'AlertTriangle',
        category: 'content',
    });

    // ---- Batch 2: New content blocks ----

    registerBlock('countdown', {
        renderer: CountdownRenderer,
        settings: CountdownSettings,
        label: 'Compte à rebours',
        icon: 'Timer',
        category: 'content',
    });

    registerBlock('code-block', {
        renderer: CodeBlockRenderer,
        settings: CodeBlockSettings,
        label: 'Bloc de code',
        icon: 'Code',
        category: 'content',
    });

    registerBlock('blockquote', {
        renderer: BlockquoteRenderer,
        settings: BlockquoteSettings,
        label: 'Citation',
        icon: 'TextQuote',
        category: 'content',
    });

    registerBlock('list', {
        renderer: ListRenderer,
        settings: ListSettings,
        label: 'Liste',
        icon: 'List',
        category: 'content',
    });

    registerBlock('logo-grid', {
        renderer: LogoGridRenderer,
        settings: LogoGridSettings,
        label: 'Grille de logos',
        icon: 'LayoutGrid',
        category: 'media',
    });

    registerBlock('team-members', {
        renderer: TeamMembersRenderer,
        settings: TeamMembersSettings,
        label: 'Équipe',
        icon: 'Users',
        category: 'content',
    });

    registerBlock('progress-bar', {
        renderer: ProgressBarRenderer,
        settings: ProgressBarSettings,
        label: 'Barre de progression',
        icon: 'BarChart',
        category: 'content',
    });

    registerBlock('timeline', {
        renderer: TimelineRenderer,
        settings: TimelineSettings,
        label: 'Chronologie',
        icon: 'GitBranch',
        category: 'content',
    });

    registerBlock('embed', {
        renderer: EmbedRenderer,
        settings: EmbedSettings,
        label: 'Intégration',
        icon: 'Link',
        category: 'media',
    });

    registerBlock('form-block', {
        renderer: FormBlockRenderer,
        settings: FormBlockSettings,
        label: 'Formulaire',
        icon: 'ClipboardList',
        category: 'data',
    });

    // ---- Batch 3: TOC & Shape Divider ----

    registerBlock('toc', {
        renderer: TocRenderer,
        settings: TocSettings,
        label: 'Table des matieres',
        icon: 'ListOrdered',
        category: 'content',
    });

    registerBlock('shape-divider', {
        renderer: ShapeDividerRenderer,
        settings: ShapeDividerSettings,
        label: 'Separateur SVG',
        icon: 'Waves',
        category: 'layout',
    });
}
