import type { GalleryLayoutProps } from './types';
import GalleryPhoto from './gallery-photo';

export function FilmstripLayout({ images, onImageClick, interactive, showCaptions }: GalleryLayoutProps) {
    return <div className="gallery-filmstrip" tabIndex={0} aria-label="Photos à faire défiler horizontalement">
        {images.map((image, index) => <GalleryPhoto key={index} image={image} index={index} onImageClick={onImageClick} interactive={interactive} showCaptions={showCaptions} />)}
    </div>;
}
