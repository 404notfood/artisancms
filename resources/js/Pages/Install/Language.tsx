import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Select, SelectOption } from '@/Components/ui/select';
import { ChevronRight, ChevronLeft, Globe } from 'lucide-react';
import InstallLayout from './partials/InstallLayout';

interface Language {
    code: string;
    name: string;
    flag: string;
}

interface Props {
    languages: Language[];
    currentLocale: string;
}

export default function Language({ languages, currentLocale }: Props) {
    const { data, setData, post, processing } = useForm({
        locale: currentLocale || 'fr',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('install.language.store'));
    };

    return (
        <InstallLayout step={2} totalSteps={7}>
            <Head title="Installation - Langue" />

            <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                    <Globe className="h-7 w-7 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Bienvenue ! / Welcome!
                </h1>
                <p className="mt-2 text-gray-500">
                    Choisissez la langue de l'interface d'administration.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="locale">Langue / Language</Label>
                    <Select
                        id="locale"
                        value={data.locale}
                        onChange={(e) => setData('locale', e.target.value)}
                        className="w-full"
                    >
                        {languages.map((lang) => (
                            <SelectOption key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                            </SelectOption>
                        ))}
                    </Select>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        Langues disponibles :
                    </p>
                    <ul className="space-y-1.5">
                        {languages.map((lang) => (
                            <li
                                key={lang.code}
                                className="flex items-center gap-2 text-sm text-gray-600"
                            >
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                                <span className="text-gray-400">({lang.code})</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex justify-between pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Retour
                    </Button>
                    <Button type="submit" disabled={processing} size="lg">
                        Continuer
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </InstallLayout>
    );
}
