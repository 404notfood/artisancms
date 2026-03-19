export interface FieldDefinition {
    label: string;
    type: 'color' | 'font' | 'select' | 'text' | 'boolean' | 'image';
    default: string | boolean;
    options?: string[];
}

export type SchemaSection = Record<string, FieldDefinition>;
export type Schema = Record<string, SchemaSection>;

export const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'system-ui', label: 'System UI' },
];
