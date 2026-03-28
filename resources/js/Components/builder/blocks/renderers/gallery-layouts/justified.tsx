import { useMemo } from 'react';
import type { GalleryLayoutProps } from './types';

const TARGET_ROW_HEIGHT = 220;

interface RowItem {
    image: GalleryLayoutProps['images'][number];
    index: number;
    ratio: number;
}

function buildRows(images: GalleryLayoutProps['images'], containerWidth: number, gapPx: number): RowItem[][] {
    const items: RowItem[] = images.map((img, i) => ({
        image: img,
        index: i,
        ratio: (img.width && img.height) ? img.width / img.height : 1.5,
    }));

    const rows: RowItem[][] = [];
    let currentRow: RowItem[] = [];
    let rowWidth = 0;

    for (const item of items) {
        const itemWidth = item.ratio * TARGET_ROW_HEIGHT;
        currentRow.push(item);
        rowWidth += itemWidth;

        const totalGap = (currentRow.length - 1) * gapPx;
        if (rowWidth + totalGap >= containerWidth && currentRow.length > 0) {
            rows.push([...currentRow]);
            currentRow = [];
            rowWidth = 0;
        }
    }
    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
}

export function JustifiedLayout({ images, gap, onImageClick }: GalleryLayoutProps) {
    const gapPx = parseInt(gap, 10) || 8;

    const rows = useMemo(() => buildRows(images, 960, gapPx), [images, gapPx]);

    return (
        <div className="gallery-justified" style={{ display: 'flex', flexDirection: 'column', gap }}>
            {rows.map((row, ri) => {
                return (
                    <div key={ri} style={{ display: 'flex', gap }}>
                        {row.map((item) => {
                            return (
                                <div
                                    key={item.index}
                                    className="group relative overflow-hidden rounded cursor-pointer"
                                    style={{ flex: `${item.ratio} 1 0%` }}
                                    onClick={() => onImageClick(item.index)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <img
                                        src={item.image.src}
                                        alt={item.image.alt || ''}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {item.image.caption && (
                                        <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="w-full bg-black/60 text-white text-sm px-3 py-2">
                                                {item.image.caption}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
