import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Settings, Search, Mail, FileText, ImageIcon, Construction, Paintbrush, Upload, Check, Shield, BarChart3, Send, Trash2 } from 'lucide-react';
import type { SettingData, SharedProps } from '@/types/cms';
import { DASHBOARD_THEMES, type DashboardTheme } from '@/Layouts/admin/dashboard-themes';
import { ADMIN_INPUT_FOCUS, adminBtnPrimary, adminTabActive, adminSelectedBorder, ADMIN_PRIMARY_BG } from '@/lib/admin-theme';

interface SettingsIndexProps {
    settings: Record<string, SettingData[]>;
}

const tabConfig: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'Général', icon: <Settings className="h-4 w-4" /> },
    { key: 'seo', label: 'SEO', icon: <Search className="h-4 w-4" /> },
    { key: 'mail', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { key: 'content', label: 'Contenu', icon: <FileText className="h-4 w-4" /> },
    { key: 'media', label: 'Médias', icon: <ImageIcon className="h-4 w-4" /> },
    { key: 'maintenance', label: 'Maintenance', icon: <Construction className="h-4 w-4" /> },
    { key: 'dashboard', label: 'Dashboard', icon: <Paintbrush className="h-4 w-4" /> },
    { key: 'security', label: 'Securite', icon: <Shield className="h-4 w-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
];

export default function SettingsIndex({ settings }: SettingsIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [activeTab, setActiveTab] = useState('general');
    const [dashboardTheme, setDashboardTheme] = useState<string>(
        () => settings['dashboard']?.find((s) => s.key === 'theme')?.value as string ?? 'indigo'
    );
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const currentSettings = settings[activeTab] ?? [];

    // Build initial form data from current tab's settings
    const initialValues: Record<string, string> = {};
    currentSettings.forEach((setting) => {
        initialValues[setting.key] = valueToInput(setting);
    });

    const { data, setData, put, processing } = useForm(initialValues);

    function handleTabChange(tabKey: string) {
        setActiveTab(tabKey);
        const tabSettings = settings[tabKey] ?? [];
        const values: Record<string, string> = {};
        tabSettings.forEach((setting) => {
            values[setting.key] = valueToInput(setting);
        });
        setData(values as Record<string, string>);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        // Transform flat key/value pairs into the array format expected by the backend
        // Prefix each key with the active tab group (e.g., "maintenance.enabled")
        const settingsArray = Object.entries(data).map(([key, value]) => ({
            key: `${activeTab}.${key}`,
            value: parseValueForSubmit(currentSettings.find((setting) => setting.key === key), value),
        }));
        router.visit(`/${prefix}/settings`, {
            method: 'put',
            data: { settings: settingsArray },
            preserveState: true,
            preserveScroll: true,
        });
    }

    async function postSettingsAction(action: 'test-mail' | 'clear-cache') {
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        setActionMessage(null);

        try {
            const response = await fetch(`/${prefix}/settings/${action}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });
            const result = await response.json();
            setActionMessage({
                type: response.ok && result.success ? 'success' : 'error',
                text: result.message || 'Action terminee.',
            });
        } catch {
            setActionMessage({ type: 'error', text: "L'action a echoue." });
        }
    }

    function renderField(setting: SettingData) {
        const value = data[setting.key];

        switch (setting.type) {
            case 'boolean':
            case 'toggle': {
                const isChecked = value === '1' || value === 'true';
                return (
                    <div key={setting.key} className="flex items-center justify-between py-3">
                        <div>
                            <label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
                                {formatLabel(setting.key)}
                            </label>
                        </div>
                        <button
                            id={setting.key}
                            type="button"
                            role="switch"
                            aria-checked={isChecked}
                            onClick={() => setData(setting.key, isChecked ? '0' : '1')}
                            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                            style={{ backgroundColor: isChecked ? 'var(--admin-primary, #6366f1)' : '#e5e7eb' }}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                                    isChecked ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                );
            }

            case 'number':
                return (
                    <div key={setting.key} className="py-3">
                        <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700">
                            {formatLabel(setting.key)}
                        </label>
                        <input
                            id={setting.key}
                            type="number"
                            value={String(value ?? '')}
                            onChange={(e) => setData(setting.key, e.target.value)}
                            className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS} sm:max-w-xs`}
                        />
                    </div>
                );

            case 'password':
                return (
                    <div key={setting.key} className="py-3">
                        <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700">
                            {formatLabel(setting.key)}
                        </label>
                        <input
                            id={setting.key}
                            type="password"
                            value={String(value ?? '')}
                            onChange={(e) => setData(setting.key, e.target.value)}
                            className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                            autoComplete="new-password"
                        />
                    </div>
                );

            case 'textarea':
            case 'text_long':
            case 'json':
                return (
                    <div key={setting.key} className="py-3">
                        <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700">
                            {formatLabel(setting.key)}
                        </label>
                        <textarea
                            id={setting.key}
                            value={String(value ?? '')}
                            onChange={(e) => setData(setting.key, e.target.value)}
                            rows={4}
                            className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                        />
                        {setting.type === 'json' && (
                            <p className="mt-1 text-xs text-gray-500">Format JSON valide attendu.</p>
                        )}
                    </div>
                );

            case 'select':
                return (
                    <div key={setting.key} className="py-3">
                        <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700">
                            {formatLabel(setting.key)}
                        </label>
                        <select
                            id={setting.key}
                            value={String(value ?? '')}
                            onChange={(e) => setData(setting.key, e.target.value)}
                            className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS} sm:max-w-xs`}
                        >
                            <option value="">Choisir...</option>
                        </select>
                    </div>
                );

            case 'image':
                return (
                    <ImageUploadField
                        key={setting.key}
                        settingKey={setting.key}
                        value={value}
                        onChange={(url) => setData(setting.key, url)}
                    />
                );

            default:
                // text, string, email, url, etc.
                return (
                    <div key={setting.key} className="py-3">
                        <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700">
                            {formatLabel(setting.key)}
                        </label>
                        <input
                            id={setting.key}
                            type="text"
                            value={String(value ?? '')}
                            onChange={(e) => setData(setting.key, e.target.value)}
                            className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                        />
                    </div>
                );
        }
    }

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>}>
            <Head title="Paramètres" />

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Tab navigation */}
                <nav className="shrink-0 lg:w-48">
                    <div className="flex gap-1 overflow-x-auto lg:flex-col">
                        {tabConfig.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? ''
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                style={activeTab === tab.key ? adminTabActive : undefined}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Settings form */}
                <div className="flex-1">
                    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
                        <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                            {tabConfig.find((t) => t.key === activeTab)?.label ?? 'Paramètres'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">{tabDescription(activeTab)}</p>
                            </div>
                            <SettingsActions activeTab={activeTab} onAction={postSettingsAction} />
                        </div>

                        {actionMessage && (
                            <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                                actionMessage.type === 'success'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-red-200 bg-red-50 text-red-700'
                            }`}>
                                {actionMessage.text}
                            </div>
                        )}

                        {activeTab === 'dashboard' ? (
                            <DashboardThemeSelector
                                currentTheme={dashboardTheme}
                                onSelect={(id) => {
                                    setDashboardTheme(id);
                                    router.visit(`/${prefix}/settings`, {
                                        method: 'put',
                                        data: { settings: [{ key: 'dashboard.theme', value: id }] },
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                        ) : activeTab === 'security' ? (
                            <SecuritySettings settings={settings['security'] ?? []} />
                        ) : activeTab === 'analytics' ? (
                            <AnalyticsSettings settings={settings['analytics'] ?? []} />
                        ) : currentSettings.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-500">
                                Aucun paramètre dans cette section.
                            </p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {currentSettings.map((setting) => renderField(setting))}
                            </div>
                        )}

                        {activeTab !== 'dashboard' && activeTab !== 'security' && currentSettings.length > 0 && (
                            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:brightness-110"
                                    style={adminBtnPrimary}
                                >
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

function valueToInput(setting: SettingData): string {
    if (setting.type === 'json') {
        return JSON.stringify(setting.value ?? null, null, 2);
    }

    if (typeof setting.value === 'boolean') {
        return setting.value ? '1' : '0';
    }

    return String(setting.value ?? '');
}

function parseValueForSubmit(setting: SettingData | undefined, value: string): unknown {
    if (!setting) return value;

    if (setting.type === 'json') {
        try {
            return JSON.parse(value || 'null');
        } catch {
            return value;
        }
    }

    if (setting.type === 'number') {
        return value === '' ? null : Number(value);
    }

    if (setting.type === 'boolean' || setting.type === 'toggle') {
        return value === '1' || value === 'true';
    }

    return value;
}

function formatLabel(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tabDescription(tab: string): string {
    const descriptions: Record<string, string> = {
        general: 'Identite du site, URL, langue et fichiers de marque.',
        seo: 'Valeurs SEO globales utilisees par defaut sur le site.',
        mail: 'Expediteur et connexion SMTP pour les emails transactionnels.',
        content: 'Comportement par defaut des contenus et de la page d’accueil.',
        media: 'Types autorises, taille maximale et optimisation des images.',
        maintenance: 'Mode maintenance, message public et IP autorisees.',
        dashboard: 'Apparence de l’administration.',
        security: 'URLs sensibles, duree de session et options de securite.',
        analytics: 'Suivi statistique interne et integrations de mesure.',
    };

    return descriptions[tab] ?? 'Parametres du CMS.';
}

function SettingsActions({
    activeTab,
    onAction,
}: {
    activeTab: string;
    onAction: (action: 'test-mail' | 'clear-cache') => void;
}) {
    if (!['mail', 'general', 'media', 'maintenance'].includes(activeTab)) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {activeTab === 'mail' && (
                <button
                    type="button"
                    onClick={() => onAction('test-mail')}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <Send className="h-4 w-4" />
                    Tester l'email
                </button>
            )}
            <button
                type="button"
                onClick={() => onAction('clear-cache')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                <Trash2 className="h-4 w-4" />
                Vider le cache
            </button>
        </div>
    );
}

function DashboardThemeSelector({ currentTheme, onSelect }: { currentTheme: string; onSelect: (id: string) => void }) {
    return (
        <div className="py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Theme du tableau de bord</h3>
            <p className="text-xs text-gray-500 mb-4">Personnalisez les couleurs de l'interface d'administration</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DASHBOARD_THEMES.map((theme) => {
                    const isSelected = currentTheme === theme.id;
                    return (
                        <button
                            key={theme.id}
                            type="button"
                            onClick={() => onSelect(theme.id)}
                            className={`relative flex flex-col rounded-xl border-2 p-3 transition-all ${
                                isSelected ? 'shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                            style={isSelected ? { borderColor: theme.colors.primary, boxShadow: `0 0 0 1px ${theme.colors.primary}, 0 4px 6px -1px rgb(0 0 0 / 0.1)` } : undefined}
                        >
                            {isSelected && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: theme.colors.primary }}>
                                    <Check className="h-3 w-3" strokeWidth={3} />
                                </span>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex gap-1">
                                    <span className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: theme.colors.sidebarBg }} />
                                    <span className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: theme.colors.primary }} />
                                    <span className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: theme.colors.accent }} />
                                </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{theme.name}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{theme.description}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ImageUploadField({
    settingKey,
    value,
    onChange,
}: {
    settingKey: string;
    value: string;
    onChange: (url: string) => void;
}) {
    const { cms } = usePage<SharedProps>().props;
    const adminPrefix = cms?.adminPrefix ?? 'admin';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string>(value || '');

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch(`/${adminPrefix}/media`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success && result.media) {
                const url = result.media.url || result.media.path || '';
                setPreview(url);
                onChange(url);
            }
        } catch {
            // Silently fail - user can retry
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    function handleRemove() {
        setPreview('');
        onChange('');
    }

    return (
        <div className="py-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {formatLabel(settingKey)}
            </label>

            {preview ? (
                <div className="flex items-start gap-4">
                    <div className="relative group">
                        <img
                            src={preview}
                            alt={formatLabel(settingKey)}
                            className="h-20 w-20 rounded-lg border border-gray-200 object-contain bg-gray-50"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Supprimer"
                        >
                            &times;
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {uploading ? 'Envoi...' : 'Remplacer'}
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-[var(--admin-primary,#6366f1)] hover:text-[var(--admin-primary,#6366f1)]"
                >
                    <Upload className="h-5 w-5" />
                    {uploading ? 'Envoi en cours...' : 'Choisir une image'}
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}

function SecuritySettings({ settings }: { settings: SettingData[] }) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const existing = Object.fromEntries(settings.map((s) => [s.key, String(s.value ?? '')]));
    const { data, setData, processing } = useForm({
        login_path: existing.login_path || 'login',
        register_path: existing.register_path || 'register',
        admin_prefix: existing.admin_prefix || 'admin',
        force_https: existing.force_https || '0',
        session_lifetime: existing.session_lifetime || '120',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const settingsArray = Object.entries(data).map(([key, value]) => ({
            key: `security.${key}`,
            value: key === 'force_https' ? value === '1' || value === 'true' : key === 'session_lifetime' ? Number(value) : value,
        }));
        router.visit(`/${prefix}/settings`, {
            method: 'put',
            data: { settings: settingsArray },
            preserveState: true,
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                    Modifier ces valeurs affecte les URLs de votre site. Les anciennes URLs redirigeront automatiquement (301).
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="login_path" className="block text-sm font-medium text-gray-700 mb-1">
                        URL de connexion
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">/</span>
                        <input
                            id="login_path"
                            type="text"
                            value={data.login_path}
                            onChange={(e) => setData('login_path', e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ''))}
                            className={`flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                            placeholder="login"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Defaut : login</p>
                </div>

                <div>
                    <label htmlFor="register_path" className="block text-sm font-medium text-gray-700 mb-1">
                        URL d'inscription
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">/</span>
                        <input
                            id="register_path"
                            type="text"
                            value={data.register_path}
                            onChange={(e) => setData('register_path', e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ''))}
                            className={`flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                            placeholder="register"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Defaut : register</p>
                </div>

                <div>
                    <label htmlFor="admin_prefix" className="block text-sm font-medium text-gray-700 mb-1">
                        Prefix de l'administration
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">/</span>
                        <input
                            id="admin_prefix"
                            type="text"
                            value={data.admin_prefix}
                            onChange={(e) => setData('admin_prefix', e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ''))}
                            className={`flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                            placeholder="admin"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Defaut : admin. Changer ce prefix ameliore la securite.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="session_lifetime" className="block text-sm font-medium text-gray-700 mb-1">
                            Duree de session (minutes)
                        </label>
                        <input
                            id="session_lifetime"
                            type="number"
                            min="15"
                            max="1440"
                            value={data.session_lifetime}
                            onChange={(e) => setData('session_lifetime', e.target.value)}
                            className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                        />
                        <p className="mt-1 text-xs text-gray-500">Recommande : 60 a 240 minutes selon le contexte.</p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                        <div>
                            <label htmlFor="force_https" className="text-sm font-medium text-gray-700">
                                Forcer HTTPS
                            </label>
                            <p className="text-xs text-gray-500">A activer en production avec certificat SSL.</p>
                        </div>
                        <button
                            id="force_https"
                            type="button"
                            role="switch"
                            aria-checked={data.force_https === '1' || data.force_https === 'true'}
                            onClick={() => setData('force_https', data.force_https === '1' || data.force_https === 'true' ? '0' : '1')}
                            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                            style={{ backgroundColor: data.force_https === '1' || data.force_https === 'true' ? 'var(--admin-primary, #6366f1)' : '#e5e7eb' }}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${data.force_https === '1' || data.force_https === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end border-t border-gray-200 pt-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:brightness-110"
                    style={adminBtnPrimary}
                >
                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}
