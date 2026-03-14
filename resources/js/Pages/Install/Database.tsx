import { Head, useForm } from '@inertiajs/react';
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
                    'Accept': 'application/json',
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
                message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
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
        <InstallLayout step={4} totalSteps={7}>
            <Head title="Installation - Base de données" />

            <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                    <DatabaseIcon className="h-7 w-7 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Base de données
                </h1>
                <p className="mt-2 text-gray-500">
                    Configurez votre connexion MySQL / MariaDB.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="db_host">Serveur</Label>
                        <Input
                            id="db_host"
                            value={data.db_host}
                            onChange={(e) => setData('db_host', e.target.value)}
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
                            onChange={(e) => setData('db_port', e.target.value)}
                            placeholder="3306"
                            error={!!errors.db_port}
                        />
                        <InputError message={errors.db_port} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="db_database">Nom de la base de données</Label>
                    <Input
                        id="db_database"
                        value={data.db_database}
                        onChange={(e) => setData('db_database', e.target.value)}
                        placeholder="artisan_cms"
                        error={!!errors.db_database}
                    />
                    <InputError message={errors.db_database} />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="create_database"
                        checked={data.create_database}
                        onChange={(e) =>
                            setData('create_database', e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="create_database" className="cursor-pointer">
                        Créer la base si elle n'existe pas
                    </Label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="db_username">Nom d'utilisateur</Label>
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
                        <span className="text-gray-400 font-normal">
                            (optionnel)
                        </span>
                    </Label>
                    <Input
                        id="db_prefix"
                        value={data.db_prefix}
                        onChange={(e) => setData('db_prefix', e.target.value)}
                        placeholder="cms_"
                        error={!!errors.db_prefix}
                    />
                    <InputError message={errors.db_prefix} />
                </div>

                {/* Test connection button */}
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="secondary"
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
                        {testResult.success ? (
                            <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                            <X className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    testResult.success
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                )}
                            >
                                {testResult.message}
                            </p>
                            {testResult.version && (
                                <p className="text-xs text-gray-500 mt-1">
                                    MySQL {testResult.version}
                                </p>
                            )}
                        </div>
                    </div>
                )}

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
                        Continuer
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </InstallLayout>
    );
}
