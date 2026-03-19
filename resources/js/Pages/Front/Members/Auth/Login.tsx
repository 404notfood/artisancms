import { Head, Link, useForm } from '@inertiajs/react';

interface LoginProps {
    modules: { social_login: boolean };
}

export default function Login({ modules }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/members/auth/login');
    }

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

    return (
        <>
            <Head title="Connexion" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Pas encore membre ?{' '}
                            <Link href="/members/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                S'inscrire
                            </Link>
                        </p>
                    </div>

                    {modules.social_login && (
                        <div className="mb-6 space-y-3">
                            {['google', 'facebook', 'github'].map((provider) => (
                                <a
                                    key={provider}
                                    href={`/members/auth/social/${provider}`}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Continuer avec {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                </a>
                            ))}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                                <div className="relative flex justify-center"><span className="bg-gray-50 px-3 text-sm text-gray-500">ou</span></div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputClass} required />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                            <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className={inputClass} required />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-600">Se souvenir de moi</span>
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
