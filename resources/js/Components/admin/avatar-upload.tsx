import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import UserAvatar from './user-avatar';

interface AvatarUploadProps {
    /** Current avatar URL (or null). */
    avatarUrl?: string | null;
    /** User display name (for initials fallback). */
    name: string;
    /** Route to POST the avatar file to. */
    uploadUrl: string;
    /** Route to DELETE the avatar. */
    deleteUrl: string;
}

export default function AvatarUpload({ avatarUrl, name, uploadUrl, deleteUrl }: AvatarUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPreview(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        router.post(uploadUrl, formData, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    };

    const handleRemove = () => {
        setPreview(null);
        router.delete(deleteUrl);
    };

    const displaySrc = preview || avatarUrl;

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo de profil</h2>
            <div className="flex items-center gap-6">
                <UserAvatar
                    name={name}
                    avatarUrl={displaySrc}
                    size="lg"
                    className="ring-2 ring-gray-200"
                />
                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        {uploading ? 'Envoi...' : 'Changer la photo'}
                    </button>
                    {displaySrc && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            Supprimer
                        </button>
                    )}
                    <p className="text-xs text-gray-500">JPG, PNG ou GIF. Max 2 Mo.</p>
                </div>
            </div>
        </section>
    );
}
