import { useEffect, useRef, useState } from 'react';
import type { BlockRendererProps } from '../block-registry';

interface CounterItem {
    value: number;
    label: string;
    prefix: string;
    suffix: string;
}

function AnimatedNumber({ value, prefix, suffix }: { value: number; prefix?: string; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const duration = 1500;
                    const start = performance.now();

                    const animate = (now: number) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        // ease-out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setDisplay(Math.round(eased * value));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 },
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value]);

    return (
        <div ref={ref}>
            {prefix || ''}{display}{suffix || ''}
        </div>
    );
}

export default function CounterRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as CounterItem[]) || [];
    const columns = (block.props.columns as number) || 3;
    const align = (block.props.align as string) || 'center';
    const valueColor = (block.props.valueColor as string) || 'var(--color-text, #0f172a)';
    const labelColor = (block.props.labelColor as string) || 'var(--color-text-muted, #64748b)';

    if (items.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucun compteur configuré
            </div>
        );
    }

    const textAlignStyle = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(columns, items.length)}, 1fr)`,
            gap: '1.5rem',
        }}>
            {items.map((item, index) => (
                <div key={index} style={{ textAlign: textAlignStyle, padding: '1.25rem 1rem' }}>
                    <div style={{
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading, inherit)',
                        color: valueColor,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                    }}>
                        <AnimatedNumber value={item.value ?? 0} prefix={item.prefix} suffix={item.suffix} />
                    </div>
                    {item.label && (
                        <div style={{
                            marginTop: '0.625rem',
                            fontSize: '0.6875rem',
                            color: labelColor,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                        }}>
                            {item.label}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
