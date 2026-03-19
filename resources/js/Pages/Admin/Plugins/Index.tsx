import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Puzzle } from 'lucide-react';
import type { FlashMessages } from '@/types/cms';

interface PluginItem {
    slug: string;
    name: string;
    version: string;
    description: string;
    author: string;
    enabled: boolean;
    settings: Record<string, unknown>;
}

interface PluginsIndexProps {
    plugins: PluginItem[];
}

export default function PluginsIndex({ plugins }: PluginsIndexProps) {
    const { flash } = usePage().props as unknown as { flash: FlashMessages };
    const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

    function handleToggle(plugin: PluginItem) {
        setTogglingSlug(plugin.slug);
        const action = plugin.enabled ? 'disable' : 'enable';
        router.post(`/admin/plugins/${plugin.slug}/${action}`, {}, {
            preserveScroll: true,
            onFinish: () => setTogglingSlug(null),
        });
    }

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Plugins</h1>}>
            <Head title="Plugins" />

            {/* Flash message */}
            {flash.success && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            {plugins.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                    <Puzzle className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1} />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun plugin</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Placez vos plugins dans le dossier content/plugins/ pour les voir ici.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <ul className="divide-y divide-gray-200">
                        {plugins.map((plugin) => (
                            <li
                                key={plugin.slug}
                                className={`flex items-center justify-between gap-4 px-6 py-4 transition-colors ${
                                    plugin.enabled ? '' : 'bg-gray-50'
                                }`}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    {/* Status indicator */}
                                    <div
                                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                            plugin.enabled ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3
                                                className={`truncate text-sm font-semibold ${
                                                    plugin.enabled ? 'text-gray-900' : 'text-gray-500'
                                                }`}
                                            >
                                                {plugin.name}
                                            </h3>
                                            <span className="text-xs text-gray-400">v{plugin.version}</span>
                                        </div>
                                        {plugin.description && (
                                            <p
                                                className={`mt-0.5 truncate text-xs ${
                                                    plugin.enabled ? 'text-gray-500' : 'text-gray-400'
                                                }`}
                                            >
                                                {plugin.description}
                                            </p>
                                        )}
                                        {plugin.author && (
                                            <p className="mt-0.5 text-xs text-gray-400">
                                                par {plugin.author}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Toggle */}
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={plugin.enabled}
                                    aria-label={`${plugin.enabled ? 'Desactiver' : 'Activer'} ${plugin.name}`}
                                    disabled={togglingSlug === plugin.slug}
                                    onClick={() => handleToggle(plugin)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                                        plugin.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                                            plugin.enabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </AdminLayout>
    );
}

