import type { BlockRendererProps } from '../block-registry';

export default function SectionRenderer({ block, children }: BlockRendererProps) {
    const { backgroundColor, backgroundImage, paddingTop = 40, paddingBottom = 40, paddingLeft = 20, paddingRight = 20 } = block.props as Record<string, string | number>;

    return (
        <div
            className="w-full min-h-[80px]"
            style={{
                backgroundColor: (backgroundColor as string) || undefined,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                paddingTop: `${paddingTop}px`,
                paddingBottom: `${paddingBottom}px`,
                paddingLeft: `${paddingLeft}px`,
                paddingRight: `${paddingRight}px`,
            }}
        >
            {children || (
                <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-400 text-sm">
                    Section vide — glissez des blocs ici
                </div>
            )}
        </div>
    );
}
