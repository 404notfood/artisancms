import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { BlockNode } from '@/types/cms';
import {
    MARGIN_PRESETS,
    PADDING_PRESETS,
    CSS_UNITS,
    parseSpacingValue,
    formatSpacingValue,
    type CssUnit,
    type SpacingPreset,
} from './spacing-utils';

// ─── Preset buttons ─────────────────────────────────────────────────────────

function PresetButtons({ presets, type, onApply }: {
    presets: SpacingPreset[];
    type: 'margin' | 'padding';
    onApply: (values: Record<string, string>) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1 mb-2">
            {presets.map((preset) => {
                const vals: Record<string, string> = {};
                if (type === 'margin') {
                    vals.marginTop = preset.values.marginTop;
                    vals.marginBottom = preset.values.marginBottom;
                    vals.marginLeft = preset.values.marginLeft;
                    vals.marginRight = preset.values.marginRight;
                } else {
                    vals.paddingTop = preset.values.paddingTop;
                    vals.paddingBottom = preset.values.paddingBottom;
                    vals.paddingLeft = preset.values.paddingLeft;
                    vals.paddingRight = preset.values.paddingRight;
                }
                return (
                    <button
                        key={preset.label}
                        type="button"
                        onClick={() => onApply(vals)}
                        className="px-2 py-0.5 text-[10px] font-medium rounded border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={`Appliquer le preset ${preset.label}`}
                    >
                        {preset.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── SpacingInput: number input + unit dropdown ─────────────────────────────

function SpacingInput({ label, value, unit, onValueChange, onUnitChange }: {
    label: string;
    value: number;
    unit: CssUnit;
    onValueChange: (v: number) => void;
    onUnitChange: (u: CssUnit) => void;
}) {
    return (
        <div className="text-center">
            <div className="flex items-stretch">
                <input
                    type="number"
                    step={unit === 'px' ? 1 : 0.1}
                    value={value}
                    onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
                    className="w-full min-w-0 border border-r-0 rounded-l px-1 py-1.5 text-sm text-center"
                    title={label}
                />
                <select
                    value={unit}
                    onChange={(e) => onUnitChange(e.target.value as CssUnit)}
                    className="border rounded-r px-0.5 py-1.5 text-[10px] text-gray-500 bg-gray-50 cursor-pointer appearance-none text-center w-10 shrink-0"
                    title="Unité"
                >
                    {CSS_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            </div>
            <span className="text-[10px] text-gray-400">{label}</span>
        </div>
    );
}

// ─── SpacingGroup: 4 inputs for one spacing type (margin or padding) ─────────

interface SpacingGroupProps {
    label: string;
    type: 'margin' | 'padding';
    values: Record<string, unknown>;
    sides: string[];
    onChange: (side: string, formatted: string) => void;
    onApplyPreset: (values: Record<string, string>) => void;
}

const SIDE_LABELS: Record<string, string> = {
    Top: 'Haut', Bottom: 'Bas', Left: 'Gauche', Right: 'Droite',
};

function SpacingGroup({ label, type, values, sides, onChange, onApplyPreset }: SpacingGroupProps) {
    const presets = type === 'margin' ? MARGIN_PRESETS : PADDING_PRESETS;

    return (
        <div>
            <span className="block text-xs font-medium text-gray-500 mb-1.5">{label}</span>
            <PresetButtons presets={presets} type={type} onApply={onApplyPreset} />
            <div className="grid grid-cols-4 gap-1.5">
                {sides.map((side) => {
                    const propKey = `${type}${side}`;
                    const parsed = parseSpacingValue(values[propKey]);
                    return (
                        <SpacingInput
                            key={side}
                            label={SIDE_LABELS[side] || side}
                            value={parsed.value}
                            unit={parsed.unit}
                            onValueChange={(v) => onChange(propKey, formatSpacingValue(v, parsed.unit))}
                            onUnitChange={(u) => onChange(propKey, formatSpacingValue(parsed.value, u))}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ─── SpacingSection: full collapsible section for block settings ─────────────

interface SpacingSectionProps {
    block: BlockNode;
    onUpdate: (props: Partial<BlockNode['props']>) => void;
    hidePadding?: boolean;
}

const SIDES = ['Top', 'Bottom', 'Left', 'Right'];

export default function SpacingSection({ block, onUpdate, hidePadding }: SpacingSectionProps) {
    const [open, setOpen] = useState(false);

    const p = block.props;
    const hasValues = SIDES.some((s) => {
        const mv = parseSpacingValue(p[`margin${s}`]).value;
        const pv = parseSpacingValue(p[`padding${s}`]).value;
        return mv !== 0 || pv !== 0;
    });

    const handleChange = (propKey: string, formatted: string) => {
        onUpdate({ [propKey]: formatted });
    };

    const handleApplyPreset = (values: Record<string, string>) => {
        onUpdate(values);
    };

    const handleReset = () => {
        onUpdate({
            marginTop: '0', marginBottom: '0', marginLeft: '0', marginRight: '0',
            paddingTop: '0', paddingBottom: '0', paddingLeft: '0', paddingRight: '0',
        });
    };

    return (
        <div className="border-t mt-4 pt-3">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
            >
                {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Espacement
                {hasValues && !open && (
                    <span className="ml-auto text-[10px] text-blue-500 font-normal">modifié</span>
                )}
            </button>

            {open && (
                <div className="mt-3 space-y-4">
                    <SpacingGroup
                        label="Marge extérieure (margin)"
                        type="margin"
                        values={p}
                        sides={SIDES}
                        onChange={handleChange}
                        onApplyPreset={handleApplyPreset}
                    />

                    {!hidePadding && (
                        <SpacingGroup
                            label="Marge intérieure (padding)"
                            type="padding"
                            values={p}
                            sides={SIDES}
                            onChange={handleChange}
                            onApplyPreset={handleApplyPreset}
                        />
                    )}

                    {hasValues && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                            Réinitialiser tout
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
