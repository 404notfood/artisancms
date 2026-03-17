import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PermissionsMatrix } from '@/Components/admin/permissions-matrix';
import { ArrowLeft } from 'lucide-react';

interface Role {
    id?: number;
    name: string;
    slug: string;
    is_system: boolean;
    permissions: string[];
}

interface RolesEditProps {
    role: Role;
    isNew: boolean;
}

export default function RolesEdit({ role, isNew }: RolesEditProps) {
    const [name, setName] = useState(role.name);
    const [slug, setSlug] = useState(role.slug);
    const [permissions, setPermissions] = useState<string[]>(role.permissions ?? []);
    const [saving, setSaving] = useState(false);

    function generateSlug(value: string) {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function handleNameChange(value: string) {
        setName(value);
        if (isNew || !role.is_system) {
            setSlug(generateSlug(value));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const data = { name, slug, permissions };

        if (isNew) {
            router.post('/admin/settings/roles', data, {
                onFinish: () => setSaving(false),
            });
        } else {
            router.put(`/admin/settings/roles/${role.id}`, data, {
                onFinish: () => setSaving(false),
            });
        }
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {isNew ? 'Créer un rôle' : `Modifier : ${role.name}`}
                    </h1>
                </div>
            }
        >
            <Head title={isNew ? 'Créer un rôle' : `Modifier ${role.name}`} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informations du rôle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du rôle</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Ex: Éditeur"
                                    disabled={role.is_system}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Identifiant (slug)</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="ex: editor"
                                    disabled={role.is_system}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PermissionsMatrix
                            permissions={permissions}
                            onChange={setPermissions}
                            disabled={role.is_system && role.slug === 'admin'}
                        />
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => history.back()}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={saving || !name.trim()}>
                        {saving ? 'Enregistrement...' : isNew ? 'Créer le rôle' : 'Enregistrer'}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
