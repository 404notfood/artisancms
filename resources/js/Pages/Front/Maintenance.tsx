import { Head, usePage } from '@inertiajs/react';
import type { MenuData } from '@/types/cms';

interface BrandingData {
    name: string;
    logo: string | null;
    logo_dark: string | null;
    favicon: string | null;
    color_primary: string;
    color_accent: string;
    show_credit: boolean;
    footer_text: string | null;
    css: string;
}

interface MaintenanceProps {
    menus?: Record<string, MenuData>;
    theme?: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
    expectedReturn?: string | null;
    message: string | null;
}

function formatExpectedReturn(dateString: string | null): string | null {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
}

export default function Maintenance({ expectedReturn, message }: MaintenanceProps) {
    const { branding } = usePage().props as { branding?: BrandingData; [key: string]: unknown };
    const formattedReturn = formatExpectedReturn(expectedReturn ?? null);

    return (
        <>
            <Head title="Maintenance en cours" />
            <div
                className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
                style={{
                    '--color-primary': branding?.color_primary || '#3b82f6',
                    '--color-accent': branding?.color_accent || '#8b5cf6',
                } as React.CSSProperties}
            >
                <div className="w-full max-w-lg text-center">
                    {/* Logo / Branding */}
                    {branding?.logo ? (
                        <img
                            src={branding.logo}
                            alt={branding.name || 'Logo'}
                            className="mx-auto mb-8 h-12 w-auto"
                        />
                    ) : (
                        <h2 className="mb-8 text-xl font-bold text-gray-900">
                            {branding?.name || 'ArtisanCMS'}
                        </h2>
                    )}

                    {/* Icon */}
                    <div className="mb-6">
                        <svg
                            className="mx-auto h-24 w-24 text-[var(--color-primary)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
                            />
                        </svg>
                    </div>

                    <h1 className="mb-4 text-3xl font-bold text-gray-900">
                        Site en maintenance
                    </h1>

                    <p className="mb-6 text-lg text-gray-600">
                        {message || 'Nous effectuons actuellement une maintenance. Le site sera de nouveau disponible très bientôt.'}
                    </p>

                    {formattedReturn && (
                        <div className="mb-8 rounded-lg bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Retour prévu le</p>
                            <p className="text-lg font-semibold text-gray-900">{formattedReturn}</p>
                        </div>
                    )}

                    <p className="text-sm text-gray-400">
                        Merci de votre patience.
                    </p>

                    {branding?.show_credit && (
                        <p className="mt-12 text-xs text-gray-400">
                            Propulsé par {branding.name || 'ArtisanCMS'}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
