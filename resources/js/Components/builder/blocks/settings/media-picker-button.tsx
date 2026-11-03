import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import MediaPickerDialog, { type MediaItem } from './media-picker-dialog';

interface MediaPickerButtonProps {
    value: string;
    onChange: (url: string, alt?: string, media?: MediaItem) => void;
    label?: string;
    placeholder?: string;
}

export default function MediaPickerButton({ value, onChange, label = 'Image', placeholder = 'Choisir une image' }: MediaPickerButtonProps) {
    const { cms } = usePage<SharedProps>().props;
    const [open, setOpen] = useState(false);

    return <div>
        {label && <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>}
        {value ? <div className="space-y-2">
            <div className="relative">
                <img src={value} alt="" className="h-24 w-full rounded-lg border object-cover" />
                <button type="button" onClick={() => onChange('', '')} aria-label="Retirer l'image" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm text-red-600 shadow">&times;</button>
            </div>
            <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Changer dans la médiathèque</button>
        </div> : <button type="button" onClick={() => setOpen(true)} className="w-full rounded-lg border-2 border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600">{placeholder}</button>}
        {open && <MediaPickerDialog adminPrefix={cms?.adminPrefix ?? 'admin'} selectedUrls={value ? [value] : []} onClose={() => setOpen(false)} onSelect={([media]) => {
            onChange(media.url, media.alt, media);
            setOpen(false);
        }} />}
    </div>;
}
