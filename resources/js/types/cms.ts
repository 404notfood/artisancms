export interface PageData {
    id: number;
    title: string;
    slug: string;
    content: BlockNode[] | null;
    status: 'draft' | 'published' | 'pending_review' | 'approved' | 'scheduled' | 'trash';
    access_level: string;
    rejection_reason: string | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    template: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_image: string | null;
    parent_id: number | null;
    order: number;
    created_by: number | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author?: UserData;
    parent?: PageData;
    children?: PageData[];
}

export interface PostData {
    id: number;
    title: string;
    slug: string;
    content: BlockNode[] | null;
    excerpt: string | null;
    status: 'draft' | 'published' | 'pending_review' | 'approved' | 'scheduled' | 'trash';
    access_level: string;
    rejection_reason: string | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    featured_image: string | null;
    created_by: number | null;
    published_at: string | null;
    allow_comments: boolean;
    created_at: string;
    updated_at: string;
    author?: UserData;
    terms?: TaxonomyTermData[];
}

export interface MediaData {
    id: number;
    filename: string;
    original_filename: string;
    path: string;
    disk: string;
    mime_type: string;
    size: number;
    alt_text: string | null;
    title: string | null;
    caption: string | null;
    metadata: Record<string, unknown> | null;
    thumbnails: Record<string, string> | null;
    folder: string | null;
    uploaded_by: number | null;
    url: string;
    created_at: string;
    updated_at: string;
}

export interface MenuData {
    id: number;
    name: string;
    slug: string;
    location: string | null;
    items: MenuItemData[];
}

export interface MenuItemData {
    id: number;
    menu_id: number;
    parent_id: number | null;
    label: string;
    type: 'page' | 'post' | 'url' | 'custom' | 'taxonomy';
    url: string | null;
    target: string;
    css_class: string | null;
    icon: string | null;
    is_mega: boolean;
    mega_columns: number;
    mega_content: MegaMenuContent | null;
    badge_text: string | null;
    badge_color: string | null;
    order: number;
    children?: MenuItemData[];
}

export interface MegaMenuContent {
    featured_image?: string | null;
    featured_title?: string | null;
    featured_description?: string | null;
    columns?: MegaMenuColumn[];
}

export interface MegaMenuColumn {
    title?: string;
    content?: string;
}

export interface GlobalSectionData {
    id: number;
    name: string;
    slug: string;
    type: 'header' | 'footer';
    content: BlockNode[] | null;
    status: 'active' | 'inactive';
    site_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface TaxonomyData {
    id: number;
    name: string;
    slug: string;
    type: string;
    description: string | null;
    hierarchical: boolean;
    applies_to: string[] | null;
    terms?: TaxonomyTermData[];
}

export interface TaxonomyTermData {
    id: number;
    taxonomy_id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    order: number;
    children?: TaxonomyTermData[];
    taxonomy?: TaxonomyData;
    posts_count?: number;
}

export interface UserData {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    role_id: number | null;
    role?: RoleData;
    created_at?: string;
    updated_at?: string;
}

export interface RoleData {
    id: number;
    name: string;
    slug: string;
    permissions: string[];
    is_system: boolean;
}

export interface SettingData {
    id: number;
    group: string;
    key: string;
    value: unknown;
    type: string;
    is_public: boolean;
}

export interface BlockNode {
    id: string;
    type: string;
    props: Record<string, unknown>;
    /** @deprecated Legacy alias for props — some stored JSON uses "settings" */
    settings?: Record<string, unknown>;
    children?: BlockNode[];
}

export interface CmsPluginData {
    id: number;
    slug: string;
    name: string;
    version: string | null;
    description: string | null;
    author: string | null;
    enabled: boolean;
    settings: Record<string, unknown> | null;
}

export interface CmsThemeData {
    id: number;
    slug: string;
    name: string;
    version: string | null;
    description: string | null;
    author: string | null;
    active: boolean;
    settings: Record<string, unknown> | null;
    customizations: Record<string, unknown> | null;
}

export interface BlockDefinition {
    id: number;
    slug: string;
    name: string;
    category: 'layout' | 'content' | 'navigation' | 'data' | 'media';
    icon: string | null;
    schema: Record<string, unknown> | null;
    default_props: Record<string, unknown> | null;
    is_core: boolean;
    source: string;
}

export interface RevisionData {
    id: number;
    revisionable_type: string;
    revisionable_id: number;
    data: Record<string, unknown>;
    reason: string | null;
    created_by: number | null;
    created_at: string;
    creator?: { id: number; name: string };
}

export interface RedirectData {
    id: number;
    source_path: string;
    target_url: string;
    status_code: number;
    hits: number;
    active: boolean;
    note: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

export interface CookieConsentConfig {
    enabled: boolean;
    position: 'bottom' | 'top';
    type: 'opt-in' | 'opt-out' | 'info-only';
    privacy_url: string;
}

export interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    consented_at: string;
}

export interface SocialSharingProps {
    url: string;
    title: string;
    description?: string;
    image?: string;
    direction?: 'horizontal' | 'vertical';
}

export interface SharedProps {
    auth: {
        user: UserData;
    };
    flash: FlashMessages;
    translations: Record<string, string>;
    locale: string;
    cms: {
        name: string;
        version: string;
        enabledPlugins: string[];
    };
    sidebar_badges?: Record<string, number>;
    cookie_consent: CookieConsentConfig;
    [key: string]: unknown;
}

// ---- Content Types (Custom Post Types) ----

export interface ContentTypeData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    fields: ContentTypeFieldDef[];
    supports: string[];
    has_archive: boolean;
    public: boolean;
    menu_position: number;
    entries_count?: number;
    created_at: string;
    updated_at: string;
}

