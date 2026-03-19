import { type LucideIcon } from 'lucide-react';

export interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: LucideIcon;
    href: string;
    category: string;
    keywords?: string[];
}
