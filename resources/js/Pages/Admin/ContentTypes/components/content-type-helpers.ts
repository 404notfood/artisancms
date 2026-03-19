import type { ContentTypeFieldDef } from '@/types/cms';

export const fieldTypes = [
    { value: 'text', label: 'Texte court' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'wysiwyg', label: 'Editeur riche' },
    { value: 'number', label: 'Nombre' },
    { value: 'email', label: 'E-mail' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date et heure' },
    { value: 'select', label: 'Liste deroulante' },
    { value: 'checkbox', label: 'Case a cocher' },
    { value: 'radio', label: 'Boutons radio' },
    { value: 'file', label: 'Fichier' },
    { value: 'image', label: 'Image' },
    { value: 'color', label: 'Couleur' },
];

export const supportOptions = [
    { value: 'title', label: 'Titre' },
    { value: 'slug', label: 'Slug' },
    { value: 'featured_image', label: 'Image mise en avant' },
    { value: 'excerpt', label: 'Extrait' },
    { value: 'content', label: 'Contenu (page builder)' },
    { value: 'taxonomies', label: 'Taxonomies' },
    { value: 'revisions', label: 'Revisions' },
    { value: 'comments', label: 'Commentaires' },
];

export function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function createEmptyField(order: number): ContentTypeFieldDef {
    return {
        name: '',
        slug: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: [],
        order,
    };
}