export interface ContentTypeFieldDef {
    name: string;
    slug: string;
    type: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'date' | 'datetime' | 'select' | 'checkbox' | 'radio' | 'file' | 'image' | 'color' | 'wysiwyg';
    required: boolean;
    placeholder?: string;
    options?: string[];
    order: number;
}

export interface ContentEntryData {
    id: number;
    content_type_id: number;
    title: string;
    slug: string;
    content: BlockNode[] | null;
    excerpt: string | null;
    featured_image: string | null;
    status: 'draft' | 'published' | 'scheduled' | 'trash';
    fields_data: Record<string, unknown>;
    created_by: number | null;
    published_at: string | null;
    author?: UserData;
    content_type?: ContentTypeData;
    created_at: string;
    updated_at: string;
}

// ---- E-commerce Types ----

export interface ProductData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    compare_price: number | null;
    sku: string | null;
    stock: number;
    status: 'draft' | 'published' | 'archived';
    featured_image: string | null;
    gallery: string[] | null;
    category_id: number | null;
    low_stock_threshold: number | null;
    category?: ProductCategoryData;
    variants?: ProductVariantData[];
    created_at: string;
    updated_at: string;
}

export interface ProductCategoryData {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    description: string | null;
    image: string | null;
    order: number;
    children?: ProductCategoryData[];
    products_count?: number;
}

export interface ProductVariantData {
    id: number;
    product_id: number;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    attributes: Record<string, string> | null;
}

