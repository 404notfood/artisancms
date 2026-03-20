import { useForm, usePage } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import type { SharedProps } from '@/types/cms';

export default function DangerTab() {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [confirmOpen, setConfirmOpen] = useState(false);
    const form = useForm({ password: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.delete(`/${prefix}/account`);
    };

    return (
        <div>
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                <h3 className="text-sm font-semibold text-red-700 mb-1">Supprimer mon compte</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Une fois votre compte supprime, toutes les donnees seront definitivement effacees.
                </p>

                {!confirmOpen ? (
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        Supprimer mon compte
                    </button>
                ) : (
                    <form onSubmit={submit} className="space-y-3 max-w-md">
                        <p className="text-sm font-medium text-red-600">
                            Confirmez en entrant votre mot de passe :
                        </p>
                        <input
                            type="password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            placeholder="Mot de passe"
                            className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                        />
                        {form.errors.password && <p className="text-xs text-red-600">{form.errors.password}</p>}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                Confirmer la suppression
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
