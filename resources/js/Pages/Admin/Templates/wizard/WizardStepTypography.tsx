import { useState, useCallback } from 'react';
import { Label } from '@/Components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GOOGLE_FONTS, FONT_CATEGORIES, type FontOption } from './constants/fonts';
import {
    TYPOGRAPHY_PRESETS,
    presetToConfig,
    type TypographyConfig,
    type TypographyScaleEntry,
} from './constants/typography-presets';
import FontPreview from './FontPreview';

interface WizardStepTypographyProps {
    config: TypographyConfig;
    onChange: (config: TypographyConfig) => void;
    headingColor?: string;
    textColor?: string;
}

const SCALE_KEYS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const FONT_SIZE_OPTIONS = [
    '0.75rem', '0.8125rem', '0.875rem', '0.9375rem', '1rem', '1.0625rem',
    '1.125rem', '1.25rem', '1.375rem', '1.5rem', '1.75rem', '2rem',
    '2.25rem', '2.5rem', '2.75rem', '3rem', '3.25rem', '3.5rem', '4rem',
];

const FONT_WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800];

const LINE_HEIGHT_OPTIONS = ['1', '1.05', '1.1', '1.15', '1.2', '1.25', '1.3', '1.35', '1.4', '1.5', '1.6', '1.7', '1.75', '1.8', '2'];

function FontSelect({ id, value, onChange, fonts }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    fonts: FontOption[];
}) {
    return (
        <select
            id={id}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
        >
            {FONT_CATEGORIES.map(cat => {
                const catFonts = fonts.filter(f => f.category === cat.value);
                if (catFonts.length === 0) return null;
                return (
                    <optgroup key={cat.value} label={cat.label}>
                        {catFonts.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </optgroup>
                );
            })}
        </select>
    );
}

export default function WizardStepTypography({
    config,
    onChange,
    headingColor = '#1e1b4b',
    textColor = '#374151',
}: WizardStepTypographyProps) {
    const [showFineTuning, setShowFineTuning] = useState(false);
    const [showAdvancedHeadings, setShowAdvancedHeadings] = useState(false);

    const selectPreset = useCallback((presetId: string) => {
        const preset = TYPOGRAPHY_PRESETS.find(p => p.id === presetId);
        if (preset) onChange(presetToConfig(preset));
    }, [onChange]);

    const updateFont = useCallback((key: 'headingFont' | 'bodyFont', value: string) => {
        onChange({ ...config, presetId: 'custom', [key]: value });
    }, [config, onChange]);

    const updateScale = useCallback((level: string, field: keyof TypographyScaleEntry, value: string | number) => {
        const newScale = { ...config.scale };
        newScale[level as keyof typeof newScale] = {
            ...newScale[level as keyof typeof newScale],
            [field]: value,
        };
        onChange({ ...config, presetId: 'custom', scale: newScale });
    }, [config, onChange]);

    return (
        <div className="space-y-5">
            {/* Preset cards */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Style typographique</Label>
                <div className="grid grid-cols-3 gap-2">
                    {TYPOGRAPHY_PRESETS.map(preset => {
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
                                    <TypographyIndicator presetId={preset.id} />
                                    <p className="text-sm font-semibold truncate">{preset.name}</p>
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
            <FontPreview config={config} headingColor={headingColor} textColor={textColor} />

            {/* Fine-tuning toggle */}
            <button
                type="button"
                onClick={() => setShowFineTuning(!showFineTuning)}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
                {showFineTuning ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Personnaliser
            </button>

            {showFineTuning && (
                <div className="space-y-4 border-t pt-4">
                    {/* Font selects */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="typo-heading" className="text-xs font-medium mb-1 block">Police titres</Label>
                            <FontSelect
                                id="typo-heading"
                                value={config.headingFont}
                                onChange={v => updateFont('headingFont', v)}
                                fonts={GOOGLE_FONTS}
                            />
                        </div>
                        <div>
                            <Label htmlFor="typo-body" className="text-xs font-medium mb-1 block">Police corps</Label>
                            <FontSelect
                                id="typo-body"
                                value={config.bodyFont}
                                onChange={v => updateFont('bodyFont', v)}
                                fonts={GOOGLE_FONTS}
                            />
                        </div>
                    </div>

                    {/* Scale fine-tuning H1-H3 */}
                    <div>
                        <Label className="text-xs font-medium mb-2 block">Echelle typographique</Label>
                        <div className="space-y-2">
                            {SCALE_KEYS.slice(0, 3).map(level => (
                                <ScaleRow
                                    key={level}
                                    level={level}
                                    entry={config.scale[level]}
                                    onChange={(field, value) => updateScale(level, field, value)}
                                />
                            ))}
                        </div>

                        {/* H4-H6 collapsed */}
                        <button
                            type="button"
                            onClick={() => setShowAdvancedHeadings(!showAdvancedHeadings)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2"
                        >
                            {showAdvancedHeadings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            H4 - H6
                        </button>
                        {showAdvancedHeadings && (
                            <div className="space-y-2 mt-2">
                                {SCALE_KEYS.slice(3).map(level => (
                                    <ScaleRow
                                        key={level}
                                        level={level}
                                        entry={config.scale[level]}
                                        onChange={(field, value) => updateScale(level, field, value)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function TypographyIndicator({ presetId }: { presetId: string }) {
    const colors: Record<string, string> = {
        moderne: 'bg-blue-400',
        classique: 'bg-amber-700',
        elegant: 'bg-rose-400',
        minimaliste: 'bg-gray-400',
        bold: 'bg-orange-500',
        editorial: 'bg-slate-500',
        tech: 'bg-cyan-500',
        ludique: 'bg-green-400',
    };
    return <span className={`w-3 h-3 rounded-full shrink-0 ${colors[presetId] ?? 'bg-gray-300'}`} />;
}

function ScaleRow({ level, entry, onChange }: {
    level: string;
    entry: TypographyScaleEntry;
    onChange: (field: keyof TypographyScaleEntry, value: string | number) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-8 text-xs font-mono text-gray-500 uppercase shrink-0">{level}</span>
            <select
                value={entry.fontSize}
                onChange={e => onChange('fontSize', e.target.value)}
                className="rounded border px-1.5 py-1 text-xs flex-1"
                title="Taille"
            >
                {FONT_SIZE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <select
                value={entry.fontWeight}
                onChange={e => onChange('fontWeight', Number(e.target.value))}
                className="rounded border px-1.5 py-1 text-xs w-16"
                title="Graisse"
            >
                {FONT_WEIGHT_OPTIONS.map(w => (
                    <option key={w} value={w}>{w}</option>
                ))}
            </select>
            <select
                value={entry.lineHeight}
                onChange={e => onChange('lineHeight', e.target.value)}
                className="rounded border px-1.5 py-1 text-xs w-14"
                title="Interligne"
            >
                {LINE_HEIGHT_OPTIONS.map(lh => (
                    <option key={lh} value={lh}>{lh}</option>
                ))}
            </select>
        </div>
    );
}
