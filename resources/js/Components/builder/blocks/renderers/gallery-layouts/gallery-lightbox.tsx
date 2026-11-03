import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { GalleryImage } from './types';

interface GalleryLightboxProps {
    images: GalleryImage[];
    index: number;
    onClose: () => void;
    onSelect: (index: number) => void;
    themeStyle: CSSProperties;
    title: string;
    showCaptions: boolean;
}

export default function GalleryLightbox({ images, index, onClose, onSelect, themeStyle, title, showCaptions }: GalleryLightboxProps) {
    const touchStart = useRef<number | null>(null);
    const thumbnails = useRef<HTMLDivElement>(null);
    const image = images[index];
    const [zoomed, setZoomed] = useState(false);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                onSelect((index + (event.key === 'ArrowRight' ? 1 : -1) + images.length) % images.length);
            }
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [index, images.length, onSelect]);

    useEffect(() => {
        setZoomed(false);
        thumbnails.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [index]);

    return <Dialog open onClose={onClose} className="cms-gallery-lightbox" style={themeStyle} onKeyDown={(event) => { if (event.key !== 'Escape') event.stopPropagation(); }}>
        <div className="cms-gallery-lightbox__backdrop" aria-hidden="true" />
        <DialogPanel className="cms-gallery-lightbox__panel">
            <div className="cms-gallery-lightbox__top">
                <div><DialogTitle className="cms-gallery-lightbox__title">{title}</DialogTitle><span className="cms-gallery-lightbox__counter" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span></div>
                <div className="cms-gallery-lightbox__actions">
                    <button type="button" onClick={() => setZoomed((value) => !value)} aria-label={zoomed ? 'Réduire la photo' : 'Voir la photo en taille réelle'} aria-pressed={zoomed} className="cms-gallery-lightbox__button">{zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</button>
                    <button type="button" onClick={onClose} aria-label="Fermer le diaporama" className="cms-gallery-lightbox__button"><X size={22} /></button>
                </div>
            </div>
            <div className="cms-gallery-lightbox__stage" style={{ touchAction: zoomed ? 'auto' : 'pan-y' }} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
                const end = event.changedTouches[0]?.clientX;
                if (!zoomed && touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 50) {
                    onSelect((index + (end < touchStart.current ? 1 : -1) + images.length) % images.length);
                }
                touchStart.current = null;
            }}>
                {images.length > 1 && <button type="button" onClick={() => onSelect((index - 1 + images.length) % images.length)} aria-label="Photo précédente" className="cms-gallery-lightbox__button cms-gallery-lightbox__previous"><ChevronLeft size={26} /></button>}
                <div className={`cms-gallery-lightbox__canvas${zoomed ? ' cms-gallery-lightbox__canvas--zoomed' : ''}`}>
                    <img key={image.src} src={image.src} alt={image.alt || ''} className="cms-gallery-lightbox__image" draggable={false} />
                </div>
                {images.length > 1 && <button type="button" onClick={() => onSelect((index + 1) % images.length)} aria-label="Photo suivante" className="cms-gallery-lightbox__button cms-gallery-lightbox__next"><ChevronRight size={26} /></button>}
            </div>
            {showCaptions && <p className="cms-gallery-lightbox__caption">{image.caption || image.alt || '\u00a0'}</p>}
            {images.length > 1 && <div ref={thumbnails} className="cms-gallery-lightbox__thumbnails">
                {images.map((thumbnail, position) => <button key={position} type="button" aria-label={`Afficher la photo ${position + 1}`} aria-current={position === index ? 'true' : undefined} onClick={() => onSelect(position)}>
                    <img src={thumbnail.thumbnail || thumbnail.src} alt="" loading="lazy" />
                </button>)}
            </div>}
        </DialogPanel>
    </Dialog>;
}
