import InputError from '@/Components/InputError';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';

interface BrandingData {
    name?: string;
    logo?: string | null;
    logo_dark?: string | null;
    color_primary?: string;
    color_accent?: string;
    login_bg?: string | null;
    login_message?: string | null;
    show_credit?: boolean;
}

/**
 * Compute a slightly darker shade of a hex color for hover states.
 */
function darkenHex(hex: string, amount = 15): string {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
    const b = Math.max(0, (num & 0x0000ff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { branding } = usePage().props as { branding?: BrandingData; [key: string]: unknown };

    const siteName = branding?.name || 'ArtisanCMS';
    const colorPrimary = branding?.color_primary || '#4f46e5';
    const colorAccent = branding?.color_accent || '#7c3aed';
    const logo = branding?.logo;
    const logoDark = branding?.logo_dark;
    const loginBg = branding?.login_bg;
    const loginMessage = branding?.login_message;
    const showCredit = branding?.show_credit !== false;

    const colorPrimaryHover = useMemo(() => darkenHex(colorPrimary, 20), [colorPrimary]);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const cssVars = {
        '--login-primary': colorPrimary,
        '--login-primary-hover': colorPrimaryHover,
        '--login-accent': colorAccent,
    } as React.CSSProperties;

    return (
        <>
            <Head title="Connexion" />
            <div className="flex min-h-screen" style={cssVars}>
                {/* Left panel - branding */}
                <div
                    className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                    style={loginBg ? {
                        backgroundImage: `url(${loginBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    } : {
                        background: `linear-gradient(135deg, ${colorPrimary} 0%, ${colorAccent} 100%)`,
                    }}
                >
                    {/* Overlay for background images */}
                    {loginBg && (
                        <div
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(135deg, ${colorPrimary}cc 0%, ${colorAccent}cc 100%)` }}
                        />
                    )}

                    {/* Decorative shapes */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-white/5" />
                        <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-white/5" />
                        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-white/5" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full border border-white/10" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full border border-white/10" />
                    </div>

                    <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                        {/* Logo / brand */}
                        <div className="mb-12">
                            {logoDark ? (
                                <img src={logoDark} alt={siteName} className="h-12 w-auto" />
                            ) : logo ? (
                                <img src={logo} alt={siteName} className="h-12 w-auto brightness-0 invert" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-xl font-bold">
                                        {siteName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-2xl font-bold tracking-tight">{siteName}</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl font-bold leading-tight mb-4">
                            {loginMessage || (
                                <>Votre espace<br />d'administration</>
                            )}
                        </h1>
                        {!loginMessage && (
                            <p className="text-lg text-white/70 max-w-md">
                                Gerez votre contenu, personnalisez votre site et suivez vos performances depuis un seul endroit.
                            </p>
                        )}

                        <div className="mt-16 space-y-5">
                            <FeatureItem
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />}
                                title="Page Builder visuel"
                                desc="Glissez-deposez vos blocs sans coder"
                            />
                            <FeatureItem
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />}
                                title="Themes personnalisables"
                                desc="Adaptez le design a votre image"
                            />
                            <FeatureItem
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />}
                                title="Ultra performant"
                                desc="Optimise pour la vitesse et le SEO"
                            />
                        </div>
                    </div>
                </div>

                {/* Right panel - login form */}
                <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 bg-gray-50">
                    <div className="mx-auto w-full max-w-sm">
                        {/* Mobile logo */}
                        <div className="mb-10 lg:hidden">
                            {logo ? (
                                <img src={logo} alt={siteName} className="h-10 w-auto" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white text-lg font-bold"
                                        style={{ backgroundColor: colorPrimary }}
                                    >
                                        {siteName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">{siteName}</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Connectez-vous a votre espace d'administration
                            </p>
                        </div>

                        {status && (
                            <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Adresse email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2"
                                    style={{ '--tw-ring-color': `${colorPrimary}33`, borderColor: undefined } as React.CSSProperties}
                                    onFocus={(e) => { e.target.style.borderColor = colorPrimary; }}
                                    onBlur={(e) => { e.target.style.borderColor = ''; }}
                                    placeholder="vous@exemple.com"
                                />
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Mot de passe
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs font-medium transition-colors"
                                            style={{ color: colorPrimary }}
                                        >
                                            Mot de passe oublie ?
                                        </Link>
                                    )}
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2"
                                    style={{ '--tw-ring-color': `${colorPrimary}33` } as React.CSSProperties}
                                    onFocus={(e) => { e.target.style.borderColor = colorPrimary; }}
                                    onBlur={(e) => { e.target.style.borderColor = ''; }}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} className="mt-1.5" />
                            </div>

                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked as false)}
                                    className="h-4 w-4 rounded border-gray-300 transition-colors"
                                    style={{ accentColor: colorPrimary }}
                                />
                                <span className="text-sm text-gray-600">Se souvenir de moi</span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: colorPrimary,
                                    '--tw-ring-color': colorPrimary,
                                } as React.CSSProperties}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = colorPrimaryHover; }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = colorPrimary; }}
                            >
                                {processing ? (
                                    <>
                                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Connexion en cours...
                                    </>
                                ) : (
                                    'Se connecter'
                                )}
                            </button>
                        </form>

                        {showCredit && (
                            <p className="mt-8 text-center text-xs text-gray-400">
                                Propulse par {siteName}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    {icon}
                </svg>
            </div>
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-white/60">{desc}</p>
            </div>
        </div>
    );
}
