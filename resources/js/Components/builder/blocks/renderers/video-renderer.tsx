import type { BlockRendererProps } from '../block-registry';

function getEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.split('/').filter(Boolean).pop();
            return id ? `https://player.vimeo.com/video/${id}` : null;
        }
    } catch { /* invalid URL */ }
    return null;
}

export default function VideoRenderer({ block }: BlockRendererProps) {
    const url = block.props.url as string;
    const aspectRatio = (block.props.aspectRatio as string) || '16/9';
    const embedUrl = url ? getEmbedUrl(url) : null;

    if (!embedUrl) {
        return (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center p-8">
                <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                    </svg>
                    <span className="text-sm">Collez une URL YouTube ou Vimeo</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full" style={{ aspectRatio }}>
            <iframe src={embedUrl} className="w-full h-full rounded" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
    );
}
