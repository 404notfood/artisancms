import { Head } from '@inertiajs/react';
import type { PageData, MenuData, BlockNode } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import SidebarLayout from '@/Layouts/SidebarLayout';
import BlockRenderer from '@/Components/front/block-renderer';

interface FrontPageProps {
    page: PageData | null;
    menus: Record<string, MenuData>;
    theme: {
        slug?: string;
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
        supports?: string[];
    };
}

const LEGAL_SLUGS = ['mentions-legales', 'politique-de-confidentialite', 'politique-de-cookies'];

/** Themes that use the sidebar layout */
const SIDEBAR_THEMES = ['studio'];

export default function FrontPage({ page, menus, theme }: FrontPageProps) {
    const useSidebar = theme.slug ? SIDEBAR_THEMES.includes(theme.slug) : (theme.supports ?? []).includes('sidebar');

    if (!page) {
        const empty = (
            <>
                <Head><title>Accueil</title></Head>
                <main>
                    <div className="container py-20 text-center text-gray-400">
                        Cette page n&apos;a pas encore de contenu.
                    </div>
                </main>
            </>
        );
        if (useSidebar) return <SidebarLayout menus={menus} theme={theme}>{empty}</SidebarLayout>;
        return <FrontLayout menus={menus} theme={theme}>{empty}</FrontLayout>;
    }

    const isLegal = LEGAL_SLUGS.includes(page.slug ?? '');

    const rawContent = page.content;
    const blocks: BlockNode[] | undefined = Array.isArray(rawContent)
        ? rawContent
        : (rawContent as unknown as { blocks?: BlockNode[] } | null)?.blocks ?? undefined;

    const content = (
        <>
            <Head>
                <title>{page.meta_title || page.title}</title>
                {page.meta_description && (
                    <meta name="description" content={page.meta_description} />
                )}
            </Head>
            <main>
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
                        ? blocks.map((block) => (
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
        </>
    );

    if (useSidebar) {
        return <SidebarLayout menus={menus} theme={theme}>{content}</SidebarLayout>;
    }

    return <FrontLayout menus={menus} theme={theme}>{content}</FrontLayout>;
}
