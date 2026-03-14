import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';

export function useTranslation() {
    const { translations } = usePage<SharedProps>().props;

    function t(key: string, replacements: Record<string, string> = {}): string {
        let value = translations[key] ?? key;

        Object.entries(replacements).forEach(([k, v]) => {
            value = value.replace(`:${k}`, v);
        });

        return value;
    }

    return { t };
}
