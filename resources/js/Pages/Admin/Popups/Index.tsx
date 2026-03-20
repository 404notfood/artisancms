import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';
import { MessageSquare, Plus, Pencil, Trash2 } from 'lucide-react';

interface Popup {
    id: number;
    name: string;
    title: string | null;
    type: 'modal' | 'banner' | 'slide-in';
    trigger: 'page_load' | 'exit_intent' | 'scroll' | 'delay';
    active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
}

interface Props {
    popups: Popup[];
}

const typeLabels: Record<string, string> = {
    modal: 'Modal',
    banner: 'Banni\u00e8re',
    'slide-in': 'Slide-in',
};

const typeBadgeClass: Record<string, string> = {
    modal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    banner: 'bg-amber-50 text-amber-700 border-amber-200',
    'slide-in': 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

const triggerLabels: Record<string, string> = {
    page_load: 'Chargement page',
    exit_intent: 'Intention de sortie',
    scroll: 'D\u00e9filement',
    delay: 'D\u00e9lai',
};

export default function PopupsIndex({ popups }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const handleDelete = (id: number) => {
        if (!confirm('Supprimer ce popup ?')) return;
        router.delete(`/admin/popups/${id}`);
    };

    const handleToggleActive = (popup: Popup) => {
        router.put(`/admin/popups/${popup.id}`, {
            ...popup,
            active: !popup.active,
        }, { preserveScroll: true });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Popups
                    </h1>
                    <Link href={`/${prefix}/popups/create`}>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Cr\u00e9er un popup
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Popups" />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Tous les popups</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {popups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                            <p className="text-gray-500">Aucun popup</p>
                            <Link href={`/${prefix}/popups/create`} className="mt-3">
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Cr\u00e9er un popup
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {['Nom', 'Type', 'D\u00e9clencheur', 'Actif', 'P\u00e9riode', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {popups.map(popup => (
                                    <tr key={popup.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{popup.name}</p>
                                            {popup.title && (
                                                <p className="text-xs text-gray-500 mt-0.5">{popup.title}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`text-xs ${typeBadgeClass[popup.type] ?? ''}`}>
                                                {typeLabels[popup.type] ?? popup.type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">
                                            {triggerLabels[popup.trigger] ?? popup.trigger}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Switch
                                                checked={popup.active}
                                                onCheckedChange={() => handleToggleActive(popup)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {popup.starts_at || popup.ends_at ? (
                                                <>
                                                    {popup.starts_at && <span>{popup.starts_at}</span>}
                                                    {popup.starts_at && popup.ends_at && <span> - </span>}
                                                    {popup.ends_at && <span>{popup.ends_at}</span>}
                                                </>
                                            ) : (
                                                <span className="text-gray-400">Toujours</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Link href={`/admin/popups/${popup.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(popup.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
