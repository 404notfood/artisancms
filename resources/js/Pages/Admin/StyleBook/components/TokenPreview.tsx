import { type DesignToken, type TokenValue } from './types';

function ColorSwatch({ value }: { value: TokenValue }) {
    const hex = value.hex ?? value.value ?? '#000';
    return (
        <div className="flex items-center gap-3">
            <div
                className="h-10 w-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: hex }}
            />
            <span className="text-sm font-mono text-gray-600">{hex}</span>
        </div>
    );
}

function TypographyPreview({ value }: { value: TokenValue }) {
    return (
        <div>
            <p
                style={{
                    fontSize: value.fontSize,
                    fontWeight: value.fontWeight as React.CSSProperties['fontWeight'],
                    lineHeight: value.lineHeight,
                    fontFamily: value.fontFamily,
                }}
            >
                Texte de preview
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
                {value.fontSize} / {value.fontWeight} / {value.lineHeight}
            </p>
        </div>
    );
}

function SpacingPreview({ value }: { value: TokenValue }) {
    const size = `${value.value}${value.unit ?? 'rem'}`;
    return (
        <div className="flex items-center gap-3">
            <div
                className="bg-indigo-200 rounded"
                style={{ width: size, height: '24px', minWidth: '4px' }}
            />
            <span className="text-sm font-mono text-gray-600">{size}</span>
        </div>
    );
}

function ShadowPreview({ value }: { value: TokenValue }) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="h-10 w-16 rounded-lg bg-white border"
                style={{ boxShadow: value.value }}
            />
            <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">{value.value}</span>
        </div>
    );
}

function BorderPreview({ value }: { value: TokenValue }) {
    if (value.width) {
        return (
            <div className="flex items-center gap-3">
                <div
                    className="h-10 w-16 rounded"
                    style={{ border: `${value.width} ${value.style ?? 'solid'} ${value.color ?? '#000'}` }}
                />
                <span className="text-xs font-mono text-gray-500">
                    {value.width} {value.style} {value.color}
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-3">
            <div className="h-10 w-16 bg-gray-100" style={{ borderRadius: value.value }} />
            <span className="text-sm font-mono text-gray-600">{value.value}</span>
        </div>
    );
}

function ButtonPreview({ value }: { value: TokenValue }) {
    const hex = value.value ?? '#4f46e5';
    return (
        <div className="flex items-center gap-3">
            <div
                className="h-8 w-8 rounded border border-gray-200"
                style={{ backgroundColor: hex }}
            />
            <span className="text-sm font-mono text-gray-600">{hex}</span>
        </div>
    );
}

export default function TokenPreview({ token }: { token: DesignToken }) {
    switch (token.category) {
        case 'color':
            return <ColorSwatch value={token.value} />;
        case 'typography':
            return <TypographyPreview value={token.value} />;
        case 'spacing':
            return <SpacingPreview value={token.value} />;
        case 'shadow':
            return <ShadowPreview value={token.value} />;
        case 'border':
            return <BorderPreview value={token.value} />;
        case 'button':
            return <ButtonPreview value={token.value} />;
        default:
            return <span className="text-sm text-gray-500">{JSON.stringify(token.value)}</span>;
    }
}
