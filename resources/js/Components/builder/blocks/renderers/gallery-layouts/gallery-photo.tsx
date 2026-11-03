import type { CSSProperties } from 'react';
import { Expand } from 'lucide-react';
import type { GalleryImage } from './types';

interface GalleryPhotoProps {
    image: GalleryImage;
    index: number;
    onImageClick: (index: number) => void;
    interactive: boolean;
    showCaptions: boolean;
    className?: string;
    style?: CSSProperties;
}

export default function GalleryPhoto({ image, index, onImageClick, interactive, showCaptions, className = '', style }: GalleryPhotoProps) {
    const Frame = interactive ? 'button' : 'div';

    return <figure className={`cms-gallery-photo ${className}`} style={{ '--photo-ratio': image.width && image.height ? image.width / image.height : 1.5, ...style } as CSSProperties}>
        <Frame className="cms-gallery-photo__frame" {...(interactive ? {
            type: 'button' as const,
            onClick: () => onImageClick(index),
            'aria-label': `Agrandir la photo ${index + 1}${image.alt ? ` : ${image.alt}` : ''}`,
        } : {})}>
            <img src={image.src} alt={image.alt || ''} width={image.width || undefined} height={image.height || undefined} loading="lazy" decoding="async" />
            {interactive && <span className="cms-gallery-photo__expand" aria-hidden="true"><Expand size={16} /></span>}
        </Frame>
        {showCaptions && image.caption && <figcaption className="cms-gallery-photo__caption"><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{image.caption}</span></figcaption>}
    </figure>;
}
