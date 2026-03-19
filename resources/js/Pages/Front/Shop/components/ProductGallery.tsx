import { useState } from 'react';
import { T } from './shop-helpers';

export function NoImagePlaceholder() {
    return (
        <div style={{
            width: '100%',
            aspectRatio: '1/1',
            background: T.surface,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            borderRadius: '2px',
        }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke={T.primary} strokeWidth="1" strokeOpacity="0.3"/>
                <path d="M20 44 L28 34 L34 40 L40 30 L48 44Z" fill={T.primary} fillOpacity="0.1"/>
                <circle cx="24" cy="26" r="4" fill={T.gold} fillOpacity="0.4"/>
            </svg>
            <span style={{ fontFamily: T.body, fontSize: '12px', color: T.primary, opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Image a venir
            </span>
        </div>
    );
}

export function ImageGallery({ featuredImage, gallery, productName }: {
    featuredImage: string | null;
    gallery: string[] | null;
    productName: string;
}) {
    const allImages = [
        ...(featuredImage ? [featuredImage] : []),
        ...(gallery || []),
    ];
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (allImages.length === 0) {
        return <NoImagePlaceholder />;
    }

    return (
        <div>
            <div style={{
                overflow: 'hidden',
                borderRadius: '2px',
                background: T.surface,
                marginBottom: allImages.length > 1 ? '12px' : '0',
            }}>
                <img
                    src={allImages[selectedIndex]}
                    alt={productName}
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                />
            </div>
            {allImages.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {allImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            style={{
                                width: '72px', height: '72px', flexShrink: 0,
                                overflow: 'hidden', borderRadius: '2px',
                                border: `2px solid ${index === selectedIndex ? T.primary : 'transparent'}`,
                                cursor: 'pointer', padding: 0, background: 'none', outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                        >
                            <img src={image} alt={`${productName} ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
