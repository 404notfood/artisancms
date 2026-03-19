import { Head, Link, useForm } from '@inertiajs/react';

interface CustomField {
    id: number;
    name: string;
    slug: string;
    type: string;
    options: string[] | null;
    placeholder: string | null;
    required: boolean;
}

interface RegisterProps {
    customFields: CustomField[];
    modules: { social_login: boolean };
}

export default function Register({ customFields, modules }: RegisterProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        custom_fields: {} as Record<number, string>,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/members/auth/register');
    }

    const inputClass = 'mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all focus:border-[var(--color-primary,#6366f1)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary,#6366f1)]/20 focus:outline-none';

    return (
        <>
            <Head title="Inscription" />

            <div className="flex min-h-screen">
                {/* Left decorative panel */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--color-primary,#6366f1)]/90 via-[var(--color-primary,#6366f1)] to-[var(--color-primary,#6366f1)]/80 items-center justify-center p-12">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    </div>
                    <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5" />
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
                    <div className="relative text-center">
                        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl">
                            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white">Rejoignez-nous !</h2>
                        <p className="mt-3 max-w-sm text-lg text-white/70">
                            Creez votre compte gratuit et accedez a notre communaute de membres.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            {['Profil personnalise', 'Annuaire membres', 'Contenu exclusif'].map(feature => (
                                <span key={feature} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="flex w-full items-center justify-center bg-white px-4 py-12 lg:w-1/2">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Creer un compte</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Deja membre ?{' '}
                                <Link href="/members/auth/login" className="font-semibold text-[var(--color-primary,#6366f1)] hover:opacity-80 transition-opacity">
                                    Se connecter
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
                                <label className="block text-sm font-medium text-gray-700">Nom</label>
                                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputClass} required />
                                {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputClass} placeholder="nom@exemple.com" required />
                                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className={inputClass} required minLength={8} />
                                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                                <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className={inputClass} required />
                            </div>

                            {customFields.map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {field.name} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                                        value={data.custom_fields[field.id] || ''}
                                        onChange={(e) => setData('custom_fields', { ...data.custom_fields, [field.id]: e.target.value })}
                                        className={inputClass}
                                        placeholder={field.placeholder || ''}
                                        required={field.required}
                                    />
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-[var(--color-primary,#6366f1)] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary,#6366f1)]/25 transition-all hover:shadow-lg hover:shadow-[var(--color-primary,#6366f1)]/30 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {processing ? 'Inscription...' : 'S\'inscrire'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
