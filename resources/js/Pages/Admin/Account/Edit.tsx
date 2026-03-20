import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Camera, User, Shield, AlertTriangle } from 'lucide-react';
import type { UserData, RoleData, SharedProps } from '@/types/cms';
import { adminTabActive } from '@/lib/admin-theme';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import DangerTab from './DangerTab';

interface AccountEditProps {
    user: UserData & {
        social_links?: Record<string, string> | null;
        profile_visibility?: string;
        avatar_url?: string | null;
        preferences?: Record<string, unknown> | null;
    };
    roles: RoleData[];
}

const TABS = [
    { key: 'profile', label: 'Profil', icon: User },
    { key: 'security', label: 'Securite', icon: Shield },
    { key: 'danger', label: 'Danger', icon: AlertTriangle },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function AccountEdit({ user, roles }: AccountEditProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [activeTab, setActiveTab] = useState<TabKey>('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const displayAvatar = avatarPreview || user.avatar_url;
    const userInitials = user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        const formData = new FormData();
        formData.append('avatar', file);
        setUploading(true);
        router.post(`/${prefix}/account/avatar`, formData, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    }

    return (
        <AdminLayout>
            <Head title="Mon compte" />

            <div className="max-w-3xl mx-auto">
                {/* Header gradient */}
                <div
                    className="relative h-36 rounded-t-2xl overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, var(--admin-primary, #6366f1) 0%, color-mix(in srgb, var(--admin-primary, #6366f1) 70%, #000) 100%)`,
                    }}
                >
                    {/* Decorative dots pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}
                    />
                </div>

                {/* Avatar overlapping header */}
                <div className="relative px-6 -mt-12 mb-4">
                    <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-5">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="group relative shrink-0"
                        >
                            {displayAvatar ? (
                                <img
                                    src={displayAvatar}
                                    alt={user.name}
                                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div
                                    className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white shadow-lg"
                                    style={{ backgroundColor: 'var(--admin-primary, #6366f1)' }}
                                >
                                    <span className="text-2xl font-bold text-white">{userInitials}</span>
                                </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <div className="mt-3 text-center sm:text-left sm:pb-1">
                            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6 mb-6">
                    <nav className="flex gap-1 -mb-px">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                                        isActive ? '' : 'text-gray-500 hover:text-gray-700'
                                    } ${tab.key === 'danger' && isActive ? '' : ''}`}
                                    style={
                                        isActive
                                            ? tab.key === 'danger'
                                                ? { backgroundColor: 'rgb(254 242 242)', color: 'rgb(220 38 38)' }
                                                : adminTabActive
                                            : undefined
                                    }
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab content */}
                <div className="px-6 pb-8">
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        {activeTab === 'profile' && <ProfileTab user={user} />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'danger' && <DangerTab />}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
