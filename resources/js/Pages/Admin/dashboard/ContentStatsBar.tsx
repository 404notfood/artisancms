import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import type { DashboardProps } from './types';

export function ContentStatsBar({ contentStats }: { contentStats: DashboardProps['contentStats'] }) {
    const maxVal = Math.max(
        contentStats?.published_pages ?? 0,
        contentStats?.draft_pages ?? 0,
        contentStats?.published_posts ?? 0,
        contentStats?.draft_posts ?? 0,
        1
    );

    const bars = [
        { label: 'Pages publiees', value: contentStats?.published_pages ?? 0, color: 'bg-blue-500' },
        { label: 'Pages brouillon', value: contentStats?.draft_pages ?? 0, color: 'bg-blue-200' },
        { label: 'Articles publies', value: contentStats?.published_posts ?? 0, color: 'bg-emerald-500' },
        { label: 'Articles brouillon', value: contentStats?.draft_posts ?? 0, color: 'bg-emerald-200' },
    ];

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    Statistiques contenu
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {bars.map((bar) => (
                        <div key={bar.label}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">{bar.label}</span>
                                <span className="font-semibold text-gray-900">{bar.value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all', bar.color)}
                                    style={{ width: `${Math.max((bar.value / maxVal) * 100, 2)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
