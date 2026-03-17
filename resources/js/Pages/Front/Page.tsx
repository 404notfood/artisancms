import { Head } from '@inertiajs/react';
import type { PageData, MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import BlockRenderer from '@/Components/front/block-renderer';

interface FrontPageProps {
    page: PageData;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
}

const LEGAL_SLUGS = ['mentions-legales', 'politique-de-confidentialite', 'politique-de-cookies'];

export default function FrontPage({ page, menus, theme }: FrontPageProps) {
    const isLegal = LEGAL_SLUGS.includes(page.slug ?? '');

    const blocks = Array.isArray(page.content)
        ? page.content
        : (page.content as { blocks?: unknown[] })?.blocks;

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head>
                <title>{page.meta_title || page.title}</title>
                {page.meta_description && (
                    <meta name="description" content={page.meta_description} />
                )}
            </Head>
            <main>
                {/* Hero header for legal pages */}
                {isLegal && (
                    <div className="border-b border-gray-100 bg-gray-50">
                        <div className="mx-auto max-w-[800px] px-6 py-12">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">
                                Informations légales
                            </p>
                            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                {page.title}
                            </h1>
                            {page.updated_at && (
                                <p className="mt-3 text-sm text-gray-500">
                                    Dernière mise à jour :{' '}
                                    {new Date(page.updated_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className={isLegal ? 'legal-page-content' : undefined}>
                    {blocks && blocks.length > 0
                        ? blocks.map((block: { id: string; [key: string]: unknown }) => (
                            <BlockRenderer key={block.id} block={block} />
                        ))
                        : (
                            <div className="container py-20 text-center text-gray-400">
                                Cette page n&apos;a pas encore de contenu.
                            </div>
                        )
                    }
                </div>
            </main>
        </FrontLayout>
    );
}
