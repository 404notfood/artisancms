import { useState, useRef, useEffect } from 'react';
import type { MenuItemData } from '@/types/cms';

interface MegaMenuProps {
    items: MenuItemData[];
    className?: string;
}

/**
 * MegaMenu - Responsive navigation with mega menu support.
 * Desktop: hover-triggered dropdown with columns, images, and custom HTML.
 * Mobile: collapsible accordion.
 * Mega menus only activate on root-level items (parent_id === null).
 */
export default function MegaMenu({ items, className = '' }: MegaMenuProps) {
    const [openItemId, setOpenItemId] = useState<number | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className={`relative ${className}`}>
            {/* Desktop */}
            <ul className="hidden lg:flex items-center gap-1">
                {items.map((item) => (
                    <li key={item.id} className="relative">
                        {item.is_mega && item.children && item.children.length > 0 ? (
                            <MegaDropdown
                                item={item}
                                isOpen={openItemId === item.id}
                                onOpen={() => setOpenItemId(item.id)}
                                onClose={() => setOpenItemId(null)}
                            />
                        ) : (
                            <NavLink item={item} />
                        )}
                    </li>
                ))}
            </ul>

            {/* Mobile toggle */}
            <div className="lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    aria-label="Menu"
                    aria-expanded={mobileOpen}
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        {mobileOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile panel */}
            {mobileOpen && (
                <div className="lg:hidden absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                    <ul className="py-2">
                        {items.map((item) => (
                            <MobileAccordionItem key={item.id} item={item} />
                        ))}
                    </ul>
                </div>
            )}
        </nav>
    );
}

/* ---------- Desktop components ---------- */

function NavLink({ item }: { item: MenuItemData }) {
    return (
        <a
            href={item.url ?? '#'}
            target={item.target}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-md hover:bg-gray-50 transition-colors"
        >
            {item.icon && <span className="text-gray-400">{item.icon}</span>}
            {item.label}
            <Badge text={item.badge_text} color={item.badge_color} />
        </a>
    );
}

function MegaDropdown({ item, isOpen, onOpen, onClose }: {
    item: MenuItemData;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const columns = item.mega_columns || 3;
    const children = item.children ?? [];
    const megaContent = item.mega_content;
    const hasImage = !!item.mega_image || !!megaContent?.featured_image;
    const hasHtml = !!item.mega_html;

    function enter() {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onOpen();
    }
    function leave() {
        timeoutRef.current = setTimeout(onClose, 200);
    }
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    // Determine total grid columns: children columns + optional image/html column
    const extraCol = hasImage || hasHtml ? 1 : 0;
    const totalCols = columns + extraCol;

    // Distribute children across columns
    const colItems: MenuItemData[][] = [];
    const perCol = Math.ceil(children.length / columns);
    for (let i = 0; i < columns; i++) {
        colItems.push(children.slice(i * perCol, (i + 1) * perCol));
    }

    // Width class based on mega_width
    const widthClass = item.mega_width === 'full'
        ? 'left-0 right-0 w-full'
        : item.mega_width === 'fixed'
            ? 'left-1/2 -translate-x-1/2 w-[900px] max-w-[95vw]'
            : 'left-1/2 -translate-x-1/2 w-screen max-w-4xl';

    return (
        <div onMouseEnter={enter} onMouseLeave={leave}>
            <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-md hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen}
            >
                {item.icon && <span className="text-gray-400">{item.icon}</span>}
                {item.label}
                <Badge text={item.badge_text} color={item.badge_color} />
                <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {isOpen && (
                <div className={`absolute top-full mt-1 rounded-xl border border-gray-200 bg-white shadow-xl z-50 ${widthClass}`}>
                    <div className="p-6">
                        <div
                            className="grid gap-6"
                            style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}
                        >
                            {/* Link columns */}
                            {colItems.map((col, ci) => (
                                <div key={ci} className="space-y-1">
                                    {col.map((child) => (
                                        <a
                                            key={child.id}
                                            href={child.url ?? '#'}
                                            target={child.target}
                                            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                        >
                                            <span className="font-medium">{child.label}</span>
                                            <Badge text={child.badge_text} color={child.badge_color} />
                                        </a>
                                    ))}
                                </div>
                            ))}

                            {/* Side panel: image and/or custom HTML */}
                            {(hasImage || hasHtml) && (
                                <div className="rounded-lg bg-gray-50 p-4 space-y-3">
                                    <MegaImage item={item} megaContent={megaContent} />
                                    {hasHtml && (
                                        <div
                                            className="prose prose-sm max-w-none text-gray-600"
                                            dangerouslySetInnerHTML={{ __html: item.mega_html! }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MegaImage({ item, megaContent }: { item: MenuItemData; megaContent: MenuItemData['mega_content'] }) {
    const src = item.mega_image ?? megaContent?.featured_image;
    if (!src) return null;
    const title = megaContent?.featured_title;
    const desc = megaContent?.featured_description;

    return (
        <div>
            <img src={src} alt={title ?? ''} className="w-full rounded-lg object-cover" />
            {title && <h4 className="mt-2 text-sm font-semibold text-gray-900">{title}</h4>}
            {desc && <p className="text-xs text-gray-500">{desc}</p>}
        </div>
    );
}

/* ---------- Mobile components ---------- */

function MobileAccordionItem({ item, depth = 0 }: { item: MenuItemData; depth?: number }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    return (
        <li>
            <div
                className="flex items-center justify-between"
                style={{ paddingLeft: `${(depth + 1) * 16}px` }}
            >
                <a
                    href={item.url ?? '#'}
                    target={item.target}
                    className="flex-1 py-2.5 pr-3 text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                    {item.icon && <span className="mr-2 text-gray-400">{item.icon}</span>}
                    {item.label}
                    <Badge text={item.badge_text} color={item.badge_color} />
                </a>
                {hasChildren && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        aria-expanded={expanded}
                        aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                        <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                )}
            </div>

            {hasChildren && expanded && (
                <>
                    {/* Show mega image/html on mobile too */}
                    {item.is_mega && (item.mega_image || item.mega_html) && (
                        <div className="mx-4 my-2 rounded-lg bg-gray-50 p-3 space-y-2">
                            {item.mega_image && (
                                <img src={item.mega_image} alt="" className="w-full rounded-lg object-cover" />
                            )}
                            {item.mega_html && (
                                <div
                                    className="prose prose-sm max-w-none text-gray-600"
                                    dangerouslySetInnerHTML={{ __html: item.mega_html }}
                                />
                            )}
                        </div>
                    )}
                    <ul className="border-l border-gray-100 ml-4">
                        {item.children!.map((child) => (
                            <MobileAccordionItem key={child.id} item={child} depth={depth + 1} />
                        ))}
                    </ul>
                </>
            )}
        </li>
    );
}

/* ---------- Shared ---------- */

function Badge({ text, color }: { text: string | null; color: string | null }) {
    if (!text) return null;
    return (
        <span
            className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: color ?? '#6366f1' }}
        >
            {text}
        </span>
    );
}