export interface OrderData {
    id: number;
    user_id: number | null;
    status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    payment_method: string | null;
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    shipping_address: AddressData | null;
    billing_address: AddressData | null;
    notes: string | null;
    items?: OrderItemData[];
    user?: { id: number; name: string; email: string };
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrderItemData {
    id: number;
    order_id: number;
    product_id: number | null;
    variant_id: number | null;
    name: string;
    price: number;
    quantity: number;
    total: number;
}

export interface AddressData {
    first_name: string;
    last_name: string;
    address: string;
    address2?: string;
    city: string;
    postal_code: string;
    country: string;
    phone?: string;
}

export interface CouponData {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_order: number | null;
    max_uses: number | null;
    used_count: number;
    starts_at: string | null;
    expires_at: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EcommerceSettingsData {
    currency: string;
    currency_symbol: string;
    tax_rate: number;
    free_shipping_threshold: number;
    shipping_cost: number;
    store_name: string;
}

// ---- Comments Types ----

export interface CommentData {
    id: number;
    post_id: number;
    parent_id: number | null;
    author_name: string;
    author_email: string;
    user_id: number | null;
    content: string;
    status: 'pending' | 'approved' | 'spam' | 'trash';
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    updated_at: string;
    post?: PostData;
    user?: UserData;
    parent?: CommentData;
    replies?: CommentData[];
}

// ---- Content Relations Types ----

export interface ContentRelationData {
    id: number;
    source_type: string;
    source_id: number;
    related_type: string;
    related_id: number;
    order: number;
    created_at: string;
}

// ---- Custom Fields Types ----

export interface CustomFieldGroupData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    applies_to: string[];
    position: 'normal' | 'side';
    order: number;
    active: boolean;
    fields_count?: number;
    fields?: CustomFieldData[];
    created_at: string;
    updated_at: string;
}

export interface CustomFieldData {
    id: number;
    group_id: number;
    name: string;
    slug: string;
    type: CustomFieldType;
    description: string | null;
    placeholder: string | null;
    default_value: string | null;
    options: CustomFieldOption[] | null;
    validation: CustomFieldValidation | null;
    order: number;
    created_at: string;
    updated_at: string;
}

export type CustomFieldType =
    | 'text'
    | 'textarea'
    | 'wysiwyg'
    | 'number'
    | 'email'
    | 'url'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'image'
    | 'file'
    | 'date'
    | 'datetime'
    | 'color'
    | 'repeater';

export interface CustomFieldOption {
    label: string;
    value: string;
}

export interface CustomFieldValidation {
    required?: boolean;
    min?: number;
    max?: number;
    [key: string]: unknown;
}

// ---- Widget Types ----

export type WidgetType =
    | 'recent_posts'
    | 'categories'
    | 'search'
    | 'text'
    | 'custom_html'
    | 'archives'
    | 'tag_cloud'
    | string;

export interface WidgetData {
    id: number;
    widget_area_id: number;
    type: WidgetType;
    title: string;
    config: Record<string, unknown> | null;
    order: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface WidgetAreaData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    site_id: number | null;
    widgets: WidgetData[];
    created_at: string;
    updated_at: string;
}

export interface WidgetTypeDefinition {
    label: string;
    icon: string;
    defaultConfig: Record<string, unknown>;
}

// ---- E-commerce Extended Types ----

export interface ShippingZoneData {
    id: number;
    name: string;
    countries: string[];
    is_default: boolean;
    methods?: ShippingMethodData[];
    created_at: string;
    updated_at: string;
}

export interface ShippingMethodData {
    id: number;
    shipping_zone_id: number;
    name: string;
    type: 'flat' | 'free' | 'weight_based' | 'price_based';
    cost: number;
    min_order_amount: number | null;
    min_weight: number | null;
    max_weight: number | null;
    active: boolean;
    order: number;
}

export interface TaxRuleData {
    id: number;
    name: string;
    country_code: string | null;
    region: string | null;
    rate: number;
    priority: number;
    compound: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethodData {
    id: number;
    name: string;
    slug: string;
    driver: 'stripe' | 'paypal' | 'cod' | 'bank_transfer';
    active: boolean;
    order: number;
    config?: Record<string, string>;
}

export interface ProductReviewData {
    id: number;
    product_id: number;
    user_id: number | null;
    author_name: string;
    author_email: string;
    rating: number;
    title: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    verified_purchase: boolean;
    admin_reply: string | null;
    product?: ProductData;
    user?: UserData;
    created_at: string;
    updated_at: string;
}

export interface CustomerAddressData {
    id: number;
    user_id: number;
    label: string;
    first_name: string;
    last_name: string;
    address: string;
    address2: string | null;
    city: string;
    postal_code: string;
    country: string;
    phone: string | null;
    is_default_shipping: boolean;
    is_default_billing: boolean;
}

export interface WishlistItemData {
    id: number;
    product_id: number;
    variant_id: number | null;
    product?: ProductData;
    variant?: ProductVariantData;
    created_at: string;
}

export interface StockMovementData {
    id: number;
    product_id: number;
    variant_id: number | null;
    type: 'sale' | 'return' | 'adjustment' | 'restock';
    quantity: number;
    reference: string | null;
    created_by: number | null;
    creator?: { id: number; name: string };
    created_at: string;
}

// ---- Notifications ----

export interface NotificationData {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

// ---- Newsletter ----

export interface NewsletterSubscriberData {
    id: number;
    email: string;
    name: string | null;
    status: 'active' | 'unsubscribed';
    subscribed_at: string;
    unsubscribed_at: string | null;
    created_at: string;
    updated_at: string;
}

// ---- Popups ----

export interface PopupData {
    id: number;
    name: string;
    title: string;
    content: string;
    type: 'modal' | 'banner' | 'slide-in';
    trigger: 'page_load' | 'exit_intent' | 'scroll' | 'delay';
    trigger_value: string | null;
    display_frequency: 'always' | 'once' | 'once_per_session';
    pages: string[] | null;
    cta_text: string | null;
    cta_url: string | null;
    style: Record<string, string>;
    active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
}

// ---- Preview Tokens ----

export interface PreviewTokenData {
    id: number;
    token: string;
    expires_at: string;
    url: string;
}
