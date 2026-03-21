import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Monitor, Smartphone, Tablet, LogOut, Globe } from 'lucide-react';

interface SessionData {
    id: number;
    user: { id: number; name: string; email: string };
    ip_address: string;
    device: string;
    browser: string;
    os: string;
    last_activity: string;
    is_current: boolean;
}

interface SessionsProps {
    sessions: SessionData[];
}

const DEVICE_ICONS: Record<string, typeof Monitor> = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
};

export default function Sessions({ sessions }: SessionsProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    function handleForceLogout(sessionId: number) {
        if (!confirm('Forcer la déconnexion de cette session ?')) return;
        router.delete(`/admin/system/sessions/${sessionId}`);
    }

    function handleLogoutAll() {
        if (!confirm('Déconnecter toutes les autres sessions ?')) return;
        router.post(`/${prefix}/system/sessions/logout-all`);
    }

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Sessions utilisateurs</h1>}
        >
            <Head title="Sessions" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {sessions.length} session{sessions.length !== 1 ? 's' : ''} active{sessions.length !== 1 ? 's' : ''}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleLogoutAll}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnecter les autres sessions
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {sessions.map((session) => {
                                const DeviceIcon = DEVICE_ICONS[session.device] ?? Globe;
                                return (
                                    <div key={session.id} className="flex items-center gap-4 px-6 py-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                            <DeviceIcon className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {session.user.name}
                                                </p>
                                                {session.is_current && (
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                        Session actuelle
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {session.browser} · {session.os} · {session.ip_address}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Dernière activité : {new Date(session.last_activity).toLocaleString('fr-FR')}
                                            </p>
                                        </div>
                                        {!session.is_current && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleForceLogout(session.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
