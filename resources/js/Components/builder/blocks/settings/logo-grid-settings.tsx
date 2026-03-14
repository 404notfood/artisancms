import type { BlockSettingsProps } from '../block-registry';

interface Logo {
    src: string;
    alt: string;
    url?: string;
}

export default function LogoGridSettings({ block, onUpdate }: BlockSettingsProps) {
    const logos = (block.props.logos as Logo[]) || [];
    const columns = (block.props.columns as number) || 4;
    const grayscale = block.props.grayscale !== false;
    const gap = (block.props.gap as string) || '6';

    const updateLogo = (index: number, field: keyof Logo, value: string) => {
        const newLogos = [...logos];
        newLogos[index] = { ...newLogos[index], [field]: value };
        onUpdate({ logos: newLogos });
    };

    const addLogo = () => {
        onUpdate({ logos: [...logos, { src: '', alt: '', url: '' }] });
    };

    const removeLogo = (index: number) => {
        onUpdate({ logos: logos.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <select
                    value={columns}
                    onChange={(e) => onUpdate({ columns: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value={3}>3 colonnes</option>
                    <option value={4}>4 colonnes</option>
                    <option value={5}>5 colonnes</option>
                    <option value={6}>6 colonnes</option>
                </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={grayscale}
                    onChange={(e) => onUpdate({ grayscale: e.target.checked })}
                    className="rounded"
                />
                Niveaux de gris (couleur au survol)
            </label>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espacement</label>
                <select
                    value={gap}
                    onChange={(e) => onUpdate({ gap: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="2">Petit</option>
                    <option value="4">Moyen</option>
                    <option value="6">Normal</option>
                    <option value="8">Grand</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logos</label>
                <div className="space-y-3">
                    {logos.map((logo, i) => (
                        <div key={i} className="border rounded p-3 space-y-2 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Logo {i + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeLogo(i)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    Supprimer
                                </button>
                            </div>
                            <input
                                type="text"
                                value={logo.src}
                                onChange={(e) => updateLogo(i, 'src', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm"
                                placeholder="URL de l'image"
                            />
                            <input
                                type="text"
                                value={logo.alt}
                                onChange={(e) => updateLogo(i, 'alt', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm"
                                placeholder="Texte alternatif"
                            />
                            <input
                                type="text"
                                value={logo.url || ''}
                                onChange={(e) => updateLogo(i, 'url', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm"
                                placeholder="Lien (optionnel)"
                            />
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addLogo}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                    + Ajouter un logo
                </button>
            </div>
        </div>
    );
}
