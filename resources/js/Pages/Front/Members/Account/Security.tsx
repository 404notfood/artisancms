import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface SecurityProps {
    twoFactorEnabled: boolean;
    recoveryCodes: string[];
}

export default function Security({ twoFactorEnabled, recoveryCodes }: SecurityProps) {
    const flash = usePage().props.flash as { '2fa_setup'?: { secret: string; qr_url: string; recovery_codes: string[] }; recovery_codes?: string[]; success?: string } | undefined;
    const setup = flash?.['2fa_setup'] ?? null;
    const newCodes = flash?.recovery_codes ?? null;

    const enableForm = useForm({});
    const confirmForm = useForm({ code: '' });
    const disableForm = useForm({ password: '' });

    const [showDisable, setShowDisable] = useState(false);

    function handleEnable(e: React.FormEvent) {
        e.preventDefault();
        enableForm.post('/members/account/security/2fa/enable');
    }

    function handleConfirm(e: React.FormEvent) {
        e.preventDefault();
        confirmForm.post('/members/account/security/2fa/confirm');
    }

    function handleDisable(e: React.FormEvent) {
        e.preventDefault();
        disableForm.post('/members/account/security/2fa/disable');
    }

    return (
        <>
            <Head title="Securite" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <h1 className="mb-8 text-2xl font-bold text-gray-900">Securite</h1>

                {flash?.success && (
                    <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                {/* 2FA Section */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Authentification a deux facteurs</h2>
                            <p className="text-sm text-gray-500">
                                {twoFactorEnabled ? 'Active - votre compte est securise' : 'Protegez votre compte avec un code TOTP'}
                            </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {twoFactorEnabled ? 'Active' : 'Desactive'}
                        </span>
                    </div>

                    {!twoFactorEnabled && !setup && (
                        <form onSubmit={handleEnable}>
                            <button
                                type="submit"
                                disabled={enableForm.processing}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Activer la 2FA
                            </button>
                        </form>
                    )}

                    {/* Setup flow */}
                    {setup && (
                        <div className="mt-4 space-y-4">
                            <p className="text-sm text-gray-600">
                                Scannez ce QR code avec Google Authenticator, puis entrez le code pour confirmer.
                            </p>
                            <div className="flex justify-center">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.qr_url)}`} alt="QR Code" className="rounded-lg" />
                            </div>
                            <p className="text-center text-xs text-gray-500">
                                Code secret : <code className="rounded bg-gray-100 px-2 py-0.5 text-sm">{setup.secret}</code>
                            </p>
                            <form onSubmit={handleConfirm} className="flex gap-3">
                                <input
                                    type="text"
                                    value={confirmForm.data.code}
                                    onChange={(e) => confirmForm.setData('code', e.target.value)}
                                    placeholder="Code a 6 chiffres"
                                    maxLength={6}
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={confirmForm.processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Confirmer
                                </button>
                            </form>
                            {confirmForm.errors.code && <p className="text-sm text-red-600">{confirmForm.errors.code}</p>}
                        </div>
                    )}

                    {/* Recovery codes */}
                    {twoFactorEnabled && (recoveryCodes.length > 0 || newCodes) && (
                        <div className="mt-4">
                            <h3 className="mb-2 text-sm font-medium text-gray-700">Codes de recuperation</h3>
                            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-4">
                                {(newCodes || recoveryCodes).map((code, i) => (
                                    <code key={i} className="text-sm text-gray-700">{code}</code>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Conservez ces codes en lieu sur. Chacun ne peut etre utilise qu'une fois.</p>
                        </div>
                    )}

                    {/* Disable */}
                    {twoFactorEnabled && (
                        <div className="mt-6 border-t border-gray-200 pt-4">
                            {!showDisable ? (
                                <button
                                    onClick={() => setShowDisable(true)}
                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                    Desactiver la 2FA
                                </button>
                            ) : (
                                <form onSubmit={handleDisable} className="space-y-3">
                                    <p className="text-sm text-gray-600">Entrez votre mot de passe pour confirmer.</p>
                                    <input
                                        type="password"
                                        value={disableForm.data.password}
                                        onChange={(e) => disableForm.setData('password', e.target.value)}
                                        placeholder="Mot de passe"
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                        required
                                    />
                                    {disableForm.errors.password && <p className="text-sm text-red-600">{disableForm.errors.password}</p>}
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={disableForm.processing}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                        >
                                            Confirmer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDisable(false)}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
