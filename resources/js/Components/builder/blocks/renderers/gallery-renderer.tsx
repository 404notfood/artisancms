import { useState } from 'react';
import type { BlockRendererProps } from '../block-registry';

interface GalleryImage {
    src: string;
    alt: string;
    caption: string;
}

export default function GalleryRenderer({ block }: BlockRendererProps) {
    const images = (block.props.images as GalleryImage[]) || [];
    const columns = (block.props.columns as number) || 3;
    const gap = (block.props.gap as string) || '8px';
    const lightbox = block.props.lightbox !== false;
    const style = (block.props.style as string) || 'grid';

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (images.length === 0) {
        return (
            <div className="w-full py-12 text-center text-gray-400 border-2 border-dashed rounded">
                Aucune image dans la galerie
            </div>
        );
    }

    const gridClass = style === 'masonry'
        ? `columns-${columns}`
        : `grid grid-cols-${columns}`;

    return (
        <>
            <div
                className={style === 'carousel' ? 'flex overflow-x-auto' : gridClass}
                style={{ gap }}
            >
                {images.map((image, index) => (
                    <div
                        key={index}
                        className={`relative group overflow-hidden rounded ${style === 'carousel' ? 'flex-shrink-0 w-72' : ''} ${style === 'masonry' ? 'mb-2 break-inside-avoid' : ''}`}
                        onClick={() => lightbox && setLightboxIndex(index)}
                        role={lightbox ? 'button' : undefined}
                        tabIndex={lightbox ? 0 : undefined}
                    >
                        <img
                            src={image.src}
                            alt={image.alt || ''}
                            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {image.caption && (
                            <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-full bg-black/60 text-white text-sm px-3 py-2">
                                    {image.caption}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {lightbox && lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        type="button"
                        className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
                        onClick={() => setLightboxIndex(null)}
                    >
                        &times;
                    </button>
                    {lightboxIndex > 0 && (
                        <button
                            type="button"
                            className="absolute left-4 text-white text-3xl hover:text-gray-300"
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                        >
                            &#8249;
                        </button>
                    )}
                    {lightboxIndex < images.length - 1 && (
                        <button
                            type="button"
                            className="absolute right-4 text-white text-3xl hover:text-gray-300"
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                        >
                            &#8250;
                        </button>
                    )}
                    <img
                        src={images[lightboxIndex].src}
                        alt={images[lightboxIndex].alt || ''}
                        className="max-w-[90vw] max-h-[90vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {images[lightboxIndex].caption && (
                        <div className="absolute bottom-4 text-white text-center text-sm">
                            {images[lightboxIndex].caption}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
