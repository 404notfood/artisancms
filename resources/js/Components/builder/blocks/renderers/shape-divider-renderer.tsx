import type { BlockRendererProps } from '../block-registry';

const SHAPES: Record<string, string> = {
    wave: 'M0,64 C320,100 640,0 960,64 L960,0 L0,0 Z',
    curve: 'M0,0 Q480,128 960,0 L960,0 L0,0 Z',
    zigzag: 'M0,0 L80,40 L160,0 L240,40 L320,0 L400,40 L480,0 L560,40 L640,0 L720,40 L800,0 L880,40 L960,0 L960,0 L0,0 Z',
    triangle: 'M480,80 L0,0 L960,0 Z',
    tilt: 'M0,80 L960,0 L960,0 L0,0 Z',
    arrow: 'M0,0 L480,80 L960,0 L960,0 L0,0 Z',
    cloud: 'M0,64 C160,100 200,20 320,64 C440,108 480,20 640,64 C760,100 800,20 960,64 L960,0 L0,0 Z',
    mountains: 'M0,80 L120,20 L240,60 L360,10 L480,50 L600,0 L720,40 L840,15 L960,60 L960,0 L0,0 Z',
    waves: 'M0,32 C160,80 320,0 480,32 C640,64 800,0 960,32 L960,0 L0,0 Z',
    drops: 'M0,48 Q80,80 160,48 Q240,16 320,48 Q400,80 480,48 Q560,16 640,48 Q720,80 800,48 Q880,16 960,48 L960,0 L0,0 Z',
};

export default function ShapeDividerRenderer({ block }: BlockRendererProps) {
    const {
        shape = 'wave',
        color = '#ffffff',
        height = 80,
        position = 'bottom',
        flipX = false,
        flipY = false,
    } = block.props as Record<string, unknown>;

    const pathD = SHAPES[shape as string] ?? SHAPES.wave;

    const svgStyle: React.CSSProperties = {
        display: 'block',
        width: '100%',
        height: `${height}px`,
        transform: [
            flipX ? 'scaleX(-1)' : '',
            flipY ? 'scaleY(-1)' : '',
        ].filter(Boolean).join(' ') || undefined,
    };

    return (
        <div className="relative w-full" style={{ lineHeight: 0 }}>
            <svg
                viewBox="0 0 960 80"
                preserveAspectRatio="none"
                style={svgStyle}
            >
                <path d={pathD} fill={color as string} />
            </svg>
        </div>
    );
}
