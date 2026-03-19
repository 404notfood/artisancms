import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { type SchemaSection } from './types';
import FieldRenderer from './FieldRenderer';

interface FontsSectionLayoutProps {
    fields: SchemaSection;
    data: Record<string, string | boolean>;
    activeSection: string;
    onChange: (dotKey: string, val: string | boolean) => void;
    onImageUpload: (dotKey: string, file: File) => void;
}

export default function FontsSectionLayout({ fields, data, activeSection, onChange, onImageUpload }: FontsSectionLayoutProps) {
    const headingSizeKeys = ['h1_size', 'h2_size', 'h3_size', 'h4_size', 'h5_size', 'h6_size'];
    const otherKeys = Object.keys(fields).filter((k) => !headingSizeKeys.includes(k));
    const existingHeadingKeys = headingSizeKeys.filter((k) => k in fields);

    return (
        <div className="space-y-5">
            {/* Polices et taille de base */}
            {otherKeys.map((key) => {
                const definition = fields[key];
                const dotKey = `${activeSection}.${key}`;
                const value = data[dotKey] ?? definition.default;
                return (
                    <FieldRenderer
                        key={dotKey}
                        dotKey={dotKey}
                        definition={definition}
                        value={value}
                        onChange={(val) => onChange(dotKey, val)}
                        onImageUpload={(file) => onImageUpload(dotKey, file)}
                    />
                );
            })}

            {/* Tailles des headings en grille 2 colonnes */}
            {existingHeadingKeys.length > 0 && (
                <div>
                    <Label className="mb-2 block text-sm font-medium text-gray-700">Tailles des titres</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {existingHeadingKeys.map((key) => {
                            const definition = fields[key];
                            const dotKey = `${activeSection}.${key}`;
                            const value = data[dotKey] ?? definition.default;
                            return (
                                <div key={dotKey}>
                                    <label className="mb-1 block text-xs text-gray-500">{definition.label}</label>
                                    <Input
                                        value={String(value || '')}
                                        onChange={(e) => onChange(dotKey, e.target.value)}
                                        className="h-8 font-mono text-xs"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
