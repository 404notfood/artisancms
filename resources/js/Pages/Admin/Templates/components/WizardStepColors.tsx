import { Label } from '@/Components/ui/label';
import { COLOR_PALETTES } from './types';

interface WizardStepColorsProps {
    primaryColor: string;
    headingColor: string;
    textColor: string;
    onPrimaryChange: (color: string) => void;
    onHeadingChange: (color: string) => void;
    onTextChange: (color: string) => void;
}

export default function WizardStepColors({
    primaryColor,
    headingColor,
    textColor,
    onPrimaryChange,
    onHeadingChange,
    onTextChange,
}: WizardStepColorsProps) {
    const applyPalette = (palette: typeof COLOR_PALETTES[0]) => {
        onPrimaryChange(palette.primary);
        onHeadingChange(palette.heading);
        onTextChange(palette.text);
    };

    return (
        <div className="space-y-5">
            {/* Predefined palettes */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Palettes</Label>
                <div className="flex gap-2">
                    {COLOR_PALETTES.map(palette => {
                        const isActive = palette.primary === primaryColor && palette.heading === headingColor;
                        return (
                            <button
                                key={palette.name}
                                type="button"
                                onClick={() => applyPalette(palette)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span
                                    className="w-4 h-4 rounded-full border border-gray-200"
                                    style={{ backgroundColor: palette.primary }}
                                />
                                {palette.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom color pickers */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="primary-color" className="text-sm font-medium mb-1.5 block">
                        Couleur principale
                    </Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            id="primary-color"
                            value={primaryColor}
                            onChange={e => onPrimaryChange(e.target.value)}
                            className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 font-mono">{primaryColor}</span>
                    </div>
                </div>
                <div>
                    <Label htmlFor="heading-color" className="text-sm font-medium mb-1.5 block">
                        Couleur titres
                    </Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            id="heading-color"
                            value={headingColor}
                            onChange={e => onHeadingChange(e.target.value)}
                            className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 font-mono">{headingColor}</span>
                    </div>
                </div>
                <div>
                    <Label htmlFor="text-color" className="text-sm font-medium mb-1.5 block">
                        Couleur texte
                    </Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            id="text-color"
                            value={textColor}
                            onChange={e => onTextChange(e.target.value)}
                            className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 font-mono">{textColor}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
