import { useState, useRef, useCallback } from 'react';
import { Crop, RotateCw, FlipHorizontal, FlipVertical, X, Check } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface ImageEditorProps {
    mediaId: number;
    imageUrl: string;
    onSave: (result: { url: string }) => void;
    onCancel: () => void;
}

type EditMode = 'crop' | 'rotate' | null;

interface CropBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function ImageEditor({ mediaId, imageUrl, onSave, onCancel }: ImageEditorProps) {
    const [mode, setMode] = useState<EditMode>(null);
    const [saving, setSaving] = useState(false);
    const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (mode !== 'crop' || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setIsDragging(true);
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setDragStart({ x, y });
            setCropBox({ x, y, width: 0, height: 0 });
        },
        [mode],
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setCropBox({
                x: Math.min(dragStart.x, x),
                y: Math.min(dragStart.y, y),
                width: Math.abs(x - dragStart.x),
                height: Math.abs(y - dragStart.y),
            });
        },
        [isDragging, dragStart],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    async function handleCrop() {
        if (!imgRef.current || !containerRef.current) return;
        setSaving(true);

        const img = imgRef.current;
        const container = containerRef.current;
        const scaleX = img.naturalWidth / container.clientWidth;
        const scaleY = img.naturalHeight / container.clientHeight;

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        try {
            const res = await fetch(`/admin/media/${mediaId}/crop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    x: Math.round(cropBox.x * scaleX),
                    y: Math.round(cropBox.y * scaleY),
                    width: Math.round(cropBox.width * scaleX),
                    height: Math.round(cropBox.height * scaleY),
                }),
            });
            const data = await res.json();
            if (data.success) {
                onSave({ url: data.url });
            }
        } catch (err) {
            console.error('Crop failed:', err);
        } finally {
            setSaving(false);
        }
    }

    async function handleReplace(file: File) {
        setSaving(true);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/admin/media/${mediaId}/replace`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                onSave({ url: data.url });
            }
        } catch (err) {
            console.error('Replace failed:', err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-2">
                <Button
                    variant={mode === 'crop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode(mode === 'crop' ? null : 'crop')}
                >
                    <Crop className="mr-1 h-4 w-4" />
                    Recadrer
                </Button>
                <label className="cursor-pointer">
                    <Button variant="ghost" size="sm" asChild>
                        <span>
                            <FlipHorizontal className="mr-1 h-4 w-4" />
                            Remplacer
                        </span>
                    </Button>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleReplace(file);
                        }}
                    />
                </label>
                <div className="flex-1" />
                {mode === 'crop' && cropBox.width > 10 && cropBox.height > 10 && (
                    <Button size="sm" onClick={handleCrop} disabled={saving}>
                        <Check className="mr-1 h-4 w-4" />
                        Appliquer
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    <X className="mr-1 h-4 w-4" />
                    Fermer
                </Button>
            </div>

            {/* Canvas area */}
            <div
                ref={containerRef}
                className="relative mx-auto max-h-[500px] overflow-hidden rounded-lg bg-checkerboard"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ cursor: mode === 'crop' ? 'crosshair' : 'default' }}
            >
                <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Edit"
                    className="block max-h-[500px] w-auto mx-auto"
                    draggable={false}
                />

                {/* Crop overlay */}
                {mode === 'crop' && cropBox.width > 0 && cropBox.height > 0 && (
                    <>
                        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                        <div
                            className="absolute border-2 border-white pointer-events-none shadow-lg"
                            style={{
                                left: cropBox.x,
                                top: cropBox.y,
                                width: cropBox.width,
                                height: cropBox.height,
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                            }}
                        >
                            {/* Corner handles */}
                            <div className="absolute -top-1 -left-1 h-3 w-3 border-2 border-white bg-indigo-500" />
                            <div className="absolute -top-1 -right-1 h-3 w-3 border-2 border-white bg-indigo-500" />
                            <div className="absolute -bottom-1 -left-1 h-3 w-3 border-2 border-white bg-indigo-500" />
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 border-2 border-white bg-indigo-500" />
                        </div>
                    </>
                )}
            </div>

            {mode === 'crop' && (
                <p className="text-center text-xs text-gray-500">
                    Cliquez et glissez sur l'image pour définir la zone de recadrage
                </p>
            )}

            {saving && (
                <div className="text-center text-sm text-indigo-600">Traitement en cours...</div>
            )}
        </div>
    );
}
