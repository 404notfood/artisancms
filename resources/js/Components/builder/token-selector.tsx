import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Paintbrush } from 'lucide-react';

interface TokenOption {
    id: number;
    name: string;
    slug: string;
    category: string;
    value: Record<string, string>;
}

interface TokenSelectorProps {
    category: string;
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

/**
 * Dropdown for selecting a design token value in block settings.
 * Fetches tokens from the API and shows a dropdown with preview.
 */
export default function TokenSelector({
    category,
    value,
    onChange,
    label,
    className,
}: TokenSelectorProps) {
    const [tokens, setTokens] = useState<TokenOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/admin/design-tokens/css`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then(() => {
                // Fetch the actual tokens
                return fetch(`/admin/design-tokens?_format=json`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
            })
            .then((res) => res.json())
            .then((data) => {
                const allTokens: TokenOption[] = data.tokens?.[category] ?? [];
                setTokens(allTokens);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [category]);

    const selectedToken = tokens.find((t) => `var(--token-${t.slug})` === value);

    const resolvePreview = (token: TokenOption): string => {
        switch (token.category) {
            case 'color':
                return token.value.hex ?? token.value.value ?? '#000';
            default:
                return token.value.value ?? '';
        }
    };

    return (
        <div className={cn('relative', className)}>
            {label && <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
                <Paintbrush className="h-3.5 w-3.5 text-gray-400" />
                {selectedToken ? (
                    <span className="flex items-center gap-2">
                        {category === 'color' && (
                            <span
                                className="h-4 w-4 rounded border"
                                style={{ backgroundColor: resolvePreview(selectedToken) }}
                            />
                        )}
                        <span className="truncate">{selectedToken.name}</span>
                    </span>
                ) : value ? (
                    <span className="text-gray-500 truncate">{value}</span>
                ) : (
                    <span className="text-gray-400">Choisir un token</span>
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border bg-white shadow-lg">
                    {/* Clear option */}
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            setOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
                    >
                        Aucun token
                    </button>

                    {loading ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-400">Chargement...</div>
                    ) : tokens.length > 0 ? (
                        tokens.map((token) => (
                            <button
                                key={token.id}
                                type="button"
                                onClick={() => {
                                    onChange(`var(--token-${token.slug})`);
                                    setOpen(false);
                                }}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50 transition-colors',
                                    `var(--token-${token.slug})` === value && 'bg-indigo-50 text-indigo-700',
                                )}
                            >
                                {category === 'color' && (
                                    <span
                                        className="h-4 w-4 rounded border shrink-0"
                                        style={{ backgroundColor: resolvePreview(token) }}
                                    />
                                )}
                                <span className="truncate">{token.name}</span>
                                <span className="text-xs text-gray-400 ml-auto font-mono">
                                    --token-{token.slug}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-center text-sm text-gray-400">
                            Aucun token disponible
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
