import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { formatTimeAgo } from '@/lib/format';
import { FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ContentTableProps {
    title: string;
    items: Array<{
        id: number;
        title: string;
        status: string;
        updated_at: string;
        author?: { name: string };
    }>;
    viewAllHref: string;
    emptyMessage: string;
    editHrefPrefix: string;
}

export function ContentTable({ title, items, viewAllHref, emptyMessage, editHrefPrefix }: ContentTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <Link
                    href={viewAllHref}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                    Voir tout
                </Link>
            </CardHeader>
            <CardContent>
                {items && items.length > 0 ? (
                    <div className="space-y-1">
                        {items.map((item) => (
                            <Link
                                key={item.id}
                                href={`${editHrefPrefix}/${item.id}/edit`}
                                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 group"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {item.author?.name && (
                                            <span>{item.author.name} &middot; </span>
                                        )}
                                        {formatTimeAgo(item.updated_at)}
                                    </p>
                                </div>
                                <StatusBadge status={item.status} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">{emptyMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
