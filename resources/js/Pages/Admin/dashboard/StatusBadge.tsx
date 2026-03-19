import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';
import { statusConfig } from './types';

export function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status];

    return (
        <Badge
            variant="outline"
            className={cn(
                'text-[11px] font-medium',
                config?.className ?? 'bg-gray-50 text-gray-600 border-gray-200'
            )}
        >
            {config?.label ?? status}
        </Badge>
    );
}
