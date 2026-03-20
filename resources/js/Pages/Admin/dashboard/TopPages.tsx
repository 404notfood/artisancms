import { Link , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { DashboardProps } from './types';

export function TopPages({ analytics }: { analytics: DashboardProps['analytics'] }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    Pages populaires
                </CardTitle>
                <Link
                    href="/admin/analytics"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                    Voir tout
                </Link>
            </CardHeader>
            <CardContent>
                {analytics?.top_pages && analytics.top_pages.length > 0 ? (
                    <div className="space-y-2">
                        {analytics.top_pages.map((page, index) => (
                            <div
                                key={page.path}
                                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-900 truncate">
                                        {page.path || '/'}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-600 shrink-0 ml-4">
                                    {Number(page.total).toLocaleString('fr-FR')} vues
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <BarChart3 className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Aucune donnee analytique disponible.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
