import { cn } from '@/lib/utils';

interface StatusConfig {
    label: string;
    className: string;
}

const STATUS_STYLES: Record<string, StatusConfig> = {
    published: { label: 'Publie', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    draft: { label: 'Brouillon', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    scheduled: { label: 'Planifie', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    trash: { label: 'Corbeille', className: 'bg-red-50 text-red-700 border-red-200' },
    pending: { label: 'En attente', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    pending_review: { label: 'En revue', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    approved: { label: 'Approuve', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    spam: { label: 'Spam', className: 'bg-red-50 text-red-700 border-red-200' },
    active: { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Inactif', className: 'bg-gray-50 text-gray-600 border-gray-200' },
    processing: { label: 'En cours', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    shipped: { label: 'Expedie', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    completed: { label: 'Termine', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Annule', className: 'bg-gray-50 text-gray-600 border-gray-200' },
    refunded: { label: 'Rembourse', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    archived: { label: 'Archive', className: 'bg-gray-50 text-gray-600 border-gray-200' },
    paid: { label: 'Paye', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    failed: { label: 'Echoue', className: 'bg-red-50 text-red-700 border-red-200' },
    rejected: { label: 'Rejete', className: 'bg-red-50 text-red-700 border-red-200' },
    trial: { label: 'Essai', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    expired: { label: 'Expire', className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = STATUS_STYLES[status];
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                config?.className ?? 'bg-gray-50 text-gray-600 border-gray-200',
                className,
            )}
        >
            {config?.label ?? status}
        </span>
    );
}
