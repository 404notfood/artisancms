import { Badge } from '@/Components/ui/badge';
import { LayoutTemplate } from 'lucide-react';
import { type Template, type TemplateDetails, categoryLabels, categoryColors } from './types';

interface WizardStepSummaryProps {
    template: Template | null;
    details: TemplateDetails;
}

export default function WizardStepSummary({ template, details }: WizardStepSummaryProps) {
    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                {template?.thumbnail_url ? (
                    <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-40 h-28 object-cover rounded-lg border shrink-0"
                    />
                ) : (
                    <div className="w-40 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border flex items-center justify-center shrink-0">
                        <LayoutTemplate className="h-8 w-8 text-gray-300" />
                    </div>
                )}
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg">{template?.name}</h3>
                    {template?.description && (
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    )}
                    {template?.category && (
                        <Badge
                            variant="outline"
                            className={`mt-2 text-xs ${categoryColors[template.category] ?? ''}`}
                        >
                            {categoryLabels[template.category] ?? template.category}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">{details.pages.length}</p>
                    <p className="text-xs text-gray-500">Pages</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">{details.menus.length}</p>
                    <p className="text-xs text-gray-500">Menus</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">
                        {details.pages.reduce((sum, p) => sum + p.blocks_count, 0)}
                    </p>
                    <p className="text-xs text-gray-500">Blocs</p>
                </div>
            </div>
        </div>
    );
}
