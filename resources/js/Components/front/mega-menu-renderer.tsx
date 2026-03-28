import { useState, useRef, useEffect } from 'react';
import type { MenuItemData } from '@/types/cms';

interface MegaMenuRendererProps {
    items: MenuItemData[];
    className?: string;
}

/**
 * MegaMenuRenderer - Lightweight desktop-only mega menu renderer.
 * Used by themes that handle mobile navigation separately.
 * Supports columns, featured image, custom HTML, and width modes.
 */
export function MegaMenuRenderer({ items, className }: MegaMenuRendererProps) {
    return (
        <nav className={className}>
            <ul className="flex items-center gap-1">
                {items.map((item) => (
                    <MegaMenuTopItem key={item.id} item={item} />
                ))}
            </ul>
        </nav>
    );
}

function MegaMenuTopItem({ item }: { item: MenuItemData }) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const hasChildren = item.children && item.children.length > 0;
    const isMega = item.is_mega && hasChildren;
    const columns = item.mega_columns || 3;
    const hasImage = !!item.mega_image || !!item.mega_content?.featured_image;
    const hasHtml = !!item.mega_html;

    function enter() {
        clearTimeout(timeoutRef.current);
        setOpen(true);
    }
    function leave() {
        timeoutRef.current = setTimeout(() => setOpen(false), 150);
    }
    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const widthClass = item.mega_width === 'full'
        ? 'left-0 right-0 w-full'
        : item.mega_width === 'fixed'
            ? 'left-1/2 -translate-x-1/2 w-[900px] max-w-[95vw]'
            : 'left-0 w-screen max-w-3xl';

    const extraCol = (hasImage || hasHtml) ? 1 : 0;

    return (
        <li
            className="relative"
            onMouseEnter={enter}
            onMouseLeave={leave}
        >
            <a
                href={item.url ?? '#'}
                target={item.target || undefined}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors rounded-md hover:bg-gray-50"
            >
                {item.label}
                {item.badge_text && (
                    <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                        style={{ backgroundColor: item.badge_color || '#6366f1' }}
                    >
                        {item.badge_text}
                    </span>
                )}
                {hasChildren && (
                    <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </a>

            {/* Mega dropdown */}
            {isMega && open && (
                <div className={`absolute top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-6 shadow-xl ${widthClass}`}>
                    <div
                        className="grid gap-6"
                        style={{ gridTemplateColumns: `repeat(${columns + extraCol}, 1fr)` }}
                    >
                        {item.children!.map((child) => (
                            <div key={child.id}>
                                <a
                                    href={child.url ?? '#'}
                                    target={child.target || undefined}
                                    className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                                >
                                    {child.label}
                                </a>
                                {child.children && child.children.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {child.children.map((gc) => (
                                            <li key={gc.id}>
                                                <a
                                                    href={gc.url ?? '#'}
                                                    target={gc.target || undefined}
                                                    className="block text-sm text-gray-600 hover:text-indigo-600 py-0.5"
                                                >
                                                    {gc.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}

                        {/* Side panel: image / HTML */}
                        {(hasImage || hasHtml) && (
                            <div className="rounded-lg bg-gray-50 p-4 space-y-3">
                                {(item.mega_image || item.mega_content?.featured_image) && (
                                    <img
                                        src={item.mega_image ?? item.mega_content!.featured_image!}
                                        alt={item.mega_content?.featured_title ?? ''}
                                        className="w-full rounded-lg object-cover"
                                    />
                                )}
                                {item.mega_content?.featured_title && (
                                    <h4 className="text-sm font-semibold text-gray-900">{item.mega_content.featured_title}</h4>
                                )}
                                {item.mega_content?.featured_description && (
                                    <p className="text-xs text-gray-500">{item.mega_content.featured_description}</p>
                                )}
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
            )}

            {/* Regular dropdown */}
            {!isMega && hasChildren && open && (
                <ul className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    {item.children!.map((child) => (
                        <li key={child.id}>
                            <a
                                href={child.url ?? '#'}
                                target={child.target || undefined}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                            >
                                {child.label}
                                {child.badge_text && (
                                    <span
                                        className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                                        style={{ backgroundColor: child.badge_color || '#6366f1' }}
                                    >
                                        {child.badge_text}
                                    </span>
                                )}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
