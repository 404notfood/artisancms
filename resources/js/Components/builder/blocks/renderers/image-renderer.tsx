import type { BlockRendererProps } from '../block-registry';
import { useBuilderStore } from '@/stores/builder-store';

function responsiveProps(props: Record<string, unknown>, viewport: string) {
    return {
        ...props,
        ...((props.responsive as Record<string, Record<string, unknown>> | undefined)?.[viewport] ?? {}),
    };
}

export default function ImageRenderer({ block }: BlockRendererProps) {
    const viewport = useBuilderStore((state) => state.viewport);
    const props = responsiveProps(block.props ?? {}, viewport);
    const src = props.src as string;
    const alt = (props.alt as string) || '';
    const width = (props.width as string) || '100%';
    const height = props.height ? `${props.height}px` : undefined;
    const objectFit = (props.objectFit as string) || 'cover';

    if (!src) {
        return (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center p-8">
                <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                    <span className="text-sm">Aucune image</span>
                </div>
            </div>
        );
    }

    return <img src={src} alt={alt} style={{ width, height, objectFit: objectFit as React.CSSProperties['objectFit'] }} className="rounded" />;
}
