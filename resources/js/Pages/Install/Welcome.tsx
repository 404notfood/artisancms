import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Language {
    code: string;
    name: string;
    flag: string;
}

interface Props {
    languages: Language[];
    currentLocale: string;
}

export default function Welcome({ languages, currentLocale }: Props) {
    const { data, setData, post, processing } = useForm({
        locale: currentLocale || 'fr',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('install.welcome.store'));
    };

    return (
        <InstallLayout step={1}>
            <Head title="Installation - Bienvenue" />

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Hero section */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-8 py-12 text-center text-white">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Bienvenue sur ArtisanCMS
                    </h1>
                    <p className="mt-3 text-indigo-100 max-w-md mx-auto">
                        Creez votre site web en quelques minutes, sans aucune connaissance technique.
                    </p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Features preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-2xl font-bold text-indigo-600 mb-1">2 min</div>
                            <p className="text-xs text-slate-500">Et votre site est en ligne</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-2xl font-bold text-indigo-600 mb-1">Glisser</div>
                            <p className="text-xs text-slate-500">Deposer, c'est tout</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-2xl font-bold text-indigo-600 mb-1">Votre</div>
                            <p className="text-xs text-slate-500">Style, vos couleurs</p>
                        </div>
                    </div>

                    {/* Language selection */}
                    <form onSubmit={submit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                Choisissez votre langue / Choose your language
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => setData('locale', lang.code)}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all duration-200',
                                            data.locale === lang.code
                                                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        )}
                                    >
                                        <span className="text-2xl">{lang.flag}</span>
                                        <div>
                                            <p className={cn(
                                                'text-sm font-medium',
                                                data.locale === lang.code ? 'text-indigo-700' : 'text-slate-700'
                                            )}>
                                                {lang.name}
                                            </p>
                                            <p className="text-xs text-slate-400">({lang.code})</p>
                                        </div>
                                        {data.locale === lang.code && (
                                            <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing} size="lg" className="px-8">
                                Commencer l'installation
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </InstallLayout>
    );
}
