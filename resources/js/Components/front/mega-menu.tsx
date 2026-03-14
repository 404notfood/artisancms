import { useState, useRef, useEffect } from 'react';
import type { MenuItemData } from '@/types/cms';

interface MegaMenuProps {
    items: MenuItemData[];
    className?: string;
}

interface MegaMenuDropdownProps {
    item: MenuItemData;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

interface MobileMenuItemProps {
    item: MenuItemData;
    depth?: number;
}

/**
 * MegaMenu - a responsive navigation component that supports mega menus with columns.
 * On desktop: shows a dropdown with columns layout.
 * On mobile: collapses to an accordion.
 */
export default function MegaMenu({ items, className = '' }: MegaMenuProps) {
    const [openItemId, setOpenItemId] = useState<number | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    function handleOpen(id: number) {
        setOpenItemId(id);
    }

    function handleClose() {
        setOpenItemId(null);
    }

    return (
        <nav className={`relative ${className}`}>
            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-1">
                {items.map((item) => (
                    <li key={item.id} className="relative">
                        {item.is_mega && item.children && item.children.length > 0 ? (
                            <MegaMenuDropdown
                                item={item}
                                isOpen={openItemId === item.id}
                                onOpen={() => handleOpen(item.id)}
                                onClose={handleClose}
                            />
                        ) : (
                            <DesktopNavItem item={item} />
                        )}
                    </li>
                ))}
            </ul>

            {/* Mobile Toggle */}
            <div className="lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    aria-label="Menu"
                >
                    {mobileOpen ? (
                        <XIcon />
                    ) : (
                        <MenuIcon />
                    )}
                </button>
            </div>

            {/* Mobile Navigation */}
            {mobileOpen && (
                <div className="lg:hidden absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                    <ul className="py-2">
                        {items.map((item) => (
                            <MobileMenuItem key={item.id} item={item} />
                        ))}
                    </ul>
                </div>
            )}
        </nav>
    );
}

function DesktopNavItem({ item }: { item: MenuItemData }) {
    return (
        <a
            href={item.url ?? '#'}
            target={item.target}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-md hover:bg-gray-50 transition-colors"
        >
            {item.icon && <span className="text-gray-400">{item.icon}</span>}
            {item.label}
            {item.badge_text && (
                <span
                    className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: item.badge_color ?? '#6366f1' }}
                >
                    {item.badge_text}
                </span>
            )}
        </a>
    );
}

function MegaMenuDropdown({ item, isOpen, onOpen, onClose }: MegaMenuDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const columns = item.mega_columns || 3;
    const children = item.children ?? [];
    const megaContent = item.mega_content;

    function handleMouseEnter() {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        onOpen();
    }

    function handleMouseLeave() {
        timeoutRef.current = setTimeout(() => {
            onClose();
        }, 200);
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Split children into columns
    const columnItems: MenuItemData[][] = [];
    const itemsPerColumn = Math.ceil(children.length / columns);
    for (let i = 0; i < columns; i++) {
        columnItems.push(children.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn));
    }

    return (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Trigger */}
            <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-md hover:bg-gray-50 transition-colors"
            >
                {item.icon && <span className="text-gray-400">{item.icon}</span>}
                {item.label}
                {item.badge_text && (
                    <span
                        className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: item.badge_color ?? '#6366f1' }}
                    >
                        {item.badge_text}
                    </span>
                )}
                <ChevronDownIcon />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-screen max-w-4xl rounded-xl border border-gray-200 bg-white shadow-xl z-50"
                >
                    <div className="p-6">
                        <div className={`grid gap-6`} style={{ gridTemplateColumns: megaContent?.featured_image ? `repeat(${columns}, 1fr) 1fr` : `repeat(${columns}, 1fr)` }}>
                            {/* Columns of links */}
                            {columnItems.map((colItems, colIndex) => (
                                <div key={colIndex} className="space-y-1">
                                    {colItems.map((child) => (
                                        <a
                                            key={child.id}
                                            href={child.url ?? '#'}
                                            target={child.target}
                                            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                        >
                                            <span className="font-medium">{child.label}</span>
                                            {child.badge_text && (
                                                <span
                                                    className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                                    style={{ backgroundColor: child.badge_color ?? '#6366f1' }}
                                                >
                                                    {child.badge_text}
                                                </span>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            ))}

                            {/* Featured content area */}
                            {megaContent?.featured_image && (
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <img
                                        src={megaContent.featured_image}
                                        alt={megaContent.featured_title ?? ''}
                                        className="w-full rounded-lg object-cover mb-3"
                                    />
                                    {megaContent.featured_title && (
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                            {megaContent.featured_title}
                                        </h4>
                                    )}
                                    {megaContent.featured_description && (
                                        <p className="text-xs text-gray-500">
                                            {megaContent.featured_description}
                                        </p>
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

function MobileMenuItem({ item, depth = 0 }: MobileMenuItemProps) {
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
                    {item.badge_text && (
                        <span
                            className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: item.badge_color ?? '#6366f1' }}
                        >
                            {item.badge_text}
                        </span>
                    )}
                </a>
                {hasChildren && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        {expanded ? <ChevronUpMobileIcon /> : <ChevronDownMobileIcon />}
                    </button>
                )}
            </div>
            {hasChildren && expanded && (
                <ul className="border-l border-gray-100 ml-4">
                    {item.children!.map((child) => (
                        <MobileMenuItem key={child.id} item={child} depth={depth + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

// -- SVG Icons --

function ChevronDownIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}

function ChevronDownMobileIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}

function ChevronUpMobileIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
