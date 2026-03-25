import { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { Check, Globe, ScrollText, ShieldCheck, Database, Settings, Rocket } from 'lucide-react';

interface InstallLayoutProps {
    step: number;
    totalSteps?: number;
    hideProgress?: boolean;
}

const steps = [
    { number: 1, label: 'Bienvenue', icon: Globe },
    { number: 2, label: 'Licence', icon: ScrollText },
    { number: 3, label: 'Votre serveur', icon: ShieldCheck },
    { number: 4, label: 'Connexion DB', icon: Database },
    { number: 5, label: 'Votre site', icon: Settings },
    { number: 6, label: 'C\'est parti !', icon: Rocket },
];

export default function InstallLayout({
    step,
    hideProgress = false,
    children,
}: PropsWithChildren<InstallLayoutProps>) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            {!hideProgress && (
                <aside className="hidden lg:flex w-72 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
                    {/* Logo */}
                    <div className="px-6 pt-8 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                                <span className="text-lg font-bold text-white">A</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight">
                                    Artisan<span className="text-indigo-400">CMS</span>
                                </h1>
                                <p className="text-xs text-slate-400">Installation</p>
                            </div>
                        </div>
                    </div>

                    {/* Stepper */}
                    <nav className="flex-1 px-6 py-4">
                        <ol className="relative space-y-2">
                            {steps.map((s, index) => {
                                const isCompleted = s.number < step;
                                const isCurrent = s.number === step;
                                const isPending = s.number > step;
                                const Icon = s.icon;

                                return (
                                    <li key={s.number} className="relative">
                                        {/* Connector line */}
                                        {index < steps.length - 1 && (
                                            <div
                                                className={cn(
                                                    'absolute left-5 top-12 h-[calc(100%)] w-0.5 -translate-x-1/2',
                                                    isCompleted ? 'bg-indigo-400' : 'bg-slate-700'
                                                )}
                                            />
                                        )}

                                        <div
                                            className={cn(
                                                'relative flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200',
                                                isCurrent && 'bg-white/10',
                                                isPending && 'opacity-50'
                                            )}
                                        >
                                            {/* Step indicator */}
                                            <div
                                                className={cn(
                                                    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                                                    isCompleted && 'border-indigo-400 bg-indigo-500',
                                                    isCurrent && 'border-indigo-400 bg-indigo-500 ring-4 ring-indigo-500/20',
                                                    isPending && 'border-slate-600 bg-slate-800'
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5 text-white" />
                                                ) : (
                                                    <Icon className={cn(
                                                        'h-5 w-5',
                                                        isCurrent ? 'text-white' : 'text-slate-500'
                                                    )} />
                                                )}
                                            </div>

                                            {/* Label */}
                                            <div>
                                                <p className={cn(
                                                    'text-xs font-medium uppercase tracking-wider',
                                                    isCurrent ? 'text-indigo-300' : 'text-slate-500'
                                                )}>
                                                    Étape {s.number}
                                                </p>
                                                <p className={cn(
                                                    'text-sm font-medium',
                                                    isCompleted && 'text-slate-300',
                                                    isCurrent && 'text-white',
                                                    isPending && 'text-slate-500'
                                                )}>
                                                    {s.label}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>

                    {/* Footer sidebar */}
                    <div className="px-6 pb-6">
                        <div className="rounded-lg bg-white/5 px-4 py-3">
                            <p className="text-xs text-slate-400">
                                Version {import.meta.env.VITE_CMS_VERSION || '1.0.0'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                © {new Date().getFullYear()} ArtisanCMS
                            </p>
                        </div>
                    </div>
                </aside>
            )}

            {/* Main content */}
            <main className="flex-1 flex flex-col">
                {/* Mobile header */}
                <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                                <span className="text-sm font-bold text-white">A</span>
                            </div>
                            <span className="font-bold text-slate-900">
                                Artisan<span className="text-indigo-600">CMS</span>
                            </span>
                        </div>
                        {!hideProgress && (
                            <span className="text-sm text-slate-500">
                                Étape {step}/{steps.length}
                            </span>
                        )}
                    </div>

                    {/* Mobile progress bar */}
                    {!hideProgress && (
                        <div className="mt-3 flex gap-1">
                            {steps.map((s) => (
                                <div
                                    key={s.number}
                                    className={cn(
                                        'h-1.5 flex-1 rounded-full transition-all duration-300',
                                        s.number < step
                                            ? 'bg-indigo-500'
                                            : s.number === step
                                              ? 'bg-indigo-400'
                                              : 'bg-slate-200'
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Content area */}
                <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12 overflow-y-auto">
                    <div className="w-full max-w-2xl">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
