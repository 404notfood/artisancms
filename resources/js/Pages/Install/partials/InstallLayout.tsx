import { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface InstallLayoutProps {
    step: number;
    totalSteps: number;
    hideProgress?: boolean;
}

const stepLabels: Record<number, string> = {
    1: 'Stack',
    2: 'Langue',
    3: 'Prérequis',
    4: 'Base de données',
    5: 'Site',
    6: 'Admin',
    7: 'Installation',
};

export default function InstallLayout({
    step,
    totalSteps,
    hideProgress = false,
    children,
}: PropsWithChildren<InstallLayoutProps>) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8 sm:py-12">
            {/* Branding */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Artisan<span className="text-indigo-600">CMS</span>
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Système d'installation
                </p>
            </div>

            {/* Progress indicator */}
            {!hideProgress && (
                <div className="mb-8 w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Étape {step}/{totalSteps}
                        </span>
                        <span className="text-xs text-gray-400">
                            {stepLabels[step]}
                        </span>
                    </div>
                    <div className="flex gap-1.5">
                        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
                            (s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        'h-1.5 flex-1 rounded-full transition-colors',
                                        s < step
                                            ? 'bg-indigo-600'
                                            : s === step
                                              ? 'bg-indigo-500'
                                              : 'bg-gray-200'
                                    )}
                                />
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Card container */}
            <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                {children}
            </div>

            {/* Footer */}
            <p className="mt-6 text-xs text-gray-400">
                ArtisanCMS &mdash; Installation
            </p>
        </div>
    );
}
