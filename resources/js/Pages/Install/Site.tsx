import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectOption } from '@/Components/ui/select';
import InputError from '@/Components/InputError';
import { ChevronRight, ChevronLeft, Globe2, Loader2 } from 'lucide-react';
import InstallLayout from './partials/InstallLayout';

interface Props {
    defaults: {
        site_name: string;
        site_description: string;
        site_url: string;
        timezone: string;
    };
    timezones: string[];
}

export default function Site({ defaults, timezones }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        site_name: defaults.site_name || '',
        site_description: defaults.site_description || '',
        site_url: defaults.site_url || '',
        timezone: defaults.timezone || 'Europe/Paris',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('install.site.store'));
    };

    return (
        <InstallLayout step={5} totalSteps={7}>
            <Head title="Installation - Votre site" />

            <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                    <Globe2 className="h-7 w-7 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Votre site
                </h1>
                <p className="mt-2 text-gray-500">
                    Configurez les informations de base de votre site.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="site_name">Nom du site</Label>
                    <Input
                        id="site_name"
                        value={data.site_name}
                        onChange={(e) => setData('site_name', e.target.value)}
                        placeholder="Mon site ArtisanCMS"
                        error={!!errors.site_name}
                        autoFocus
                    />
                    <InputError message={errors.site_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="site_description">
                        Description{' '}
                        <span className="text-gray-400 font-normal">
                            (tagline)
                        </span>
                    </Label>
                    <Input
                        id="site_description"
                        value={data.site_description}
                        onChange={(e) =>
                            setData('site_description', e.target.value)
                        }
                        placeholder="Un site construit avec ArtisanCMS"
                        error={!!errors.site_description}
                    />
                    <InputError message={errors.site_description} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="site_url">URL du site</Label>
                    <Input
                        id="site_url"
                        type="url"
                        value={data.site_url}
                        onChange={(e) => setData('site_url', e.target.value)}
                        placeholder="https://mon-site.com"
                        error={!!errors.site_url}
                    />
                    <p className="text-xs text-gray-400">
                        Auto-détectée depuis l'URL actuelle. Modifiez si nécessaire.
                    </p>
                    <InputError message={errors.site_url} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    <Select
                        id="timezone"
                        value={data.timezone}
                        onChange={(e) => setData('timezone', e.target.value)}
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
