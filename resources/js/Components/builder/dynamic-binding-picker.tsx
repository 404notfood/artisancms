import { useState } from 'react';
import { Link2, X, Database } from 'lucide-react';

interface DynamicBindingPickerProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
}

const BINDING_SOURCES = [
    {
        group: 'Page',
        items: [
            { value: '$bind:page_field.title', label: 'Titre de la page' },
            { value: '$bind:page_field.slug', label: 'Slug de la page' },
            { value: '$bind:page_field.meta_title', label: 'Meta titre' },
            { value: '$bind:page_field.meta_description', label: 'Meta description' },
        ],
    },
    {
        group: 'Article',
        items: [
            { value: '$bind:post_field.title', label: 'Titre de l\'article' },
            { value: '$bind:post_field.excerpt', label: 'Extrait' },
            { value: '$bind:post_field.author_name', label: 'Nom de l\'auteur' },
            { value: '$bind:post_field.published_at', label: 'Date de publication' },
            { value: '$bind:post_field.featured_image', label: 'Image a la une' },
        ],
    },
    {
        group: 'Site',
        items: [
            { value: '$bind:site.name', label: 'Nom du site' },
            { value: '$bind:site.url', label: 'URL du site' },
            { value: '$bind:date.year', label: 'Annee courante' },
            { value: '$bind:date.full', label: 'Date du jour' },
        ],
    },
    {
        group: 'Utilisateur',
        items: [
            { value: '$bind:user.name', label: 'Nom utilisateur connecte' },
            { value: '$bind:user.email', label: 'Email utilisateur' },
        ],
    },
];

export default function DynamicBindingPicker({ value, onChange, label }: DynamicBindingPickerProps) {
    const [open, setOpen] = useState(false);
    const isDynamic = value?.startsWith('$bind:');

    return (
        <div className="relative">
            {label && <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>}

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className={`p-1.5 rounded transition-colors ${isDynamic ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Contenu dynamique"
                >
                    <Database className="h-3.5 w-3.5" />
                </button>

                {isDynamic && (
                    <div className="flex items-center gap-1 bg-indigo-50 rounded px-2 py-1 text-xs text-indigo-700">
                        <Link2 className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{value?.replace('$bind:', '')}</span>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="text-indigo-400 hover:text-indigo-700"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 left-0 w-64 max-h-64 overflow-y-auto rounded-lg border bg-white shadow-lg">
                    {BINDING_SOURCES.map((group) => (
                        <div key={group.group}>
                            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase text-gray-400 bg-gray-50">
                                {group.group}
                            </p>
                            {group.items.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(item.value);
                                        setOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
