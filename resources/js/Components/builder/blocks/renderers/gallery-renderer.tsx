import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Expand, Images } from 'lucide-react';
import type { BlockRendererProps } from '../block-registry';
import type { GalleryImage, GalleryLayoutProps } from './gallery-layouts/types';
import GalleryPhoto from './gallery-layouts/gallery-photo';
import { MasonryLayout } from './gallery-layouts/masonry';
import { JustifiedLayout } from './gallery-layouts/justified';
import { CollageLayout } from './gallery-layouts/collage';
import { FilmstripLayout } from './gallery-layouts/filmstrip';
import GalleryLightbox from './gallery-layouts/gallery-lightbox';
import GalleryCarousel from './gallery-layouts/gallery-carousel';
import './gallery-layouts/gallery-layouts.css';

type LayoutStyle = 'editorial' | 'grid' | 'masonry' | 'slider' | 'justified' | 'collage' | 'filmstrip';
const LAYOUTS = new Set<LayoutStyle>(['editorial', 'grid', 'masonry', 'slider', 'justified', 'collage', 'filmstrip']);

export default function GalleryRenderer({ block, isEditing }: BlockRendererProps) {
    const images = ((block.props.images as GalleryImage[]) || []).filter((image) => image.src?.trim());
    const columns = Math.min(6, Math.max(1, Math.floor(Number(block.props.columns)) || 3));
    const gap = (block.props.gap as string) || '16px';
    const lightbox = block.props.lightbox !== false;
    const requestedStyle = block.props.style === 'carousel' ? 'slider' : block.props.style as LayoutStyle;
    const style = LAYOUTS.has(requestedStyle) ? requestedStyle : 'masonry';
    const title = (block.props.title as string) || '';
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [sliderIndex, setSliderIndex] = useState(0);
    const previousBlock = useRef(block.id);
    const gallery = useRef<HTMLElement>(null);
    const [viewerTheme, setViewerTheme] = useState<CSSProperties>({});
    const openImage = useCallback((index: number) => {
        if (!lightbox) return;
        if (gallery.current) {
            const theme = getComputedStyle(gallery.current);
            setViewerTheme({ '--gallery-accent': theme.getPropertyValue('--gallery-accent'), fontFamily: theme.fontFamily } as CSSProperties);
        }
        setLightboxIndex(index);
    }, [lightbox]);
    const currentSlide = Math.min(sliderIndex, Math.max(0, images.length - 1));

    useEffect(() => {
        if (previousBlock.current !== block.id) {
            setLightboxIndex(null);
            setSliderIndex(0);
            previousBlock.current = block.id;
        }
    }, [block.id]);

    if (images.length === 0) return isEditing ? <div className="cms-gallery-empty"><Images size={24} /><span>Ajoutez vos photos depuis la médiathèque.</span></div> : null;

    const layoutProps: GalleryLayoutProps = { images, columns, gap, onImageClick: openImage, interactive: lightbox, showCaptions: block.props.showCaptions !== false };
    const activeLightbox = lightboxIndex === null ? null : Math.min(lightboxIndex, images.length - 1);

    const cornerStyle = { square: '0px', soft: '8px', rounded: '16px' }[block.props.cornerStyle as string];
    return <section ref={gallery} className="cms-gallery not-prose" data-layout={style} data-appearance={(block.props.appearance as string) || 'theme'} data-columns={columns} aria-label={title || 'Galerie de photographies'} style={{ '--gallery-gap': gap, '--gallery-columns': columns, ...(cornerStyle ? { '--gallery-radius': cornerStyle } : {}) } as CSSProperties}>
        <div className="cms-gallery__heading">
            <div><span className="cms-gallery__eyebrow">{images.length} photographie{images.length > 1 ? 's' : ''}</span>{title && <h3 className="cms-gallery__title">{title}</h3>}</div>
            {lightbox && <button type="button" className="cms-gallery__open" onClick={() => openImage(0)}><Expand size={14} /><span>Voir le diaporama</span></button>}
        </div>
        {(style === 'editorial' || style === 'grid') && <div className={style === 'editorial' ? 'gallery-editorial' : 'gallery-grid'}>
            {images.map((image, index) => <GalleryPhoto key={index} {...layoutProps} image={image} index={index} className={style === 'editorial' && index === 0 ? 'cms-gallery-photo--lead' : ''} />)}
        </div>}
        {style === 'masonry' && <MasonryLayout {...layoutProps} />}
        {style === 'justified' && <JustifiedLayout {...layoutProps} />}
        {style === 'collage' && <CollageLayout {...layoutProps} />}
        {style === 'filmstrip' && <FilmstripLayout {...layoutProps} />}
        {style === 'slider' && <GalleryCarousel images={images} index={currentSlide} onSelect={setSliderIndex} onOpen={openImage} lightbox={lightbox} showCaptions={layoutProps.showCaptions} />}
        {lightbox && activeLightbox !== null && <GalleryLightbox images={images} index={activeLightbox} onClose={() => {
            if (style === 'slider') setSliderIndex(activeLightbox);
            setLightboxIndex(null);
        }} onSelect={setLightboxIndex} themeStyle={viewerTheme} title={title || 'Galerie photo'} showCaptions={layoutProps.showCaptions} />}
    </section>;
}
