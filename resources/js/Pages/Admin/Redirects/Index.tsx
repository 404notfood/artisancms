import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Select } from '@/Components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/Components/ui/dialog';
import { ArrowRightLeft, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useState, FormEvent } from 'react';

interface RedirectItem {
    id: number;
    source_path: string;
    target_url: string;
    status_code: number;
    hits: number;
    active: boolean;
    note: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    redirects: {
        data: RedirectItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search?: string;
    };
}

export default function RedirectsIndex({ redirects, filters }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const [editingRedirect, setEditingRedirect] = useState<RedirectItem | null>(null);

    const createForm = useForm({
        source_path: '',
        target_url: '',
        status_code: 301,
        active: true,
        note: '',
    });

    const editForm = useForm({
        source_path: '',
        target_url: '',
        status_code: 301,
        active: true,
        note: '',
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(`/${prefix}/redirects`, { search: searchQuery }, { preserveState: true });
    };

    const handleCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(`/${prefix}/redirects`, {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
            },
        });
    };

    const handleEdit = (redirect: RedirectItem) => {
        setEditingRedirect(redirect);
        editForm.setData({
            source_path: redirect.source_path,
            target_url: redirect.target_url,
            status_code: redirect.status_code,
            active: redirect.active,
            note: redirect.note ?? '',
        });
    };

    const handleUpdate = (e: FormEvent) => {
        e.preventDefault();
        if (!editingRedirect) return;

        editForm.put(`/admin/redirects/${editingRedirect.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingRedirect(null);
            },
        });
    };

    const handleDelete = (id: number, sourcePath: string) => {
        if (!confirm(`Supprimer la redirection "${sourcePath}" ?`)) return;
        router.delete(`/admin/redirects/${id}`, { preserveScroll: true });
    };

    const handleToggleActive = (redirect: RedirectItem) => {
        router.put(
            `/admin/redirects/${redirect.id}`,
            {
                source_path: redirect.source_path,
                target_url: redirect.target_url,
                status_code: redirect.status_code,
                active: !redirect.active,
                note: redirect.note ?? '',
            },
            { preserveScroll: true },
        );
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Redirections
                    </h1>
                </div>
            }
        >
            <Head title="Redirections" />

            <div className="space-y-6">
                {/* Search */}
                <div className="flex items-center gap-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Rechercher une redirection..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline" size="sm">
                            Rechercher
                        </Button>
                    </form>
                </div>

                {/* Create Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Nouvelle redirection
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="flex items-end gap-3 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="source_path">Chemin source</Label>
                                <Input
                                    id="source_path"
                                    value={createForm.data.source_path}
                                    onChange={e => createForm.setData('source_path', e.target.value)}
                                    placeholder="/ancien-chemin"
                                />
                                {createForm.errors.source_path && (
                                    <p className="text-sm text-red-500 mt-1">{createForm.errors.source_path}</p>
                                )}
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="target_url">URL cible</Label>
                                <Input
                                    id="target_url"
                                    value={createForm.data.target_url}
                                    onChange={e => createForm.setData('target_url', e.target.value)}
                                    placeholder="/nouveau-chemin ou https://..."
                                />
                                {createForm.errors.target_url && (
                                    <p className="text-sm text-red-500 mt-1">{createForm.errors.target_url}</p>
                                )}
                            </div>
                            <div className="w-32">
                                <Label htmlFor="status_code">Code</Label>
                                <Select
                                    value={String(createForm.data.status_code)}
                                    onChange={e => createForm.setData('status_code', Number(e.target.value))}
                                >
                                    <option value="301">301</option>
                                    <option value="302">302</option>
                                </Select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <Label htmlFor="note">Note</Label>
                                <Input
                                    id="note"
                                    value={createForm.data.note}
                                    onChange={e => createForm.setData('note', e.target.value)}
                                    placeholder="Note optionnelle"
                                />
                            </div>
                            <Button type="submit" disabled={createForm.processing} size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Ajouter
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Redirects Table */}
                {redirects.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <ArrowRightLeft className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">Aucune redirection</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Utilisez le formulaire ci-dessus pour creer une redirection.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50/50">
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Source</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Cible</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Visites</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actif</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Note</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {redirects.data.map(redirect => (
                                            <tr key={redirect.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                                <td className="py-3 px-4 font-mono text-xs">{redirect.source_path}</td>
                                                <td className="py-3 px-4 font-mono text-xs truncate max-w-[200px]">
                                                    {redirect.target_url}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant={redirect.status_code === 301 ? 'default' : 'secondary'}
                                                        className="text-xs"
                                                    >
                                                        {redirect.status_code}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">{redirect.hits}</td>
                                                <td className="py-3 px-4">
                                                    <Switch
                                                        checked={redirect.active}
                                                        onCheckedChange={() => handleToggleActive(redirect)}
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-xs truncate max-w-[150px]">
                                                    {redirect.note ?? '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(redirect)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(redirect.id, redirect.source_path)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {redirects.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {redirects.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={editingRedirect !== null} onOpenChange={open => !open && setEditingRedirect(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la redirection</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <Label htmlFor="edit_source_path">Chemin source</Label>
                            <Input
                                id="edit_source_path"
                                value={editForm.data.source_path}
                                onChange={e => editForm.setData('source_path', e.target.value)}
                            />
                            {editForm.errors.source_path && (
                                <p className="text-sm text-red-500 mt-1">{editForm.errors.source_path}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="edit_target_url">URL cible</Label>
                            <Input
                                id="edit_target_url"
                                value={editForm.data.target_url}
                                onChange={e => editForm.setData('target_url', e.target.value)}
                            />
                            {editForm.errors.target_url && (
                                <p className="text-sm text-red-500 mt-1">{editForm.errors.target_url}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="edit_status_code">Code de statut</Label>
                            <Select
                                value={String(editForm.data.status_code)}
                                onChange={e => editForm.setData('status_code', Number(e.target.value))}
                            >
                                <option value="301">301 - Permanent</option>
                                <option value="302">302 - Temporaire</option>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit_note">Note</Label>
                            <Input
                                id="edit_note"
                                value={editForm.data.note}
                                onChange={e => editForm.setData('note', e.target.value)}
                                placeholder="Note optionnelle"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editForm.data.active}
                                onCheckedChange={val => editForm.setData('active', val)}
                            />
                            <Label>Actif</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingRedirect(null)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
