import { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryLayoutProps } from './types';
import GalleryPhoto from './gallery-photo';

export function JustifiedLayout({ images, gap, onImageClick, interactive, showCaptions }: GalleryLayoutProps) {
    const container = useRef<HTMLDivElement>(null);
    const [measure, setMeasure] = useState({ width: 900, gap: 16 });
    useEffect(() => {
        const element = container.current;
        if (!element) return;
        const update = () => setMeasure({ width: element.getBoundingClientRect().width, gap: parseFloat(getComputedStyle(element).rowGap) || 16 });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [gap]);
    const rows = useMemo(() => {
        const result: { image: typeof images[number]; index: number; ratio: number }[][] = [];
        let row: typeof result[number] = [];
        let width = 0;
        images.forEach((image, index) => {
            const ratio = image.width && image.height ? image.width / image.height : 1.5;
            row.push({ image, index, ratio });
            width += ratio * 220;
            if (width + (row.length - 1) * measure.gap >= measure.width) {
                result.push(row);
                row = [];
                width = 0;
            }
        });
        if (row.length) result.push(row);
        return result;
    }, [images, measure]);

    return <div ref={container} className="gallery-justified">
        {rows.map((row, index) => <div key={index} className="gallery-justified__row" style={{ maxWidth: row.reduce((sum, item) => sum + item.ratio * 260, 0) + (row.length - 1) * measure.gap }}>
            {row.map((item) => <GalleryPhoto key={item.index} image={item.image} index={item.index} onImageClick={onImageClick} interactive={interactive} showCaptions={showCaptions} style={{ flex: `${item.ratio} 1 0%` }} />)}
        </div>)}
    </div>;
}
