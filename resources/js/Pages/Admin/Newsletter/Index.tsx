import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Mail, Download, Trash2, Users, UserCheck, UserX, CalendarDays, Search } from 'lucide-react';
import { useState } from 'react';

interface Subscriber {
    id: number;
    email: string;
    name: string | null;
    status: 'active' | 'unsubscribed';
    subscribed_at: string;
    unsubscribed_at: string | null;
    ip_address: string | null;
}

interface Stats {
    total: number;
    active: number;
    unsubscribed: number;
    this_month: number;
}

interface Props {
    subscribers: {
        data: Subscriber[];
        links: any;
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: Stats;
    filters: { search?: string; status?: string };
}

export default function NewsletterIndex({ subscribers, stats, filters }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    const applyFilters = () => {
        router.get(`/${prefix}/newsletter`, {
            ...(search ? { search } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
        }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Supprimer cet abonn\u00e9 ?')) return;
        router.delete(`/admin/newsletter/${id}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') applyFilters();
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Newsletter
                    </h1>
                    <a href={`/${prefix}/newsletter/export`}>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Exporter CSV
                        </Button>
                    </a>
                </div>
            }
        >
            <Head title="Newsletter" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                {[
                    { label: 'Total abonn\u00e9s', value: stats.total, icon: Users },
                    { label: 'Actifs', value: stats.active, icon: UserCheck },
                    { label: 'D\u00e9sabonn\u00e9s', value: stats.unsubscribed, icon: UserX },
                    { label: 'Ce mois-ci', value: stats.this_month, icon: CalendarDays },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <s.icon className="h-4 w-4 text-gray-400" />
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                            <p className="text-lg font-semibold mt-1 text-gray-900">{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Input
                                placeholder="Rechercher par email ou nom..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="unsubscribed">D\u00e9sabonn\u00e9s</option>
                        </select>
                        <Button variant="outline" onClick={applyFilters}>
                            <Search className="h-4 w-4 mr-1" />
                            Filtrer
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Subscribers table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Abonn\u00e9s ({subscribers.total})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {subscribers.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Mail className="h-10 w-10 text-gray-300 mb-3" />
                            <p className="text-gray-500">Aucun abonn\u00e9</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {['Email', 'Nom', 'Statut', 'Date d\'inscription', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {subscribers.data.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-900 font-medium">{sub.email}</td>
                                        <td className="px-4 py-3 text-gray-600">{sub.name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${
                                                    sub.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}
                                            >
                                                {sub.status === 'active' ? 'Actif' : 'D\u00e9sabonn\u00e9'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{sub.subscribed_at}</td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(sub.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {subscribers.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-xs text-gray-500">
                                Page {subscribers.current_page} sur {subscribers.last_page}
                            </p>
                            <div className="flex gap-1">
                                {subscribers.links && Array.isArray(subscribers.links) && subscribers.links.map((link: any, i: number) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className="text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
