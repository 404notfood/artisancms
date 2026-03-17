import { Label } from '@/Components/ui/label';

interface AnimationConfig {
    type: string;
    duration: number;
    delay: number;
    easing: string;
}

interface AnimationPickerProps {
    value: AnimationConfig;
    onChange: (config: AnimationConfig) => void;
}

const ANIMATION_TYPES = [
    { value: 'none', label: 'Aucune' },
    { value: 'fade-in', label: 'Fondu' },
    { value: 'slide-up', label: 'Glisser haut' },
    { value: 'slide-down', label: 'Glisser bas' },
    { value: 'slide-left', label: 'Glisser gauche' },
    { value: 'slide-right', label: 'Glisser droite' },
    { value: 'zoom-in', label: 'Zoom entree' },
    { value: 'zoom-out', label: 'Zoom sortie' },
    { value: 'rotate', label: 'Rotation' },
    { value: 'bounce', label: 'Rebond' },
    { value: 'flip', label: 'Retournement' },
    { value: 'blur-in', label: 'Fondu flou' },
    { value: 'stagger-fade', label: 'Apparition decalee' },
];

const EASING_OPTIONS = [
    { value: 'ease', label: 'Ease' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out', label: 'Ease In-Out' },
    { value: 'linear', label: 'Linear' },
    { value: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', label: 'Back' },
];

const DEFAULT_ANIMATION: AnimationConfig = {
    type: 'none',
    duration: 600,
    delay: 0,
    easing: 'ease-out',
};

export { type AnimationConfig, DEFAULT_ANIMATION };

export default function AnimationPicker({ value, onChange }: AnimationPickerProps) {
    const config = { ...DEFAULT_ANIMATION, ...value };

    const update = (partial: Partial<AnimationConfig>) => {
        onChange({ ...config, ...partial });
    };

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-xs">Animation d'entree</Label>
                <select
                    value={config.type}
                    onChange={(e) => update({ type: e.target.value })}
                    className="w-full rounded border px-2 py-1.5 text-sm mt-1"
                >
                    {ANIMATION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            {config.type !== 'none' && (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs">Duree (ms)</Label>
                            <input
                                type="number"
                                value={config.duration}
                                onChange={(e) => update({ duration: Number(e.target.value) })}
                                min={100}
                                max={3000}
                                step={100}
                                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Delai (ms)</Label>
                            <input
                                type="number"
                                value={config.delay}
                                onChange={(e) => update({ delay: Number(e.target.value) })}
                                min={0}
                                max={3000}
                                step={100}
                                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs">Easing</Label>
                        <select
                            value={config.easing}
                            onChange={(e) => update({ easing: e.target.value })}
                            className="w-full rounded border px-2 py-1.5 text-sm mt-1"
                        >
                            {EASING_OPTIONS.map((e) => (
                                <option key={e.value} value={e.value}>{e.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div
                            key={`${config.type}-${config.duration}-${config.easing}`}
                            className="cms-animate inline-block bg-indigo-100 text-indigo-700 rounded px-4 py-2 text-sm font-medium"
                            style={{
                                animation: `cms-${config.type} ${config.duration}ms ${config.easing} ${config.delay}ms both`,
                            }}
                        >
                            Preview
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
