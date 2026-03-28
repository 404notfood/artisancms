import type { GalleryLayoutProps } from './types';

/**
 * Collage layout: CSS grid with varied sizes.
 * Every 5th and 3rd image spans 2 rows for visual interest.
 */
export function CollageLayout({ images, columns, gap, onImageClick }: GalleryLayoutProps) {
    const colCount = Math.min(columns, 4);

    return (
        <div
            className="gallery-collage"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                gridAutoRows: '180px',
                gap,
            }}
        >
            {images.map((image, index) => {
                const isLarge = index % 5 === 0 || index % 7 === 3;
                return (
                    <div
                        key={index}
                        className="group relative overflow-hidden rounded cursor-pointer"
                        style={{
                            gridRow: isLarge ? 'span 2' : 'span 1',
                            gridColumn: isLarge && index % 5 === 0 ? 'span 2' : 'span 1',
                        }}
                        onClick={() => onImageClick(index)}
                        role="button"
                        tabIndex={0}
                    >
                        <img
                            src={image.src}
                            alt={image.alt || ''}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                );
            })}
        </div>
    );
}
