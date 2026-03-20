import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Plus, Shield, Users, Pencil, Trash2 } from 'lucide-react';

interface Role {
    id: number;
    name: string;
    slug: string;
    is_system: boolean;
    permissions: string[];
    users_count: number;
}

interface RolesIndexProps {
    roles: Role[];
}

export default function RolesIndex({ roles }: RolesIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    function handleDelete(role: Role) {
        if (role.is_system) return;
        if (!confirm(`Supprimer le rôle "${role.name}" ? Les utilisateurs seront réaffectés au rôle par défaut.`)) return;
        router.delete(`/admin/settings/roles/${role.id}`);
    }

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Gestion des rôles</h1>}
        >
            <Head title="Rôles" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Gérez les rôles et les permissions de vos utilisateurs.
                    </p>
                    <Button asChild>
                        <Link href={`/${prefix}/settings/roles/create`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau rôle
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <Card key={role.id} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                                            <Shield className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{role.name}</CardTitle>
                                            <p className="text-xs text-gray-400">{role.slug}</p>
                                        </div>
                                    </div>
                                    {role.is_system && (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                            Système
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span>
                                            {role.users_count} utilisateur{role.users_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="h-4 w-4 text-gray-400" />
                                        <span>{role.permissions.length} permissions</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link href={`/admin/settings/roles/${role.id}/edit`}>
                                            <Pencil className="mr-1 h-3.5 w-3.5" />
                                            Modifier
                                        </Link>
                                    </Button>
                                    {!role.is_system && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(role)}
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
