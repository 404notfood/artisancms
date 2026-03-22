import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import InputError from '@/Components/InputError';
import {
    ChevronRight,
    ChevronLeft,
    Database as DatabaseIcon,
    Check,
    X,
    Loader2,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Props {
    defaults: {
        db_host: string;
        db_port: string;
        db_database: string;
        db_username: string;
        db_password: string;
        db_prefix: string;
    };
}

interface TestResult {
    success: boolean;
    message: string;
    version: string | null;
}

export default function Database({ defaults }: Props) {
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [testing, setTesting] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        db_host: defaults.db_host || '127.0.0.1',
        db_port: defaults.db_port || '3306',
        db_database: defaults.db_database || 'artisan_cms',
        db_username: defaults.db_username || 'root',
        db_password: defaults.db_password || '',
        db_prefix: defaults.db_prefix || '',
        create_database: true,
    });

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const response = await fetch(route('install.database.test'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    db_host: data.db_host,
                    db_port: data.db_port,
                    db_database: data.db_database,
                    db_username: data.db_username,
                    db_password: data.db_password,
                    create_database: data.create_database,
                }),
            });

            const result: TestResult = await response.json();
            setTestResult(result);
        } catch {
            setTestResult({
                success: false,
                message:
                    'Impossible de contacter le serveur. Vérifiez votre connexion.',
                version: null,
            });
        } finally {
            setTesting(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('install.database.store'));
    };

    return (
        <InstallLayout step={4}>
            <Head title="Installation - Base de données" />

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                            <DatabaseIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Base de données
                            </h1>
                            <p className="text-sm text-slate-500">
                                Configurez votre connexion MySQL / MariaDB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-8 space-y-5">
                    {/* Info box */}
                    <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-4">
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                            Ces informations sont fournies par votre hébergeur. Si vous utilisez Laragon, WAMP ou XAMPP, les valeurs par défaut devraient fonctionner.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="db_host">Serveur</Label>
                            <Input
                                id="db_host"
                                value={data.db_host}
                                onChange={(e) =>
                                    setData('db_host', e.target.value)
                                }
                                placeholder="127.0.0.1"
                                error={!!errors.db_host}
                            />
                            <InputError message={errors.db_host} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="db_port">Port</Label>
                            <Input
                                id="db_port"
                                value={data.db_port}
                                onChange={(e) =>
                                    setData('db_port', e.target.value)
                                }
                                placeholder="3306"
                                error={!!errors.db_port}
                            />
                            <InputError message={errors.db_port} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="db_database">
                            Nom de la base de données
                        </Label>
                        <Input
                            id="db_database"
                            value={data.db_database}
                            onChange={(e) =>
                                setData('db_database', e.target.value)
                            }
                            placeholder="artisan_cms"
                            error={!!errors.db_database}
                        />
                        <InputError message={errors.db_database} />
                    </div>

                    <label
                        htmlFor="create_database"
                        className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all',
                            data.create_database
                                ? 'border-indigo-200 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                        )}
                    >
                        <input
                            type="checkbox"
                            id="create_database"
                            checked={data.create_database}
                            onChange={(e) =>
                                setData('create_database', e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-slate-700">
                                Créer automatiquement la base de données
                            </span>
                            <p className="text-xs text-slate-400">
                                Si la base n'existe pas, elle sera créée automatiquement.
                            </p>
                        </div>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="db_username">
                                Nom d'utilisateur
                            </Label>
                            <Input
                                id="db_username"
                                value={data.db_username}
                                onChange={(e) =>
                                    setData('db_username', e.target.value)
                                }
                                placeholder="root"
                                error={!!errors.db_username}
                            />
                            <InputError message={errors.db_username} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="db_password">Mot de passe</Label>
                            <Input
                                id="db_password"
                                type="password"
                                value={data.db_password}
                                onChange={(e) =>
                                    setData('db_password', e.target.value)
                                }
                                placeholder="••••••••"
                                error={!!errors.db_password}
                            />
                            <InputError message={errors.db_password} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="db_prefix">
                            Préfixe des tables{' '}
                            <span className="text-slate-400 font-normal">
                                (optionnel)
                            </span>
                        </Label>
                        <Input
                            id="db_prefix"
                            value={data.db_prefix}
                            onChange={(e) =>
                                setData('db_prefix', e.target.value)
                            }
                            placeholder="cms_"
                            error={!!errors.db_prefix}
                        />
                        <p className="text-xs text-slate-400">
                            Utile si vous partagez la base avec d'autres applications.
                        </p>
                        <InputError message={errors.db_prefix} />
                    </div>

                    {/* Test connection */}
                    <div className="pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={testConnection}
                            disabled={testing}
                        >
                            {testing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <DatabaseIcon className="h-4 w-4" />
                            )}
                            Tester la connexion
                        </Button>
                    </div>

                    {/* Test result */}
                    {testResult && (
                        <div
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-4',
                                testResult.success
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                            )}
                        >
                            <div className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                testResult.success ? 'bg-green-100' : 'bg-red-100'
                            )}>
                                {testResult.success ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <X className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        'text-sm font-semibold',
                                        testResult.success
                                            ? 'text-green-800'
                                            : 'text-red-800'
                                    )}
                                >
                                    {testResult.success ? 'Connexion réussie' : 'Échec de la connexion'}
                                </p>
                                <p className={cn(
                                    'text-sm mt-0.5',
                                    testResult.success ? 'text-green-600' : 'text-red-600'
                                )}>
                                    {testResult.message}
                                </p>
                                {testResult.version && (
                                    <p className="text-xs text-slate-500 mt-1 font-mono">
                                        MySQL {testResult.version}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Footer */}
                    <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
                        <div className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.get(route('install.requirements'))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                size="lg"
                            >
                                {processing && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Continuer
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </InstallLayout>
    );
}
