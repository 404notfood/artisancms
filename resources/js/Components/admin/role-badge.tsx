import { cn } from '@/lib/utils';
import type { RoleData } from '@/types/cms';

const ROLE_STYLES: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    editor: 'bg-blue-100 text-blue-800',
    author: 'bg-green-100 text-green-800',
    contributor: 'bg-yellow-100 text-yellow-800',
    subscriber: 'bg-gray-100 text-gray-800',
};

interface RoleBadgeProps {
    role?: RoleData | null;
    className?: string;
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
    if (!role) return <span className="text-gray-400">--</span>;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                ROLE_STYLES[role.slug] ?? 'bg-gray-100 text-gray-800',
                className,
            )}
        >
            {role.name}
        </span>
    );
}
