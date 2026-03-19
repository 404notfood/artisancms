import { useState } from 'react';

interface PreviewModalProps {
    previewUrl: string;
    expiresAt: string;
    onClose: () => void;
}

export default function PreviewModal({ previewUrl, expiresAt, onClose }: PreviewModalProps) {
    const [copied, setCopied] = useState(false);

    function copyUrl() {
        navigator.clipboard.writeText(previewUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-lg font-medium text-gray-900">Lien d'apercu</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Ce lien permet de visualiser le contenu sans etre connecte. Il expire automatiquement.
                </p>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'apercu</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={previewUrl}
                            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                        />
                        <button
                            type="button"
                            onClick={copyUrl}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shrink-0"
                        >
                            {copied ? 'Copie !' : 'Copier'}
                        </button>
                    </div>
                </div>
                {expiresAt && (
                    <p className="mt-3 text-xs text-gray-500">
                        Expire le {new Date(expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
                <div className="mt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Fermer
                    </button>
                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                        Ouvrir l'apercu
                    </a>
                </div>
            </div>
        </div>
    );
}
