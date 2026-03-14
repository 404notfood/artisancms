import { Head, router } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/Components/ui/button';
import { Progress } from '@/Components/ui/progress';
import {
    Check,
    Circle,
    Loader2,
    X,
    AlertTriangle,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Step {
    label: string;
    weight: number;
}

interface Props {
    steps: Record<string, Step>;
}

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface StepState {
    key: string;
    label: string;
    weight: number;
    status: StepStatus;
    error?: string;
}

export default function Execute({ steps }: Props) {
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

            // Mark current step as running
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
                        'Accept': 'application/json',
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

                // Mark current step as done
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
    };

    const getStepIcon = (status: StepStatus) => {
        switch (status) {
            case 'done':
                return <Check className="h-5 w-5 text-green-500" />;
            case 'running':
                return <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />;
            case 'error':
                return <X className="h-5 w-5 text-red-500" />;
            default:
                return <Circle className="h-5 w-5 text-gray-300" />;
        }
    };

    return (
        <InstallLayout step={7} totalSteps={7}>
            <Head title="Installation - Exécution" />

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isComplete
                        ? 'Installation terminée !'
                        : overallError
                          ? 'Erreur d\'installation'
                          : 'Installation en cours...'}
                </h1>
                {!isComplete && !overallError && (
                    <p className="mt-2 text-gray-500">
                        Veuillez patienter pendant la configuration de votre CMS.
                    </p>
                )}
            </div>

            {/* Steps list */}
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
                {stepStates.map((step) => (
                    <div
                        key={step.key}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3 transition-colors',
                            step.status === 'running' && 'bg-indigo-50',
                            step.status === 'error' && 'bg-red-50'
                        )}
                    >
                        {getStepIcon(step.status)}
                        <div className="flex-1">
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    step.status === 'done' && 'text-green-700',
                                    step.status === 'running' &&
                                        'text-indigo-700',
                                    step.status === 'error' && 'text-red-700',
                                    step.status === 'pending' && 'text-gray-500'
                                )}
                            >
                                {step.label}
                            </span>
                            {step.error && (
                                <p className="text-xs text-red-600 mt-0.5">
                                    {step.error}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Progression</span>
                    <span className="text-sm font-medium text-gray-700">
                        {progressValue}%
                    </span>
                </div>
                <Progress value={progressValue} />
            </div>

            {/* Error message */}
            {overallError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-700">
                            {overallError}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                            Corrigez le problème puis réessayez l'installation.
                        </p>
                    </div>
                </div>
            )}

            {/* Success / action buttons */}
            {isComplete && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 mb-6">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-green-700">
                        ArtisanCMS a été installé avec succès !
                    </p>
                </div>
            )}

            <div className="flex justify-end">
                {isComplete ? (
                    <Button
                        size="lg"
                        onClick={() =>
                            router.get(route('install.complete'))
                        }
                    >
                        Voir le récapitulatif
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                ) : overallError ? (
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Réessayer
                    </Button>
                ) : null}
            </div>
        </InstallLayout>
    );
}
