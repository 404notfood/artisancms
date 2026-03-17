import { useEffect, useRef, useState, type ReactNode } from 'react';

interface AnimateOnScrollProps {
    children: ReactNode;
    animation?: {
        type?: string;
        duration?: number;
        delay?: number;
        easing?: string;
    };
    hover?: {
        type: string;
        intensity: string;
    };
    textEffect?: {
        type: string;
    };
    continuous?: {
        type: string;
        speed: string;
    };
    className?: string;
}

/**
 * Wraps children with an IntersectionObserver-driven entrance animation.
 * Also applies hover, text effect, and continuous animation classes.
 * Respects prefers-reduced-motion via CSS.
 */
export default function AnimateOnScroll({ children, animation, hover, textEffect, continuous, className }: AnimateOnScrollProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    const type = animation?.type ?? 'none';

    useEffect(() => {
        if (type === 'none' || !ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [type]);

    // Build extra CSS classes
    const extraClasses: string[] = [];

    if (hover && hover.type && hover.type !== 'none') {
        extraClasses.push(`cms-hover-${hover.type}-${hover.intensity}`);
    }

    if (textEffect && textEffect.type && textEffect.type !== 'none') {
        extraClasses.push(`cms-text-${textEffect.type}`);
    }

    if (continuous && continuous.type && continuous.type !== 'none') {
        extraClasses.push(`cms-continuous-${continuous.type}-${continuous.speed}`);
    }

    const extraClassStr = extraClasses.join(' ');

    if (type === 'none') {
        // Still apply hover/text/continuous classes even without entrance animation
        const classes = [className, extraClassStr].filter(Boolean).join(' ');
        if (classes) {
            return <div className={classes}>{children}</div>;
        }
        return <>{children}</>;
    }

    const duration = animation?.duration ?? 600;
    const delay = animation?.delay ?? 0;
    const easing = animation?.easing ?? 'ease-out';

    return (
        <div
            ref={ref}
            className={`cms-animate ${extraClassStr} ${className ?? ''}`.trim()}
            style={
                visible
                    ? {
                          animation: `cms-${type} ${duration}ms ${easing} ${delay}ms both`,
                      }
                    : { opacity: 0 }
            }
        >
            {children}
        </div>
    );
}
