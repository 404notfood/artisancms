import { Head } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Check,
    ExternalLink,
    AlertTriangle,
    Globe,
    Mail,
    Database,
    Palette,
    Info,
} from 'lucide-react';
import InstallLayout from './partials/InstallLayout';

interface Props {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    version: string;
}

export default function Complete({
    siteName,
    siteUrl,
    adminEmail,
    version,
}: Props) {
    return (
        <InstallLayout step={7} totalSteps={7} hideProgress>
            <Head title="Installation terminée" />

            <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Installation terminée !
                </h1>
                <p className="mt-2 text-gray-500">
                    ArtisanCMS a été installé avec succès.
                </p>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-200 mb-6">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Site</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                        {siteName}
                    </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">URL</span>
                    </div>
                    <a
                        href={siteUrl}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {siteUrl}
                    </a>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Admin</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                        {adminEmail}
                    </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Version</span>
                    </div>
                    <Badge variant="secondary">{version}</Badge>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Palette className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Thème</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                        Default Theme
                    </span>
                </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 mb-6">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-yellow-700">
                        Notez bien votre mot de passe admin !
                    </p>
                    <p className="text-xs text-yellow-600 mt-0.5">
                        Il ne sera plus affiché après cette page.
                    </p>
                </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 mb-6">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                    Connectez-vous au tableau de bord pour commencer à créer des pages,
                    personnaliser votre thème et configurer vos plugins.
                </p>
            </div>

            {/* CTA */}
            <div className="flex justify-center">
                <a href="/admin">
                    <Button size="lg">
                        Accéder au tableau de bord
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </a>
            </div>
        </InstallLayout>
    );
}
