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
    Info,
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
}

export default function Requirements({ requirements, allPassed }: Props) {
    const [refreshing, setRefreshing] = useState(false);

    const requiredItems = Object.entries(requirements).filter(
        ([, req]) => req.required
    );
    const recommendedItems = Object.entries(requirements).filter(
        ([, req]) => !req.required
    );

    const passedCount = Object.values(requirements).filter((r) => r.passed).length;
    const totalCount = Object.values(requirements).length;

    const handleRefresh = () => {
        setRefreshing(true);
        router.reload({
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <InstallLayout step={3}>
            <Head title="Installation - Compatibilité" />

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-xl',
                                allPassed ? 'bg-green-100' : 'bg-amber-100'
                            )}>
                                <ShieldCheck className={cn(
                                    'h-6 w-6',
                                    allPassed ? 'text-green-600' : 'text-amber-600'
                                )} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">
                                    Compatibilité du système
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {passedCount}/{totalCount} vérifications réussies
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
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
                </div>

                <div className="p-8 space-y-6">
                    {/* Status summary */}
                    {allPassed ? (
                        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                <Check className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-green-800">
                                    Votre serveur est compatible
                                </p>
                                <p className="text-xs text-green-600">
                                    Tous les prérequis obligatoires sont satisfaits.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                <X className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    Certains prérequis ne sont pas satisfaits
                                </p>
                                <p className="text-xs text-red-600">
                                    Corrigez les éléments en rouge avant de continuer.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Required items */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-600">!</span>
                            Obligatoire
                        </h2>
                        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                            {requiredItems.map(([key, req]) => (
                                <div
                                    key={key}
                                    className={cn(
                                        'flex items-center justify-between px-4 py-3 transition-colors',
                                        !req.passed && 'bg-red-50/50'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-full',
                                            req.passed ? 'bg-green-100' : 'bg-red-100'
                                        )}>
                                            {req.passed ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <X className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <span className={cn(
                                                'text-sm font-medium',
                                                req.passed ? 'text-slate-700' : 'text-red-700'
                                            )}>
                                                {req.label}
                                            </span>
                                            {!req.passed && req.message && (
                                                <p className="text-xs text-red-500 mt-0.5">
                                                    {req.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={cn(
                                        'text-xs font-mono px-2 py-1 rounded',
                                        req.passed
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                    )}>
                                        {req.current}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommended items */}
                    {recommendedItems.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4 text-slate-400" />
                                Recommandé
                            </h2>
                            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                {recommendedItems.map(([key, req]) => (
                                    <div
                                        key={key}
                                        className={cn(
                                            'flex items-center justify-between px-4 py-3 transition-colors',
                                            !req.passed && 'bg-amber-50/50'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'flex h-7 w-7 items-center justify-center rounded-full',
                                                req.passed ? 'bg-green-100' : 'bg-amber-100'
                                            )}>
                                                {req.passed ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                )}
                                            </div>
                                            <div>
                                                <span className={cn(
                                                    'text-sm font-medium',
                                                    req.passed ? 'text-slate-700' : 'text-amber-700'
                                                )}>
                                                    {req.label}
                                                </span>
                                                {!req.passed && req.message && (
                                                    <p className="text-xs text-amber-500 mt-0.5">
                                                        {req.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            'text-xs font-mono px-2 py-1 rounded',
                                            req.passed
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-amber-50 text-amber-700'
                                        )}>
                                            {req.current}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => router.get(route('install.license'))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Retour
                        </Button>
                        <Button
                            onClick={() => router.get(route('install.database'))}
                            disabled={!allPassed}
                            size="lg"
                        >
                            Continuer
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </InstallLayout>
    );
}
