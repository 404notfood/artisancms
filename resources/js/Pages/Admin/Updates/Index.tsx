import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
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
    Settings2,
    Key,
    Loader2,
    RotateCcw,
    Save,
    X,
} from 'lucide-react';

interface UpdateInfo {
    current: string;
    latest: string | null;
    available: boolean;
    changelog: string | null;
    download_url?: string | null;
    urgent?: boolean;
}

interface ExtensionUpdate {
    slug: string;
    name: string;
    current: string;
    latest: string | null;
    available: boolean;
    download_url?: string | null;
}

interface HistoryEntry {
    id: number;
    type: string;
    slug: string | null;
    from_version: string;
    to_version: string;
    status: string;
    error_message: string | null;
    backup_path: Record<string, string> | null;
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

interface AutoUpdateSettings {
    auto_update: 'disabled' | 'minor' | 'all';
    auto_update_plugins: boolean;
    auto_update_themes: boolean;
    notify_email: boolean;
}

interface UpdatesIndexProps {
    updates: {
        cms: UpdateInfo;
        plugins: ExtensionUpdate[];
        themes: ExtensionUpdate[];
        checked_at?: string | null;
    };
    history: HistoryEntry[];
    health: HealthStatus;
    settings: AutoUpdateSettings;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'text-gray-500' },
    downloading: { label: 'Téléchargement', color: 'text-blue-500' },
    installing: { label: 'Installation', color: 'text-blue-600' },
    completed: { label: 'Terminé', color: 'text-emerald-600' },
    failed: { label: 'Échoué', color: 'text-red-600' },
    rolled_back: { label: 'Annulé', color: 'text-amber-600' },
};

