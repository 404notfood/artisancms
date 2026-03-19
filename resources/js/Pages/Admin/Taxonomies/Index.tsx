import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import type { TaxonomyData } from '@/types/cms';
import { Tag } from 'lucide-react';
import TaxonomyListPanel from './components/TaxonomyListPanel';
import TermsPanel from './components/TermsPanel';

interface TaxonomiesIndexProps {
    taxonomies: TaxonomyData[];
}

export default function TaxonomiesIndex({ taxonomies }: TaxonomiesIndexProps) {
    const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<number | null>(
        taxonomies.length > 0 ? taxonomies[0].id : null
    );

    const selectedTaxonomy = taxonomies.find((t) => t.id === selectedTaxonomyId) ?? null;

    function handleDeleteTaxonomy(taxonomy: TaxonomyData) {
        if (!confirm(`Supprimer la taxonomie "${taxonomy.name}" et tous ses termes ?`)) return;
        router.delete(`/admin/taxonomies/${taxonomy.id}`, {
            onSuccess: () => {
                if (selectedTaxonomyId === taxonomy.id) {
                    setSelectedTaxonomyId(taxonomies.length > 1 ? taxonomies[0].id : null);
                }
            },
        });
    }

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Taxonomies</h1>}>
            <Head title="Taxonomies" />

            <div className="flex flex-col gap-6 lg:flex-row">
                <TaxonomyListPanel
                    taxonomies={taxonomies}
                    selectedTaxonomyId={selectedTaxonomyId}
                    onSelectTaxonomy={setSelectedTaxonomyId}
                    onDeleteTaxonomy={handleDeleteTaxonomy}
                />

                <div className="flex-1">
                    {selectedTaxonomy ? (
                        <TermsPanel taxonomy={selectedTaxonomy} />
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
                            <Tag className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                                {taxonomies.length === 0
                                    ? 'Creez votre premiere taxonomie pour organiser votre contenu.'
                                    : 'Selectionnez une taxonomie pour gerer ses termes.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
