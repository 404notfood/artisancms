import { useState, useCallback } from 'react';
import { Label } from '@/Components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    ANIMATION_PRESETS,
    ENTRANCE_TYPES,
    HOVER_TYPES,
    TEXT_EFFECT_TYPES,
    INTENSITY_OPTIONS,
    BLOCK_TYPE_CATEGORIES,
    presetToConfig,
    type AnimationConfig,
    type BlockTypeCategory,
    type BlockAnimationConfig,
} from './constants/animation-presets';
import AnimationPreview from './AnimationPreview';

interface WizardStepAnimationsProps {
    config: AnimationConfig;
    onChange: (config: AnimationConfig) => void;
}

export default function WizardStepAnimations({ config, onChange }: WizardStepAnimationsProps) {
    const [showFineTuning, setShowFineTuning] = useState(false);
    const [openCategory, setOpenCategory] = useState<BlockTypeCategory | null>(null);

    const selectPreset = useCallback((presetId: string) => {
        const preset = ANIMATION_PRESETS.find(p => p.id === presetId);
        if (preset) onChange(presetToConfig(preset));
    }, [onChange]);

    const updateCategoryConfig = useCallback(
        (category: BlockTypeCategory, partial: Partial<BlockAnimationConfig>) => {
            const newConfig = JSON.parse(JSON.stringify(config)) as AnimationConfig;
            newConfig.presetId = 'custom';
            newConfig.config[category] = { ...newConfig.config[category], ...partial };
            onChange(newConfig);
        },
        [config, onChange],
    );

    const toggleCategory = useCallback((cat: BlockTypeCategory) => {
        setOpenCategory(prev => prev === cat ? null : cat);
    }, []);

    return (
        <div className="space-y-5">
            {/* Preset cards */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Style d'animations</Label>
                <div className="grid grid-cols-3 gap-2">
                    {ANIMATION_PRESETS.map(preset => {
                        const isActive = config.presetId === preset.id;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => selectPreset(preset.id)}
                                className={`border rounded-lg p-3 text-left transition-all ${
                                    isActive
                                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <PresetIndicator presetId={preset.id} />
                                    <p className="text-sm font-semibold">{preset.name}</p>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">{preset.description}</p>
                            </button>
                        );
                    })}
                    {config.presetId === 'custom' && (
                        <div className="border border-amber-500 bg-amber-50 ring-1 ring-amber-500 rounded-lg p-3 text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-3 h-3 rounded-full bg-amber-500" />
                                <p className="text-sm font-semibold text-amber-800">Personnalise</p>
                            </div>
                            <p className="text-[10px] text-amber-600 leading-tight">Configuration custom</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Live preview */}
            <AnimationPreview config={config} />

            {/* Fine-tuning toggle */}
            <button
                type="button"
                onClick={() => setShowFineTuning(!showFineTuning)}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
                {showFineTuning ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Ajuster par type de bloc
            </button>

            {showFineTuning && (
                <div className="space-y-1 border-t pt-3">
                    {BLOCK_TYPE_CATEGORIES.map(cat => {
                        const isOpen = openCategory === cat.value;
                        const catConfig = config.config[cat.value];
                        const showTextEffects = cat.value === 'headings' || cat.value === 'text';
                        return (
                            <div key={cat.value} className="border rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(cat.value)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {cat.label}
                                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                                {isOpen && (
                                    <div className="px-3 pb-3 space-y-3 border-t">
                                        {/* Entrance */}
                                        <div className="pt-2">
                                            <Label className="text-xs text-gray-500 mb-1 block">Entree</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <select
                                                    value={catConfig.entrance.type}
                                                    onChange={e =>
                                                        updateCategoryConfig(cat.value, {
                                                            entrance: { ...catConfig.entrance, type: e.target.value },
                                                        })
                                                    }
                                                    className="rounded border px-1.5 py-1 text-xs"
                                                >
                                                    {ENTRANCE_TYPES.map(t => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={catConfig.entrance.duration}
                                                    onChange={e =>
                                                        updateCategoryConfig(cat.value, {
                                                            entrance: { ...catConfig.entrance, duration: Number(e.target.value) },
                                                        })
                                                    }
                                                    min={100}
                                                    max={3000}
                                                    step={100}
                                                    className="rounded border px-1.5 py-1 text-xs"
                                                    title="Duree (ms)"
                                                    placeholder="Duree"
                                                />
                                                <input
                                                    type="number"
                                                    value={catConfig.entrance.delay}
                                                    onChange={e =>
                                                        updateCategoryConfig(cat.value, {
                                                            entrance: { ...catConfig.entrance, delay: Number(e.target.value) },
                                                        })
                                                    }
                                                    min={0}
                                                    max={3000}
                                                    step={50}
                                                    className="rounded border px-1.5 py-1 text-xs"
                                                    title="Delai (ms)"
                                                    placeholder="Delai"
                                                />
                                            </div>
                                        </div>

                                        {/* Hover */}
                                        <div>
                                            <Label className="text-xs text-gray-500 mb-1 block">Hover</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={catConfig.hover.type}
                                                    onChange={e =>
                                                        updateCategoryConfig(cat.value, {
                                                            hover: { ...catConfig.hover, type: e.target.value },
                                                        })
                                                    }
                                                    className="rounded border px-1.5 py-1 text-xs"
                                                >
                                                    {HOVER_TYPES.map(t => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                                {catConfig.hover.type !== 'none' && (
                                                    <select
                                                        value={catConfig.hover.intensity}
                                                        onChange={e =>
                                                            updateCategoryConfig(cat.value, {
                                                                hover: { ...catConfig.hover, intensity: e.target.value as 'subtle' | 'medium' | 'strong' },
                                                            })
                                                        }
                                                        className="rounded border px-1.5 py-1 text-xs"
                                                    >
                                                        {INTENSITY_OPTIONS.map(i => (
                                                            <option key={i.value} value={i.value}>{i.label}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>

                                        {/* Text effects (only for headings and text) */}
                                        {showTextEffects && (
                                            <div>
                                                <Label className="text-xs text-gray-500 mb-1 block">Effet texte</Label>
                                                <select
                                                    value={catConfig.text.type}
                                                    onChange={e =>
                                                        updateCategoryConfig(cat.value, {
                                                            text: { type: e.target.value },
                                                        })
                                                    }
                                                    className="rounded border px-1.5 py-1 text-xs w-full"
                                                >
                                                    {TEXT_EFFECT_TYPES.map(t => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PresetIndicator({ presetId }: { presetId: string }) {
    const colors: Record<string, string> = {
        none: 'bg-gray-300',
        subtil: 'bg-blue-300',
        fluide: 'bg-emerald-400',
        dynamique: 'bg-orange-400',
        spectaculaire: 'bg-purple-500',
        magazine: 'bg-rose-400',
    };
    return <span className={`w-3 h-3 rounded-full ${colors[presetId] ?? 'bg-gray-300'}`} />;
}
