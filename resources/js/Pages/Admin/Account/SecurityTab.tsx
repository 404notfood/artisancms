import { useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { ADMIN_INPUT_FOCUS, adminBtnPrimary } from '@/lib/admin-theme';
import type { SharedProps } from '@/types/cms';

export default function SecurityTab() {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(`/${prefix}/account/password`, {
            onSuccess: () => form.reset(),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-5 max-w-md">
            <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel
                </label>
                <input
                    id="current_password"
                    type="password"
                    value={form.data.current_password}
                    onChange={(e) => form.setData('current_password', e.target.value)}
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                />
                {form.errors.current_password && (
                    <p className="mt-1 text-xs text-red-600">{form.errors.current_password}</p>
                )}
            </div>
            <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                </label>
                <input
                    id="new_password"
                    type="password"
                    value={form.data.password}
                    onChange={(e) => form.setData('password', e.target.value)}
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                />
                {form.errors.password && <p className="mt-1 text-xs text-red-600">{form.errors.password}</p>}
            </div>
            <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                </label>
                <input
                    id="password_confirmation"
                    type="password"
                    value={form.data.password_confirmation}
                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                />
            </div>
            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50 hover:brightness-110 transition-all"
                    style={adminBtnPrimary}
                >
                    {form.processing ? 'Mise a jour...' : 'Changer le mot de passe'}
                </button>
            </div>
        </form>
    );
}
