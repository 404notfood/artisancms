import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import type { SettingData } from '@/types/cms';

interface SettingsIndexProps {
    settings: Record<string, SettingData[]>;
}

const tabConfig: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'Général', icon: <GeneralIcon /> },
    { key: 'seo', label: 'SEO', icon: <SeoIcon /> },
    { key: 'mail', label: 'Email', icon: <MailIcon /> },
    { key: 'content', label: 'Contenu', icon: <ContentIcon /> },
    { key: 'media', label: 'Médias', icon: <MediaIcon /> },
    { key: 'maintenance', label: 'Maintenance', icon: <MaintenanceIcon /> },
];

export default function SettingsIndex({ settings }: SettingsIndexProps) {
    const availableTabs = tabConfig.filter((tab) => settings[tab.key] && settings[tab.key].length > 0);
    const [activeTab, setActiveTab] = useState(availableTabs[0]?.key ?? 'general');

    const currentSettings = settings[activeTab] ?? [];

    // Build initial form data from current tab's settings
    const initialValues: Record<string, string> = {};
    currentSettings.forEach((setting) => {
        initialValues[setting.key] = String(setting.value ?? '');
    });

    const { data, setData, put, processing } = useForm(initialValues);

    function handleTabChange(tabKey: string) {
        setActiveTab(tabKey);
        const tabSettings = settings[tabKey] ?? [];
        const values: Record<string, string> = {};
        tabSettings.forEach((setting) => {
            values[setting.key] = String(setting.value ?? '');
        });
        setData(values as typeof data);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        // Transform flat key/value pairs into the array format expected by the backend
        // Prefix each key with the active tab group (e.g., "maintenance.enabled")
        const settingsArray = Object.entries(data).map(([key, value]) => ({
            key: `${activeTab}.${key}`,
            value,
        }));
        router.put('/admin/settings', { settings: settingsArray } as any, {
            preserveState: true,
            preserveScroll: true,
        });
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
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                isChecked ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
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
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-xs"
                        />
                    </div>
                );

            case 'textarea':
            case 'text_long':
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
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
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
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-xs"
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
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
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
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            {tabConfig.find((t) => t.key === activeTab)?.label ?? 'Paramètres'}
                        </h2>

                        {currentSettings.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-500">
                                Aucun paramètre dans cette section.
                            </p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {currentSettings.map((setting) => renderField(setting))}
                            </div>
                        )}

                        {currentSettings.length > 0 && (
                            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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

function formatLabel(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Tab icons
function GeneralIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function SeoIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    );
}

function ContentIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function MediaIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18z" />
        </svg>
    );
}

function MaintenanceIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1h12.18M4.5 19.5h15" />
        </svg>
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
            const response = await fetch('/admin/media', {
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
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
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
