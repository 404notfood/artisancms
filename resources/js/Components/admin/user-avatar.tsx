import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-teal-100 text-teal-700',
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getColorIndex(name: string): number {
    return name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
}

interface UserAvatarProps {
    name: string;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZE_CLASSES = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-24 w-24 text-2xl',
};

export default function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
    const sizeClass = SIZE_CLASSES[size];

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className={cn('rounded-full object-cover ring-1 ring-gray-200', sizeClass, className)}
            />
        );
    }

    const initials = getInitials(name);
    const colorClass = AVATAR_COLORS[getColorIndex(name)];

    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-full ring-1 ring-gray-200 font-semibold',
                sizeClass,
                colorClass,
                className,
            )}
        >
            <span>{initials}</span>
        </div>
    );
}

export { getInitials };
