import type { GalleryLayoutProps } from './types';
import GalleryPhoto from './gallery-photo';

export function MasonryLayout({ images, onImageClick, interactive, showCaptions }: GalleryLayoutProps) {
    return <div className="gallery-masonry">
        {images.map((image, index) => <GalleryPhoto key={index} image={image} index={index} onImageClick={onImageClick} interactive={interactive} showCaptions={showCaptions} />)}
    </div>;
}
