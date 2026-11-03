export interface GalleryImage {
    src: string;
    alt: string;
    caption: string;
    thumbnail?: string;
    width?: number;
    height?: number;
}

export interface GalleryLayoutProps {
    images: GalleryImage[];
    columns: number;
    gap: string;
    onImageClick: (index: number) => void;
    interactive: boolean;
    showCaptions: boolean;
}
