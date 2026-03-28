import type { GalleryLayoutProps } from './types';

export function MasonryLayout({ images, columns, gap, onImageClick }: GalleryLayoutProps) {
    return (
        <div
            className="gallery-masonry"
            style={{
                columnCount: columns,
                columnGap: gap,
            }}
        >
            {images.map((image, index) => (
                <div
                    key={index}
                    className="gallery-masonry-item group relative overflow-hidden rounded mb-2 break-inside-avoid"
                    onClick={() => onImageClick(index)}
                    role="button"
                    tabIndex={0}
                >
                    <img
                        src={image.src}
                        alt={image.alt || ''}
                        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
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
