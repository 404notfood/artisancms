import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import type { BlockNode } from '@/types/cms';
import { SelectField, NumberInput } from './setting-controls';
import {
    ANIMATION_TYPES,
    ANIMATION_EASINGS,
    ANIMATION_TRIGGERS,
    type AnimationType,
    type AnimationEasing,
    type AnimationTrigger,
} from './animation-renderer';

// ─── Option labels (i18n-ready) ─────────────────────────────────────────────

const ANIMATION_LABELS: Record<AnimationType, string> = {
    none: 'Aucune',
    fadeIn: 'Fondu',
    fadeInUp: 'Fondu vers le haut',
    fadeInDown: 'Fondu vers le bas',
    fadeInLeft: 'Fondu depuis la gauche',
    fadeInRight: 'Fondu depuis la droite',
    slideUp: 'Glissement vers le haut',
    slideDown: 'Glissement vers le bas',
    zoomIn: 'Zoom avant',
    bounceIn: 'Rebond',
};

const EASING_LABELS: Record<AnimationEasing, string> = {
    'ease': 'Ease',
    'ease-in': 'Ease In',
    'ease-out': 'Ease Out',
    'ease-in-out': 'Ease In-Out',
};

const TRIGGER_LABELS: Record<AnimationTrigger, string> = {
    onLoad: 'Au chargement',
    onScroll: 'Au scroll (viewport)',
};

const TYPE_OPTIONS = ANIMATION_TYPES.map((t) => ({ value: t, label: ANIMATION_LABELS[t] }));
const EASING_OPTIONS = ANIMATION_EASINGS.map((e) => ({ value: e, label: EASING_LABELS[e] }));
const TRIGGER_OPTIONS = ANIMATION_TRIGGERS.map((t) => ({ value: t, label: TRIGGER_LABELS[t] }));

// ─── Animation preview ──────────────────────────────────────────────────────

interface AnimationPreviewProps {
    type: AnimationType;
    duration: number;
    delay: number;
    easing: AnimationEasing;
}

function AnimationPreview({ type, duration, delay, easing }: AnimationPreviewProps) {
    const [playing, setPlaying] = useState(false);
    const [key, setKey] = useState(0);

    const handlePlay = useCallback(() => {
        setPlaying(true);
        setKey((k) => k + 1);
        const timeout = setTimeout(
            () => setPlaying(false),
            (duration + delay) * 1000 + 100,
        );
        return () => clearTimeout(timeout);
    }, [duration, delay]);

    if (type === 'none') return null;

    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={handlePlay}
                disabled={playing}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Play className="w-3 h-3" />
                {playing ? 'En cours...' : 'Tester'}
            </button>
            <div className="mt-1.5 border border-dashed border-gray-200 rounded p-3 overflow-hidden bg-gray-50/50">
                <div
                    key={key}
                    className={playing ? `cms-animate-${type}` : ''}
                    style={playing ? {
                        '--cms-anim-duration': `${duration}s`,
                        '--cms-anim-delay': `${delay}s`,
                        '--cms-anim-easing': easing,
                    } as React.CSSProperties : undefined}
                >
                    <div className="h-8 rounded bg-gradient-to-r from-blue-400 to-blue-600" />
                </div>
            </div>
        </div>
    );
}

// ─── Main animation settings section ────────────────────────────────────────

interface AnimationSectionProps {
    block: BlockNode;
    onUpdate: (props: Partial<BlockNode['props']>) => void;
}

export default function AnimationSection({ block, onUpdate }: AnimationSectionProps) {
    const [open, setOpen] = useState(false);

    const p = block.props;
    const type = (p.animationType as AnimationType) || 'none';
    const duration = typeof p.animationDuration === 'number' ? p.animationDuration : 0.6;
    const delay = typeof p.animationDelay === 'number' ? p.animationDelay : 0;
    const easing = (p.animationEasing as AnimationEasing) || 'ease';
    const trigger = (p.animationTrigger as AnimationTrigger) || 'onScroll';

    const hasAnimation = type !== 'none';

    const handleReset = () => {
        onUpdate({
            animationType: 'none',
            animationDuration: 0.6,
            animationDelay: 0,
            animationEasing: 'ease',
            animationTrigger: 'onScroll',
        });
    };

    return (
        <div className="border-t mt-4 pt-3">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
            >
                {open
                    ? <ChevronDown className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />}
                Animation
                {hasAnimation && !open && (
                    <span className="ml-auto text-[10px] text-blue-500 font-normal">
                        {ANIMATION_LABELS[type]}
                    </span>
                )}
            </button>

            {open && (
                <div className="mt-3 space-y-3">
                    <SelectField
                        label="Type d'animation"
                        value={type}
                        onChange={(v) => onUpdate({ animationType: v })}
                        options={TYPE_OPTIONS}
                    />

                    {hasAnimation && (
                        <>
                            <SelectField
                                label="Déclencheur"
                                value={trigger}
                                onChange={(v) => onUpdate({ animationTrigger: v })}
                                options={TRIGGER_OPTIONS}
                            />

                            <NumberInput
                                label="Durée (secondes)"
                                value={duration}
                                onChange={(v) => onUpdate({ animationDuration: v })}
                                min={0.1}
                                max={3}
                                step={0.1}
                            />

                            <NumberInput
                                label="Délai (secondes)"
                                value={delay}
                                onChange={(v) => onUpdate({ animationDelay: v })}
                                min={0}
                                max={3}
                                step={0.1}
                            />

                            <SelectField
                                label="Courbe d'animation"
                                value={easing}
                                onChange={(v) => onUpdate({ animationEasing: v })}
                                options={EASING_OPTIONS}
                            />

                            <AnimationPreview
                                type={type}
                                duration={duration}
                                delay={delay}
                                easing={easing}
                            />

                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                Les animations sont automatiquement
                                {' '}
                                <span className="font-medium">
                                    désactivées
                                </span>
                                {' '}
                                pour les utilisateurs ayant activé
                                {' '}
                                <span className="italic">
                                    &laquo; Reduce Motion &raquo;
                                </span>
                                {' '}
                                dans leur OS.
                            </p>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                Supprimer l'animation
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
