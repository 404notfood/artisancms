import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { GalleryImage } from './types';

interface GalleryCarouselProps {
    images: GalleryImage[];
    index: number;
    onSelect: (index: number) => void;
    onOpen: (index: number) => void;
    lightbox: boolean;
    showCaptions: boolean;
}

export default function GalleryCarousel({ images, index, onSelect, onOpen, lightbox, showCaptions }: GalleryCarouselProps) {
    const strip = useRef<HTMLDivElement>(null);
    const touchStart = useRef<number | null>(null);
    const image = images[index];
    const move = (direction: number) => onSelect((index + direction + images.length) % images.length);

    useEffect(() => {
        const thumbnails = strip.current;
        const selected = thumbnails?.querySelector<HTMLElement>('[aria-current="true"]');
        if (thumbnails && selected) {
            thumbnails.scrollTo({ left: selected.offsetLeft - (thumbnails.clientWidth - selected.clientWidth) / 2 });
        }
    }, [index]);

    return <div className="cms-carousel" role="region" aria-roledescription="carrousel" aria-label="Carrousel de photographies" onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            event.stopPropagation();
            move(event.key === 'ArrowRight' ? 1 : -1);
        }
    }}>
        <div className="cms-carousel__toolbar">
            <span aria-live="polite" className="cms-carousel__counter">{String(index + 1).padStart(2, '0')} <span>/ {String(images.length).padStart(2, '0')}</span></span>
            {lightbox && <button type="button" onClick={() => onOpen(index)} aria-label="Ouvrir le carrousel en plein écran"><Maximize2 size={17} /><span>Plein écran</span></button>}
        </div>
        <div className="cms-carousel__stage" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
            const end = event.changedTouches[0]?.clientX;
            if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 50) move(end < touchStart.current ? 1 : -1);
            touchStart.current = null;
        }}>
            <button type="button" className="cms-carousel__photo" disabled={!lightbox} onClick={() => onOpen(index)} aria-label={`Agrandir la photo ${index + 1}${image.alt ? ` : ${image.alt}` : ''}`}>
                <img key={image.src} src={image.src} alt={image.alt || ''} width={image.width || undefined} height={image.height || undefined} loading="lazy" decoding="async" draggable={false} />
            </button>
            {images.length > 1 && <>
                <button type="button" className="cms-carousel__arrow cms-carousel__arrow--previous" onClick={() => move(-1)} aria-label="Photo précédente"><ChevronLeft size={24} /></button>
                <button type="button" className="cms-carousel__arrow cms-carousel__arrow--next" onClick={() => move(1)} aria-label="Photo suivante"><ChevronRight size={24} /></button>
            </>}
        </div>
        {showCaptions && <div className="cms-carousel__caption" aria-live="polite">{image.caption || image.alt || '\u00a0'}</div>}
        {images.length > 1 && <div ref={strip} className="cms-carousel__thumbnails">
            {images.map((thumbnail, position) => <button key={position} type="button" onClick={() => onSelect(position)} aria-label={`Choisir la photo ${position + 1}`} aria-current={position === index ? 'true' : undefined}>
                <img src={thumbnail.thumbnail || thumbnail.src} alt="" loading="lazy" draggable={false} />
            </button>)}
        </div>}
    </div>;
}
