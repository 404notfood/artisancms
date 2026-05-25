import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { AlertTriangle, CheckCircle2, ExternalLink, FileSearch, Search } from 'lucide-react';

interface SeoAuditItem {
    id: number;
    type: 'page' | 'post';
    title: string;
    path: string;
    status: string;
    score: number;
    issues: string[];
    updated_at: string | null;
}

interface SeoIndexProps {
    audit: {
        summary: {
            total: number;
            good: number;
            warning: number;
            bad: number;
        };
        items: SeoAuditItem[];
    };
    sitemapUrl: string;
    robotsUrl: string;
}

export default function SeoIndex({ audit, sitemapUrl, robotsUrl }: SeoIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';

    return (
        <AdminLayout header={<h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900"><Search className="h-5 w-5" /> SEO global</h1>}>
            <Head title="SEO global" />

            <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-4">
                    <SeoStat label="Contenus audites" value={audit.summary.total} tone="neutral" />
                    <SeoStat label="Bons" value={audit.summary.good} tone="good" />
                    <SeoStat label="A surveiller" value={audit.summary.warning} tone="warning" />
                    <SeoStat label="Critiques" value={audit.summary.bad} tone="bad" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <ToolLink title="Sitemap XML" description="Liste publique des pages indexables." href={sitemapUrl} />
                    <ToolLink title="Robots.txt" description="Directives d'indexation envoyees aux robots." href={robotsUrl} />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-900">Audit SEO des contenus publies</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Contenu</th>
                                    <th className="px-4 py-3">Score</th>
                                    <th className="px-4 py-3">Problemes</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {audit.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                                            Aucun contenu publie a auditer.
                                        </td>
                                    </tr>
                                ) : audit.items.map((item) => (
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.title}</div>
                                            <div className="text-xs text-gray-500">{item.type === 'page' ? 'Page' : 'Article'} - {item.path}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ScoreBadge score={item.score} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.issues.length === 0 ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    OK
                                                </span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.issues.map((issue) => (
                                                        <span key={issue} className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                                                            {issue}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/${prefix}/${item.type === 'page' ? 'pages' : 'posts'}/${item.id}/edit`}
                                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Corriger
                                                </Link>
                                                <a href={item.path} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-indigo-600" title="Voir">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function SeoStat({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'good' | 'warning' | 'bad' }) {
    const tones = {
        neutral: 'border-gray-200 bg-white text-gray-900',
        good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        bad: 'border-red-200 bg-red-50 text-red-700',
    };

    return (
        <div className={`rounded-lg border px-4 py-3 ${tones[tone]}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
}

function ToolLink({ title, description, href }: { title: string; description: string; href: string }) {
    return (
        <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 hover:bg-indigo-50/30">
            <FileSearch className="h-5 w-5 text-indigo-600" />
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">{title}</span>
                <span className="block text-xs text-gray-500">{description}</span>
            </span>
            <ExternalLink className="h-4 w-4 text-gray-400" />
        </a>
    );
}

function ScoreBadge({ score }: { score: number }) {
    const tone = score >= 80
        ? 'bg-emerald-100 text-emerald-700'
        : score >= 50
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700';

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {score < 50 && <AlertTriangle className="h-3.5 w-3.5" />}
            {score}%
        </span>
    );
}
