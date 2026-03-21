import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import {
    Download,
    RefreshCw,
    Shield,
    CheckCircle,
    AlertTriangle,
    Clock,
    Package,
    Palette,
    Settings,
    Key,
    Loader2,
} from 'lucide-react';

interface UpdateInfo {
    current: string;
    latest: string | null;
    available: boolean;
    changelog: string | null;
}

interface ExtensionUpdate {
    slug: string;
    name: string;
    current: string;
    latest: string | null;
    available: boolean;
}

interface HistoryEntry {
    id: number;
    type: string;
    slug: string | null;
    from_version: string;
    to_version: string;
    status: string;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
    performer?: { name: string };
}

interface HealthStatus {
    safe_mode: boolean;
    faulty_extensions: Array<{
        type: string;
        slug: string;
        error: string;
        recorded_at: string;
    }>;
    has_recovery_token: boolean;
}

interface UpdatesIndexProps {
    updates: {
        cms: UpdateInfo;
        plugins: ExtensionUpdate[];
        themes: ExtensionUpdate[];
    };
    history: HistoryEntry[];
    health: HealthStatus;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'text-gray-500' },
    downloading: { label: 'Téléchargement', color: 'text-blue-500' },
    installing: { label: 'Installation', color: 'text-blue-600' },
    completed: { label: 'Terminé', color: 'text-emerald-600' },
    failed: { label: 'Échoué', color: 'text-red-600' },
    rolled_back: { label: 'Annulé', color: 'text-amber-600' },
};

export default function UpdatesIndex({ updates, history, health }: UpdatesIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [checking, setChecking] = useState(false);
    const [safeMode, setSafeMode] = useState(health.safe_mode);
    const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);

    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

    async function handleCheckUpdates() {
        setChecking(true);
        try {
            await fetch(`/${prefix}/updates/check`, {
                headers: { Accept: 'application/json' },
            });
            window.location.reload();
        } finally {
            setChecking(false);
        }
    }

    async function handleToggleSafeMode() {
        const res = await fetch(`/${prefix}/updates/safe-mode`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        const data = await res.json();
        setSafeMode(data.safe_mode);
    }

    async function handleGenerateToken() {
        const res = await fetch(`/${prefix}/updates/recovery-token`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                Accept: 'application/json',
            },
        });
        const data = await res.json();
        setRecoveryUrl(data.url);
    }

    const pluginUpdates = updates.plugins.filter((p) => p.available);
    const themeUpdates = updates.themes.filter((t) => t.available);
    const totalUpdates = (updates.cms.available ? 1 : 0) + pluginUpdates.length + themeUpdates.length;

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Mises à jour</h1>}
        >
            <Head title="Mises à jour" />

            <div className="space-y-6">
                {/* Safe mode banner */}
                {safeMode && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-amber-600" />
                            <div className="flex-1">
                                <p className="font-medium text-amber-800">Mode sans échec activé</p>
                                <p className="text-sm text-amber-700">
                                    Les extensions non-essentielles sont désactivées.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleToggleSafeMode}>
                                Désactiver
                            </Button>
                        </div>
                    </div>
                )}

                {/* Faulty extensions */}
                {health.faulty_extensions.length > 0 && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <p className="font-medium text-red-800">Extensions défaillantes détectées</p>
                        </div>
                        <div className="space-y-1">
                            {health.faulty_extensions.map((ext, i) => (
                                <p key={i} className="text-sm text-red-700">
                                    <span className="font-medium">{ext.type}/{ext.slug}</span> — {ext.error}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Check + Summary */}
                <div className="flex items-center justify-between">
                    <div>
                        {totalUpdates > 0 ? (
                            <p className="text-sm text-amber-600 font-medium">
                                {totalUpdates} mise{totalUpdates > 1 ? 's' : ''} à jour disponible{totalUpdates > 1 ? 's' : ''}
                            </p>
                        ) : (
                            <p className="text-sm text-emerald-600 font-medium">Tout est à jour</p>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCheckUpdates} disabled={checking}>
                        {checking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Vérifier les mises à jour
                    </Button>
                </div>

                {/* CMS update */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Settings className="h-5 w-5 text-indigo-500" />
                            ArtisanCMS
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Version actuelle : <span className="font-mono font-medium">{updates.cms.current}</span>
                                </p>
                                {updates.cms.available && updates.cms.latest && (
                                    <p className="text-sm text-amber-600">
                                        Nouvelle version disponible : <span className="font-mono font-medium">{updates.cms.latest}</span>
                                    </p>
                                )}
                            </div>
                            {updates.cms.available ? (
                                <Button size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Mettre à jour
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm">À jour</span>
                                </div>
                            )}
                        </div>
                        {updates.cms.changelog && (
                            <div className="mt-3 rounded bg-gray-50 p-3 text-xs text-gray-600">
                                {updates.cms.changelog}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Plugins */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Package className="h-5 w-5 text-emerald-500" />
                            Extensions ({updates.plugins.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {updates.plugins.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucune extension installée.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {updates.plugins.map((plugin) => (
                                    <div key={plugin.slug} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{plugin.name}</p>
                                            <p className="text-xs text-gray-500">v{plugin.current}</p>
                                        </div>
                                        {plugin.available ? (
                                            <Button size="sm" variant="outline">
                                                <Download className="mr-1 h-3.5 w-3.5" />
                                                v{plugin.latest}
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-emerald-600">À jour</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Themes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Palette className="h-5 w-5 text-purple-500" />
                            Thèmes ({updates.themes.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {updates.themes.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucun thème installé.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {updates.themes.map((theme) => (
                                    <div key={theme.slug} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                                            <p className="text-xs text-gray-500">v{theme.current}</p>
                                        </div>
                                        {theme.available ? (
                                            <Button size="sm" variant="outline">
                                                <Download className="mr-1 h-3.5 w-3.5" />
                                                v{theme.latest}
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-emerald-600">À jour</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Error Recovery */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="h-5 w-5 text-amber-500" />
                            Récupération d'erreurs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Mode sans échec</p>
                                <p className="text-xs text-gray-500">
                                    Désactive toutes les extensions non-essentielles.
                                </p>
                            </div>
                            <Button
                                variant={safeMode ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={handleToggleSafeMode}
                            >
                                {safeMode ? 'Désactiver' : 'Activer'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Token de récupération</p>
                                <p className="text-xs text-gray-500">
                                    Génère un lien d'accès d'urgence (valide 24h).
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleGenerateToken}>
                                <Key className="mr-1 h-3.5 w-3.5" />
                                Générer
                            </Button>
                        </div>

                        {recoveryUrl && (
                            <div className="rounded bg-amber-50 p-3">
                                <p className="text-xs font-medium text-amber-800 mb-1">URL de récupération :</p>
                                <input
                                    type="text"
                                    readOnly
                                    value={recoveryUrl}
                                    className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-xs font-mono"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                                <p className="mt-1 text-[10px] text-amber-600">Ce lien expire dans 24 heures.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Update History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Historique des mises à jour
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucun historique de mise à jour.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {history.map((entry) => {
                                    const status = STATUS_MAP[entry.status] ?? { label: entry.status, color: 'text-gray-500' };
                                    return (
                                        <div key={entry.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {entry.type === 'cms' ? 'ArtisanCMS' : entry.slug}
                                                    <span className="ml-2 font-normal text-gray-500">
                                                        {entry.from_version} → {entry.to_version}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {entry.started_at ? new Date(entry.started_at).toLocaleDateString('fr-FR') : '—'}
                                                    {entry.performer && ` par ${entry.performer.name}`}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
