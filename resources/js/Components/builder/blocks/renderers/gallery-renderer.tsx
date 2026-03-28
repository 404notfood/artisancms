import { useState, useCallback } from 'react';
import type { BlockRendererProps } from '../block-registry';
import type { GalleryImage } from './gallery-layouts/types';
import { MasonryLayout } from './gallery-layouts/masonry';
import { JustifiedLayout } from './gallery-layouts/justified';
import { CollageLayout } from './gallery-layouts/collage';
import { FilmstripLayout } from './gallery-layouts/filmstrip';
import './gallery-layouts/gallery-layouts.css';

type LayoutStyle = 'grid' | 'masonry' | 'slider' | 'justified' | 'collage' | 'filmstrip';

export default function GalleryRenderer({ block }: BlockRendererProps) {
    const images = (block.props.images as GalleryImage[]) || [];
    const columns = (block.props.columns as number) || 3;
    const gap = (block.props.gap as string) || '8px';
    const lightbox = block.props.lightbox !== false;
    const style = (block.props.style as LayoutStyle) || 'grid';

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [sliderIndex, setSliderIndex] = useState(0);

    const handleImageClick = useCallback(
        (index: number) => { if (lightbox) setLightboxIndex(index); },
        [lightbox],
    );

    if (images.length === 0) {
        return (
            <div className="w-full py-12 text-center text-gray-400 border-2 border-dashed rounded">
                Aucune image dans la galerie
            </div>
        );
    }

    const layoutProps = { images, columns, gap, onImageClick: handleImageClick };

    return (
        <>
            {/* ----- Layout dispatch ----- */}
            {style === 'grid' && <GridLayout {...layoutProps} />}
            {style === 'masonry' && <MasonryLayout {...layoutProps} />}
            {style === 'slider' && (
                <SliderLayout
                    images={images}
                    current={sliderIndex}
                    onPrev={() => setSliderIndex((i) => Math.max(0, i - 1))}
                    onNext={() => setSliderIndex((i) => Math.min(images.length - 1, i + 1))}
                    onImageClick={handleImageClick}
                />
            )}
            {style === 'justified' && <JustifiedLayout {...layoutProps} />}
            {style === 'collage' && <CollageLayout {...layoutProps} />}
            {style === 'filmstrip' && <FilmstripLayout {...layoutProps} />}

            {/* ----- Lightbox (shared across all layouts) ----- */}
            {lightbox && lightboxIndex !== null && (
                <Lightbox
                    images={images}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onPrev={() => setLightboxIndex((i) => Math.max(0, (i ?? 1) - 1))}
                    onNext={() => setLightboxIndex((i) => Math.min(images.length - 1, (i ?? 0) + 1))}
                />
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Grid (inline - simple)                                            */
/* ------------------------------------------------------------------ */
function GridLayout({ images, columns, gap, onImageClick }: {
    images: GalleryImage[]; columns: number; gap: string; onImageClick: (i: number) => void;
}) {
    return (
        <div
            className="gallery-grid"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}
        >
            {images.map((image, index) => (
                <div
                    key={index}
                    className="group relative overflow-hidden rounded cursor-pointer"
                    onClick={() => onImageClick(index)}
                    role="button"
                    tabIndex={0}
                >
                    <img
                        src={image.src}
                        alt={image.alt || ''}
                        className="w-full h-auto object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                    <ImageCaption caption={image.caption} />
                </div>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Slider (inline - needs local state wiring)                        */
/* ------------------------------------------------------------------ */
function SliderLayout({ images, current, onPrev, onNext, onImageClick }: {
    images: GalleryImage[]; current: number; onPrev: () => void; onNext: () => void; onImageClick: (i: number) => void;
}) {
    return (
        <div className="relative w-full overflow-hidden rounded">
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="w-full flex-shrink-0 cursor-pointer"
                        onClick={() => onImageClick(index)}
                        role="button"
                        tabIndex={0}
                    >
                        <img
                            src={image.src}
                            alt={image.alt || ''}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                        />
                        <ImageCaption caption={image.caption} />
                    </div>
                ))}
            </div>
            {current > 0 && (
                <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                >
                    &#8249;
                </button>
            )}
            {current < images.length - 1 && (
                <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                >
                    &#8250;
                </button>
            )}
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                    <span
                        key={i}
                        className={`block w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Lightbox (shared)                                                 */
/* ------------------------------------------------------------------ */
function Lightbox({ images, index, onClose, onPrev, onNext }: {
    images: GalleryImage[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
            <button type="button" className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300" onClick={onClose}>
                &times;
            </button>
            {index > 0 && (
                <button
                    type="button"
                    className="absolute left-4 text-white text-3xl hover:text-gray-300"
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                >
                    &#8249;
                </button>
            )}
            {index < images.length - 1 && (
                <button
                    type="button"
                    className="absolute right-4 text-white text-3xl hover:text-gray-300"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                >
                    &#8250;
                </button>
            )}
            <img
                src={images[index].src}
                alt={images[index].alt || ''}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
            {images[index].caption && (
                <div className="absolute bottom-4 text-white text-center text-sm">
                    {images[index].caption}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  ImageCaption (shared helper)                                      */
/* ------------------------------------------------------------------ */
function ImageCaption({ caption }: { caption?: string }) {
    if (!caption) return null;
    return (
        <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-full bg-black/60 text-white text-sm px-3 py-2">
                {caption}
            </div>
        </div>
    );
}
