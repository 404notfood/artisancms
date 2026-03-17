import { useMemo } from 'react';
import { useBuilderStore, flattenTree } from '@/stores/builder-store';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import type { BlockNode } from '@/types/cms';

interface CheckItem {
    label: string;
    passed: boolean;
    description: string;
}

interface PrePublishChecklistProps {
    open: boolean;
    onClose: () => void;
    onPublish: () => void;
    pageTitle?: string;
    metaDescription?: string;
}

function runChecks(blocks: BlockNode[], pageTitle?: string, metaDescription?: string): CheckItem[] {
    const allBlocks = flattenTree(blocks);
    const checks: CheckItem[] = [];

    // Has content
    checks.push({
        label: 'Contenu present',
        passed: blocks.length > 0,
        description: blocks.length > 0 ? `${allBlocks.length} blocs` : 'Aucun bloc sur la page',
    });

    // Has at least one heading
    const headings = allBlocks.filter((b) => b.type === 'heading');
    checks.push({
        label: 'Titre H1/H2 present',
        passed: headings.length > 0,
        description: headings.length > 0 ? `${headings.length} titre(s)` : 'Ajoutez au moins un titre',
    });

    // Images have alt text
    const images = allBlocks.filter((b) => b.type === 'image');
    const imagesWithAlt = images.filter((b) => b.props.alt && String(b.props.alt).trim() !== '');
    checks.push({
        label: 'Texte alternatif des images',
        passed: images.length === 0 || imagesWithAlt.length === images.length,
        description: images.length === 0
            ? 'Aucune image'
            : `${imagesWithAlt.length}/${images.length} images avec alt`,
    });

    // Page title set
    checks.push({
        label: 'Titre de page defini',
        passed: !!pageTitle && pageTitle.trim().length > 0,
        description: pageTitle ? `"${pageTitle}"` : 'Le titre est vide',
    });

    // Meta description
    checks.push({
        label: 'Meta description',
        passed: !!metaDescription && metaDescription.trim().length >= 50,
        description: metaDescription
            ? `${metaDescription.length} caracteres`
            : 'Ajoutez une meta description (min 50 car.)',
    });

    // No empty sections
    const emptySections = allBlocks.filter(
        (b) => (b.type === 'section' || b.type === 'grid') && (!b.children || b.children.length === 0),
    );
    checks.push({
        label: 'Pas de sections vides',
        passed: emptySections.length === 0,
        description: emptySections.length === 0
            ? 'Toutes les sections ont du contenu'
            : `${emptySections.length} section(s) vide(s)`,
    });

    return checks;
}

export default function PrePublishChecklist({
    open,
    onClose,
    onPublish,
    pageTitle,
    metaDescription,
}: PrePublishChecklistProps) {
    const { blocks } = useBuilderStore();

    const checks = useMemo(
        () => runChecks(blocks, pageTitle, metaDescription),
        [blocks, pageTitle, metaDescription],
    );

    const allPassed = checks.every((c) => c.passed);
    const passedCount = checks.filter((c) => c.passed).length;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">
                        Checklist pre-publication
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {checks.map((check) => (
                        <div
                            key={check.label}
                            className="flex items-start gap-3 rounded-lg px-3 py-2"
                        >
                            {check.passed ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-800">{check.label}</p>
                                <p className="text-xs text-gray-500">{check.description}</p>
                            </div>
                        </div>
                    ))}

                    <div className="pt-3 border-t text-center">
                        <p className="text-sm text-gray-600 mb-3">
                            {passedCount}/{checks.length} verifications passees
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t px-5 py-4">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Retour a l'editeur
                    </Button>
                    <Button size="sm" onClick={onPublish}>
                        {allPassed ? 'Publier' : 'Publier quand meme'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
