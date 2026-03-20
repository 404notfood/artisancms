import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';

interface SettingsData {
    modules: Record<string, boolean>;
    profile: Record<string, string | number | boolean>;
    directory: Record<string, string | number | boolean>;
    registration: Record<string, string | boolean>;
    social_login: Record<string, string>;
    stripe: Record<string, string>;
}

interface SettingsProps {
    settings: SettingsData;
}

const MODULE_LABELS: Record<string, { label: string; description: string }> = {
    member_directory: { label: 'Annuaire des membres', description: 'Page publique listant les membres' },
    content_restriction: { label: 'Restriction de contenu', description: 'Restreindre l\'acces aux pages et articles' },
    custom_fields: { label: 'Champs personnalises', description: 'Ajouter des champs au profil membre' },
    social_login: { label: 'Social Login', description: 'Connexion via Google, Facebook, GitHub' },
    two_factor: { label: '2FA', description: 'Authentification a deux facteurs (TOTP)' },
    membership_plans: { label: 'Plans d\'abonnement', description: 'Plans payants avec Stripe' },
    user_verification: { label: 'Verification des membres', description: 'Verification manuelle par un admin' },
};

export default function Settings({ settings }: SettingsProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { data, setData, put, processing } = useForm(settings);
    const [activeTab, setActiveTab] = useState('modules');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/${prefix}/member-space/settings`);
    }

    function toggleModule(key: string) {
        setData('modules', { ...data.modules, [key]: !data.modules[key] });
    }

    const tabs = [
        { key: 'modules', label: 'Modules' },
        { key: 'profile', label: 'Profils' },
        { key: 'directory', label: 'Annuaire' },
        { key: 'registration', label: 'Inscription' },
        { key: 'social', label: 'Social Login' },
        { key: 'stripe', label: 'Stripe' },
    ];

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
    const labelClass = 'block text-sm font-medium text-gray-700';

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Parametres Espace Membre</h1>}>
            <Head title="Parametres Espace Membre" />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Modules */}
                {activeTab === 'modules' && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Modules</h2>
                        <p className="text-sm text-gray-500">Activez ou desactivez les fonctionnalites.</p>
                        <div className="space-y-3">
                            {Object.entries(MODULE_LABELS).map(([key, info]) => (
                                <label key={key} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{info.label}</p>
                                        <p className="text-xs text-gray-500">{info.description}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={data.modules[key] ?? false}
                                        onChange={() => toggleModule(key)}
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Profile */}
                {activeTab === 'profile' && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Profils</h2>
                        <div>
                            <label className={labelClass}>Visibilite par defaut</label>
                            <select value={String(data.profile.default_visibility)} onChange={(e) => setData('profile', { ...data.profile, default_visibility: e.target.value })} className={inputClass}>
                                <option value="public">Public</option>
                                <option value="members_only">Membres uniquement</option>
                                <option value="private">Prive</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Longueur max de la bio</label>
                            <input type="number" value={Number(data.profile.max_bio_length)} onChange={(e) => setData('profile', { ...data.profile, max_bio_length: parseInt(e.target.value) || 500 })} className={inputClass} min={100} max={5000} />
                        </div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={Boolean(data.profile.require_avatar)} onChange={(e) => setData('profile', { ...data.profile, require_avatar: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Avatar obligatoire</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={Boolean(data.profile.enable_cover_photo)} onChange={(e) => setData('profile', { ...data.profile, enable_cover_photo: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Activer la photo de couverture</span>
                        </label>
                    </div>
                )}

                {/* Directory */}
                {activeTab === 'directory' && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Annuaire</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Membres par page</label>
                                <input type="number" value={Number(data.directory.per_page)} onChange={(e) => setData('directory', { ...data.directory, per_page: parseInt(e.target.value) || 12 })} className={inputClass} min={6} max={48} />
                            </div>
                            <div>
                                <label className={labelClass}>Tri par defaut</label>
                                <select value={String(data.directory.default_sort)} onChange={(e) => setData('directory', { ...data.directory, default_sort: e.target.value })} className={inputClass}>
                                    <option value="newest">Plus recents</option>
                                    <option value="oldest">Plus anciens</option>
                                    <option value="name">Nom</option>
                                    <option value="recently_active">Recemment actifs</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Layout</label>
                            <select value={String(data.directory.layout)} onChange={(e) => setData('directory', { ...data.directory, layout: e.target.value })} className={inputClass}>
                                <option value="grid">Grille</option>
                                <option value="list">Liste</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Registration */}
                {activeTab === 'registration' && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Inscription</h2>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={Boolean(data.registration.enable_custom_registration)} onChange={(e) => setData('registration', { ...data.registration, enable_custom_registration: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Activer l'inscription personnalisee</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={Boolean(data.registration.require_email_verification)} onChange={(e) => setData('registration', { ...data.registration, require_email_verification: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Verification email obligatoire</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={Boolean(data.registration.auto_create_profile)} onChange={(e) => setData('registration', { ...data.registration, auto_create_profile: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Creer le profil automatiquement</span>
                        </label>
                    </div>
                )}

                {/* Social Login */}
                {activeTab === 'social' && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Social Login</h2>
                        <p className="text-sm text-gray-500">Configurez les identifiants OAuth pour chaque provider.</p>
                        {['google', 'facebook', 'github'].map((provider) => (
                            <div key={provider} className="space-y-2 rounded-lg border border-gray-100 p-4">
                                <h3 className="text-sm font-semibold text-gray-800">{provider.charAt(0).toUpperCase() + provider.slice(1)}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Client ID</label>
                                        <input type="text" value={data.social_login[`${provider}_client_id`] || ''} onChange={(e) => setData('social_login', { ...data.social_login, [`${provider}_client_id`]: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Client Secret</label>
                                        <input type="password" value={data.social_login[`${provider}_client_secret`] || ''} onChange={(e) => setData('social_login', { ...data.social_login, [`${provider}_client_secret`]: e.target.value })} className={inputClass} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stripe */}
                {activeTab === 'stripe' && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Stripe</h2>
                        <p className="text-sm text-gray-500">Configuration pour les plans payants.</p>
                        <div>
                            <label className={labelClass}>Cle publique</label>
                            <input type="text" value={data.stripe.publishable_key || ''} onChange={(e) => setData('stripe', { ...data.stripe, publishable_key: e.target.value })} className={inputClass} placeholder="pk_..." />
                        </div>
                        <div>
                            <label className={labelClass}>Cle secrete</label>
                            <input type="password" value={data.stripe.secret_key || ''} onChange={(e) => setData('stripe', { ...data.stripe, secret_key: e.target.value })} className={inputClass} placeholder="sk_..." />
                        </div>
                        <div>
                            <label className={labelClass}>Webhook Secret</label>
                            <input type="password" value={data.stripe.webhook_secret || ''} onChange={(e) => setData('stripe', { ...data.stripe, webhook_secret: e.target.value })} className={inputClass} placeholder="whsec_..." />
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
