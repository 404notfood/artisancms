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

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

    return (
        <>
            <Head title="Inscription" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Creer un compte</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Deja membre ?{' '}
                            <Link href="/members/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Se connecter
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
                            <label className="block text-sm font-medium text-gray-700">Nom</label>
                            <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputClass} required />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputClass} required />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                            <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className={inputClass} required minLength={8} />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                            <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className={inputClass} required />
                        </div>

                        {customFields.map((field) => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700">
                                    {field.name} {field.required && '*'}
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
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Inscription...' : 'S\'inscrire'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
