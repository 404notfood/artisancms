import { useState, useRef, useCallback, useEffect } from 'react';

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropProps {
    src: string;
    mediaId: number;
    onCropped?: (result: { url: string; width: number; height: number }) => void;
    onCancel?: () => void;
    aspectRatio?: number | null;
}

const PRESETS = [
    { label: 'Libre', ratio: null },
    { label: '1:1', ratio: 1 },
    { label: '16:9', ratio: 16 / 9 },
    { label: '4:3', ratio: 4 / 3 },
    { label: '3:2', ratio: 3 / 2 },
    { label: '2:3', ratio: 2 / 3 },
];

export default function ImageCrop({ src, mediaId, onCropped, onCancel, aspectRatio = null }: ImageCropProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 });
    const [ratio, setRatio] = useState<number | null>(aspectRatio);
    const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: { x: 0, y: 0, width: 0, height: 0 } });
    const [saving, setSaving] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (ratio !== null) {
            const newHeight = crop.width / ratio;
            setCrop((c) => ({
                ...c,
                height: Math.min(newHeight, 100 - c.y),
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ratio]);

    function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const img = e.currentTarget;
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    }

    function getRelativePosition(clientX: number, clientY: number) {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const rect = container.getBoundingClientRect();
        return {
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100,
        };
    }

    const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
        e.preventDefault();
        e.stopPropagation();
        const pos = getRelativePosition(e.clientX, e.clientY);
        setDragging(type);
        setDragStart({ x: pos.x, y: pos.y, crop: { ...crop } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crop]);

    useEffect(() => {
        if (!dragging) return;

        function handleMouseMove(e: MouseEvent) {
            const pos = getRelativePosition(e.clientX, e.clientY);
            const dx = pos.x - dragStart.x;
            const dy = pos.y - dragStart.y;

            if (dragging === 'move') {
                const newX = Math.max(0, Math.min(100 - dragStart.crop.width, dragStart.crop.x + dx));
                const newY = Math.max(0, Math.min(100 - dragStart.crop.height, dragStart.crop.y + dy));
                setCrop({ ...dragStart.crop, x: newX, y: newY });
            } else if (dragging === 'resize') {
                let newWidth = Math.max(5, Math.min(100 - dragStart.crop.x, dragStart.crop.width + dx));
                let newHeight: number;
                if (ratio !== null) {
                    newHeight = newWidth / ratio;
                } else {
                    newHeight = Math.max(5, Math.min(100 - dragStart.crop.y, dragStart.crop.height + dy));
                }
                newHeight = Math.min(newHeight, 100 - dragStart.crop.y);
                if (ratio !== null) {
                    newWidth = newHeight * ratio;
                }
                setCrop({ ...dragStart.crop, width: newWidth, height: newHeight });
            }
        }

        function handleMouseUp() {
            setDragging(null);
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragging, dragStart, ratio]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getRelativePosition2(clientX: number, clientY: number): any {
        return getRelativePosition(clientX, clientY);
    }
    void getRelativePosition2;

    async function handleSave() {
        setSaving(true);
        try {
            const pixelCrop = {
                x: Math.round((crop.x / 100) * imageSize.width),
                y: Math.round((crop.y / 100) * imageSize.height),
                width: Math.round((crop.width / 100) * imageSize.width),
                height: Math.round((crop.height / 100) * imageSize.height),
            };

            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/admin/media/${mediaId}/crop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(pixelCrop),
            });
            const result = await response.json();
            if (result.success && onCropped) {
                onCropped({ url: result.url, width: pixelCrop.width, height: pixelCrop.height });
            }
        } catch {
            // silently fail
        } finally {
            setSaving(false);
        }
    }

    const cropPixels = imageSize.width > 0 ? {
        width: Math.round((crop.width / 100) * imageSize.width),
        height: Math.round((crop.height / 100) * imageSize.height),
    } : null;

    return (
        <div className="space-y-4">
            {/* Ratio presets */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Ratio :</span>
                {PRESETS.map((preset) => (
                    <button
                        key={preset.label}
                        type="button"
                        onClick={() => setRatio(preset.ratio)}
                        className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                            ratio === preset.ratio
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Crop area */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-lg border border-gray-300 bg-gray-900 select-none"
                style={{ maxHeight: '500px' }}
            >
                <img
                    ref={imgRef}
                    src={src}
                    alt="Image a recadrer"
                    onLoad={handleImageLoad}
                    className="block w-full h-auto"
                    draggable={false}
                />
                {/* Overlay */}
                <div className="absolute inset-0">
                    {/* Dark overlay around crop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        style={{
                            clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${crop.y}%, ${crop.x}% ${crop.y}%, ${crop.x}% ${crop.y + crop.height}%, ${crop.x + crop.width}% ${crop.y + crop.height}%, ${crop.x + crop.width}% ${crop.y}%, 0% ${crop.y}%)`,
                        }}
                    />
                    {/* Crop selection */}
                    <div
                        className="absolute border-2 border-white cursor-move"
                        style={{
                            left: `${crop.x}%`,
                            top: `${crop.y}%`,
                            width: `${crop.width}%`,
                            height: `${crop.height}%`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'move')}
                    >
                        {/* Grid lines */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="border border-white/30" />
                            ))}
                        </div>
                        {/* Resize handle */}
                        <div
                            className="absolute -right-1.5 -bottom-1.5 h-4 w-4 rounded-full border-2 border-white bg-indigo-600 cursor-se-resize"
                            onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        />
                        {/* Corner indicators */}
                        <div className="absolute -left-0.5 -top-0.5 h-3 w-3 border-l-2 border-t-2 border-white" />
                        <div className="absolute -right-0.5 -top-0.5 h-3 w-3 border-r-2 border-t-2 border-white" />
                        <div className="absolute -left-0.5 -bottom-0.5 h-3 w-3 border-l-2 border-b-2 border-white" />
                    </div>
                </div>
            </div>

            {/* Info bar */}
            {cropPixels && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                        Dimensions : {cropPixels.width} × {cropPixels.height} px
                    </span>
                    <span>
                        Original : {imageSize.width} × {imageSize.height} px
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Recadrage...' : 'Recadrer et sauvegarder'}
                </button>
            </div>
        </div>
    );
}
