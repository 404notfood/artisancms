import { useState, useRef, useEffect } from 'react';

interface MegaMenuItem {
    id: number;
    label: string;
    url: string;
    target?: string;
    mega_menu?: boolean;
    mega_columns?: number;
    badge_text?: string;
    badge_color?: string;
    children?: MegaMenuItem[];
}

interface MegaMenuRendererProps {
    items: MegaMenuItem[];
    className?: string;
}

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

function MegaMenuTopItem({ item }: { item: MegaMenuItem }) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const containerRef = useRef<HTMLLIElement>(null);

    const hasChildren = item.children && item.children.length > 0;
    const isMega = item.mega_menu && hasChildren;
    const columns = item.mega_columns || 3;

    function handleMouseEnter() {
        clearTimeout(timeoutRef.current);
        setOpen(true);
    }

    function handleMouseLeave() {
        timeoutRef.current = setTimeout(() => setOpen(false), 150);
    }

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    return (
        <li
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <a
                href={item.url}
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
                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </a>

            {/* Mega menu dropdown */}
            {isMega && open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-screen max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
                    <div
                        className="grid gap-6"
                        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                    >
                        {item.children!.map((child) => (
                            <div key={child.id}>
                                <a
                                    href={child.url}
                                    target={child.target || undefined}
                                    className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                                >
                                    {child.label}
                                </a>
                                {child.children && child.children.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {child.children.map((grandchild) => (
                                            <li key={grandchild.id}>
                                                <a
                                                    href={grandchild.url}
                                                    target={grandchild.target || undefined}
                                                    className="block text-sm text-gray-600 hover:text-indigo-600 py-0.5"
                                                >
                                                    {grandchild.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Regular dropdown */}
            {!isMega && hasChildren && open && (
                <ul className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    {item.children!.map((child) => (
                        <li key={child.id}>
                            <a
                                href={child.url}
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
