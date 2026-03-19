import { Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import type { StatCardProps } from './types';

export function StatCard({ label, value, icon, iconBg, iconColor, href }: StatCardProps) {
    const content = (
        <Card
            className={cn(
                'group relative overflow-hidden transition-all duration-200',
                href && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
            )}
        >
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                            iconBg
                        )}
                    >
                        <div className={iconColor}>{icon}</div>
                    </div>
                    <div className="min-w-0">
                        <p className="text-3xl font-bold tracking-tight text-gray-900">
                            {value.toLocaleString('fr-FR')}
                        </p>
                        <p className="text-sm font-medium text-gray-500">{label}</p>
                    </div>
                </div>
            </CardContent>
            {href && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            )}
        </Card>
    );

    if (href) {
        return <Link href={href} className="block">{content}</Link>;
    }

    return content;
}
