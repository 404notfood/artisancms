import { useState, useCallback } from 'react';
import type { AnimationConfig, BlockAnimationConfig } from './constants/animation-presets';
import { RotateCcw } from 'lucide-react';

interface AnimationPreviewProps {
    config: AnimationConfig;
}

function getHoverClass(hover: BlockAnimationConfig['hover']): string {
    if (hover.type === 'none') return '';
    return `cms-hover-${hover.type}-${hover.intensity}`;
}

function getTextClass(text: BlockAnimationConfig['text']): string {
    if (text.type === 'none') return '';
    return `cms-text-${text.type}`;
}

export default function AnimationPreview({ config }: AnimationPreviewProps) {
    const [playKey, setPlayKey] = useState(0);

    const replay = useCallback(() => {
        setPlayKey(k => k + 1);
    }, []);

    const headingCfg = config.config.headings;
    const textCfg = config.config.text;
    const buttonCfg = config.config.buttons;

    const headingEntrance = headingCfg.entrance;
    const textEntrance = textCfg.entrance;
    const buttonEntrance = buttonCfg.entrance;

    return (
        <div className="border rounded-lg p-5 bg-white space-y-4 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Apercu des animations</span>
                <button
                    type="button"
                    onClick={replay}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                    <RotateCcw className="h-3 w-3" />
                    Rejouer
                </button>
            </div>

            {/* Heading */}
            <div
                key={`h-${playKey}`}
                className={`cms-animate ${getTextClass(headingCfg.text)} ${getHoverClass(headingCfg.hover)}`}
                style={
                    headingEntrance.type !== 'none'
                        ? {
                              animation: `cms-${headingEntrance.type} ${headingEntrance.duration}ms ${headingEntrance.easing} ${headingEntrance.delay}ms both`,
                          }
                        : undefined
                }
            >
                <h3 className="text-lg font-bold text-gray-900">
                    Titre de section
                </h3>
            </div>

            {/* Text */}
            <div
                key={`t-${playKey}`}
                className={`cms-animate ${getTextClass(textCfg.text)} ${getHoverClass(textCfg.hover)}`}
                style={
                    textEntrance.type !== 'none'
                        ? {
                              animation: `cms-${textEntrance.type} ${textEntrance.duration}ms ${textEntrance.easing} ${textEntrance.delay}ms both`,
                          }
                        : undefined
                }
            >
                <p className="text-sm text-gray-600 leading-relaxed">
                    Un paragraphe de demonstration pour visualiser l'effet d'animation
                    applique au texte de votre site.
                </p>
            </div>

            {/* Button */}
            <div
                key={`b-${playKey}`}
                className={`cms-animate inline-block ${getHoverClass(buttonCfg.hover)}`}
                style={
                    buttonEntrance.type !== 'none'
                        ? {
                              animation: `cms-${buttonEntrance.type} ${buttonEntrance.duration}ms ${buttonEntrance.easing} ${buttonEntrance.delay}ms both`,
                          }
                        : undefined
                }
            >
                <span className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md">
                    Bouton d'action
                </span>
            </div>
        </div>
    );
}
