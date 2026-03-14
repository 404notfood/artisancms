# CMS Competitive Analysis - Exhaustive Feature Comparison

> Last updated: March 2026
> Purpose: Identify EVERY feature across the top 10 CMS platforms to ensure ArtisanCMS covers all essential capabilities.

---

## Table of Contents

1. [WordPress](#1-wordpress)
2. [Joomla](#2-joomla)
3. [Drupal](#3-drupal)
4. [PrestaShop](#4-prestashop)
5. [Magento / Adobe Commerce](#5-magento--adobe-commerce)
6. [Shopify](#6-shopify)
7. [Wix](#7-wix)
8. [Squarespace](#8-squarespace)
9. [Ghost](#9-ghost)
10. [Strapi](#10-strapi)

---

## 1. WordPress

**Type:** Open-source CMS (self-hosted) | **License:** GPLv2 | **Stack:** PHP/MySQL | **Market Share:** ~43% of all websites

### 1.1 Core Content Management
- Posts (blog entries) with categories, tags, and custom taxonomies
- Pages (hierarchical, static content)
- Custom Post Types (CPTs) - register unlimited custom content types
- Custom Taxonomies (hierarchical and flat)
- Media Library with drag-and-drop upload, grid/list views, image editing (crop, rotate, scale, flip)
- Media folders (via plugins), audio/video embedding
- AVIF, WebP, JPEG, PNG, GIF, SVG (via plugin) support
- Automatic image srcset generation for responsive images
- Lazy loading for images (native since WP 5.5)
- Post formats (aside, gallery, link, image, quote, status, video, audio, chat)
- Sticky posts
- Post excerpts (manual and auto-generated)
- Featured images / post thumbnails
- Content scheduling (future publish date)
- Post password protection
- Post visibility (public, private, password-protected)
- Trash / soft delete with configurable retention
- Bulk actions (edit, delete, move to trash)
- Quick Edit (inline editing from list views)
- Inline link editing
- Copy/paste from Google Docs/Word with formatting preservation

### 1.2 Block Editor (Gutenberg)
- 90+ core blocks: Paragraph, Heading, List, Image, Gallery, Quote, Audio, Cover, File, Video, Table, Code, Preformatted, Pullquote, Verse, Buttons, Columns, Group, Row, Stack, Media & Text, Separator, Spacer, Page Break, More, Nextpage, Embed (30+ providers), Social Icons, RSS, Search, Tag Cloud, Archives, Calendar, Categories, Latest Posts, Latest Comments, Page List, Navigation, Site Logo, Site Title, Site Tagline, Query Loop, Post Title, Post Content, Post Date, Post Excerpt, Post Featured Image, Post Author, Post Comments, Comments Title, Comments Form, Comment Author, Comment Date, Comment Content, Comment Edit Link, Comment Reply Link, Comments Pagination
- **New blocks (6.9):** Accordion, Math, Terms Query, Time to Read / Word Count
- Reusable blocks (synced patterns)
- Block patterns (pre-built layouts)
- Block variations
- Block locking (prevent moving/removing)
- Block-level notes/comments for collaboration (6.9)
- Hide/Show blocks without deleting (6.9)
- Block styles (pre-defined style variations)
- Block supports: color, typography, spacing, border, dimensions
- Block bindings API (connect blocks to dynamic data sources)
- Custom block development (React-based)
- Inner blocks / nested blocks
- Block transforms (convert between block types)
- Block directory (install blocks from editor)
- Block-based widgets
- Template editing
- Global styles (site-wide design settings)
- Style Book (visual overview of all block styles)
- Keyboard shortcuts (Ctrl+B bold, Ctrl+I italic, Ctrl+K link, Ctrl+Z undo, Ctrl+Shift+Z redo, / quick inserter, etc.)
- Drag-and-drop block reordering
- Block movers (up/down arrows)
- List View (outline/tree view of all blocks)
- Document outline (heading structure)
- Spotlight mode (dim other blocks)
- Fullscreen mode
- Top toolbar mode
- Code editor toggle (HTML)
- Block HTML editing
- Copy/paste blocks between posts
- Block export/import
- Responsive preview (desktop, tablet, mobile)
- Command Palette (quick actions search, WP 6.3+)
- Undo/redo (unlimited history in session)
- Autosave (configurable interval, default 60s)
- Post revisions with visual diff comparison
- Post revisions restore
- Content-only editing mode

### 1.3 Site Editor (Full Site Editing)
- Template editing (index, single, page, archive, search, 404, etc.)
- Template parts (header, footer, sidebar)
- Multiple templates per slug (6.9)
- Template hierarchy visualization
- Global styles: colors, typography, spacing, layout
- Style variations (pre-built design presets)
- Custom CSS (global and per-block)
- Theme blocks (site logo, site title, navigation, query loop, etc.)
- Navigation block (mega menu support)
- Pattern manager (create, edit, manage patterns)
- Export theme (download current design as theme)
- Theme switching safety improvements (6.9)

### 1.4 Page Builder Ecosystem (Elementor)
- 40+ free widgets, 100+ pro widgets
- Drag-and-drop visual builder
- Section/Column/Widget hierarchy
- Inline text editing
- Global widgets (reusable across site)
- Global colors and fonts
- Theme Builder (header, footer, single, archive, search, 404)
- Popup Builder with display conditions
- Form builder (contact, login, registration)
- WooCommerce Builder (product page, cart, checkout, my account)
- Motion effects (parallax, mouse effects, scrolling effects)
- Custom CSS per element
- Dynamic content (connect to ACF, CPT, etc.)
- Custom code widget (HTML, JS, CSS)
- Responsive editing (desktop, tablet, mobile breakpoints)
- Custom breakpoints
- Responsive visibility (hide on specific devices)
- Navigator panel (layers/tree view)
- Finder (search any page/template/setting)
- Revision history with restore
- Copy/paste styles between elements
- Import/export templates
- Template library (300+ templates)
- Kit library (complete website kits)
- SVG support
- Shape dividers
- Box shadows, text shadows
- Gradient backgrounds
- Background overlays
- Background video
- Sticky elements
- Scroll snap
- Animated headlines
- Lottie animations
- Flip box
- Image hotspots
- Table of contents
- Price list/table
- Countdown timer
- Progress bar
- Testimonial carousel
- Posts grid/carousel
- Portfolio widget
- Tabs, accordion, toggle
- Breadcrumbs
- Back to top button
- AI integration (generate text, images, code, custom CSS)
- Loop Builder (dynamic content queries)
- Flexbox container layout
- CSS Grid layout
- Role-based access to editor features
- Notes (collaboration comments)
- Version control
- Performance optimization (DOM output, asset loading)

### 1.5 Custom Fields (ACF / Advanced Custom Fields)
- 30+ field types: Text, Textarea, Number, Range, Email, URL, Password, Image, File, oEmbed, WYSIWYG, Select, Checkbox, Radio, Button Group, True/False, Link, Post Object, Page Link, Relationship, Taxonomy, User, Google Map, Date Picker, Date Time Picker, Time Picker, Color Picker, Icon Picker, Accordion, Message, Tab, Group, Repeater, Flexible Content, Clone, Gallery
- Custom Post Type registration (UI-based)
- Custom Taxonomy registration (UI-based)
- Field groups with location rules (post type, page template, user role, etc.)
- Conditional logic (show/hide fields based on other field values)
- Bi-directional relationships
- Options pages (global settings)
- ACF Blocks (register Gutenberg blocks via ACF fields)
- ACF Blocks V3 inline editing
- REST API integration
- JSON/PHP field synchronization
- Local JSON (version-controlled field definitions)
- Import/export field groups
- Clone fields (reuse field groups)
- Flexible Content (layout builder within posts)
- Repeater (unlimited sub-fields)
- Taxonomy field with hierarchy
- Gallery field with sort order

### 1.6 SEO (Yoast SEO)
- SEO analysis (title, meta description, keyphrase, content analysis)
- Readability analysis (Flesch reading ease, passive voice, sentence length, etc.)
- Focus keyphrase optimization
- Related keyphrases (Premium)
- Cornerstone content marking
- Internal linking suggestions (Premium)
- SEO title and meta description templates (with variables)
- SERP preview (desktop and mobile)
- XML Sitemap generation (auto-updated)
- News Sitemap (Premium)
- Video Sitemap (Premium)
- Schema.org / structured data (Article, FAQ, HowTo, Product, etc.)
- Breadcrumbs (with customizable separator, taxonomy selection)
- Canonical URL management
- Robots.txt management
- Meta robots per post/page (noindex, nofollow)
- Open Graph (Facebook) meta tags
- Twitter Card meta tags
- Social preview (Facebook, Twitter)
- Redirect manager (301, 302, 307, 410)
- Orphaned content detection (Premium)
- Stale content alerts (Premium)
- AI title/description generation (Premium)
- AI content summarization (Premium)
- Google Search Console integration
- IndexNow integration
- Multilingual SEO (WPML/Polylang integration)
- WooCommerce SEO
- Local SEO (Premium - Google Business Profile, store locator, local schema)
- Crawl settings (optimize crawl budget)
- RSS feed optimization
- Primary category selection
- Permalink structure recommendations

### 1.7 E-commerce (WooCommerce)
- Product types: Simple, Variable, Grouped, External/Affiliate, Virtual, Downloadable
- Product attributes and variations (size, color, etc.)
- Product categories and tags
- Product images and galleries
- Product reviews and ratings
- Stock management (SKU, quantity, backorders, low stock threshold)
- Product visibility (catalog, search, hidden)
- Related products, upsells, cross-sells
- Product bundles (via extension)
- Product subscriptions (via extension)
- Product bookings/appointments (via extension)
- Cost of Goods Sold (COGS) - native in 2025
- Brand management - native in 2025
- Unique product identifiers (GTIN, MPN, ISBN)
- Shopping cart with quantity editing
- Mini cart / cart drawer
- Checkout: multi-step or single-page
- Guest checkout
- Account creation at checkout
- Payment gateways: WooPayments, PayPal, Stripe, Amazon Pay, bank transfer, COD, check (50+ gateways)
- Shipping methods: flat rate, free shipping, local pickup, table rate
- Shipping zones
- Shipping classes
- Real-time carrier rates (USPS, FedEx, UPS, DHL)
- Tax calculation (automatic by location)
- Tax classes (standard, reduced, zero)
- Tax reports
- Coupon system (percentage, fixed cart, fixed product, free shipping)
- Coupon restrictions (min/max spend, product, category, email)
- Coupon usage limits
- Gift cards (via extension)
- Order management (processing, on-hold, completed, cancelled, refunded)
- Order notes
- Partial refunds
- Manual orders
- Order editing
- Order status emails (customizable)
- Invoice generation (via extension)
- Packing slips (via extension)
- Customer accounts and order history
- Wishlist (via extension)
- Compare products (via extension)
- Recently viewed products
- Advanced reporting (revenue, orders, products, categories, coupons, stock, taxes)
- Dashboard analytics
- High-Performance Order Storage (HPOS) - 5x faster order processing
- Cart and checkout blocks (Gutenberg-native)
- Store notices
- Store policies pages (privacy, terms, refund)
- Currency switching (via extension)
- Multi-currency (via extension)
- REST API (products, orders, customers, reports, coupons, etc.)
- Webhooks (order created, product updated, etc.)
- WooCommerce CLI
- Action Scheduler (background job processing)
- Email customizer
- Marketplace/multivendor (via extensions like Dokan)
- Auction (via extension)
- Points and rewards (via extension)
- Affiliate system (via extension)
- Print on demand (via extension)
- Dropshipping (via extension)
- Product CSV import/export
- Customer CSV import/export
- Order CSV export
- Tax CSV import
- WooCommerce Blocks (product grid, featured product, cart, checkout, etc.)
- Store API (headless commerce)

### 1.8 Forms (Gravity Forms)
- 30+ field types: Text, Textarea, Number, Phone, Email, Website, Date, Time, Address, Name, File Upload, CAPTCHA, Hidden, HTML, Section Break, Page Break, Consent, Dropdown, Radio, Checkboxes, Multiselect, List, Price (product, option, shipping, total)
- Conditional logic (show/hide fields, pages, buttons, notifications)
- Multi-page forms with progress bar
- Save and continue (partial submissions)
- File uploads (multi-file, drag-and-drop)
- Calculations (math formulas on form values)
- Form scheduling (start/end dates)
- Entry limits
- Post creation from forms
- User registration from forms
- Quiz/survey fields
- Payment integration (Stripe, PayPal, Square)
- Recurring payments / subscriptions
- Coupons in forms
- Notifications (email, Slack, SMS, webhooks)
- Confirmations (message, redirect, page)
- Anti-spam: reCAPTCHA v2/v3, hCaptcha, Akismet, honeypot
- Form import/export
- Entry management (view, edit, delete, export CSV)
- Entry notes
- Partial entries
- Merge tags (dynamic field values in notifications)
- Chained selects (dependent dropdowns)
- Nested forms
- Signature field
- Digital signatures
- Polls/voting
- Conversational forms (one question at a time)
- Pre-population via URL parameters
- Custom validation
- Gravity Flow (workflow automation)
- Webhooks add-on
- Zapier integration
- REST API for form data
- PDF generation from entries
- Gutenberg block for form embedding

### 1.9 User Management & Permissions
- 6 default roles: Super Admin, Administrator, Editor, Author, Contributor, Subscriber
- 70+ granular capabilities
- Custom roles (via plugins like Members, User Role Editor)
- Custom capabilities
- Role-based content access
- User profiles with custom fields (via plugins)
- User registration (built-in or custom)
- User avatars (Gravatar integration)
- Application passwords (for API authentication)
- Two-factor authentication (via plugins)
- Passkey/WebAuthn authentication (via plugins)
- Social login (via plugins - Google, Facebook, Twitter, etc.)
- LDAP/Active Directory integration (via plugins)
- Single Sign-On / SSO (via plugins)
- Password strength meter
- Password reset via email
- Login lockout / brute force protection (via plugins)
- User session management
- User activity tracking (via plugins)
- User groups (via plugins)
- Content restriction by role/capability (via plugins)
- Member directory (via plugins)
- BuddyPress/BuddyBoss social networking features (profiles, groups, activity feeds, messaging, friend connections)

### 1.10 Multisite
- Network of sites from single WordPress installation
- Super Admin role (network-wide)
- Subdomain or subdirectory structure
- Network-wide plugin/theme management
- Per-site plugin/theme activation
- Network-wide user management
- Site cloning (via plugins)
- Domain mapping
- Shared user database across sites
- Network-wide search (via plugins)
- Centralized updates

### 1.11 Security
- Automatic background updates (minor versions)
- Nonce-based CSRF protection
- Data validation and sanitization APIs
- Prepared SQL statements (prevent SQL injection)
- Content Security Policy (via plugins)
- Security headers (HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection) via plugins
- File permissions management
- wp-config.php hardening
- Disable XML-RPC
- Disable REST API for unauthenticated users (optional)
- Login URL change (via plugins)
- IP whitelisting/blacklisting (via plugins)
- Web Application Firewall / WAF (via plugins - Wordfence, Sucuri)
- Malware scanning (via plugins)
- File integrity monitoring (via plugins)
- Security audit log (via plugins)
- Automatic logout on inactivity
- GDPR compliance tools
- Cookie consent (via plugins)
- Data export/erasure tools (GDPR, built-in)

### 1.12 Performance & Caching
- Built-in lazy loading for images and iframes
- On-demand CSS loading per block (6.9)
- Object cache support (Redis, Memcached via plugins)
- Page cache (via plugins - WP Super Cache, W3 Total Cache, LiteSpeed Cache)
- Browser caching headers
- Database query caching
- Opcode caching (OPcache)
- Asset minification (CSS, JS via plugins)
- Asset concatenation (via plugins)
- GZIP/Brotli compression (server-level)
- Critical CSS generation (via plugins)
- Image compression (lossy/lossless via plugins)
- WebP/AVIF conversion (via plugins)
- CDN integration (via plugins)
- DNS prefetch
- Preload key resources
- Defer/async JavaScript loading
- Heartbeat API control
- Database optimization and cleanup (via plugins)
- Transients API (temporary cached data)
- Fragment caching
- Persistent object cache drop-in

### 1.13 Multilingual / i18n
- Translation-ready core (.pot/.po/.mo files)
- 200+ language translations
- Right-to-Left (RTL) support
- WPML plugin (paid) - full multilingual content management
- Polylang plugin (free/paid) - multilingual support
- TranslatePress (visual translation)
- Language switcher widgets
- Multilingual SEO (hreflang tags)
- Translation management dashboard
- String translation (for theme/plugin strings)
- Media translation (different images per language)
- Menu translation
- WooCommerce multilingual (multicurrency + multilingual products)
- GlotPress (community translation platform)
- auto-translation via Google Translate/DeepL (via plugins)

### 1.14 API & Developer Tools
- REST API (core): posts, pages, media, users, comments, taxonomies, settings, search, block types, themes, plugins, widgets, menus, sidebars, templates, navigation, global styles
- WPGraphQL (plugin) - full GraphQL API
- XML-RPC API (legacy)
- WP-CLI (command-line interface): 40+ built-in commands
- Custom REST API endpoints
- Actions and Filters hook system (thousands of hooks)
- Plugin API
- Theme API
- Shortcodes API
- Widgets API
- Settings API
- Options API
- Transients API
- HTTP API
- Rewrite API (custom URL rules)
- Cron API (WP-Cron scheduled tasks)
- Customizer API
- Block API (register custom blocks)
- Interactivity API (reactive front-end features)
- Script Modules API (ES modules)
- wp-env (local development environment)
- Theme.json (theme configuration)
- Block.json (block metadata)
- PHP autoloading
- Composer support
- PHPUnit test framework integration
- E2E testing support (Playwright)
- Debug mode (WP_DEBUG)
- Query Monitor (plugin - debug database queries, hooks, HTTP requests)
- Health Check & Troubleshooting (built-in site health screen)
- Error recovery mode (auto-disable faulty plugins/themes)

### 1.15 Navigation & Menus
- Multiple menu locations (defined by theme)
- Drag-and-drop menu builder
- Menu item types: Page, Post, Custom Link, Category, Tag, Custom Post Type
- Nested items (sub-menus, mega menus via plugins)
- Menu item CSS classes
- Menu item descriptions
- Menu item link target
- Menu item link relationship (XFN)
- Navigation block (full site editing)
- Mega menu (via plugins)
- Mobile responsive menus
- Breadcrumbs (via SEO plugins or theme)
- Footer menus
- Sidebar menus

### 1.16 Comments & Social
- Built-in comment system
- Threaded (nested) comments
- Comment moderation (approve, spam, trash)
- Comment blacklist / disallow list
- Comment notifications (email)
- Pingbacks and trackbacks
- Avatar support (Gravatar)
- Comment pagination
- Comment RSS feed
- Comment cookies consent
- Disqus integration (via plugin)
- Social sharing buttons (via plugins)
- Social media auto-posting (via plugins - Jetpack, SNAP)
- Open Graph / Twitter Card meta tags
- oEmbed support (auto-embed from social media URLs)
- Social login (via plugins)
- Social feeds display (via plugins)

### 1.17 Backup & Restore
- Built-in export (WXR XML format): posts, pages, comments, categories, tags, menus, custom content
- Built-in import
- Full site backup (via plugins - UpdraftPlus, BackupBuddy, Duplicator, BlogVault)
- Scheduled automated backups
- Incremental backups
- Remote storage: Google Drive, Dropbox, S3, FTP, email
- One-click restore
- Migration tools (Duplicator, All-in-One WP Migration)
- Database backup
- Files backup (media, themes, plugins)
- Site staging/cloning (via plugins or hosting)

### 1.18 Import / Export
- WordPress eXtended RSS (WXR) export/import
- CSV import/export for various content types (via plugins)
- RSS import
- Blogger import
- Tumblr import
- LiveJournal import
- Movable Type / TypePad import
- WooCommerce product CSV import/export
- Customer CSV import/export
- Media export
- Theme export (site editor)
- Customizer settings export/import
- Widget settings export/import (via plugins)
- Database export (phpMyAdmin, WP-CLI)

### 1.19 Workflow & Editorial
- Post statuses: Draft, Pending Review, Published, Scheduled, Private, Trash
- Post scheduling (date and time)
- Revision history with diff viewer
- Revision restore
- Content locking (editing lock per user)
- Editorial workflow (via plugins - PublishPress, EditFlow)
- Custom post statuses (via plugins)
- Editorial comments (via plugins)
- Content approval workflows (via plugins)
- Editorial calendar (via plugins)
- Block-level collaboration notes (WP 6.9)
- Pre-publish checklist
- Post preview (before publishing)
- Preview as different user role
- Preview scheduled posts

### 1.20 Search
- Built-in search (basic keyword matching)
- Search by title, content, excerpt
- Search widget / block
- Custom search results template
- Search exclusion per post/page
- Ajax search (via plugins - SearchWP, Relevanssi, Ajax Search Pro)
- Faceted search / filtering (via plugins)
- Fuzzy matching (via plugins)
- Weight-based results (via plugins)
- WooCommerce product search (via plugins)
- Elasticsearch integration (via ElasticPress plugin)
- Algolia integration (via plugin)
- Search analytics (via plugins)
- Search suggestions / autocomplete (via plugins)

### 1.21 AI Features
- Jetpack AI Assistant (content generation, tone adjustment, translation, summarization)
- Jetpack AI Featured Image generation
- AI block content generation
- Yoast AI (SEO title/description generation, content optimization)
- Elementor AI (text generation, image generation, code generation, custom CSS)
- Various AI writing assistant plugins
- AI chatbots (via plugins)
- AI image alt text generation (via plugins)
- AI content translation (via plugins)
- AI SEO recommendations (via plugins)

### 1.22 Analytics & Reporting
- Jetpack Stats (built-in views, visitors, popular content)
- Google Analytics integration (via plugins - MonsterInsights, Site Kit)
- Google Search Console integration (via Site Kit)
- WooCommerce Analytics (revenue, orders, products, categories, coupons, stock, taxes, downloads)
- Custom dashboards (via plugins)
- Real-time stats
- Traffic source analysis
- Geographic analytics
- Device/browser analytics
- Email campaign tracking
- UTM parameter tracking
- Privacy-focused analytics (via plugins - Matomo, Plausible, Fathom)

### 1.23 Email & Newsletter
- Built-in email notifications (new user, password reset, comments, updates)
- HTML email templates
- WP Mail SMTP (configure SMTP delivery)
- Newsletter plugins (Mailpoet, Newsletter, The Newsletter Plugin)
- Email marketing integration (Mailchimp, ConvertKit, ActiveCampaign via plugins)
- Transactional email customization
- WooCommerce order emails (customizable)
- Email logging (via plugins)
- Email queue management (via plugins)

### 1.24 Maintenance & Admin
- Maintenance mode (via plugins)
- Coming soon page (via plugins)
- Admin dashboard widgets (customizable)
- Screen options (customize admin views)
- Admin color schemes (8 built-in)
- Admin bar (toolbar)
- Custom admin branding / white-label (via plugins)
- Custom login page (via plugins)
- Admin notices system
- Site Health screen (PHP version, database, HTTPS, updates, extensions)
- Debug information panel
- Automatic plugin/theme updates (selective)
- One-click core updates
- Custom admin menu order (via plugins)
- Disable admin bar for specific roles
- Admin columns customization (via plugins)

### 1.25 Dark Mode
- Admin dark mode (via plugins - Dark Mode, WP Dark Mode, Darkify)
- Frontend dark mode toggle (via plugins)
- OS-aware auto dark mode detection
- Time-based dark mode scheduling
- Keyboard shortcut toggle (Ctrl+Alt+D)
- Custom dark mode colors
- Dark mode for Gutenberg editor
- Dark mode logo variant support

### 1.26 Mobile & Responsive
- Responsive admin dashboard
- Mobile-friendly media uploader
- Responsive themes (standard)
- AMP support (via plugin)
- PWA support (via plugin)
- WordPress mobile apps (iOS, Android) for content management
- Mobile preview in editor
- Touch-friendly admin interfaces

### 1.27 URL Management & Redirects
- Pretty permalinks (customizable structure)
- Custom permalink for each post/page
- Category base and tag base customization
- Redirect manager (via plugins - Yoast, Redirection, Safe Redirect Manager)
- 301, 302, 307, 410 redirects
- Regex-based redirects
- Redirect logging and 404 monitoring
- Automatic slug generation
- Trailing slash enforcement
- Canonical URLs (built-in)
- Custom rewrite rules

### 1.28 Accessibility
- WCAG 2.0 AA compliance goal for admin
- Screen reader support in admin
- Keyboard navigation in admin and editor
- Skip-to-content links
- ARIA landmarks and roles
- Alt text for media
- Focus indicators
- Color contrast requirements for core
- Accessible forms
- Accessibility-ready themes (tag in theme directory)

---

## 2. Joomla

**Type:** Open-source CMS (self-hosted) | **License:** GPLv2 | **Stack:** PHP/MySQL/PostgreSQL | **Market Share:** ~1.7%

### 2.1 Core Content Management
- Articles (content items) with categories
- Categories (nested/hierarchical, unlimited depth)
- Featured articles
- Article versioning (revision history with compare and restore)
- Article scheduling (publish start/end dates)
- Article access levels (public, registered, special, custom)
- Article ordering (manual drag-and-drop)
- Article voting/rating
- Batch processing (move, copy, change access/language)
- Article aliases (custom URL slugs)
- Tags (flat taxonomy, applies to articles, contacts, newsfeeds, users, banners)
- Custom fields (text, textarea, integer, decimal, list, SQL, date, color, editor, media, URL, user, usergrouplist, checkboxes, radio, imagelist, repeatable, subform)
- Content filtering (TinyMCE security filters)
- Read More break
- Page break / pagination within articles
- Article intro text and full text separation
- Hits/view counter
- Article metadata (description, keywords, robots, author)
- Article images and links fields (intro image, full article image)
- Content modules (display articles in modules, positions)

### 2.2 Editor
- TinyMCE 6.7 (WYSIWYG editor with image alignment)
- CodeMirror (code editor)
- Editor buttons for custom functionality
- Editor plugins (extension-based)
- No native drag-and-drop page builder (available via extensions like SP Page Builder, Quix, JCE)

### 2.3 Template/Theme System
- Template framework with template positions
- Template styles (multiple instances per template)
- Template overrides (layout overrides for any component/module)
- Alternative layouts per content type
- Child templates
- Template module positions (unlimited)
- Template media overrides
- Cassiopeia (default template) with customizable colors/fonts
- Responsive templates
- Bootstrap 5 integration
- Accessibility-ready templates

### 2.4 SEO
- Search Engine Friendly (SEF) URLs
- URL rewriting (mod_rewrite)
- Global metadata settings
- Per-article meta description and keywords
- Canonical URLs
- Robots meta tag per page
- XML Sitemap (via extensions like OSMap, JSitemap)
- Open Graph tags (via extensions)
- Schema.org structured data (built-in: Organization, BlogPosting, Book, Event, Vacancy, Person, Recipe)
- 301 redirects (via extensions)
- H1-H6 heading structure control
- Alt text for images
- Breadcrumbs module

### 2.5 User Management & Access Control
- 9 default user groups: Public, Guest, Manager, Administrator, Registered, Author, Editor, Publisher, Super Users
- Access Control List (ACL) - granular permissions
- Custom user groups (unlimited)
- Custom viewing access levels
- Per-component permissions (create, delete, edit, edit state, edit own)
- User registration (self-registration with activation options)
- User profiles with custom fields
- User notes (admin notes on user accounts)
- Contact linking to user accounts
- Multi-factor authentication (WebAuthn/Passkey, TOTP authenticator apps, backup codes)
- Password policies
- User session management
- LDAP authentication (via plugin)
- User group hierarchy

### 2.6 Multilingual
- 70+ translation packs available
- Built-in multilingual content management
- Language associations (link content across languages)
- Language switcher module
- Language-specific menus
- Per-language content
- RTL language support
- Multilingual custom fields
- Installation in multiple languages
- Admin and frontend language selection

### 2.7 Menu Management
- Unlimited menus
- Unlimited menu items
- Nested menu items (unlimited depth)
- 40+ menu item types (single article, category blog, category list, featured articles, form layout, contact, search, user profile, system links, URL, alias, separator, heading)
- Menu module positions
- Menu access level per item
- Menu item metadata
- Menu item page class suffix
- Menu ordering (drag-and-drop)
- Default menu item setting
- Menu item associations (multilingual)

### 2.8 Extensions & Plugins
- 8,000+ extensions in Joomla Extensions Directory (JED)
- Extension types: Components, Modules, Plugins, Templates, Languages, Libraries, Files, Packages
- One-click install from JED
- Extension update notifications
- Plugin events system (60+ event groups)
- Plugin ordering
- System plugins, content plugins, authentication plugins, user plugins, etc.
- Web Services plugins (API endpoints per component)
- Task Scheduler plugins
- Workflow plugins
- Mail plugins
- Media Action plugins

### 2.9 API & Developer Tools
- REST API (Joomla Web Services)
- API authentication (token-based, Basic)
- Custom API endpoints via plugins
- MVC architecture (Model-View-Controller)
- Component development framework
- CLI application support (Joomla Console)
- Database abstraction layer (MySQL, PostgreSQL)
- Event/Observer pattern
- Dependency Injection Container
- Service providers
- Namespace autoloading
- Joomla Framework (standalone PHP framework)
- Override system (template overrides, language overrides)
- Custom form fields
- Database schema management (install/update SQL)
- Media Manager API

### 2.10 Media Management
- Built-in Media Manager
- Drag-and-drop upload
- Multi-file upload
- Folder management (create, rename, delete)
- Image resize on upload
- AVIF format support (Joomla 5)
- MIME type validation
- Separate folders for images and files
- Image editing (crop, resize, rotate) - basic
- Media field type for custom fields

### 2.11 Security
- Multi-factor authentication (MFA) built-in
- Passkey / WebAuthn authentication (Joomla 5)
- Forced password reset
- Password complexity requirements
- Session handler options (database, filesystem)
- CSRF token protection
- Input filtering
- Admin access restriction by IP
- .htaccess security rules
- Security notifications
- Joomla Security Centre (advisories)
- Automatic update notifications
- Content filtering levels

### 2.12 Cache & Performance
- Page caching (Conservative and Progressive)
- Module-level caching
- GZIP page compression
- Browser caching headers
- CSS/JS combination (via extensions)
- CDN support (via extensions)
- Lazy loading (via extensions)
- Database query optimization
- PHP 8.1+ performance improvements

### 2.13 Workflow (Publishing)
- Built-in workflow engine (Joomla 4+)
- Custom workflow stages (unpublished, published, trashed, archived, custom)
- Workflow transitions (configurable permissions)
- Workflow notifications
- Content moderation
- Publishing scheduling (start/end dates)
- Article status: Published, Unpublished, Archived, Trashed

### 2.14 Search
- Smart Search (advanced full-text search with autocomplete)
- Smart Search filters
- Smart Search content maps
- Smart Search plugins (articles, categories, contacts, newsfeeds, tags)
- Search statistics
- Search suggestions
- Exclude from Smart Search option per content

### 2.15 Built-in Components
- Banners (advertising management with impressions, clicks, clients, campaigns)
- Contacts (contact directory with categories, custom fields, forms)
- Newsfeeds (RSS aggregation and display)
- Tags (cross-content tagging)
- Post-installation messages
- Redirect manager
- Guided Tours (interactive admin tutorials, Joomla 5)
- Mail Templates (customizable system emails)
- Privacy suite (GDPR: consent, data requests, export, removal)
- Scheduled Tasks (cron-like task scheduler)
- Content versioning

### 2.16 Admin Panel
- Customizable admin dashboard
- Quick icons / shortcuts
- Admin modules (login, menu, submenu, status, feed, etc.)
- Multilingual admin interface
- Global configuration (site, system, server, logging, session, etc.)
- System information page
- Admin dark mode (Joomla 5)
- Accessibility improvements (WCAG compliance in admin)
- Guided tours for new users

### 2.17 Maintenance & Backup
- Maintenance mode (offline mode with custom message)
- Database table repair/optimize
- Cache clearing
- Session clearing
- Extension updates (one-click)
- Joomla update (one-click)
- Pre-update check
- Akeeba Backup (most popular backup extension)
- Backup/restore via extensions

---

## 3. Drupal

**Type:** Open-source CMS (self-hosted) | **License:** GPLv2 | **Stack:** PHP/MySQL/PostgreSQL/SQLite | **Market Share:** ~1.3%

### 3.1 Core Content Management
- Content types (fully customizable with fields)
- Built-in content types: Article, Basic Page
- Custom content type creation (unlimited)
- Fields system (30+ field types: text, number, list, date, link, reference, file, image, boolean, email, telephone, timestamp, etc.)
- Field storage: database, custom
- Field display modes (teaser, full, custom)
- Field formatters (control rendering)
- Field widgets (control input)
- Paragraphs (modular content composition via module)
- Entity reference fields (link to other content, users, terms)
- Inline entity form (create referenced entities inline)
- Content moderation (workflow states: draft, published, archived)
- Content scheduling (via Scheduler module)
- Content locking (via module)
- Content versioning / revisions (built-in, with diff comparison)
- Taxonomy terms revisions (Drupal 11)
- Body field with summary
- URL aliases (custom paths)
- Path auto-generation (Pathauto module)
- Metatags (via module)
- Content translation (built-in multilingual)
- Bulk operations on content
- Content cloning (via module)
- Workflow transitions with permissions

### 3.2 Views (Content Display Engine)
- Visual query builder for content listings
- Display types: page, block, attachment, feed, REST export, embed
- Filters: exposed (user-facing), contextual (URL-based), combined
- Sort criteria (multiple, exposed)
- Relationships (JOINs to related content)
- Fields display or content/entity display modes
- Grouping by field values
- Aggregation (COUNT, SUM, AVG)
- Pager (full, mini, infinite scroll via module)
- Ajax loading
- Attachment displays
- Header/footer content
- Empty behavior
- CSS classes per row/field
- Views Bulk Operations (VBO)
- Caching per view
- Contextual filters (dynamic content based on URL, user, etc.)
- Custom templates per view

### 3.3 Layout Builder
- Drag-and-drop page layout editor
- Section-based layouts (1 column, 2 column, 3 column, custom)
- Block placement within sections
- Custom blocks (reusable content blocks)
- Inline blocks (non-reusable, per-page)
- Content blocks, Views blocks, Menu blocks, Custom blocks
- Layout per content type (default layout)
- Layout per entity (override per page)
- Layout Builder restrictions (limit blocks/layouts per content type)
- Responsive layout configuration
- Layout Builder + Content Moderation integration
- Layout Builder styles (via module)

### 3.4 Experience Builder (Drupal CMS 2025)
- No-code visual site building
- True WYSIWYG editing
- Component-based architecture
- Deep integration with entities, fields, blocks, permissions
- In-browser editing
- Drag-and-drop components
- Template creation without code

### 3.5 Editor (CKEditor 5)
- Rich text editing with CKEditor 5
- Media embedding within editor
- Internal link autocomplete (Drupal 11)
- Inline image upload
- Text formats and filters
- Custom CKEditor plugins
- Source code editing
- Table creation and editing
- Media Library integration

### 3.6 Taxonomy System
- Vocabularies (groups of terms)
- Hierarchical terms (unlimited depth)
- Term reference fields
- Term pages (auto-generated listing pages)
- Term revisions (Drupal 11)
- Term access control
- Multi-vocabulary tagging
- Free tagging (autocomplete tag creation)
- Term weight/ordering

### 3.7 User Management & Permissions
- Roles and permissions system
- Granular permissions (per module, per content type, per field)
- Access Policy API (Drupal 11) - context-based access (time, URL, taxonomy, etc.)
- Content access (view, create, edit, delete per type and per own)
- Custom roles (unlimited)
- User fields (profile fields)
- User registration (admin approval, email verification, open)
- User cancellation policies
- User pictures
- Contact form per user
- User status (active, blocked)
- Admin role assignment
- Content authorship

### 3.8 Multilingual
- 4 built-in multilingual modules: Language, Content Translation, Configuration Translation, Interface Translation
- Unlimited languages
- Per-field translation
- Translation management
- Language detection (URL, session, browser, user)
- Language negotiation
- hreflang tags
- RTL support
- Multilingual Views
- Multilingual menus
- Multilingual taxonomy
- Multilingual blocks
- Translation workflows (via Workflow + Content Moderation)
- TMGMT module (Translation Management)

### 3.9 API & Headless
- JSON:API (in core, zero configuration)
- REST API (in core)
- GraphQL (via module - GraphQL, GraphQL Compose)
- API authentication: cookie, basic auth, OAuth 2.0 (via module)
- Content negotiation
- Hypermedia-driven APIs
- JSON:API includes, sparse fieldsets, filtering, sorting, pagination
- Decoupled/headless architecture support
- Next.js integration (via next-drupal module)
- Gatsby integration
- CORS configuration

### 3.10 Modules & Extensibility
- 50,000+ contributed modules on Drupal.org
- Module types: core, contributed, custom
- Hook system (alter hooks, info hooks, theme hooks)
- Event subscribers (Symfony events)
- Service container (dependency injection)
- Plugin API (swappable components)
- Annotations and Attributes for plugin discovery
- Custom entity types
- Queue API (background processing)
- Batch API (large operations)
- State API (key-value storage)
- Cache API (cache tags, cache contexts, cache max-age)
- Render API (render arrays)
- Form API (programmatic form building)
- AJAX framework

### 3.11 Theme System
- Twig templating engine
- Theme hooks and preprocess functions
- Template suggestions (override templates per content type, view mode, etc.)
- Theme regions (unlimited)
- Block placement in regions
- Sub-themes (inheritance)
- Base themes (Claro for admin, Olivero for frontend)
- Single Directory Components (Drupal 11)
- Libraries system (CSS/JS management)
- Breakpoints (responsive design)
- Color module (customize theme colors) - deprecated, CSS custom properties used
- Starterkit theme generator (CLI command)

### 3.12 SEO
- Clean URLs (built-in)
- Path aliases (custom URLs per content)
- Pathauto (automatic URL alias patterns)
- Redirect module (301, 302 redirects, 404 tracking)
- Metatag module (title, description, Open Graph, Twitter Cards, Schema.org)
- XML Sitemap module
- Google Analytics module
- Robots.txt management
- hreflang (built-in with multilingual)
- Canonical URLs
- Breadcrumbs
- SEO Checklist module

### 3.13 Media Management
- Media Library (built-in)
- Media types: Image, File, Audio, Video, Remote Video (oEmbed)
- Custom media types
- Media browser (grid/table views)
- Drag-and-drop upload
- Bulk upload
- Image styles (resize, crop, scale, desaturate, rotate, convert)
- Responsive images (srcset/sizes)
- Focal point module (smart cropping)
- Image optimization (via modules)
- SVG support (via module)
- Media access control
- Media usage tracking
- Remote media embedding (YouTube, Vimeo)
- IIIF support (via module)

### 3.14 Search
- Built-in Search module
- Search API module (advanced search framework)
- Solr integration (via Search API Solr)
- Elasticsearch integration (via Search API Elasticsearch)
- Faceted search (via Facets module)
- Full-text search
- Search indexing
- Custom search pages
- Search relevance tuning
- Autocomplete suggestions
- Highlighted search results
- Spellcheck (via Solr/Elasticsearch)
- Views-based search results

### 3.15 Caching & Performance
- Internal page cache (anonymous users)
- Dynamic page cache (authenticated users)
- BigPipe (streaming page delivery)
- Cache tags (granular invalidation)
- Cache contexts (vary by user, role, URL, etc.)
- Cache max-age
- Render caching
- Asset aggregation (CSS/JS)
- Lazy loading
- CDN module
- Purge module (external cache invalidation)
- Varnish integration
- 26-33% performance improvement in Drupal 11.3
- Preloading and prefetching
- HTMX integration (Drupal 11.3)

### 3.16 Workflows & Moderation
- Content Moderation (in core)
- Custom workflow states (draft, review, published, archived, custom)
- Workflow transitions with role-based permissions
- Workspaces (stage content changes and publish together - stable in Drupal 11)
- Scheduling (via Scheduler module)
- Content lock (prevent simultaneous editing)
- Diff module (compare revisions)
- Audit trail (via module)
- Moderation dashboard (via module)

### 3.17 Webforms
- Webform module (100+ element types)
- Conditional logic
- Multi-page forms
- Computed elements
- File uploads
- Draft save
- Form submissions management
- Export (CSV, TSV, JSON, YAML)
- Email notifications
- Custom handlers
- Prepopulate
- Access control
- CAPTCHA / honeypot
- Analytics (submission statistics)
- REST API submission
- Payment integration (via handler)

### 3.18 Security
- Security advisory process (Drupal Security Team)
- Automated security updates (via Update Manager)
- Content Security Policy (via module)
- Twig auto-escaping (XSS prevention)
- CSRF token protection
- Input filtering
- PHP access restriction
- Trusted host patterns
- Password policy module
- Login security module (brute force protection)
- CAPTCHA module
- Two-factor authentication (via TFA module)
- Security Kit module (HSTS, CSP, X-Frame-Options)
- Security Review module
- Flood control (built-in rate limiting)

### 3.19 Admin Panel
- Responsive admin theme (Claro)
- Admin toolbar (vertical navigation - Drupal 11)
- Contextual links (in-place editing shortcuts)
- Admin views (sortable, filterable content lists)
- Dashboard (customizable via modules)
- Tour module (guided admin tours)
- Help topics (built-in searchable help)
- Announce module (Drupal project announcements)
- Config Inspector (debugging)
- Status report (system requirements, updates, errors)
- Recent log messages (Watchdog/Dblog)

### 3.20 Configuration Management
- Configuration export/import (YAML files)
- Config sync (deploy config between environments)
- Config split (environment-specific config)
- Config ignore (exclude from sync)
- Config readonly (production protection)
- Features module (package config into reusable bundles)
- Recipes (Drupal 11 - bundle config, modules, content setup)

### 3.21 Multisite
- Multi-site setup (shared codebase, separate databases)
- Domain Access module (shared database multisite)
- Sites directory structure
- Per-site configuration

### 3.22 CLI
- Drush (Drupal shell) - comprehensive CLI
- Cache rebuild, config import/export, database operations
- Module/theme enable/disable
- User management
- Cron run
- Update database
- Generate content (devel-generate)
- Custom Drush commands
- Drupal Console (alternative CLI - deprecated in favor of Drush)

### 3.23 Accessibility
- WCAG 2.2 AA commitment
- Accessibility Team oversight
- Admin theme accessibility (Claro)
- Front-end theme accessibility (Olivero)
- ARIA support
- Keyboard navigation
- Screen reader compatibility
- Color contrast compliance
- Focus management
- Accessible forms
- Accessibility audit tools (via modules)

---

## 4. PrestaShop

**Type:** Open-source e-commerce (self-hosted) | **License:** OSL 3.0 | **Stack:** PHP/MySQL (Symfony) | **Market Share:** ~0.7%

### 4.1 Product Management
- Simple products
- Products with combinations (variants: size, color, material, etc.)
- Virtual/digital products (downloadable)
- Pack products (bundles)
- Product customization fields (text, file upload)
- Product features (characteristics display)
- Product attributes (variant generators)
- Bulk combination management
- Product images (multiple, drag-and-drop ordering)
- Image zoom / gallery
- Product descriptions (short and long)
- Product tags
- Product conditions (new, used, refurbished)
- Product visibility (catalog, search, both, nowhere)
- Product redirections (when disabled)
- Stock management (quantity, minimum order, out-of-stock behavior)
- Advanced stock management (warehouses, supply orders)
- Product suppliers and manufacturers/brands
- Product attachments (PDF, docs)
- Product specific prices (per customer, group, country, currency, date range)
- Product ecotax
- Product weight, dimensions
- Delivery time display
- Related/accessory products
- Cross-selling products
- Product comparison
- Product catalog mode (no add-to-cart)

### 4.2 Category Management
- Nested categories (unlimited depth)
- Category images and descriptions
- Category SEO settings
- Category products ordering
- Featured products per category
- Subcategory display options

### 4.3 Order Management
- Order statuses (awaiting payment, payment accepted, processing, shipped, delivered, cancelled, refunded, error, custom)
- Order details (products, shipping, payment, customer info)
- Order editing (add/remove products, change prices)
- Partial refunds
- Return merchandise authorization (RMA)
- Credit slips (refund documents)
- Invoice generation (automatic)
- Delivery slips
- Order messages (pre-defined and custom)
- Order notes
- Order history
- Cart rules applied
- Multi-invoice per order
- Order export

### 4.4 Payment
- PrestaShop Checkout (PayPal, cards)
- PayPal Standard and Pro
- Stripe
- Bank wire transfer
- Check payment
- Cash on delivery
- Google Pay, Apple Pay
- Saved payment methods
- Multi-currency payment
- 3D Secure support
- PSD2/SCA compliance
- 250+ payment modules available

### 4.5 Shipping
- Carriers management
- Shipping zones
- Shipping by weight ranges
- Shipping by price ranges
- Free shipping rules
- Carrier tracking (URL template)
- Carrier logos
- Carrier delays display
- USPS, FedEx, UPS, DHL integration (via modules)
- Pickup in store
- Shipping cost calculation
- Multi-carrier per order

### 4.6 Tax Management
- Tax rules by country/state/ZIP
- Tax groups
- Ecotax
- Tax display (with/without tax)
- EU VAT compliance
- Tax reports
- VIES VAT number validation (via module)

### 4.7 Customer Management
- Customer accounts
- Customer groups (visitor, guest, customer, custom)
- Customer addresses (multiple)
- Customer order history
- Customer carts (abandoned carts tracking)
- Customer messages / support tickets
- Customer notes
- Customer GDPR data export/deletion
- Guest checkout
- B2B features (company info, outstanding balance, groups)
- Customer service / helpdesk
- Loyalty programs (via modules)
- Newsletter subscription
- Customer import/export (CSV)

### 4.8 Marketing & Promotions
- Cart rules (discounts with conditions)
- Catalog price rules (bulk pricing)
- Coupon codes
- Free shipping promotions
- Buy X get Y offers
- Percentage and fixed amount discounts
- Minimum purchase requirements
- Date-range promotions
- Product-specific / category-specific promotions
- Customer group-specific promotions
- Cross-selling
- Product highlighting (new, sale, pack)
- Email marketing module
- Newsletter management
- Abandoned cart reminders (via modules)
- Referral programs (via modules)

### 4.9 CMS & Content
- CMS pages (about us, terms, legal, custom)
- CMS categories
- Blog (via modules)
- Contact form
- Store locator
- Sitemap page

### 4.10 SEO
- SEO-friendly URLs
- Meta title, description per product/category/CMS page
- Canonical URLs
- Hreflang tags (multilingual)
- XML sitemap generation (via module)
- Robots.txt management
- Alt text for images
- URL redirects (via module)
- Schema.org product markup (via module)
- Google Analytics integration
- Google Shopping feed (via module)

### 4.11 Multilingual & Multi-currency
- Built-in multilingual support
- Language packs (75+ languages)
- Multi-currency support
- Automatic currency conversion
- Currency formatting
- Localized content per language
- Localized URL slugs
- RTL support

### 4.12 Multi-store
- Multiple stores from single back office
- Per-store product catalogs
- Per-store themes
- Per-store pricing
- Per-store customers
- Per-store orders
- Per-store languages/currencies
- Shared or separate stock
- Group/individual store management

### 4.13 Analytics & Reporting
- Dashboard KPIs (sales, orders, visitors, conversion)
- Sales reports
- Product reports (best sellers, most viewed)
- Category reports
- Customer reports
- Carrier reports
- Stock reports
- Newsletter statistics
- Search term statistics
- Real-time visitor tracking (via module)
- Google Analytics integration

### 4.14 Themes & Design
- Theme marketplace
- Theme customization (logo, colors, favicon)
- Theme positions/hooks (display hooks)
- Responsive themes
- Custom CSS
- Theme export/import
- Page builder (via modules: Creative Elements, Ap Page Builder)

### 4.15 Modules & Extensions
- 5,000+ modules on PrestaShop Addons Marketplace
- Module categories: payments, shipping, SEO, marketing, design, admin, security
- Module management (install, configure, enable, disable)
- One-click install
- Module updates
- Module hooks system
- Custom module development (Symfony-based)

### 4.16 API & Developer Tools
- Web Services API (REST)
- CRUD operations on all entities
- API key authentication
- Symfony framework (4.4+)
- Override system (class, controller, template overrides)
- Hooks system (display hooks, action hooks)
- Smarty templating engine
- Module development kit
- CLI tools
- Debug mode and profiler
- PHPUnit testing support
- Docker development environment

### 4.17 Security
- SSL/TLS support
- Token-based CSRF protection
- SQL injection prevention
- XSS protection
- Password hashing (bcrypt)
- Admin login brute force protection
- Employee permissions (granular)
- IP restriction for back office
- PCI DSS compliance considerations
- GDPR compliance tools
- Cookie consent
- Security patches and updates
- File integrity check (via module)

### 4.18 Import/Export
- Product CSV import/export
- Category CSV import
- Customer CSV import/export
- Order CSV export
- Combination CSV import
- Supplier/manufacturer import
- Address import
- Alias import
- Store contact import
- Data mapping during import
- Image import from URL

### 4.19 Admin Panel
- Customizable dashboard
- Quick access bar
- Admin themes
- Multilingual back office
- Employee roles and permissions
- Activity log
- Performance page (caching, CCC - Combine, Compress, Cache)
- Logs page (error, access)
- Email configuration (SMTP)
- Backup (database)
- Admin notifications

---

## 5. Magento / Adobe Commerce

**Type:** Open-source / Enterprise e-commerce | **License:** OSL 3.0 (Open Source) / Proprietary (Commerce) | **Stack:** PHP/MySQL (Symfony/Laminas)

### 5.1 Product Management
- Simple products
- Configurable products (variants)
- Grouped products
- Bundle products
- Virtual products
- Downloadable products
- Gift cards (Commerce)
- Product attributes (unlimited custom attributes)
- Attribute sets
- Product images and videos
- Product gallery with zoom
- Product reviews and ratings
- Product comparisons
- Related products, upsells, cross-sells
- Product visibility per store view
- Inventory management (multi-source inventory - MSI)
- Stock alerts (back in stock, price drop)
- Backorders
- Minimum/maximum order quantity
- Tiered pricing
- Group pricing (per customer group)
- Special prices (date ranges)
- Cost of Goods Sold
- Product import/export (CSV, scheduled)
- Catalog flat tables (performance optimization)
- Layered navigation (filterable product attributes)
- Swatches (color, image, text)

### 5.2 Category Management
- Nested categories (unlimited depth)
- Category landing pages
- Category images and descriptions
- Category products ordering (position, name, price, custom)
- Category-based pricing rules
- Category display modes (products, CMS block, both)
- Anchor categories (include subcategory products)
- Category permissions (Commerce)

### 5.3 Page Builder (Commerce / Open Source 2.4+)
- Drag-and-drop content editor
- Content types: Row, Column, Tabs, Text, Heading, Buttons, Divider, HTML Code, Block, Dynamic Block, Products, Image, Video, Banner, Slider, Map
- Full-width layouts
- Background images/videos/parallax
- Custom CSS per element
- Mobile responsive editing
- Content staging and preview (Commerce)
- Content scheduling (Commerce)
- Content versioning
- A/B testing (via Adobe Target)
- Dynamic blocks (content rules based on customer segments) (Commerce)
- Template library
- Widget system (CMS blocks, product lists, etc.)

### 5.4 Customer Management
- Customer accounts and dashboards
- Customer groups
- Customer segments (Commerce) - rule-based dynamic segmentation
- Customer attributes (custom fields)
- Address book (multiple addresses)
- Order history
- Wishlist (multiple wishlists in Commerce)
- Product reviews
- Store credit (Commerce)
- Reward points (Commerce)
- Gift registry (Commerce)
- Customer data import/export

### 5.5 Order Management
- Order processing workflow
- Order statuses (pending, processing, complete, closed, cancelled, on-hold, custom)
- Order editing
- Partial shipments
- Partial invoicing
- Credit memos (full/partial refunds)
- Returns (RMA - Commerce)
- Order comments/notes
- Order email notifications
- Re-ordering
- Admin order creation
- Order archiving (Commerce)
- Order PDF invoices/packing slips/credit memos

### 5.6 Payment
- Built-in: Check/Money Order, Bank Transfer, Cash on Delivery, Purchase Order, Zero Subtotal
- PayPal (Express, Standard, Advanced, Payflow)
- Braintree
- Authorize.net
- Stripe (via extension)
- Amazon Pay (via extension)
- Stored payment methods (vault)
- Offline payment methods
- Payment method per country
- Minimum order amount per payment method

### 5.7 Shipping
- Table rates
- Flat rate
- Free shipping
- UPS, USPS, FedEx, DHL carriers
- Multi-address shipping
- In-store pickup
- Shipping by weight/price/item count
- Shipping origin configuration
- Dimensional weight support
- Multi-Source Inventory shipping

### 5.8 Tax
- Tax rules (by country, state, ZIP)
- Tax classes (product, customer)
- Fixed Product Tax (FPT / Weee)
- Tax calculation (unit price, row total, total)
- Tax display options (including/excluding)
- Cross-border trade tax
- EU VAT ID validation
- Tax import/export
- Vertex tax integration (Commerce)

### 5.9 Marketing & Promotions
- Catalog price rules (percentage off, fixed amount, adjust to)
- Cart price rules (coupons, conditions, actions)
- Related products rules (Commerce)
- Email marketing (Dotdigital integration)
- Google Shopping ads integration
- Customer segments for targeted promotions (Commerce)
- Newsletter management
- Gift wrap option
- Product recommendations (Adobe Sensei AI) (Commerce)
- Visual Merchandiser (drag-and-drop category product ordering) (Commerce)

### 5.10 Search
- MySQL full-text search
- Elasticsearch integration (built-in)
- OpenSearch support
- Live Search (Adobe Sensei AI) (Commerce)
- Search terms management
- Search synonyms
- Search term redirect
- Layered navigation / faceted search
- Search autocomplete and suggestions
- Search weight configuration
- Catalog search indexing

### 5.11 SEO
- SEF URLs
- URL rewrites management
- Meta title, description, keywords per page
- Canonical URLs (auto-generated)
- XML Sitemap generation
- Robots.txt management
- Rich snippets / Schema.org (via extension)
- hreflang tags
- Breadcrumbs
- Alt text for images
- Header tags management
- Google Analytics / Tag Manager integration

### 5.12 Multilingual & Multi-currency
- Store views (per language/currency)
- Multiple websites from single installation
- Currency conversion (manual and auto-update)
- Locale-specific formatting
- RTL support (via themes)
- Translation packages
- Inline translation tool

### 5.13 Multi-store
- Multiple websites
- Multiple stores per website
- Multiple store views per store
- Shared or separate catalogs
- Shared or separate customer bases
- Per-store pricing
- Per-store design/theme
- Per-store domain
- Centralized admin

### 5.14 API & Developer Tools
- REST API (comprehensive: products, categories, customers, orders, carts, etc.)
- GraphQL API
- SOAP API (deprecated)
- API authentication (OAuth, token-based, session-based)
- Custom API endpoints (service contracts)
- Dependency injection
- Plugin (interceptor) system (before, around, after methods)
- Events and observers
- Cron jobs
- Message queue (RabbitMQ, MySQL)
- Service contracts (interfaces)
- EAV (Entity-Attribute-Value) model
- Module development
- CLI (bin/magento commands)
- Code generation
- Setup scripts (install/upgrade)
- Composer package management
- PHPUnit testing framework
- Integration testing framework
- Functional testing (MFTF)
- API functional testing
- Static testing (PHP CodeSniffer, PHP Mess Detector)

### 5.15 Caching & Performance
- Full Page Cache (Varnish or built-in)
- Block cache
- Collections cache
- Configuration cache
- DDL cache
- EAV cache
- Layout cache
- Reflection cache
- Translation cache
- Web services cache
- Flat catalog indexing
- Indexers (price, catalog search, category product, stock)
- Asset minification (CSS, JS, HTML)
- Asset merging and bundling
- Image optimization
- Lazy loading (via theme)
- CDN support
- Redis/Memcached support
- MySQL/Elasticsearch query optimization
- New Relic integration
- Database profiler

### 5.16 Security
- Two-factor authentication (built-in)
- CAPTCHA and reCAPTCHA
- Admin session lifetime
- Admin ACL (granular resource permissions)
- Content Security Policy
- Password hashing (Argon2ID)
- Encryption key management
- XSS prevention (output escaping)
- CSRF protection
- SQL injection prevention
- Admin login lockout
- Admin URL customization
- IP whitelist for admin
- PCI DSS compliance (via PayPal Payflow)
- Security scan tool
- Patch management
- WAF (Cloud)

### 5.17 B2B Features (Commerce)
- Company accounts
- Company hierarchy
- Buyer roles and permissions
- Shared catalogs
- Custom pricing per company
- Quote management (request for quote, negotiation)
- Purchase orders
- Requisition lists
- Quick order (by SKU)
- Credit limit management
- Payment on account

### 5.18 Content Staging (Commerce)
- Schedule content changes
- Preview scheduled changes
- Dashboard timeline of scheduled updates
- Campaign management (multiple changes grouped)
- Rollback capability
- Content versioning

### 5.19 Admin Panel
- Dashboard (revenue, orders, tax, shipping, quantity, bestsellers, customers, searches)
- Notifications center
- Admin activity log
- Data grids (sortable, filterable, exportable)
- Mass actions
- Admin theme customization
- Admin user roles and permissions
- Admin action log (Commerce)
- System configuration (hundreds of settings)
- Release notes in admin
- Cache management panel
- Index management panel
- Store email configuration

### 5.20 Analytics & Reporting
- Revenue report
- Tax report
- Shipping report
- Invoiced report
- Refunds report
- Coupons report
- Product views report
- Bestsellers report
- Low stock report
- Search terms report
- Customer accounts report
- Order totals report
- New vs returning customers
- Advanced Reporting (embedded BI)
- Adobe Analytics integration (Commerce)
- Custom report builder (Commerce)

### 5.21 Import/Export
- Product CSV import/export (scheduled)
- Customer CSV import/export
- Advanced pricing import
- Customer addresses import
- Stock sources import
- Tax rates import
- URL rewrites import
- Data profiles (Commerce)
- Scheduled import/export (Commerce)

---

## 6. Shopify

**Type:** SaaS e-commerce | **License:** Proprietary | **Market Share:** ~4.4%

### 6.1 Product Management
- Unlimited products
- Product variants (up to 100 per product with 3 option types / up to 2,000 with Combined Listings)
- Product images (up to 250 per product) and videos
- Product image zoom
- 3D model support (AR preview)
- Product descriptions (rich text)
- Product tags and collections (manual and automated)
- Smart collections (rule-based auto-categorization)
- Product types
- Product vendors
- Product metafields (custom fields)
- Inventory tracking per location
- Multi-location inventory
- Inventory transfers between locations
- Low stock alerts
- Barcode/SKU management
- Weight and dimensions
- Product status (active, draft, archived)
- Bulk editor
- Product duplication
- Gift cards
- Digital products
- Subscription products (via apps)
- Pre-order products (via apps)
- Product bundles (via apps)
- Product reviews (via apps)
- Product personalization/customization
- Product media (images, videos, 3D models)
- Product CSV import/export

### 6.2 Storefront & Themes
- Shopify Theme Store (free and paid themes)
- Horizon (2025) - new design system with 10+ presets, 30+ modular blocks
- Online Store 2.0 (sections everywhere)
- Theme editor (visual customization)
- Sections and blocks (nestable up to 8 levels deep)
- Dynamic sources (metafields in theme settings)
- Color schemes
- Custom fonts
- Custom CSS
- Custom Liquid code sections
- Responsive design (all themes)
- Theme versioning
- Theme duplication
- Theme preview
- Theme code editor (Liquid, HTML, CSS, JS)
- Liquid templating language
- Theme Architecture (JSON templates)
- Predictive search
- Mega menu support (theme-dependent)
- AI theme generation (2025)

### 6.3 Checkout & Cart
- Shopify Checkout (conversion-optimized)
- One-page checkout
- Checkout extensibility (checkout UI extensions, Shopify Functions)
- Shop Pay (accelerated checkout)
- Shop Pay Installments (BNPL)
- Express checkout (Apple Pay, Google Pay, Amazon Pay)
- Dynamic checkout buttons
- Cart drawer / slide-out cart
- Cart notes
- Discount codes at checkout
- Automatic discounts
- Gift cards at checkout
- Tipping at checkout
- Shipping rate calculator in cart
- Order notes
- Custom checkout branding
- Post-purchase upsells (via apps)
- Thank you page customization
- Order status page customization
- Mixed fulfillment (carry out + ship)
- B2B checkout (wholesale pricing, net payment terms)
- Multi-currency checkout
- Duties and taxes collection at checkout

### 6.4 Payments
- Shopify Payments (Stripe-powered)
- 100+ third-party payment gateways
- PayPal
- Amazon Pay
- Apple Pay, Google Pay
- Cryptocurrency (via apps)
- Manual payment methods
- Multi-currency (130+ currencies)
- Automatic currency conversion
- Payment capture (auto or manual)
- Fraud analysis (built-in)
- Chargeback management
- PCI DSS Level 1 compliance

### 6.5 Shipping
- Calculated shipping rates (USPS, UPS, FedEx, DHL, Canada Post)
- Custom flat rates
- Free shipping
- Local delivery
- Local pickup / BOPIS (Buy Online Pick Up In Store)
- Shipping labels (USPS, UPS, DHL)
- Discounted shipping rates
- Package dimensions/weight tracking
- Shipping zones
- Multi-origin shipping
- Shipping profiles (per product)
- Real-time carrier rates (Advanced plan+)
- Third-party fulfillment integration (ShipStation, etc.)
- Order tracking and notifications
- Returns management
- Packing slips

### 6.6 Marketing & Promotions
- Shopify Email (built-in email marketing)
- Email templates and automation
- Discount codes (percentage, fixed, BOGO, free shipping)
- Automatic discounts
- Discount combinations
- Customer segmentation
- Abandoned cart recovery emails (automatic)
- Abandoned checkout recovery
- Facebook/Instagram Shopping integration
- Google Shopping integration
- TikTok Shopping integration
- Pinterest Shopping integration
- Social media posting
- SEO tools
- Blog
- Landing pages
- Marketing automations (Shopify Flow)
- Customer reviews (via apps)
- Loyalty programs (via apps)
- Referral programs (via apps)
- Affiliate marketing (via apps)
- Product recommendations (AI-powered)

### 6.7 SEO
- Customizable title tags and meta descriptions
- Auto-generated sitemap.xml
- Auto-generated robots.txt
- Canonical URLs (automatic)
- 301 redirects (URL redirects)
- Alt text for images
- Clean URL structure
- Blog for content marketing
- Structured data / Schema.org (basic, via apps for advanced)
- Mobile-friendly (responsive themes)
- Page speed optimization
- hreflang tags (Shopify Markets)
- Breadcrumbs (theme-dependent)

### 6.8 Analytics & Reporting
- Shopify Analytics dashboard
- Overview (sales, sessions, conversion rate, AOV)
- Sales reports (by product, channel, discount, staff, time)
- Customer reports (at-risk, loyal, one-time)
- Acquisition reports (sessions by source, referrer)
- Behavior reports (searches, page views)
- Finance reports (gross sales, returns, taxes, payments)
- Inventory reports
- Profit reports (margin, COGS)
- Marketing reports
- Live View (real-time store activity)
- Custom reports (Advanced plan+)
- Google Analytics 4 integration
- Facebook Pixel / Conversions API
- Third-party analytics (via apps)
- ShopifyQL Notebooks (custom data queries - Plus)

### 6.9 Customer Management
- Customer profiles
- Customer segments (rule-based)
- Customer tags
- Customer notes
- Customer order history
- Customer metafields (custom fields)
- Customer accounts (classic and new)
- Customer groups / B2B companies
- Newsletter subscription
- Wishlists and registries (2025 - native)
- Customer import/export (CSV)
- Customer notification preferences
- GDPR data request handling

### 6.10 Multi-channel
- Online Store
- Point of Sale (POS)
- Facebook/Instagram Shop
- Google Shopping
- TikTok Shop
- Pinterest
- Amazon
- eBay (via app)
- Walmart (via app)
- Buy Button (embed on any website)
- Wholesale channel (Plus)
- Headless (Hydrogen/Storefront API)

### 6.11 POS (Point of Sale)
- Shopify POS app (iOS, Android)
- Hardware support (card readers, receipt printers, barcode scanners, cash drawers)
- Unified inventory (online + in-store)
- Staff management
- Customer profiles at POS
- Split payments
- Custom discounts
- Gift card creation and redemption
- Returns and exchanges at POS
- Order fulfillment from POS
- Session tracking
- Cash tracking
- Receipt customization
- POS Pro features (staff permissions, inventory counts, store analytics)

### 6.12 Apps & Integrations
- Shopify App Store (8,000+ apps)
- Shopify Functions (custom logic: discounts, shipping, payment)
- Shopify Flow (automation - triggers, conditions, actions)
- Zapier integration
- Webhooks (50+ event types)
- APIs: Admin REST API, Admin GraphQL API, Storefront API, Ajax API
- Shopify CLI (theme development, app development)
- Hydrogen (React headless framework)
- Oxygen (hosting for Hydrogen apps)
- Metafield definitions
- Custom apps (private apps)

### 6.13 Multi-language & International
- Shopify Markets (manage international selling)
- Auto-translate (via apps)
- Multi-currency (130+ currencies, automatic conversion)
- Multi-language (up to 20 languages)
- Localized checkout
- Duties and import tax calculation
- Market-specific pricing
- Market-specific content
- Domain strategy (subdomain, subdirectory, ccTLD)
- Geo-IP detection and redirect

### 6.14 Security
- PCI DSS Level 1 compliance
- SSL certificates (free)
- Fraud analysis
- CAPTCHA on forms
- Staff permissions (granular)
- API access scopes
- Two-factor authentication
- Activity log
- DDoS protection
- 99.98% uptime SLA (Plus)
- Automatic security updates
- SOC 2 compliance

### 6.15 Developer Tools
- Shopify CLI
- Theme Kit (legacy theme development)
- Liquid templating language
- Shopify Functions (Rust/Wasm backend logic)
- Checkout UI Extensions (React)
- Admin UI Extensions
- Post-purchase extensions
- GraphQL Admin API
- REST Admin API
- Storefront API (GraphQL)
- Ajax API (Cart)
- Customer Account API
- Webhooks
- App Bridge (embedded app framework)
- Polaris (design system for apps)
- Hydrogen (React framework)
- Oxygen (edge hosting)
- Development store (free for testing)
- Theme check (linting tool)

### 6.16 AI Features (2025)
- Shopify Magic (AI content generation)
- AI product descriptions
- AI email generation
- AI image background removal/generation
- AI chat (Sidekick)
- AI product recommendations
- AI FAQ generation
- AI theme/block generation
- AI-powered search
- AI fraud detection
- Semantic search (natural language product search)

### 6.17 Admin Panel
- Clean, modern admin interface
- Dashboard with KPIs
- Notifications center
- Timeline / activity feed per order
- Staff accounts with permissions
- Admin mobile app
- Bulk actions
- Saved filters and views
- Draft orders
- Order timeline
- Internal notes
- Settings organized by category

---

## 7. Wix

**Type:** SaaS website builder | **License:** Proprietary | **Market Share:** ~3.4%

### 7.1 Website Builder
- AI Website Builder (conversational site creation)
- Wix Editor (drag-and-drop, pixel-perfect positioning)
- Wix Studio (advanced editor for agencies/developers)
- 2,000+ free templates (800+ original, industry-specific)
- ADI (Artificial Design Intelligence)
- Sections (pre-designed page sections)
- Strips (full-width sections)
- Grid layouts
- Flexbox layouts (Studio)
- Custom breakpoints (Studio)
- Undo/redo
- Copy/paste elements and styles
- Snap to grid
- Rulers and guides
- Layer management (z-index)
- Group elements
- Responsive design (mobile editor)
- Separate mobile layout editing
- Hidden elements per device
- Animation effects (entrance, scroll, hover)
- Parallax scrolling
- Video backgrounds
- Lightbox / popup builder
- Anchors and scroll effects
- Sticky elements
- Back to top button

### 7.2 Design & Media
- Image editor (crop, filters, enhance, AI image generation)
- Photo gallery (grid, masonry, slideshow, freestyle)
- Image zoom
- SVG support
- Icon library
- Shape elements
- Vector art
- Background patterns
- Gradient backgrounds
- Video hosting (Wix Video)
- Audio player
- 3D text
- Hover effects
- Box shadows
- Borders and corners
- Opacity control
- Custom fonts upload
- Google Fonts integration
- Color palettes
- Global design system (colors, fonts, styles)

### 7.3 Content Management
- Dynamic pages (database-driven)
- Wix Data (built-in database/CMS)
- Collections (data tables)
- Content Manager (spreadsheet-like data editing)
- Dynamic list and item pages
- Reference fields (relationships)
- Repeaters (dynamic content lists)
- Datasets (connect data to elements)
- Filter and sort datasets
- User input forms connected to data
- Presets (pre-built dynamic pages)
- API for external data sources

### 7.4 Blog
- Blog posts with categories and tags
- Blog layouts (grid, list, side by side, etc.)
- Multi-author support
- Post scheduling
- RSS feed
- Related posts
- Social sharing
- Comments (built-in)
- Blog search
- Blog archive
- Custom post types (via dynamic pages)
- SEO per post
- Blog analytics
- Monetization (paid content)
- AI blog content generation

### 7.5 E-commerce
- Online store
- Product management (physical, digital, service)
- Product variants
- Product options
- Product media (images, video)
- Product ribbons/badges
- Inventory tracking
- Order management
- Wix Payments
- PayPal, Stripe integration
- 50+ payment gateways
- Multi-currency
- Tax management
- Shipping rules
- Shipping labels (via apps)
- Coupons and discounts
- Abandoned cart recovery
- Custom checkout
- Subscriptions / recurring payments
- POS (via app)
- Print on demand integration
- Dropshipping integration
- Loyalty programs
- Gift cards
- Product reviews
- Wishlist
- Back in stock notifications
- Multi-channel (Facebook, Instagram, Amazon, eBay)
- Invoice generation

### 7.6 Booking & Scheduling
- Service types (appointment, class, course, workshop)
- Online booking widget
- Calendar management
- Staff management
- Custom booking forms
- Booking confirmations and reminders
- Video conferencing integration (Zoom)
- Waitlist management
- Recurring sessions
- Cancellation policy
- Buffer time between appointments
- Payment upon booking
- Booking packages

### 7.7 Events
- Event creation and management
- Ticket tiers and pricing
- Seating charts / table maps
- Registration forms
- Email invitations and confirmations
- Guest list management
- Event analytics
- RSVP management
- Online/hybrid events
- Recurring events
- Event calendar widget

### 7.8 Marketing & SEO
- Wix SEO Wiz (step-by-step SEO plan)
- AI meta title/description generation
- Custom URL slugs
- Alt text for images
- XML sitemap (auto-generated)
- Robots.txt editing
- Canonical URLs
- Structured data / Schema.org
- Open Graph tags
- Google Search Console integration
- Google Analytics integration
- Facebook Pixel integration
- Email marketing (Wix Ascend)
- Social media posting
- Social media graphics creator
- Video maker
- Logo maker
- Business cards designer
- Marketing automations
- Pop-ups and banners
- Live chat
- Chat with visitors (Wix Chat)
- AI Chat (automated responses)
- Google Ads integration
- Facebook Ads integration

### 7.9 Forms
- Wix Forms (contact, subscription, registration, custom)
- Multi-step forms
- File upload fields
- Payment fields
- Conditional logic (field rules)
- Custom thank-you messages / redirects
- Form submissions management
- Email notifications
- Auto-responders
- CAPTCHA / spam protection
- Form analytics
- Integration with CRM
- Integration with Google Sheets (via automations)

### 7.10 Membership & Subscriptions
- Member login
- Member profiles
- Member badges
- Membership plans (free and paid)
- Gated content (page-level access)
- Member-only pricing
- Member directory
- Follow/activity feed
- Forum (Wix Forum)
- Groups (Wix Groups)
- Online community features

### 7.11 Multilingual
- Wix Multilingual (180+ languages)
- AI auto-translate pages
- Manual translation editing
- Language switcher
- SEO per language (hreflang)
- Per-language URL slugs
- RTL support
- Multilingual e-commerce

### 7.12 Analytics
- Wix Analytics dashboard
- Traffic overview (visitors, page views, sessions)
- Traffic sources
- Device breakdown
- Top pages
- Sales analytics
- Booking analytics
- Blog analytics
- Marketing analytics
- Conversion funnel
- Google Analytics integration
- Facebook Analytics

### 7.13 Developer Tools (Velo by Wix)
- Full-stack JavaScript development
- Custom JavaScript on pages
- Wix Data API (CRUD on collections)
- HTTP functions (custom APIs / webhooks)
- Custom backend code (Node.js runtime)
- NPM packages support
- Scheduled jobs (cron-like)
- Custom routers
- Custom site members authentication
- Secrets Manager
- Service plugins (custom app logic)
- Custom elements (web components)
- Wix CLI (for local development)
- Git integration for Wix Studio
- External database connectors

### 7.14 Apps & Integrations
- Wix App Market (800+ apps)
- Zapier integration (2,000+ apps)
- Google Workspace integration
- Mailchimp integration
- HubSpot integration
- Social media integrations
- Payment provider integrations
- Shipping provider integrations
- Custom app development

### 7.15 Security & Performance
- Free SSL certificate
- DDoS protection
- Automatic security updates
- 99.9% uptime
- Global CDN
- Automatic image optimization
- Lazy loading
- Code minification
- Caching optimization
- GDPR compliance tools
- Cookie consent banner
- SOC 2 compliance
- Data encryption
- Automatic backups
- Site history (restore previous versions)

### 7.16 Mobile
- Wix mobile app (manage site, chat, bookings, store)
- Mobile-optimized sites
- Mobile-specific design adjustments
- Mobile action bar
- PWA capabilities (via Branded App)
- Branded mobile app (via Wix app - paid)

### 7.17 CRM & Business Tools
- Wix CRM (contacts management)
- Contact segmentation
- Tasks and reminders
- Invoicing and quotes
- Payment links
- Automations (trigger-based workflows)
- Workflows (visual automation builder)
- Chat (live chat, Facebook Messenger, Instagram DM)
- Price estimates
- Financial reports

---

## 8. Squarespace

**Type:** SaaS website builder | **License:** Proprietary | **Market Share:** ~1.7%

### 8.1 Website Builder & Design
- Template library (award-winning, responsive)
- Fluid Engine (modern drag-and-drop editor)
- Sections and blocks system
- Pre-designed page layouts (Contact, About, Blog, Portfolio, Products, Events)
- Custom CSS injection
- Custom JavaScript injection
- Custom code blocks
- Design panel (global styles)
- Custom colors and fonts
- Google Fonts integration
- Custom font upload
- Color palettes (auto-generated)
- Responsive design (automatic)
- Mobile-specific layout adjustments
- Animation effects (block-level)
- Parallax scrolling
- Image focal point
- Background videos
- Opacity and blend modes
- Custom spacing and padding
- Site-wide style changes
- Template switching (within ecosystem)
- Undo/redo

### 8.2 Content Management
- Pages (standard, cover, layout)
- Blog posts
- Portfolio pages / galleries
- Product pages
- Event pages
- Collection pages (blogs, events, products, galleries)
- Custom page types (via member areas)
- Markdown support
- Reusable content sections (saved sections)
- Content blocks: Text, Image, Gallery, Video, Audio, Map, Form, Newsletter, Button, Quote, Spacer, Line, Code, Markdown, Summary, Calendar, Chart, Accordion, Tabs, Table, Carousel, Shape, Embed, Social Links, Menu/Restaurant
- Draft/Published status
- Scheduling (publish at specific date/time)
- Post and page duplication
- Version history (site-level)
- Contributors with different permission levels

### 8.3 Blog
- Categories and tags
- Multiple authors
- Post scheduling
- Post thumbnails / featured images
- Post excerpts
- Blog sidebar
- Archive navigation
- RSS feed
- Related posts
- Comments (built-in or Disqus integration)
- Comment moderation
- Social sharing buttons
- Blog search
- Post pinning
- Podcast support (audio hosting, Apple Podcasts integration)
- AMP pages (via third-party integration)
- Blog analytics

### 8.4 Portfolio & Gallery
- Multiple gallery layouts (grid, masonry, slideshow, carousel, stack)
- Image lightbox
- Image zoom
- Image metadata display
- Video galleries
- Photo captions
- Custom sort order
- Gallery pages
- Full-screen gallery

### 8.5 E-commerce
- Products: Physical, Digital, Service, Gift Card
- Product variants (unlimited)
- Product images and videos
- Product reviews (built-in)
- Inventory management
- Limited availability labels
- Related products
- Product quick view
- Product search and filtering
- Categories and tags
- Custom product form fields
- Shopping cart
- Single-page checkout (responsive)
- Express checkout (Apple Pay, Google Pay, Afterpay)
- Squarespace Payments
- PayPal, Stripe integration
- Subscriptions / recurring products
- Donation products
- Customer accounts
- Order management
- Shipping labels (USPS, UPS, FedEx via Shippo)
- Calculated shipping rates
- Flat rate shipping
- Free shipping rules
- Shipping zones
- Shipping profiles
- In-store pickup
- Tax management (automatic, TaxJar integration)
- Discount codes (percentage, fixed, free shipping)
- Automatic discounts
- Abandoned cart recovery (automatic emails)
- Customer notifications (order confirmation, shipping, etc.)
- Product import/export (CSV)
- Multi-currency (via Squarespace payments)
- SEO for products (title, description, URL slug)
- Product waitlist
- Point of Sale (Square integration)
- Instagram Shopping / Facebook Shopping
- Google Shopping integration
- Product syndication

### 8.6 Scheduling & Appointments (Acuity Scheduling)
- Online appointment booking
- Calendar management
- Staff/provider scheduling
- Service types and packages
- Custom intake forms
- Appointment reminders and follow-ups
- Video conferencing (Zoom, Google Meet)
- Buffer time
- Recurring appointments
- Class/group scheduling
- Subscription packages
- Gift certificates
- Payment at booking (Stripe, Square, PayPal)
- Calendar sync (Google Calendar, iCal, Outlook)
- Time zone detection
- Branded scheduling page
- Embeddable booking widget
- Cancellation/reschedule policy

### 8.7 Email Campaigns
- Squarespace Email Campaigns
- Email templates (matching website design)
- Drag-and-drop email editor
- Mailing list management
- Subscriber import
- Email segmentation
- Email automation (10+ pre-made workflows: welcome series, abandoned cart, product restock)
- Newsletter signup blocks
- A/B testing for subject lines
- Email analytics (opens, clicks, conversions)
- RSS-to-email
- Dynamic content in emails
- Unsubscribe management
- GDPR compliance
- Integration with Mailchimp (via Zapier)

### 8.8 SEO & AI Optimization
- Customizable page titles and meta descriptions
- SEO panel per page
- AI Optimization (AIO) panel (2025)
- Auto-generated sitemap
- Clean URL structure
- SSL certificates (free)
- Alt text for images
- 301 redirects
- Canonical URLs
- Open Graph tags
- Structured data (basic)
- Mobile-friendly design
- Page speed optimization
- Google Search Console integration
- Search keywords analytics
- SEO checklist for pages
- AMP (limited support)
- Beacon AI for SEO suggestions

### 8.9 Analytics
- Built-in analytics dashboard
- Traffic overview
- Traffic sources
- Popular content
- Geography
- Device breakdown
- Sales analytics (conversion funnel, revenue, orders)
- Product performance
- Search keywords
- Form and newsletter analytics
- RSS subscriber analytics
- Activity log
- Google Analytics 4 integration
- Facebook Pixel integration

### 8.10 Forms
- Built-in form blocks
- Contact form
- Newsletter signup form
- Custom form fields
- File upload field (Business plan+)
- Custom confirmation message/redirect
- Email notifications
- CAPTCHA / spam protection
- Form storage (Squarespace panel)
- Google Sheets integration (via Zapier)
- Conditional logic (limited)
- Multi-step forms (via code)

### 8.11 Membership Areas
- Gated content (pages, blog posts, videos)
- Membership plans (free, paid, recurring)
- Member profiles
- Member-only pricing
- Drip content
- Community features
- SSO options (Okta, Google, Azure, SAML, OAuth 2.0, OpenID)
- SCIM provisioning (enterprise)

### 8.12 Invoicing & Financial
- Professional invoices (free)
- Scheduled invoices
- Recurring invoices
- Invoice customization (logo, branding, terms)
- Online payment via invoices
- Invoice tracking
- Squarespace Balance (financial account)
- Same-day earnings access
- Business spending card
- Cashback rewards

### 8.13 Domains
- Domain registration
- Domain transfer
- Google Workspace email (integration)
- Custom email address
- DNS management
- Domain forwarding
- WHOIS privacy

### 8.14 Integrations
- Google Analytics, Google Search Console, Google Ads
- Facebook/Instagram, Pinterest, TikTok
- Mailchimp, ConvertKit (via Zapier)
- Zapier (2,000+ apps)
- Disqus (comments)
- OpenTable (reservations)
- ChowNow (food ordering)
- Printful (print on demand)
- ShipBob, Shippo (fulfillment)
- Square POS
- Google Maps
- Social media feeds
- Custom code embeds
- Developer API (Commerce, Forms, Inventory, Profiles)

### 8.15 User Roles & Permissions
- Owner
- Administrator
- Website Editor
- Billing
- Analytics
- Comment Moderator
- Store Manager
- Scheduling Administrator
- Email Campaigns Editor
- Viewer (read-only)

### 8.16 Accessibility
- WCAG 2.1 considerations
- Alt text support
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Accessible templates
- Color contrast guidelines

### 8.17 Mobile
- Responsive design (all templates)
- Mobile-specific design adjustments
- Squarespace mobile app (content management, analytics, commerce, scheduling)
- Mobile commerce optimized checkout

### 8.18 Bio Sites & Link in Bio
- Bio Site builder
- Custom domain for bio site
- Digital product sales from bio site
- Appointment booking from bio site
- Link customization
- Analytics for bio site

### 8.19 AI Features (2025 - Beacon AI & Beyond)
- AI website generation
- AI text generation (content blocks)
- AI product descriptions (AI Product Composer)
- AI discount recommendations (AI Discount Composer)
- AI FAQ generation (AI FAQ Composer)
- AI SEO metadata generation
- AI alt text generation
- AI business planning assistance
- AI marketing automation suggestions
- Beacon AI (ongoing AI business partner)

---

## 9. Ghost

**Type:** Open-source publishing platform | **License:** MIT | **Stack:** Node.js/MySQL/SQLite | **Focus:** Blogging, newsletters, memberships

### 9.1 Editor
- React/Redux-based editor (Koenig editor, rewritten 2024)
- Rich text formatting (bold, italic, heading, quote, link, list)
- Card system: Image, Gallery, Markdown, HTML, Bookmark, Email content, Email CTA, Toggle, Callout, Divider, Button, Product, Header, File, Audio, Video, NFT, Signup
- Drag-and-drop card reordering
- Inline image upload and hosting
- Unsplash integration (free stock photos)
- Image editing (crop, resize) natively in editor
- Image galleries (grid, wide, full)
- Embed cards (YouTube, Twitter, Vimeo, CodePen, etc.)
- Markdown support (full card or inline)
- Code card with syntax highlighting
- Toggle card (expandable/collapsible content)
- Bookmark card (auto-fetched link previews)
- Email content card (email-only sections)
- Snippet management (saved reusable content blocks)
- Focus mode / distraction-free writing
- Word count and reading time
- Word count goals
- Post history (who edited what, when)
- Version restore
- Undo/redo
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+H, etc.)
- Image width options (normal, wide, full)
- Internal linking (reference other posts)
- Drag-and-drop images

### 9.2 Content Management
- Posts and Pages
- Tags (primary tag, multiple tags)
- Authors (multi-author)
- Internal tags (organizational, hidden from public)
- Post URL (custom slug)
- Post excerpt
- Featured posts
- Post scheduling
- Post visibility: public, members-only, paid-members-only, specific-tier-only
- Post status: Draft, Scheduled, Published, Sent (newsletters)
- Canonical URL setting
- Code injection per post (head, footer)
- OpenGraph image/title/description per post
- Twitter card image/title/description per post
- Custom template per post (theme-dependent)
- Content collections (via routing)
- MobileDoc/Lexical JSON storage format

### 9.3 Newsletter & Email
- Built-in newsletter system
- Newsletter from any post
- Email design customization (header image, colors, fonts)
- Email segmentation (free members, paid members, specific labels)
- Email-only content (email content cards)
- Email subject and preview text
- Email preview before sending
- Send test email
- Email analytics (open rate, click rate)
- Email retry (failed delivery)
- Multiple newsletter support (different newsletters for different audiences)
- Newsletter subscription management
- Subscriber import/export (CSV)
- Signup forms / embeddable forms
- RSS-to-email (via integration)
- Native Mailgun/Mailjet integration for email delivery
- Custom email templates (via theme)

### 9.4 Membership & Monetization
- Free membership tier
- Paid membership tiers (monthly/yearly)
- Custom pricing per tier
- Tier-specific content gating
- Stripe integration (native, zero platform fee)
- Member signup / login portal
- Member account management (update email, cancel, etc.)
- Member analytics (total, free, paid, MRR, growth)
- Member labels and segments
- Member notes
- Member impersonation (admin)
- Offers and coupons (discounts for subscriptions)
- Trial periods
- Complimentary memberships (gift access)
- Member CSV import/export
- Member activity tracking
- Subscription revenue analytics (MRR, ARR)

### 9.5 Themes
- Handlebars.js templating
- Ghost themes (free and paid marketplace)
- Casper (default theme)
- Custom theme development
- Theme upload via admin
- Theme settings (custom design settings per theme)
- Dynamic routing (routes.yaml)
- Content collections (via routing)
- Custom post templates
- Partials (reusable template fragments)
- @asset helper (cache-busted URLs)
- @site, @config data helpers
- Navigation helpers
- Pagination helpers
- Tag and author helpers
- Responsive image helpers
- Members helpers (conditional rendering based on membership)
- Custom theme settings (in package.json)
- Theme marketplace (official and third-party)

### 9.6 SEO
- Automatic XML sitemap
- Automatic meta tags
- Open Graph tags
- Twitter Card tags
- Canonical URLs (auto-generated, customizable)
- Schema.org structured data (Article, WebSite, Organization)
- Clean URL structure (configurable via routing)
- Social preview in editor
- No-code SEO (optimized by default)
- Fast page load (Node.js + static caching)
- Semantic HTML output
- AMP support (via custom theme or integration)

### 9.7 API
- Content API (public, read-only: posts, pages, tags, authors, tiers, settings)
- Admin API (authenticated: posts, pages, tags, images, themes, members, tiers, offers, newsletters, webhooks, users, site)
- Webhooks (post.published, post.unpublished, member.added, member.updated, etc.)
- API versioning
- JavaScript Content API SDK
- JavaScript Admin API SDK
- PHP SDK
- Python SDK (community)
- Ruby SDK (community)
- Custom integrations (individual API keys per integration)
- Zapier integration
- First-party integrations: Slack, AMP, Unsplash, Stripe

### 9.8 Social Web & Distribution
- ActivityPub integration (Ghost 6.0, 2025)
- Publish to Fediverse (Mastodon, Bluesky, Threads, Flipboard, etc.)
- Cross-platform discovery and following
- Comments from social web clients
- RSS feed (full content or excerpt)
- JSON Feed
- Social media sharing
- OEmbed support

### 9.9 Admin Panel
- Clean, minimal admin dashboard
- Post list with filters (status, tag, author, visibility)
- Member dashboard (growth, engagement, revenue)
- Staff management (Owner, Administrator, Editor, Author, Contributor)
- Staff permissions
- Activity log (post history)
- Site settings (title, description, language, timezone, metadata)
- Design settings (navigation, branding, code injection, announcements)
- Labs (experimental features)
- Import/export (JSON)
- Redirects management (JSON/YAML upload)
- Routes management (YAML)
- Integrations management
- Theme management
- Publication identity (icon, logo, cover image, accent color)

### 9.10 Performance
- Node.js (non-blocking I/O)
- Built-in caching (server-side)
- Static asset serving
- Image optimization (via CDN with Ghost(Pro))
- Lazy loading (theme-dependent)
- Minimal JavaScript output
- Fast first contentful paint
- CDN (Ghost(Pro) or custom)
- Edge caching
- Database query optimization

### 9.11 Deployment
- Self-hosted (Node.js + MySQL/SQLite)
- Ghost(Pro) (managed hosting)
- Docker support
- One-click installers (DigitalOcean, AWS, etc.)
- Ghost-CLI (install, update, configure)
- Automatic updates (Ghost(Pro))
- Migration tools (WordPress importer, Substack importer, Medium importer, Mailchimp importer)

### 9.12 Unique Features
- Portal (membership UI widget, embedded on any theme)
- Announcement bar (customizable per audience)
- Comments (native, member-based)
- Brand identity (accent color, publication icon, logo, cover)
- Code injection (global head/footer, per-post head/footer)
- Labs (experimental features toggle)
- Custom search (powered by content API)
- Native tipping (coming)
- Staff tokens (per-user API)

---

## 10. Strapi

**Type:** Open-source headless CMS | **License:** MIT (Community) / Enterprise License | **Stack:** Node.js (TypeScript) / PostgreSQL, MySQL, MariaDB, SQLite

### 10.1 Content Type Builder
- Collection types (multiple entries: articles, products, users)
- Single types (one entry: homepage, global settings)
- Components (reusable field groups)
- Dynamic zones (flexible content layouts with multiple component options)
- Content type builder UI (visual schema editor)
- Field types: Text (short/long), Rich Text (Markdown/Blocks), Number (integer, float, decimal, big integer), Date (date, datetime, time), Boolean, Email, Password, Enumeration, Media, JSON, UID, Relation, Component, Dynamic Zone
- Relations: one-to-one, one-to-many, many-to-one, many-to-many, morph (polymorphic)
- Custom fields (extensible via plugins)
- Required fields, unique fields, min/max, regex validation
- Private fields (hidden from API)
- Field configuration (default values, placeholder, description)
- Component nesting (unlimited depth)

### 10.2 Content Manager
- Content list views with filters and search
- Content creation and editing
- Rich text editor (Markdown or Blocks editor)
- Media picker (from Media Library)
- Relation picker (search and link)
- Component instances (add/remove/reorder)
- Dynamic zone component selection
- Content preview (via plugin or custom)
- Localized content editing (side-by-side)
- Draft & publish workflow
- Bulk publish / unpublish
- Content history (versions with restore) (Enterprise / Cloud)
- Autosave
- Content cloning (duplicate entries)

### 10.3 Draft & Publish
- Draft and Published states
- Separate draft and published tabs
- Modified indicator (draft changes pending)
- Publish action
- Unpublish action
- Bulk publish
- Discardable draft changes
- Relation handling in drafts (draft relations don't leak to published)

### 10.4 Internationalization (i18n)
- Built-in i18n plugin (core in v5)
- Unlimited locales
- Per-field localization toggle
- Localized content editing
- Content translation per locale
- Locale-based API filtering
- Default locale configuration
- Locale management in admin

### 10.5 Media Library
- Upload images, videos, files
- Drag-and-drop upload
- Bulk upload
- Folder organization
- Image cropping and resizing
- Thumbnail generation
- Responsive image formats
- MIME type validation
- File size limits
- Alt text and caption
- Media usage tracking (which content uses which media)
- Asset replacement
- Media filtering and search
- Upload providers: Local, AWS S3, Cloudinary, Azure, custom

### 10.6 API (REST & GraphQL)
- Auto-generated REST API for every content type
- Auto-generated GraphQL API (via plugin, official)
- OpenAPI/Swagger documentation (auto-generated)
- API filtering (=, !=, <, >, in, notIn, contains, startsWith, etc.)
- API sorting
- API pagination (page-based, offset-based)
- API field selection (sparse fieldsets)
- API population (relations, components, dynamic zones, media)
- API locale filtering
- API draft/published filtering
- Custom API endpoints (controllers, routes, services)
- Custom middleware
- API rate limiting
- API token authentication
- JWT authentication

### 10.7 Users & Permissions
- Admin users (back-office)
- End users (API consumers, via Users & Permissions plugin)
- RBAC (role-based access control)
- Admin roles: Super Admin, Editor, Author, custom roles
- End-user roles: Authenticated, Public, custom roles
- Permission per content type per action (find, findOne, create, update, delete)
- Permission per API endpoint
- Field-level permissions (Enterprise)
- SSO: Active Directory, Okta, Auth0, Keycloak, OAuth, OpenID, SAML (Enterprise)
- SCIM provisioning (Enterprise)
- Registration, login, password reset
- Email confirmation
- Provider-based authentication (Google, Facebook, GitHub, Discord, etc.)

### 10.8 Review Workflows (Enterprise)
- Custom review stages (e.g., Draft -> In Review -> Approved -> Published)
- Stage transition rules
- Assignee management per stage
- Stage-based permissions
- Webhook triggers on stage change
- Visual workflow status

### 10.9 Audit Logs (Enterprise)
- Admin activity logging
- Action tracking (create, update, delete, publish, login, etc.)
- User attribution
- Timestamp tracking
- Filterable log views
- Log retention policy
- Export audit data

### 10.10 Webhooks
- Custom webhook configuration
- Trigger events: entry.create, entry.update, entry.delete, entry.publish, entry.unpublish, media.create, media.update, media.delete, review-workflows.updateEntryStage
- Custom headers
- Multiple webhooks per event
- Webhook testing (trigger manually)
- Webhook logs (success/failure)

### 10.11 Plugins & Marketplace
- Official plugins: i18n, GraphQL, Sentry, Documentation, Email (SMTP), Upload
- Community plugins: SEO, Sitemap, Comments, Slug, Import/Export, Transformer, Menus, Navigation, Config Sync, Cloudinary, Meilisearch, Redis, etc.
- In-app marketplace (browse/install from admin)
- Plugin SDK for custom development
- Plugin lifecycle hooks
- Custom fields via plugins

### 10.12 Email
- Built-in email plugin
- SMTP configuration
- Email providers: Sendgrid, Amazon SES, Mailgun, Sendmail, custom
- Email templates (customizable)
- Programmatic email sending (from lifecycle hooks, controllers)

### 10.13 Admin Panel
- Modern React-based admin UI
- Dark mode toggle
- Customizable admin panel (logo, colors, name)
- Content Manager (CRUD for all content types)
- Media Library browser
- Content Type Builder (visual)
- Plugin marketplace (in-app)
- Settings panel (roles, webhooks, API tokens, internationalization, media, email)
- Admin panel localization (multiple languages)
- Guided tours (onboarding)
- Admin panel extensions (custom pages, sections)
- Brand/white-label customization

### 10.14 Developer Tools
- Fully TypeScript codebase (v5)
- Custom controllers, services, routes, middlewares, policies
- Lifecycle hooks (beforeCreate, afterCreate, beforeUpdate, afterUpdate, etc.)
- Database query layer (Knex.js-based)
- Strapi CLI
  - `strapi new` (project creation)
  - `strapi develop` (dev server with auto-reload)
  - `strapi build` (admin panel build)
  - `strapi start` (production)
  - `strapi generate` (scaffolding: API, controller, service, policy, middleware, plugin, content-type)
  - `strapi transfer` (data transfer between instances)
  - `strapi import/export` (data backup)
  - `strapi configuration:dump/restore`
- Data transfer (between environments)
- Custom plugins development
- Custom admin panel pages
- Single Sign-On integration
- Database migrations
- Seed data scripts
- Environment-based configuration
- `.env` support
- TypeScript autocompletion and type safety
- Hot reloading in development
- Custom validation logic

### 10.15 Configuration & Deployment
- Environment-based configuration (development, staging, production)
- Database support: PostgreSQL, MySQL, MariaDB, SQLite
- File upload providers: local, S3, Cloudinary, Azure
- Docker support
- Heroku, Railway, Render, DigitalOcean deployment guides
- Strapi Cloud (official managed hosting)
- PM2 process manager support
- Reverse proxy configuration
- CORS configuration
- Rate limiting configuration
- Security configuration (CSP, HSTS, X-Frame-Options, etc.)
- Cron jobs (scheduled tasks)
- Admin panel rebuild on deploy
- Static file serving

### 10.16 Content Import/Export
- Data import/export (CLI: strapi import/export)
- Full data backup (schema + content + media references)
- Data transfer between environments (strapi transfer)
- CSV import (via plugin)
- JSON import/export
- WordPress import (via plugin)

### 10.17 Search
- Built-in search on content types (API filters)
- Meilisearch integration (via plugin - full-text search)
- Algolia integration (via plugin)
- Elasticsearch integration (via plugin)
- Fuzzy search (via search engine plugins)

### 10.18 Cache & Performance
- REST API response caching (via middleware)
- Redis caching (via plugin)
- Database query optimization
- Asset optimization (admin panel)
- CDN for media (via upload providers)
- Lazy loading admin panel
- Connection pooling

### 10.19 Security
- Helmet.js security headers
- CORS configuration
- Rate limiting
- CSRF protection
- Input validation (per field)
- Sanitized outputs
- API token permissions (read-only, full-access, custom)
- JWT secret management
- Admin panel access control
- Secrets management
- SSL/TLS support
- Content Security Policy
- Brute force protection (via rate limiting)
- Security advisories
- Dependency security scanning

### 10.20 Unique Features
- Content Type Builder (visual schema editor - no code needed)
- Dynamic Zones (ultimate content flexibility)
- Component reusability (define once, use across content types)
- Strapi Transfer (move data between instances)
- Auto-generated API documentation
- Database agnostic (switch DB without code changes)
- No vendor lock-in (self-hosted, portable)
- Headless-first (bring your own frontend)
- Framework agnostic frontend (React, Vue, Angular, Next.js, Nuxt, Gatsby, etc.)

---

## Feature Coverage Matrix (Summary)

| Feature Category | WordPress | Joomla | Drupal | PrestaShop | Magento | Shopify | Wix | Squarespace | Ghost | Strapi |
|---|---|---|---|---|---|---|---|---|---|---|
| Visual Page Builder | Gutenberg + Elementor | Extensions | Layout Builder + XB | Extensions | Built-in | Theme Editor + Sections | Full Editor | Fluid Engine | No (headless) | No (headless) |
| Drag & Drop | Yes | Extensions | Yes | Extensions | Yes | Yes | Yes | Yes | Cards only | No |
| Custom Fields | ACF (30+ types) | Built-in (15+ types) | Fields API (30+ types) | Product attributes | EAV attributes | Metafields | Wix Data | Limited | No | Content Type Builder |
| Custom Post Types | Yes (built-in + ACF) | Components | Content Types | CMS pages only | Products only | Metaobjects | Dynamic Pages | No | Posts + Pages only | Collection Types |
| SEO Tools | Yoast/RankMath | Extensions | Modules (Metatag, etc.) | Modules | Extensions | Basic + Apps | Wix SEO Wiz | SEO Panel + AI | Built-in (basic) | Via plugins |
| E-commerce | WooCommerce | VirtueMart/HikaShop | Commerce module | Native (core) | Native (core) | Native (core) | Built-in | Built-in | Membership/Stripe | Via custom |
| Multilingual | WPML/Polylang | Built-in (70+ lang) | Built-in (core) | Built-in (75+ lang) | Store views | Markets (20 lang) | 180+ languages | Limited | 50+ languages | i18n plugin (built-in) |
| Multi-site | Built-in (Multisite) | No (extensions) | Multi-site / Domain Access | Multi-store | Multiple websites | Plus (multi-entity) | No | No | No | No |
| REST API | Yes (core) | Yes (core) | Yes (core) | Yes (Web Services) | Yes (comprehensive) | Yes (Admin + Storefront) | Velo / HTTP | Commerce API | Yes (Content + Admin) | Yes (auto-generated) |
| GraphQL | WPGraphQL (plugin) | No | Module | No | Yes (core) | Yes (Storefront + Admin) | No | No | No | Yes (plugin, official) |
| RBAC | Yes (roles + caps) | ACL (granular) | Yes (granular + Access Policy) | Employee permissions | Admin ACL | Staff permissions | Basic roles | 10 role types | 5 roles | Yes (field-level in Enterprise) |
| Webhooks | Via plugins | Via plugins | Via modules | Via modules | REST API events | Yes (50+ events) | Velo HTTP | Via API | Yes (native) | Yes (native) |
| Dark Mode | Plugins | Built-in (Joomla 5) | No | No | No | No | No | No | No | Yes (built-in) |
| AI Features | Jetpack AI, Yoast AI, Elementor AI | No | No | No | Adobe Sensei (Commerce) | Shopify Magic | 20+ AI features | Beacon AI | No | No |
| Comments | Built-in | No | No | Via modules | Via extensions | Via apps | Blog comments | Built-in | Built-in (member-based) | Via plugin |
| Newsletter/Email | Plugins (MailPoet) | Extensions | Modules | Built-in (basic) | Dotdigital | Shopify Email | Wix Ascend | Email Campaigns | Built-in (native) | Email plugin |
| Forms | Gravity Forms/CF7 | Contacts component | Webform module | Contact page | Contact forms | Via apps | Wix Forms | Built-in forms | No | Via custom |
| Membership | Plugins | Extensions | Modules | No | No | Via apps | Built-in | Built-in | Built-in (native) | Users & Permissions |
| Backup/Restore | Plugins | Extensions (Akeeba) | Core (config) + modules | Extensions | CLI + Extensions | Automatic (SaaS) | Automatic | Automatic | JSON export + CLI | CLI (strapi export/import) |
| Search | Basic + plugins | Smart Search | Search API + Solr/ES | Built-in | Elasticsearch/OpenSearch | Built-in + Apps | Built-in | Built-in | API-powered | API filters + Meilisearch plugin |
| Caching | Plugins | Built-in (page/module) | Built-in (BigPipe, cache tags) | CCC (CSS/JS) | Varnish + Redis | Automatic (CDN) | Automatic | Automatic | Server-side | Middleware/Redis |
| Version Control | Revisions (built-in) | Article versioning | Revisions (built-in) | No | Content staging (Commerce) | No | Site history | Version history | Post history | Content history (Enterprise) |
| Workflow | Plugins | Built-in (Joomla 4+) | Content Moderation + Workspaces | Order statuses | Content staging (Commerce) | Shopify Flow (automation) | Automations | No | Basic (Draft/Published) | Review Workflows (Enterprise) |
| Autosave | Yes (60s default) | Yes | Yes | No | No | Yes | Yes | Yes | Yes | Yes |
| Keyboard Shortcuts | Yes (editor) | Limited | Limited | No | No | Limited | Limited | Limited | Yes (editor) | Limited |
| CLI | WP-CLI | Joomla Console | Drush | CLI tools | bin/magento | Shopify CLI | Wix CLI | No | Ghost-CLI | Strapi CLI |
| Hooks/Filters | Actions + Filters | Plugin events | Hooks + Events | Hooks system | Plugin interceptors | Functions + Extensions | Velo events | No | No | Lifecycle hooks |
| White-labeling | Plugins | Limited | Modules | Limited | Admin theme | No | No | No | Brand identity | Admin customization |
| Activity Log | Plugins | Limited | Watchdog (Dblog) | Built-in (basic) | Admin action log (Commerce) | Activity log | No | Activity log | Post history | Audit logs (Enterprise) |
| Accessibility (WCAG) | Goal: AA | Improving | Commitment: 2.2 AA | Basic | WCAG considerations | Basic | Improving | WCAG considerations | Theme-dependent | Admin: basic |
| Maintenance Mode | Plugins | Built-in (offline) | Modules | Built-in | Built-in | Password-protected storefront | No | No | No | No |
| Social Web/Federation | No | No | ActivityPub module | No | No | No | No | No | ActivityPub (Ghost 6.0) | No |

---

## Key Gaps to Consider for ArtisanCMS

Based on this analysis, features commonly found across multiple platforms that ArtisanCMS should ensure coverage of:

### Must-Have (present in 7+ platforms)
1. **Visual drag-and-drop editor** with undo/redo, keyboard shortcuts
2. **Content scheduling** (future publish date)
3. **Revision history** with diff comparison and restore
4. **Autosave** with configurable intervals
5. **Media management** with folders, image editing, bulk upload
6. **SEO tools** (meta tags, sitemap, Schema.org, redirects, canonical URLs)
7. **User roles and permissions** (granular RBAC)
8. **REST API** with authentication
9. **Multilingual support**
10. **Responsive design** / mobile preview
11. **Forms** (contact, custom fields, conditional logic)
12. **Blog/content** with categories, tags, authors
13. **Comments system**
14. **Search** with full-text capabilities
15. **Caching** strategy
16. **Backup/restore**
17. **Import/export** (CSV, JSON)
18. **CLI** for common operations
19. **Analytics** (built-in or integration)
20. **Email** notifications and customization

### Should-Have (present in 4-6 platforms)
1. **GraphQL API** in addition to REST
2. **Content moderation workflow** (custom states, transitions)
3. **Webhooks** (native, configurable)
4. **Dark mode** for admin
5. **AI features** (content generation, image generation, SEO suggestions)
6. **Membership / gated content**
7. **E-commerce** capabilities (even basic)
8. **Multi-site** support
9. **Custom fields / custom content types**
10. **Activity log / audit trail**
11. **Maintenance mode**
12. **Social media integration** (sharing, Open Graph)
13. **White-labeling / branding**
14. **Accessibility** (WCAG compliance)
15. **Newsletter / email marketing**

### Nice-to-Have (differentiators)
1. **ActivityPub / Social Web** federation (Ghost 6.0 pioneered this)
2. **AI-powered page building** (Wix, Shopify, Elementor)
3. **Real-time collaboration** (block-level comments, concurrent editing)
4. **Component/block marketplace** (install blocks from editor)
5. **Content staging / workspaces** (Drupal, Magento Commerce)
6. **Dynamic zones** (Strapi's flexible content approach)
7. **Headless mode** with auto-generated API docs
8. **Visual query builder** for content listings (Drupal Views)
9. **Booking/appointment system** (Wix, Squarespace)
10. **Invoicing** (Squarespace)
11. **POS integration** (Shopify, Wix, Squarespace)
12. **Bio site / link-in-bio** builder (Squarespace)
13. **Podcast support** (Squarespace, Ghost)
14. **A/B testing** (Magento, Squarespace email)
15. **Progressive Web App** support
16. **Announcement bar** (Ghost)
17. **Command palette** (WordPress, quick search for actions)
18. **Guided tours** for admin onboarding (Joomla, Strapi)
