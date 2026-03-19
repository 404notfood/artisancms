import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { LayoutTemplate, Upload, Loader2 } from 'lucide-react';
import { type Template, categoryLabels, categoryColors } from './types';

interface TemplateCardProps {
    template: Template;
    installing: boolean;
    onInstall: (template: Template) => void;
}

export default function TemplateCard({ template, installing, onInstall }: TemplateCardProps) {
    return (
        <Card className="overflow-hidden">
            {template.thumbnail_url ? (
                <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="h-40 w-full object-cover"
                />
            ) : (
                <div className="h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <LayoutTemplate className="h-10 w-10 text-gray-300" />
                </div>
            )}
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    {template.category && (
                        <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ml-2 ${categoryColors[template.category] ?? ''}`}
                        >
                            {categoryLabels[template.category] ?? template.category}
                        </Badge>
                    )}
                </div>
                {template.description && (
                    <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                )}
                <Button
                    size="sm"
                    className="w-full"
                    disabled={installing}
                    onClick={() => onInstall(template)}
                >
                    {installing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Installation...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-1" />
                            Installer
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
