import { useEffect, useRef, useState, useMemo, type CSSProperties } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export const ANIMATION_TYPES = [
    'none',
    'fadeIn',
    'fadeInUp',
    'fadeInDown',
    'fadeInLeft',
    'fadeInRight',
    'slideUp',
    'slideDown',
    'zoomIn',
    'bounceIn',
] as const;

export type AnimationType = (typeof ANIMATION_TYPES)[number];

export const ANIMATION_EASINGS = ['ease', 'ease-in', 'ease-out', 'ease-in-out'] as const;
export type AnimationEasing = (typeof ANIMATION_EASINGS)[number];

export const ANIMATION_TRIGGERS = ['onLoad', 'onScroll'] as const;
export type AnimationTrigger = (typeof ANIMATION_TRIGGERS)[number];

export interface AnimationProps {
    animationType?: AnimationType;
    animationDuration?: number;
    animationDelay?: number;
    animationEasing?: AnimationEasing;
    animationTrigger?: AnimationTrigger;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 0.6;
const DEFAULT_DELAY = 0;
const DEFAULT_EASING: AnimationEasing = 'ease';
const DEFAULT_TRIGGER: AnimationTrigger = 'onScroll';

// ─── Reduced motion detection ───────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return reduced;
}

// ─── IntersectionObserver hook ──────────────────────────────────────────────

function useInView(
    ref: React.RefObject<HTMLElement | null>,
    enabled: boolean,
): boolean {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (!enabled || !ref.current) {
            if (!enabled) setInView(true);
            return;
        }

        const el = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, enabled]);

    return inView;
}

// ─── useAnimation hook ──────────────────────────────────────────────────────

export interface UseAnimationResult {
    ref: React.RefObject<HTMLDivElement | null>;
    className: string;
    style: CSSProperties;
}

/**
 * Hook that returns ref, className and style to animate a block.
 * Handles IntersectionObserver for onScroll trigger and respects
 * prefers-reduced-motion.
 */
export function useAnimation(props: Record<string, unknown>): UseAnimationResult {
    const ref = useRef<HTMLDivElement | null>(null);
    const prefersReduced = usePrefersReducedMotion();

    const type = (props.animationType as AnimationType) || 'none';
    const duration = Number(props.animationDuration) || DEFAULT_DURATION;
    const delay = Number(props.animationDelay) || DEFAULT_DELAY;
    const easing = (props.animationEasing as AnimationEasing) || DEFAULT_EASING;
    const trigger = (props.animationTrigger as AnimationTrigger) || DEFAULT_TRIGGER;

    const isScrollTrigger = trigger === 'onScroll';
    const hasAnimation = type !== 'none' && !prefersReduced;

    const inView = useInView(ref, hasAnimation && isScrollTrigger);

    const shouldAnimate = hasAnimation && (isScrollTrigger ? inView : true);
    const isPending = hasAnimation && isScrollTrigger && !inView;

    const className = useMemo(() => {
        if (!hasAnimation) return '';
        if (isPending) return 'cms-animate-pending';
        if (shouldAnimate) return `cms-animate-${type}`;
        return '';
    }, [hasAnimation, isPending, shouldAnimate, type]);

    const style = useMemo<CSSProperties>(() => {
        if (!shouldAnimate) return {};
        return {
            '--cms-anim-duration': `${duration}s`,
            '--cms-anim-delay': `${delay}s`,
            '--cms-anim-easing': easing,
        } as CSSProperties;
    }, [shouldAnimate, duration, delay, easing]);

    return { ref, className, style };
}

/**
 * Extracts AnimationProps from a block's props record.
 * Useful for checking if a block has any animation configured.
 */
export function hasAnimationConfig(props: Record<string, unknown>): boolean {
    const type = props.animationType as string | undefined;
    return !!type && type !== 'none';
}
