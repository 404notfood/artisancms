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

    const inputClass = 'mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all focus:border-[var(--color-primary,#6366f1)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary,#6366f1)]/20 focus:outline-none';

    return (
        <>
            <Head title="Connexion" />

            <div className="flex min-h-screen">
                {/* Left decorative panel */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--color-primary,#6366f1)] via-[var(--color-primary,#6366f1)]/90 to-[var(--color-primary,#6366f1)]/70 items-center justify-center p-12">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    </div>
                    <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5" />
                    <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
                    <div className="relative text-center">
                        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl">
                            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white">Bon retour !</h2>
                        <p className="mt-3 max-w-sm text-lg text-white/70">
                            Connectez-vous pour acceder a votre espace membre et toutes vos ressources.
                        </p>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="flex w-full items-center justify-center bg-white px-4 py-12 lg:w-1/2">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Pas encore membre ?{' '}
                                <Link href="/members/auth/register" className="font-semibold text-[var(--color-primary,#6366f1)] hover:opacity-80 transition-opacity">
                                    S'inscrire
                                </Link>
                            </p>
                        </div>

                        {modules.social_login && (
                            <div className="mb-6 space-y-3">
                                {[
                                    { provider: 'google', label: 'Google', bg: 'hover:bg-red-50 hover:border-red-200 hover:text-red-700' },
                                    { provider: 'facebook', label: 'Facebook', bg: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700' },
                                    { provider: 'github', label: 'GitHub', bg: 'hover:bg-gray-100 hover:border-gray-300' },
                                ].map(({ provider, label, bg }) => (
                                    <a
                                        key={provider}
                                        href={`/members/auth/social/${provider}`}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all ${bg}`}
                                    >
                                        Continuer avec {label}
                                    </a>
                                ))}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                                    <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-gray-400">ou par email</span></div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputClass} placeholder="nom@exemple.com" required />
                                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className={inputClass} required />
                                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary,#6366f1)] focus:ring-[var(--color-primary,#6366f1)]" />
                                <span className="text-sm text-gray-600">Se souvenir de moi</span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-[var(--color-primary,#6366f1)] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary,#6366f1)]/25 transition-all hover:shadow-lg hover:shadow-[var(--color-primary,#6366f1)]/30 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {processing ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
