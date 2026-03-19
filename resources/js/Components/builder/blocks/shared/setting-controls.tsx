/**
 * Shared setting control primitives for block settings panels.
 *
 * These extract the massively duplicated UI patterns found across 39 settings files:
 *   - Color picker (color input + text input)
 *   - Alignment select
 *   - Columns select/input
 *   - Select field
 *   - Text/number/textarea input
 *   - Checkbox toggle
 *   - Section heading for settings groups
 */

interface SettingFieldProps {
    label: string;
    children: React.ReactNode;
    hint?: string;
}

/** Wraps any setting control with a label + optional hint. */
export function SettingField({ label, children, hint }: SettingFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
            {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

// ─── Color Picker ────────────────────────────────────────────────────────────

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    /** If true, render only the swatch (no text input). Default: false */
    swatchOnly?: boolean;
}

export function ColorPicker({ label, value, onChange, swatchOnly }: ColorPickerProps) {
    if (swatchOnly) {
        return (
            <SettingField label={label}>
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-10 rounded border cursor-pointer"
                />
            </SettingField>
        );
    }

    return (
        <SettingField label={label}>
            <div className="flex gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder="#000000"
                />
            </div>
        </SettingField>
    );
}

// ─── Alignment Select ────────────────────────────────────────────────────────

interface AlignmentSelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options?: { value: string; label: string }[];
}

const DEFAULT_ALIGNMENT_OPTIONS = [
    { value: 'left', label: 'Gauche' },
    { value: 'center', label: 'Centre' },
    { value: 'right', label: 'Droite' },
];

export function AlignmentSelect({ label = 'Alignement', value, onChange, options }: AlignmentSelectProps) {
    const opts = options || DEFAULT_ALIGNMENT_OPTIONS;
    return (
        <SettingField label={label}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
            >
                {opts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </SettingField>
    );
}

// ─── Columns Input ───────────────────────────────────────────────────────────

interface ColumnsInputProps {
    label?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    /** If provided, renders as a <select> instead of <input type="number"> */
    options?: number[];
}

export function ColumnsInput({ label = 'Colonnes', value, onChange, min = 1, max = 6, options }: ColumnsInputProps) {
    if (options) {
        return (
            <SettingField label={label}>
                <select
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    {options.map((n) => (
                        <option key={n} value={n}>{n} colonne{n > 1 ? 's' : ''}</option>
                    ))}
                </select>
            </SettingField>
        );
    }

    return (
        <SettingField label={label}>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value) || min)}
                className="w-full border rounded px-3 py-2 text-sm"
            />
        </SettingField>
    );
}

// ─── Generic Select ──────────────────────────────────────────────────────────

interface SelectFieldProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    options: { value: string | number; label: string }[];
    hint?: string;
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
    return (
        <SettingField label={label} hint={hint}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </SettingField>
    );
}

// ─── Generic Text Input ──────────────────────────────────────────────────────

interface TextInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'url';
    hint?: string;
}

export function TextInput({ label, value, onChange, placeholder, type = 'text', hint }: TextInputProps) {
    return (
        <SettingField label={label} hint={hint}>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder={placeholder}
            />
        </SettingField>
    );
}

// ─── Number Input ────────────────────────────────────────────────────────────

interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    hint?: string;
}

export function NumberInput({ label, value, onChange, min, max, step, hint }: NumberInputProps) {
    return (
        <SettingField label={label} hint={hint}>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full border rounded px-3 py-2 text-sm"
            />
        </SettingField>
    );
}

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextareaFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
    className?: string;
}

export function TextareaField({ label, value, onChange, rows = 3, placeholder, className }: TextareaFieldProps) {
    return (
        <SettingField label={label}>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm ${className ?? ''}`}
                rows={rows}
                placeholder={placeholder}
            />
        </SettingField>
    );
}

// ─── Checkbox Toggle ─────────────────────────────────────────────────────────

interface CheckboxToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}

export function CheckboxToggle({ label, checked, onChange, id }: CheckboxToggleProps) {
    return (
        <label className="flex items-center gap-2 text-sm">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded"
            />
            {label}
        </label>
    );
}
