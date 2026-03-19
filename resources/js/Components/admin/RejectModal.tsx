import { useState } from 'react';

interface RejectModalProps {
    entityLabel: string;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}

export default function RejectModal({ entityLabel, onConfirm, onCancel }: RejectModalProps) {
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-lg font-medium text-gray-900">Rejeter {entityLabel}</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Indiquez la raison du rejet. L'auteur la verra sur {entityLabel}.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Raison du rejet..."
                    required
                />
                <div className="mt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={() => { if (reason.trim()) onConfirm(reason); }}
                        disabled={!reason.trim()}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        Confirmer le rejet
                    </button>
                </div>
            </div>
        </div>
    );
}
