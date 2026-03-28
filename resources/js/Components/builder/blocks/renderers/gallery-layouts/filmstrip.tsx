import type { GalleryLayoutProps } from './types';

/**
 * Filmstrip layout: horizontal scrollable strip with CSS scroll-snap.
 */
export function FilmstripLayout({ images, gap, onImageClick }: GalleryLayoutProps) {
    return (
        <div
            className="gallery-filmstrip"
            style={{ gap }}
        >
            {images.map((image, index) => (
                <div
                    key={index}
                    className="gallery-filmstrip-item group relative overflow-hidden rounded flex-shrink-0 cursor-pointer"
                    onClick={() => onImageClick(index)}
                    role="button"
                    tabIndex={0}
                >
                    <img
                        src={image.src}
                        alt={image.alt || ''}
                        className="h-full w-auto object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
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
    );
}