export default function UpdatesIndex({ updates, history, health, settings }: UpdatesIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

    const [checking, setChecking] = useState(false);
    const [safeMode, setSafeMode] = useState(health.safe_mode);
    const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    // Auto-update settings state
    const [autoUpdate, setAutoUpdate] = useState(settings.auto_update);
    const [autoUpdatePlugins, setAutoUpdatePlugins] = useState(settings.auto_update_plugins);
    const [autoUpdateThemes, setAutoUpdateThemes] = useState(settings.auto_update_themes);
    const [notifyEmail, setNotifyEmail] = useState(settings.notify_email);
    const [savingSettings, setSavingSettings] = useState(false);

    // Confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => {} });

    const headers = {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    // ─── Handlers ────────────────────────────────────────

    async function handleCheckUpdates() {
        setChecking(true);
        setError(null);
        try {
            await fetch(`/${prefix}/updates/check`, { headers: { Accept: 'application/json' } });
            window.location.reload();
        } finally {
            setChecking(false);
        }
    }

    async function doUpdate(type: 'plugin' | 'theme', slug: string) {
        const key = `${type}-${slug}`;
        setUpdating((prev) => ({ ...prev, [key]: true }));
        setError(null);
        try {
            const res = await fetch(`/${prefix}/updates/${type}/${slug}`, {
                method: 'POST',
                headers,
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            } else {
                setError(data.message || 'Erreur lors de la mise à jour.');
            }
        } catch {
            setError('Erreur de connexion au serveur.');
        } finally {
            setUpdating((prev) => ({ ...prev, [key]: false }));
        }
    }

    function handleUpdatePlugin(slug: string, name: string, version: string) {
        setConfirmDialog({
            open: true,
            title: `Mettre à jour ${name}`,
            message: `Voulez-vous mettre à jour ${name} vers la version ${version} ? Une sauvegarde sera créée automatiquement.`,
            onConfirm: () => {
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                doUpdate('plugin', slug);
            },
        });
    }

    function handleUpdateTheme(slug: string, name: string, version: string) {
        setConfirmDialog({
            open: true,
            title: `Mettre à jour ${name}`,
            message: `Voulez-vous mettre à jour le thème ${name} vers la version ${version} ? Une sauvegarde sera créée automatiquement.`,
            onConfirm: () => {
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                doUpdate('theme', slug);
            },
        });
    }

    async function handleUpdateAll() {
        setConfirmDialog({
            open: true,
            title: 'Tout mettre à jour',
            message: `${totalUpdates} mise(s) à jour vont être installées. Une sauvegarde sera créée pour chaque élément.`,
            onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                setUpdating({ all: true });
                setError(null);
                try {
                    const res = await fetch(`/${prefix}/updates/all`, {
                        method: 'POST',
                        headers,
                    });
                    const data = await res.json();
                    if (data.success) {
                        window.location.reload();
                    } else {
                        setError(data.message);
                    }
                } catch {
                    setError('Erreur de connexion.');
                } finally {
                    setUpdating({});
                }
            },
        });
    }

    async function handleRollback(logId: number) {
        setUpdating((prev) => ({ ...prev, [`rollback-${logId}`]: true }));
        setError(null);
        try {
            const res = await fetch(`/${prefix}/updates/${logId}/rollback`, {
                method: 'POST',
                headers,
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            } else {
                setError(data.message);
            }
        } catch {
            setError('Erreur de connexion.');
        } finally {
            setUpdating((prev) => ({ ...prev, [`rollback-${logId}`]: false }));
        }
    }

    async function handleSaveSettings() {
        setSavingSettings(true);
        setError(null);
        try {
            const res = await fetch(`/${prefix}/updates/settings`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    auto_update: autoUpdate,
                    auto_update_plugins: autoUpdatePlugins,
                    auto_update_themes: autoUpdateThemes,
                    notify_email: notifyEmail,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de la sauvegarde.');
            }
        } catch {
            setError('Erreur de connexion.');
        } finally {
            setSavingSettings(false);
        }
    }

    async function handleToggleSafeMode() {
        const res = await fetch(`/${prefix}/updates/safe-mode`, {
            method: 'POST',
            headers,
        });
        const data = await res.json();
        setSafeMode(data.safe_mode);
    }

    async function handleGenerateToken() {
        const res = await fetch(`/${prefix}/updates/recovery-token`, {
            method: 'POST',
            headers,
        });
        const data = await res.json();
        setRecoveryUrl(data.url);
    }

    const pluginUpdates = updates.plugins.filter((p) => p.available);
    const themeUpdates = updates.themes.filter((t) => t.available);
    const totalUpdates = (updates.cms.available ? 1 : 0) + pluginUpdates.length + themeUpdates.length;

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Mises à jour</h1>}>
            <Head title="Mises à jour" />

            <div className="space-y-6">
                {/* Error banner */}
                {error && (
                    <div className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Confirmation dialog */}
                {confirmDialog.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
                            <p className="mt-2 text-sm text-gray-600">{confirmDialog.message}</p>
                            <div className="mt-4 flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                                >
                                    Annuler
                                </Button>
                                <Button size="sm" onClick={confirmDialog.onConfirm}>
                                    Confirmer
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Safe mode */}
                {safeMode && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-amber-600" />
                            <div className="flex-1">
                                <p className="font-medium text-amber-800">Mode sans échec activé</p>
                                <p className="text-sm text-amber-700">Les extensions non-essentielles sont désactivées.</p>
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
                        <div className="mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <p className="font-medium text-red-800">Extensions défaillantes détectées</p>
                        </div>
                        {health.faulty_extensions.map((ext, i) => (
                            <p key={i} className="text-sm text-red-700">
                                <span className="font-medium">{ext.type}/{ext.slug}</span> — {ext.error}
                            </p>
                        ))}
                    </div>
                )}

                {/* Summary + Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        {totalUpdates > 0 ? (
                            <p className="text-sm font-medium text-amber-600">
                                {totalUpdates} mise{totalUpdates > 1 ? 's' : ''} à jour disponible{totalUpdates > 1 ? 's' : ''}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-emerald-600">Tout est à jour</p>
                        )}
                        {updates.checked_at && (
                            <p className="text-xs text-gray-400">
                                Dernière vérification : {new Date(updates.checked_at).toLocaleString('fr-FR')}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {totalUpdates > 1 && (
                            <Button size="sm" onClick={handleUpdateAll} disabled={!!updating.all}>
                                {updating.all ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Tout mettre à jour
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleCheckUpdates} disabled={checking}>
                            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Vérifier
                        </Button>
                    </div>
                </div>

                {/* CMS */}
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
                                        Nouvelle version : <span className="font-mono font-medium">{updates.cms.latest}</span>
                                        {updates.cms.urgent && (
                                            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                                                Urgent
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                            {updates.cms.available ? (
                                <Button size="sm" disabled>
                                    <Download className="mr-2 h-4 w-4" />
                                    Bientôt disponible
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm">À jour</span>
                                </div>
                            )}
                        </div>
                        {updates.cms.changelog && (
                            <div className="mt-3 rounded bg-gray-50 p-3 text-xs text-gray-600 whitespace-pre-line">
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
                            {pluginUpdates.length > 0 && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    {pluginUpdates.length} MAJ
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {updates.plugins.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucune extension installée.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {updates.plugins.map((plugin) => {
                                    const key = `plugin-${plugin.slug}`;
                                    const isUpdating = updating[key];
                                    return (
                                        <div key={plugin.slug} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{plugin.name}</p>
                                                <p className="text-xs text-gray-500">v{plugin.current}</p>
                                            </div>
                                            {plugin.available && plugin.latest ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdatePlugin(plugin.slug, plugin.name, plugin.latest!)}
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Download className="mr-1 h-3.5 w-3.5" />
                                                    )}
                                                    v{plugin.latest}
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-emerald-600">À jour</span>
                                            )}
                                        </div>
                                    );
                                })}
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
                            {themeUpdates.length > 0 && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    {themeUpdates.length} MAJ
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {updates.themes.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucun thème installé.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {updates.themes.map((theme) => {
                                    const key = `theme-${theme.slug}`;
                                    const isUpdating = updating[key];
                                    return (
                                        <div key={theme.slug} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                                                <p className="text-xs text-gray-500">v{theme.current}</p>
                                            </div>
                                            {theme.available && theme.latest ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateTheme(theme.slug, theme.name, theme.latest!)}
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Download className="mr-1 h-3.5 w-3.5" />
                                                    )}
                                                    v{theme.latest}
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-emerald-600">À jour</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Auto-update settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Settings2 className="h-5 w-5 text-blue-500" />
                            Mises à jour automatiques
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-1.5">
                            <Label>Mise à jour automatique du CMS</Label>
                            <Select value={autoUpdate} onValueChange={(v: 'disabled' | 'minor' | 'all') => setAutoUpdate(v)}>
                                <SelectTrigger className="w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="disabled">Désactivé</SelectItem>
                                    <SelectItem value="minor">Mineures uniquement (recommandé)</SelectItem>
                                    <SelectItem value="all">Toutes les versions</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Les mises à jour majeures ne sont jamais automatiques.</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Plugins</p>
                                <p className="text-xs text-gray-500">
                                    Installer automatiquement les mises à jour mineures des plugins.
                                </p>
                            </div>
                            <Switch checked={autoUpdatePlugins} onCheckedChange={setAutoUpdatePlugins} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Thèmes</p>
                                <p className="text-xs text-gray-500">
                                    Installer automatiquement les mises à jour des thèmes.
                                </p>
                            </div>
                            <Switch checked={autoUpdateThemes} onCheckedChange={setAutoUpdateThemes} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Notification email</p>
                                <p className="text-xs text-gray-500">
                                    Recevoir une notification après chaque mise à jour automatique.
                                </p>
                            </div>
                            <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                        </div>

                        <Button size="sm" onClick={handleSaveSettings} disabled={savingSettings}>
                            {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Sauvegarder
                        </Button>
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
                                <p className="text-xs text-gray-500">Désactive toutes les extensions non-essentielles.</p>
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
                                <p className="text-xs text-gray-500">Génère un lien d'accès d'urgence (valide 24h).</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleGenerateToken}>
                                <Key className="mr-1 h-3.5 w-3.5" />
                                Générer
                            </Button>
                        </div>
                        {recoveryUrl && (
                            <div className="rounded bg-amber-50 p-3">
                                <p className="mb-1 text-xs font-medium text-amber-800">URL de récupération :</p>
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

                {/* History */}
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
                                    const canRollback =
                                        entry.backup_path &&
                                        (entry.status === 'completed' || entry.status === 'failed');

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
                                                    {entry.started_at
                                                        ? new Date(entry.started_at).toLocaleDateString('fr-FR', {
                                                              day: 'numeric',
                                                              month: 'short',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : '—'}
                                                    {entry.performer && ` par ${entry.performer.name}`}
                                                </p>
                                                {entry.error_message && (
                                                    <p className="mt-0.5 text-xs text-red-500">{entry.error_message}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                                                {canRollback && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRollback(entry.id)}
                                                        disabled={updating[`rollback-${entry.id}`]}
                                                        title="Restaurer la version précédente"
                                                    >
                                                        {updating[`rollback-${entry.id}`] ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
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
