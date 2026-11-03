import type { GalleryLayoutProps } from './types';
import GalleryPhoto from './gallery-photo';

export function CollageLayout({ images, columns, onImageClick, interactive, showCaptions }: GalleryLayoutProps) {
    return <div className="gallery-collage">
        {images.map((image, index) => <GalleryPhoto key={index} image={image} index={index} onImageClick={onImageClick} interactive={interactive} showCaptions={showCaptions} className={columns > 1 && index % 5 === 0 ? 'cms-gallery-photo--large' : ''} />)}
    </div>;
}
