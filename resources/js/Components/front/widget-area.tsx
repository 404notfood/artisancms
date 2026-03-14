import type { WidgetAreaData, WidgetData } from '@/types/cms';

// ---------------------------------------------------------------------------
// Individual widget renderers
// ---------------------------------------------------------------------------

function RecentPostsWidget({ widget }: { widget: WidgetData }) {
    const count = (widget.config?.count as number) ?? 5;

    return (
        <div className="widget widget-recent-posts">
            {widget.title && (
                <h3 className="widget-title text-lg font-semibold mb-3">{widget.title}</h3>
            )}
            <p className="text-sm text-gray-500">
                Affichage des {count} derniers articles.
            </p>
            {/* Actual post list would be populated server-side or via API */}
        </div>
    );
}

function CategoriesWidget({ widget }: { widget: WidgetData }) {
    const showCount = (widget.config?.show_count as boolean) ?? true;
    const hierarchical = (widget.config?.hierarchical as boolean) ?? false;

    return (
        <div className="widget widget-categories">
            {widget.title && (
                <h3 className="widget-title text-lg font-semibold mb-3">{widget.title}</h3>
            )}
            <p className="text-sm text-gray-500">
                Categories{showCount ? ' (avec compteur)' : ''}{hierarchical ? ', hierarchique' : ''}
            </p>
            {/* Actual category list would be populated server-side or via API */}
        </div>
    );
}

function SearchWidget({ widget }: { widget: WidgetData }) {
    const placeholder = (widget.config?.placeholder as string) ?? 'Rechercher...';

    return (
        <div className="widget widget-search">
            {widget.title && (
                <h3 className="widget-title text-lg font-semibold mb-3">{widget.title}</h3>
            )}
            <form action="/search" method="GET">
                <div className="flex">
                    <input
                        type="search"
                        name="q"
                        placeholder={placeholder}
                        className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        className="rounded-r-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition-colors"
                    >
                        Rechercher
                    </button>
                </div>
            </form>
        </div>
    );
}

function TextWidget({ widget }: { widget: WidgetData }) {
    const content = (widget.config?.content as string) ?? '';

    return (
        <div className="widget widget-text">
            {widget.title && (
                <h3 className="widget-title text-lg font-semibold mb-3">{widget.title}</h3>
            )}
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {content}
            </div>
        </div>
    );
}

function CustomHtmlWidget({ widget }: { widget: WidgetData }) {
    const html = (widget.config?.html as string) ?? '';

    return (
        <div className="widget widget-custom-html">
            {widget.title && (
                <h3 className="widget-title text-lg font-semibold mb-3">{widget.title}</h3>
            )}
            <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}

function ArchivesWidget({ widget }: { widget: WidgetData }) {
    const showCount = (widget.config?.show_count as boolean) ?? true;
    const dropdown = (widget.config?.dropdown as boolean) ?? false;

    return (
        <div className="widget widget-archives">
            {widget.title && (
                <h3 className="widget-title text-lg font-semibold mb-3">{widget.title}</h3>
            )}
            <p className="text-sm text-gray-500">
                Archives{showCount ? ' (avec compteur)' : ''}{dropdown ? ', liste deroulante' : ''}
            </p>
            {/* Actual archives list would be populated server-side or via API */}
        </div>
    );
}

function TagCloudWidget({ widget }: { widget: WidgetData }) {
    const maxTags = (widget.config?.max_tags as number) ?? 20;

    return (
        <div className="widget widget-tag-cloud">
            {widget.title && (
                <h3 className="widget-title text-lg font-semibold mb-3">{widget.title}</h3>
            )}
            <p className="text-sm text-gray-500">
                Nuage de tags (max {maxTags})
            </p>
            {/* Actual tag cloud would be populated server-side or via API */}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Widget renderer map
// ---------------------------------------------------------------------------

const widgetRendererMap: Record<string, React.ComponentType<{ widget: WidgetData }>> = {
    recent_posts: RecentPostsWidget,
    categories: CategoriesWidget,
    search: SearchWidget,
    text: TextWidget,
    custom_html: CustomHtmlWidget,
    archives: ArchivesWidget,
    tag_cloud: TagCloudWidget,
};

// ---------------------------------------------------------------------------
// Single widget renderer
// ---------------------------------------------------------------------------

function WidgetRenderer({ widget }: { widget: WidgetData }) {
    const Renderer = widgetRendererMap[widget.type];

    if (!Renderer) {
        // Unknown widget type - skip silently on the public site
        return null;
    }

    return <Renderer widget={widget} />;
}

// ---------------------------------------------------------------------------
// Widget Area component
// ---------------------------------------------------------------------------

interface WidgetAreaProps {
    /** The widget area data, passed from Inertia shared data or page props. */
    area?: WidgetAreaData | null;
    /** CSS class name for the widget area container. */
    className?: string;
}

/**
 * Public-facing widget area renderer.
 * Renders a widget area by its data, displaying each active widget
 * using the appropriate renderer component.
 */
export default function WidgetArea({ area, className }: WidgetAreaProps) {
    if (!area || !area.widgets || area.widgets.length === 0) {
        return null;
    }

    // Filter to only active widgets and sort by order
    const activeWidgets = area.widgets
        .filter((w) => w.active)
        .sort((a, b) => a.order - b.order);

    if (activeWidgets.length === 0) {
        return null;
    }

    return (
        <aside className={className} data-widget-area={area.slug}>
            <div className="space-y-6">
                {activeWidgets.map((widget) => (
                    <WidgetRenderer key={widget.id} widget={widget} />
                ))}
            </div>
        </aside>
    );
}
