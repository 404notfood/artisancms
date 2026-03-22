import { Head, router } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/Components/ui/button';
import {
    Check,
    Circle,
    Loader2,
    X,
    AlertTriangle,
    Rocket,
    PartyPopper,
    ExternalLink,
    LayoutDashboard,
    Globe,
    Mail,
    Palette,
    Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Step {
    label: string;
    weight: number;
}

interface Props {
    steps: Record<string, Step>;
    siteName?: string;
    siteUrl?: string;
    adminEmail?: string;
    version?: string;
}

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface StepState {
    key: string;
    label: string;
    weight: number;
    status: StepStatus;
    error?: string;
}

export default function Execute({ steps, siteName, siteUrl, adminEmail, version }: Props) {
    const [stepStates, setStepStates] = useState<StepState[]>(() =>
        Object.entries(steps).map(([key, step]) => ({
            key,
            label: step.label,
            weight: step.weight,
            status: 'pending' as StepStatus,
        }))
    );
    const [overallError, setOverallError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const hasStarted = useRef(false);

    const totalWeight = stepStates.reduce((sum, s) => sum + s.weight, 0);
    const completedWeight = stepStates
        .filter((s) => s.status === 'done')
        .reduce((sum, s) => sum + s.weight, 0);
    const runningWeight = stepStates
        .filter((s) => s.status === 'running')
        .reduce((sum, s) => sum + s.weight * 0.5, 0);
    const progressValue = Math.round(
        ((completedWeight + runningWeight) / totalWeight) * 100
    );

    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        runInstallation();
    }, []);

    const runInstallation = async () => {
        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

        const stepKeys = Object.keys(steps);

        for (let i = 0; i < stepKeys.length; i++) {
            const currentKey = stepKeys[i];

            setStepStates((prev) =>
                prev.map((s) =>
                    s.key === currentKey ? { ...s, status: 'running' } : s
                )
            );

            try {
                const response = await fetch(route('install.execute.run'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({ step: currentKey }),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    setStepStates((prev) =>
                        prev.map((s) =>
                            s.key === currentKey
                                ? {
                                      ...s,
                                      status: 'error',
                                      error:
                                          result.message ||
                                          'Une erreur est survenue.',
                                  }
                                : s
                        )
                    );
                    setOverallError(
                        result.message ||
                            `Erreur lors de l'étape "${steps[currentKey].label}".`
                    );
                    return;
                }

                setStepStates((prev) =>
                    prev.map((s) =>
                        s.key === currentKey ? { ...s, status: 'done' } : s
                    )
                );
            } catch {
                setStepStates((prev) =>
                    prev.map((s) =>
                        s.key === currentKey
                            ? {
                                  ...s,
                                  status: 'error',
                                  error: 'Erreur réseau.',
                              }
                            : s
                    )
                );
                setOverallError(
                    'Une erreur réseau est survenue. Vérifiez votre connexion.'
                );
                return;
            }
        }

        setIsComplete(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    };

    const getStepIcon = (status: StepStatus) => {
        switch (status) {
            case 'done':
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                    </div>
                );
            case 'running':
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                        <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                    </div>
                );
            case 'error':
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                        <X className="h-4 w-4 text-red-600" />
                    </div>
                );
            default:
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                        <Circle className="h-4 w-4 text-slate-300" />
                    </div>
                );
        }
    };

    // Success view
    if (isComplete) {
        return (
            <InstallLayout step={6} hideProgress>
                <Head title="Installation terminée !" />

                {/* Confetti animation */}
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute animate-confetti"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`,
                                }}
                            >
                                <div
                                    className="h-3 w-2 rounded-sm"
                                    style={{
                                        backgroundColor: [
                                            '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
                                            '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
                                        ][Math.floor(Math.random() * 8)],
                                        transform: `rotate(${Math.random() * 360}deg)`,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Success hero */}
                    <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 px-8 py-12 text-center text-white">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                            <PartyPopper className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Félicitations !
                        </h1>
                        <p className="mt-2 text-green-100 text-lg">
                            ArtisanCMS a été installé avec succès.
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Summary */}
                        <div className="rounded-lg border border-slate-200 overflow-hidden mb-6">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Récapitulatif
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-600">Site</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-900">
                                        {siteName || 'ArtisanCMS'}
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ExternalLink className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-600">URL</span>
                                    </div>
                                    <span className="text-sm font-medium text-indigo-600">
                                        {siteUrl || window.location.origin}
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-600">Admin</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-900">
                                        {adminEmail || ''}
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-600">Version</span>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        v{version || '1.0.0'}
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Palette className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-600">Thème</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-900">
                                        Default Theme
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    Notez votre mot de passe administrateur !
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Il ne sera plus affiché après cette page. Conservez-le en lieu sûr.
                                </p>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            <a
                                href="/admin"
                                className="flex items-center gap-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 px-4 py-4 transition-all hover:border-indigo-300 hover:bg-indigo-100 group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white group-hover:bg-indigo-600 transition-colors">
                                    <LayoutDashboard className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-indigo-700">
                                        Tableau de bord
                                    </p>
                                    <p className="text-xs text-indigo-500">
                                        Gérer votre site
                                    </p>
                                </div>
                            </a>
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-4 transition-all hover:border-slate-300 hover:bg-slate-100 group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500 text-white group-hover:bg-slate-600 transition-colors">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">
                                        Voir le site
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Visiter votre site
                                    </p>
                                </div>
                            </a>
                        </div>

                        {/* Next steps */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                Prochaines étapes
                            </h3>
                            <ol className="space-y-2">
                                {[
                                    'Personnalisez votre thème dans Apparence',
                                    'Créez vos premières pages avec le Page Builder',
                                    'Configurez vos menus de navigation',
                                    'Installez des plugins pour étendre les fonctionnalités',
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 mt-0.5">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Confetti CSS */}
                <style>{`
                    @keyframes confetti-fall {
                        0% {
                            transform: translateY(-100vh) rotate(0deg);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(100vh) rotate(720deg);
                            opacity: 0;
                        }
                    }
                    .animate-confetti {
                        animation: confetti-fall linear forwards;
                    }
                `}</style>
            </InstallLayout>
        );
    }

    // Installation in progress view
    return (
        <InstallLayout step={6}>
            <Head title="Installation en cours..." />

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl',
                            overallError ? 'bg-red-100' : 'bg-indigo-100'
                        )}>
                            {overallError ? (
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            ) : (
                                <Rocket className="h-6 w-6 text-indigo-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {overallError
                                    ? "Erreur d'installation"
                                    : 'Installation en cours...'}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {overallError
                                    ? 'Un problème est survenu.'
                                    : 'Veuillez patienter, cela ne prendra que quelques instants.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Progress bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">
                                Progression
                            </span>
                            <span className="text-sm font-bold text-indigo-600">
                                {progressValue}%
                            </span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-500 ease-out',
                                    overallError
                                        ? 'bg-red-500'
                                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                                )}
                                style={{ width: `${progressValue}%` }}
                            />
                        </div>
                    </div>

                    {/* Steps list */}
                    <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                        {stepStates.map((step) => (
                            <div
                                key={step.key}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 transition-all duration-300',
                                    step.status === 'running' && 'bg-indigo-50/50',
                                    step.status === 'error' && 'bg-red-50/50'
                                )}
                            >
                                {getStepIcon(step.status)}
                                <div className="flex-1 min-w-0">
                                    <span
                                        className={cn(
                                            'text-sm font-medium',
                                            step.status === 'done' && 'text-green-700',
                                            step.status === 'running' && 'text-indigo-700',
                                            step.status === 'error' && 'text-red-700',
                                            step.status === 'pending' && 'text-slate-400'
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                    {step.error && (
                                        <p className="text-xs text-red-500 mt-0.5 truncate">
                                            {step.error}
                                        </p>
                                    )}
                                </div>
                                {step.status === 'done' && (
                                    <span className="text-xs text-green-500 font-medium">OK</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Error message */}
                    {overallError && (
                        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    {overallError}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    Corrigez le problème puis réessayez.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with retry */}
                {overallError && (
                    <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Réessayer l'installation
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </InstallLayout>
    );
}
