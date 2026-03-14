import type { BlockRendererProps } from '../block-registry';

function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

function detectType(url: string): string {
    if (!url) return 'iframe';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'iframe';
}

export default function EmbedRenderer({ block }: BlockRendererProps) {
    const url = (block.props.url as string) || '';
    const typeOverride = (block.props.type as string) || 'auto';
    const aspectRatio = (block.props.aspectRatio as string) || '16/9';
    const maxWidth = (block.props.maxWidth as string) || '100%';

    const type = typeOverride === 'auto' ? detectType(url) : typeOverride;

    if (!url) {
        return (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucune URL configurée</p>
                <p className="text-xs mt-1">Ajoutez une URL dans les paramètres du bloc</p>
            </div>
        );
    }

    const containerStyle = { maxWidth, aspectRatio };

    if (type === 'youtube') {
        const videoId = extractYouTubeId(url);
        if (!videoId) {
            return <p className="text-sm text-red-500">URL YouTube invalide</p>;
        }
        return (
            <div className="w-full" style={{ maxWidth }}>
                <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Vidéo YouTube"
                    />
                </div>
            </div>
        );
    }

    if (type === 'vimeo') {
        const videoId = extractVimeoId(url);
        if (!videoId) {
            return <p className="text-sm text-red-500">URL Vimeo invalide</p>;
        }
        return (
            <div className="w-full" style={{ maxWidth }}>
                <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio }}>
                    <iframe
                        src={`https://player.vimeo.com/video/${videoId}`}
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title="Vidéo Vimeo"
                    />
                </div>
            </div>
        );
    }

    if (type === 'twitter') {
        return (
            <div className="border rounded-lg p-4 bg-gray-50" style={{ maxWidth }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold">𝕏</span>
                    <span className="text-sm text-gray-500">Publication Twitter / X</span>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                >
                    {url}
                </a>
                <p className="text-xs text-gray-400 mt-2">
                    Le contenu s'affichera sur le site publié
                </p>
            </div>
        );
    }

    // Generic iframe
    return (
        <div className="w-full" style={{ maxWidth }}>
            <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio }}>
                <iframe
                    src={url}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    title="Contenu intégré"
                />
            </div>
        </div>
    );
}
