import { useEffect, useRef, useState, type ReactNode } from 'react';

interface AnimateOnScrollProps {
    children: ReactNode;
    animation?: {
        type?: string;
        duration?: number;
        delay?: number;
        easing?: string;
    };
    className?: string;
}

/**
 * Wraps children with an IntersectionObserver-driven entrance animation.
 * Respects prefers-reduced-motion via CSS.
 */
export default function AnimateOnScroll({ children, animation, className }: AnimateOnScrollProps) {
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

    if (type === 'none') {
        return <div className={className}>{children}</div>;
    }

    const duration = animation?.duration ?? 600;
    const delay = animation?.delay ?? 0;
    const easing = animation?.easing ?? 'ease-out';

    return (
        <div
            ref={ref}
            className={`cms-animate ${className ?? ''}`}
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
