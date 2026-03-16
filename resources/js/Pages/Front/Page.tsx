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

export default function FrontPage({ page, menus, theme }: FrontPageProps) {
    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head>
                <title>{page.meta_title || page.title}</title>
                {page.meta_description && (
                    <meta name="description" content={page.meta_description} />
                )}
            </Head>
            <main>
                {(() => {
                    const blocks = Array.isArray(page.content)
                        ? page.content
                        : (page.content as { blocks?: unknown[] })?.blocks;
                    return blocks && blocks.length > 0
                        ? blocks.map((block: { id: string; [key: string]: unknown }) => (
                            <BlockRenderer key={block.id} block={block} />
                        ))
                        : (
                            <div className="container py-20 text-center text-gray-400">
                                Cette page n&apos;a pas encore de contenu.
                            </div>
                        );
                })()}
            </main>
        </FrontLayout>
    );
}
