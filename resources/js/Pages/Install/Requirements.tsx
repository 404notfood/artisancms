import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    X,
    AlertTriangle,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Requirement {
    label: string;
    required: boolean;
    passed: boolean;
    current: string;
    message: string;
}

interface Props {
    requirements: Record<string, Requirement>;
    allPassed: boolean;
    stack: string;
}

export default function Requirements({ requirements, allPassed, stack }: Props) {
    const [refreshing, setRefreshing] = useState(false);

    const requiredItems = Object.entries(requirements).filter(
        ([, req]) => req.required
    );
    const recommendedItems = Object.entries(requirements).filter(
        ([, req]) => !req.required
    );

    const handleRefresh = () => {
        setRefreshing(true);
        router.reload({
            onFinish: () => setRefreshing(false),
        });
    };

    const handleContinue = () => {
        router.get(route('install.database'));
    };

    return (
        <InstallLayout step={3} totalSteps={7}>
            <Head title="Installation - Prérequis" />

            <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                    <ShieldCheck className="h-7 w-7 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Vérification des prérequis
                </h1>
                <p className="mt-2 text-gray-500">
                    Vérification de votre environnement pour le stack{' '}
                    <span className="font-medium text-gray-700">
                        {stack === 'laravel' ? 'Laravel + React' : 'Next.js'}
                    </span>
                </p>
            </div>

            {/* Required items */}
            <div className="space-y-1 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Obligatoire
                </h2>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {requiredItems.map(([key, req]) => (
                        <div
                            key={key}
                            className={cn(
                                'flex items-center justify-between px-4 py-3',
                                !req.passed && 'bg-red-50'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {req.passed ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                    <X className="h-5 w-5 text-red-500" />
                                )}
                                <div>
                                    <span
                                        className={cn(
                                            'text-sm font-medium',
                                            req.passed
                                                ? 'text-gray-700'
                                                : 'text-red-700'
                                        )}
                                    >
                                        {req.label}
                                    </span>
                                    {!req.passed && (
                                        <p className="text-xs text-red-600 mt-0.5">
                                            {req.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">
                                {req.current}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommended items */}
            {recommendedItems.length > 0 && (
                <div className="space-y-1 mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                        Recommandé
                    </h2>
                    <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                        {recommendedItems.map(([key, req]) => (
                            <div
                                key={key}
                                className={cn(
                                    'flex items-center justify-between px-4 py-3',
                                    !req.passed && 'bg-yellow-50'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {req.passed ? (
                                        <Check className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    )}
                                    <div>
                                        <span
                                            className={cn(
                                                'text-sm font-medium',
                                                req.passed
                                                    ? 'text-gray-700'
                                                    : 'text-yellow-700'
                                            )}
                                        >
                                            {req.label}
                                        </span>
                                        {!req.passed && (
                                            <p className="text-xs text-yellow-600 mt-0.5">
                                                {req.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {req.current}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status summary */}
            {allPassed ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 mb-6">
                    <Check className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-sm font-medium text-green-700">
                        Tous les prérequis obligatoires sont satisfaits.
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 mb-6">
                    <X className="h-5 w-5 text-red-600 shrink-0" />
                    <p className="text-sm font-medium text-red-700">
                        Certains prérequis obligatoires ne sont pas satisfaits. Corrigez-les avant de continuer.
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.get(route('install.stack'))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Retour
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            className={cn(
                                'h-4 w-4',
                                refreshing && 'animate-spin'
                            )}
                        />
                        Revérifier
                    </Button>
                </div>
                <Button
                    onClick={handleContinue}
                    disabled={!allPassed}
                    size="lg"
                >
                    Continuer
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </InstallLayout>
    );
}
