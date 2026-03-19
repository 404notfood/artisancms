import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Server, Puzzle, Palette } from 'lucide-react';
import { type ReactNode } from 'react';
import type { DashboardProps } from './types';

function SystemInfoItem({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {label}
            </p>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                {icon}
                {value}
            </p>
        </div>
    );
}

export function SystemInfo({ system }: { system: DashboardProps['system'] }) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-4 w-4 text-gray-500" />
                    Informations systeme
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <SystemInfoItem
                        label="ArtisanCMS"
                        value={`v${system?.cms_version ?? '1.0.0'}`}
                    />
                    <SystemInfoItem
                        label="PHP"
                        value={system?.php_version ?? '-'}
                    />
                    <SystemInfoItem
                        label="Laravel"
                        value={`v${system?.laravel_version ?? '-'}`}
                    />
                    <SystemInfoItem
                        label="Plugins actifs"
                        value={String(system?.active_plugins ?? 0)}
                        icon={<Puzzle className="h-3.5 w-3.5 text-gray-400" />}
                    />
                    <SystemInfoItem
                        label="Theme actif"
                        value={system?.active_theme ?? 'Default'}
                        icon={<Palette className="h-3.5 w-3.5 text-gray-400" />}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
