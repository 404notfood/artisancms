import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectOption } from '@/Components/ui/select';
import InputError from '@/Components/InputError';
import {
    ChevronLeft,
    Settings,
    Loader2,
    Rocket,
    Globe2,
    UserPlus,
    Eye,
    EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Props {
    defaults: {
        site_name: string;
        site_description: string;
        site_url: string;
        timezone: string;
        admin_name: string;
        admin_email: string;
    };
    timezones: string[];
}

type Tab = 'site' | 'admin';

function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    if (!password) {
        return { score: 0, label: '', color: 'bg-slate-200' };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Moyen', color: 'bg-amber-500' };
    return { score, label: 'Fort', color: 'bg-green-500' };
}

export default function Configuration({ defaults, timezones }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('site');
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        site_name: defaults.site_name || '',
        site_description: defaults.site_description || '',
        site_url: defaults.site_url || '',
        timezone: defaults.timezone || 'Europe/Paris',
        admin_name: defaults.admin_name || '',
        admin_email: defaults.admin_email || '',
        admin_password: '',
        admin_password_confirmation: '',
    });

    const passwordStrength = useMemo(
        () => getPasswordStrength(data.admin_password),
        [data.admin_password]
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('install.configuration.store'));
    };

    const tabs: { id: Tab; label: string; icon: typeof Globe2 }[] = [
        { id: 'site', label: 'Votre site', icon: Globe2 },
        { id: 'admin', label: 'Administrateur', icon: UserPlus },
    ];

    const siteFieldsFilled = data.site_name && data.site_url;
    const adminFieldsFilled = data.admin_name && data.admin_email && data.admin_password && data.admin_password_confirmation;

    return (
        <InstallLayout step={5}>
            <Head title="Installation - Configuration" />

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                            <Settings className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Derniere ligne droite !
                            </h1>
                            <p className="text-sm text-slate-500">
                                Donnez un nom a votre site et creez votre compte
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 px-8">
                    <div className="flex gap-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const isComplete = tab.id === 'site' ? !!siteFieldsFilled : !!adminFieldsFilled;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                                        isActive
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                    {isComplete && !isActive && (
                                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit}>
                    <div className="p-8">
                        {/* Site tab */}
                        <div className={cn(activeTab === 'site' ? 'block' : 'hidden')}>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="site_name">Nom du site *</Label>
                                    <Input
                                        id="site_name"
                                        value={data.site_name}
                                        onChange={(e) =>
                                            setData('site_name', e.target.value)
                                        }
                                        placeholder="Mon site ArtisanCMS"
                                        error={!!errors.site_name}
                                        autoFocus
                                    />
                                    <InputError message={errors.site_name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="site_description">
                                        Description{' '}
                                        <span className="text-slate-400 font-normal">
                                            (tagline)
                                        </span>
                                    </Label>
                                    <Input
                                        id="site_description"
                                        value={data.site_description}
                                        onChange={(e) =>
                                            setData(
                                                'site_description',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Un site construit avec ArtisanCMS"
                                        error={!!errors.site_description}
                                    />
                                    <InputError
                                        message={errors.site_description}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="site_url">URL du site *</Label>
                                    <Input
                                        id="site_url"
                                        type="url"
                                        value={data.site_url}
                                        onChange={(e) =>
                                            setData('site_url', e.target.value)
                                        }
                                        placeholder="https://mon-site.com"
                                        error={!!errors.site_url}
                                    />
                                    <p className="text-xs text-slate-400">
                                        Auto-détectée. Modifiez si nécessaire.
                                    </p>
                                    <InputError message={errors.site_url} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timezone">
                                        Fuseau horaire
                                    </Label>
                                    <Select
                                        id="timezone"
                                        value={data.timezone}
                                        onChange={(e) =>
                                            setData('timezone', e.target.value)
                                        }
                                        error={!!errors.timezone}
                                    >
                                        {timezones.map((tz) => (
                                            <SelectOption key={tz} value={tz}>
                                                {tz}
                                            </SelectOption>
                                        ))}
                                    </Select>
                                    <InputError message={errors.timezone} />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('admin')}
                                        variant="outline"
                                    >
                                        Suivant : Administrateur
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Admin tab */}
                        <div className={cn(activeTab === 'admin' ? 'block' : 'hidden')}>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="admin_name">
                                        Nom complet *
                                    </Label>
                                    <Input
                                        id="admin_name"
                                        value={data.admin_name}
                                        onChange={(e) =>
                                            setData(
                                                'admin_name',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Jean Dupont"
                                        error={!!errors.admin_name}
                                    />
                                    <InputError message={errors.admin_name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="admin_email">
                                        Adresse e-mail *
                                    </Label>
                                    <Input
                                        id="admin_email"
                                        type="email"
                                        value={data.admin_email}
                                        onChange={(e) =>
                                            setData(
                                                'admin_email',
                                                e.target.value
                                            )
                                        }
                                        placeholder="admin@monsite.com"
                                        error={!!errors.admin_email}
                                    />
                                    <InputError message={errors.admin_email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="admin_password">
                                        Mot de passe *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="admin_password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.admin_password}
                                            onChange={(e) =>
                                                setData(
                                                    'admin_password',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="••••••••••••"
                                            error={!!errors.admin_password}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Password strength */}
                                    {data.admin_password && (
                                        <div className="space-y-1.5">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5, 6].map(
                                                    (i) => (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                'h-1.5 flex-1 rounded-full transition-all duration-300',
                                                                i <=
                                                                    passwordStrength.score
                                                                    ? passwordStrength.color
                                                                    : 'bg-slate-200'
                                                            )}
                                                        />
                                                    )
                                                )}
                                            </div>
                                            <p
                                                className={cn(
                                                    'text-xs font-medium',
                                                    passwordStrength.score <= 2
                                                        ? 'text-red-600'
                                                        : passwordStrength.score <=
                                                            4
                                                          ? 'text-amber-600'
                                                          : 'text-green-600'
                                                )}
                                            >
                                                Force : {passwordStrength.label}
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-400">
                                        Min. 8 caractères, 1 majuscule, 1 chiffre.
                                    </p>
                                    <InputError
                                        message={errors.admin_password}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="admin_password_confirmation">
                                        Confirmer le mot de passe *
                                    </Label>
                                    <Input
                                        id="admin_password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        value={
                                            data.admin_password_confirmation
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'admin_password_confirmation',
                                                e.target.value
                                            )
                                        }
                                        placeholder="••••••••••••"
                                        error={
                                            !!errors.admin_password_confirmation
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors.admin_password_confirmation
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
                        <div className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    if (activeTab === 'admin') {
                                        setActiveTab('site');
                                    } else {
                                        window.history.back();
                                    }
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                {activeTab === 'admin' ? 'Votre site' : 'Retour'}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                size="lg"
                                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600"
                            >
                                {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Rocket className="h-4 w-4" />
                                )}
                                Lancer l'installation
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </InstallLayout>
    );
}
