import type { CustomFieldType, CustomFieldGroupData } from '@/types/cms';

export interface FieldEntry {
    id: number | null;
    name: string;
    slug: string;
    type: CustomFieldType;
    description: string;
    placeholder: string;
    default_value: string;
    options: { label: string; value: string }[];
    validation: { required: boolean; min: string; max: string };
    order: number;
}

export const fieldTypeLabels: Record<string, string> = {
    text: 'Texte court',
    textarea: 'Texte long',
    wysiwyg: 'Éditeur visuel',
    number: 'Nombre',
    email: 'E-mail',
    url: 'URL',
    select: 'Liste déroulante',
    checkbox: 'Cases à cocher',
    radio: 'Boutons radio',
    image: 'Image',
    file: 'Fichier',
    date: 'Date',
    datetime: 'Date et heure',
    color: 'Couleur',
    repeater: 'Répéteur',
};

export const typesWithOptions = ['select', 'checkbox', 'radio'];

export const appliesToOptions = [
    { label: 'Pages', value: 'page' },
    { label: 'Articles', value: 'post' },
];

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
}

export function generateGroupSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function createEmptyField(order: number): FieldEntry {
    return {
        id: null,
        name: '',
        slug: '',
        type: 'text',
        description: '',
        placeholder: '',
        default_value: '',
        options: [],
        validation: { required: false, min: '', max: '' },
        order,
    };
}

export function fieldFromData(
    f: NonNullable<CustomFieldGroupData['fields']>[number]
): FieldEntry {
    return {
        id: f.id,
        name: f.name,
        slug: f.slug,
        type: f.type,
        description: f.description ?? '',
        placeholder: f.placeholder ?? '',
        default_value: f.default_value ?? '',
        options: f.options ?? [],
        validation: {
            required: f.validation?.required ?? false,
            min: f.validation?.min !== undefined ? String(f.validation.min) : '',
            max: f.validation?.max !== undefined ? String(f.validation.max) : '',
        },
        order: f.order,
    };
}

export function prepareFieldsForSubmit(fields: FieldEntry[]) {
    return fields.map((field, i) => ({
        ...field,
        order: i,
        options: typesWithOptions.includes(field.type)
            ? field.options.length > 0
                ? field.options
                : null
            : null,
        validation: {
            required: field.validation.required,
            ...(field.validation.min !== '' ? { min: Number(field.validation.min) } : {}),
            ...(field.validation.max !== '' ? { max: Number(field.validation.max) } : {}),
        },
    }));
}
