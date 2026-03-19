import { useState } from 'react';
import { X } from 'lucide-react';
import type { ProductFormSectionProps } from './types';

export default function ProductImagesSection({ data, setData, errors }: ProductFormSectionProps) {
    const [galleryInput, setGalleryInput] = useState('');

    function addGalleryImage() {
        if (!galleryInput.trim()) return;
        setData('gallery', [...data.gallery, galleryInput.trim()]);
        setGalleryInput('');
    }

    function removeGalleryImage(index: number) {
        setData('gallery', data.gallery.filter((_, i) => i !== index));
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Images</h2>

            <div>
                <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700">
                    Image principale
                </label>
                <input
                    id="featured_image"
                    type="text"
                    value={data.featured_image}
                    onChange={(e) => setData('featured_image', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="URL de l'image"
                />
                {data.featured_image && (
                    <div className="mt-2">
                        <img
                            src={data.featured_image}
                            alt="Apercu"
                            className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
                        />
                    </div>
                )}
                {errors.featured_image && <p className="mt-1 text-sm text-red-600">{errors.featured_image}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Galerie
                </label>
                {data.gallery.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3">
                        {data.gallery.map((url, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`Galerie ${index + 1}`}
                                    className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Retirer"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={galleryInput}
                        onChange={(e) => setGalleryInput(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="URL de l'image"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addGalleryImage();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={addGalleryImage}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Ajouter
                    </button>
                </div>
                {errors.gallery && <p className="mt-1 text-sm text-red-600">{errors.gallery}</p>}
            </div>
        </div>
    );
}
