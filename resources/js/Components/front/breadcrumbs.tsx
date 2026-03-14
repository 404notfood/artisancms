import { Link } from '@inertiajs/react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

/**
 * Breadcrumbs component with semantic HTML and Schema.org JSON-LD.
 *
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: 'Accueil', href: '/' },
 *     { label: 'Blog', href: '/blog' },
 *     { label: 'Mon article' },
 *   ]} />
 *
 * The last item is rendered as plain text (current page).
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    if (items.length === 0) return null;

    // Build Schema.org BreadcrumbList JSON-LD
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            ...(item.href
                ? {
                      item: {
                          '@id': `${origin}${item.href}`,
                          name: item.label,
                      },
                  }
                : { name: item.label }),
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;

                        return (
                            <li key={index} className="flex items-center gap-1">
                                {index > 0 && (
                                    <svg
                                        className="h-4 w-4 flex-shrink-0 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                                    </svg>
                                )}
                                {isLast || !item.href ? (
                                    <span
                                        className="font-medium text-gray-900"
                                        aria-current={isLast ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="transition-colors hover:text-[var(--color-primary,#3b82f6)] hover:underline"
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}
