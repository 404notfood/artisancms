import { Head, useForm } from '@inertiajs/react';

export default function TwoFactor() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/members/auth/two-factor');
    }

    return (
        <>
            <Head title="Verification 2FA" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-sm">
                    <div className="rounded-xl border border-gray-200 bg-white p-8">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary,#6366f1)]/10">
                                <svg className="h-6 w-6 text-[var(--color-primary,#6366f1)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Verification en deux etapes</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Entrez le code depuis votre application d'authentification ou un code de recuperation.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="Code a 6 chiffres ou code de recuperation"
                                className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-lg tracking-widest focus:border-[var(--color-primary,#6366f1)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#6366f1)]"
                                autoFocus
                                required
                            />
                            {errors.code && <p className="text-sm text-red-600 text-center">{errors.code}</p>}

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-lg bg-[var(--color-primary,#6366f1)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                                {processing ? 'Verification...' : 'Verifier'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
