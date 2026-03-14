import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { TrendingUp, Users, Eye, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';

interface DailyData {
    date: string;
    views: number;
    unique_visitors: number;
}

interface TopPage {
    path: string;
    views: number;
    unique_visitors: number;
}

interface TopReferrer {
    referrer: string;
    count: number;
}

interface DeviceBreakdown {
    device_type: string;
    count: number;
}

interface Overview {
    total_views: number;
    unique_visitors: number;
    top_pages: TopPage[];
    top_referrers: TopReferrer[];
    device_breakdown: DeviceBreakdown[];
    views_over_time: DailyData[];
}

interface Props {
    overview: Overview;
    period: string;
    periods: string[];
}

const periodLabels: Record<string, string> = {
    '7d': '7 jours',
    '30d': '30 jours',
    '90d': '90 jours',
    '1y': '1 an',
};

const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
};

function LineChart({ data }: { data: DailyData[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Aucune donnée disponible
            </div>
        );
    }

    const maxViews = Math.max(...data.map(d => d.views), 1);
    const width = 600;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => ({
        x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
        y: padding.top + chartHeight - (d.views / maxViews) * chartHeight,
        views: d.views,
        date: d.date,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPath = pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 140 }}>
            <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#chartGrad)" />
            <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0).map((p, i) => (
                <text key={i} x={p.x} y={height - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">
                    {new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </text>
            ))}
        </svg>
    );
}

export default function Analytics({ overview, period, periods }: Props) {
    const changePeriod = (newPeriod: string) => {
        router.get('/admin/analytics', { period: newPeriod }, { preserveState: true });
    };

    const totalDevices = overview.device_breakdown?.reduce((sum, d) => sum + d.count, 0) || 1;

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Analytics</h1>}>
            <Head title="Analytics" />

            <div className="space-y-6">
                {/* Period selector */}
                <div className="flex items-center gap-2">
                    {periods.map(p => (
                        <Button
                            key={p}
                            size="sm"
                            variant={period === p ? 'default' : 'outline'}
                            onClick={() => changePeriod(p)}
                        >
                            {periodLabels[p] ?? p}
                        </Button>
                    ))}
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                                <Eye className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {(overview.total_views ?? 0).toLocaleString('fr-FR')}
                                </p>
                                <p className="text-sm text-gray-500">Vues de pages</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                                <Users className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {(overview.unique_visitors ?? 0).toLocaleString('fr-FR')}
                                </p>
                                <p className="text-sm text-gray-500">Visiteurs uniques</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Views over time */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4 text-gray-500" />
                            Vues sur la période
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LineChart data={overview.views_over_time ?? []} />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top pages */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Pages les plus vues</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(overview.top_pages ?? []).length > 0 ? (
                                <div className="space-y-2">
                                    {overview.top_pages.map((page, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="truncate text-gray-700 font-mono text-xs max-w-[200px]">
                                                {page.path}
                                            </span>
                                            <Badge variant="secondary">{page.views.toLocaleString('fr-FR')}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Aucune donnée</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top referrers */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Globe className="h-4 w-4 text-gray-500" />
                                Sources de trafic
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(overview.top_referrers ?? []).length > 0 ? (
                                <div className="space-y-2">
                                    {overview.top_referrers.map((ref, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="truncate text-gray-700 text-xs max-w-[200px]">
                                                {ref.referrer || 'Direct'}
                                            </span>
                                            <Badge variant="secondary">{ref.count.toLocaleString('fr-FR')}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Aucune donnée</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Device breakdown */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Appareils</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-6">
                            {(overview.device_breakdown ?? []).map((d, i) => {
                                const pct = Math.round((d.count / totalDevices) * 100);
                                return (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-gray-400">{deviceIcons[d.device_type] ?? <Monitor className="h-4 w-4" />}</span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 capitalize">{d.device_type}</p>
                                            <p className="text-xs text-gray-500">{pct}% · {d.count.toLocaleString('fr-FR')}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {(overview.device_breakdown ?? []).length === 0 && (
                                <p className="text-sm text-gray-400">Aucune donnée</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* RGPD notice */}
                <p className="text-xs text-gray-400">
                    Analytics server-side · Conforme RGPD · Aucun cookie tiers · Données anonymisées (hash SHA-256)
                </p>
            </div>
        </AdminLayout>
    );
}
