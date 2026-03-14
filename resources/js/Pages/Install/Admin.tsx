import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import InputError from '@/Components/InputError';
import { ChevronLeft, UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Props {
    defaults: {
        admin_name: string;
        admin_email: string;
    };
}

function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    if (!password) {
        return { score: 0, label: '', color: 'bg-gray-200' };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
        return { score, label: 'Faible', color: 'bg-red-500' };
    }
    if (score <= 4) {
        return { score, label: 'Moyen', color: 'bg-yellow-500' };
    }
    return { score, label: 'Fort', color: 'bg-green-500' };
}

export default function Admin({ defaults }: Props) {
    const { data, setData, post, processing, errors } = useForm({
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
        post(route('install.admin.store'));
    };

    return (
        <InstallLayout step={6} totalSteps={7}>
            <Head title="Installation - Administrateur" />

            <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                    <UserPlus className="h-7 w-7 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Compte administrateur
                </h1>
                <p className="mt-2 text-gray-500">
                    Créez votre compte administrateur pour accéder au tableau de bord.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="admin_name">Nom complet</Label>
                    <Input
                        id="admin_name"
                        value={data.admin_name}
                        onChange={(e) => setData('admin_name', e.target.value)}
                        placeholder="Admin"
                        error={!!errors.admin_name}
                        autoFocus
                    />
                    <InputError message={errors.admin_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="admin_email">Adresse e-mail</Label>
                    <Input
                        id="admin_email"
                        type="email"
                        value={data.admin_email}
                        onChange={(e) => setData('admin_email', e.target.value)}
                        placeholder="admin@artisancms.dev"
                        error={!!errors.admin_email}
                    />
                    <InputError message={errors.admin_email} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="admin_password">Mot de passe</Label>
                    <Input
                        id="admin_password"
                        type="password"
                        value={data.admin_password}
                        onChange={(e) =>
                            setData('admin_password', e.target.value)
                        }
                        placeholder="••••••••••••"
                        error={!!errors.admin_password}
                    />

                    {/* Password strength indicator */}
                    {data.admin_password && (
                        <div className="space-y-1.5">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'h-1.5 flex-1 rounded-full transition-colors',
                                            i <= passwordStrength.score
                                                ? passwordStrength.color
                                                : 'bg-gray-200'
                                        )}
                                    />
                                ))}
                            </div>
                            <p
                                className={cn(
                                    'text-xs',
                                    passwordStrength.score <= 2
                                        ? 'text-red-600'
                                        : passwordStrength.score <= 4
                                          ? 'text-yellow-600'
                                          : 'text-green-600'
                                )}
                            >
                                Force : {passwordStrength.label}
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-gray-400">
                        Min. 8 caractères, 1 majuscule, 1 chiffre.
                    </p>
                    <InputError message={errors.admin_password} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="admin_password_confirmation">
                        Confirmer le mot de passe
                    </Label>
                    <Input
                        id="admin_password_confirmation"
                        type="password"
                        value={data.admin_password_confirmation}
                        onChange={(e) =>
                            setData(
                                'admin_password_confirmation',
                                e.target.value
                            )
                        }
                        placeholder="••••••••••••"
                        error={!!errors.admin_password_confirmation}
                    />
                    <InputError message={errors.admin_password_confirmation} />
                </div>

                <div className="flex justify-between pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Retour
                    </Button>
                    <Button type="submit" disabled={processing} size="lg">
                        {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Installer
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </InstallLayout>
    );
}
