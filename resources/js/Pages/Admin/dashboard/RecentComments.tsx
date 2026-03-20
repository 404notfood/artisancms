import { Link , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { formatTimeAgo } from '@/lib/format';
import { MessageSquare } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { CommentItem } from './types';

export function RecentComments({ recentComments }: { recentComments: CommentItem[] }) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    Commentaires recents
                </CardTitle>
                <Link
                    href={`/${prefix}/comments`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                    Voir tout
                </Link>
            </CardHeader>
            <CardContent>
                {recentComments && recentComments.length > 0 ? (
                    <div className="space-y-3">
                        {recentComments.map((comment) => (
                            <div
                                key={comment.id}
                                className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                                    {(comment.user?.name ?? comment.author_name ?? '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {comment.user?.name ?? comment.author_name}
                                        </span>
                                        <StatusBadge status={comment.status} />
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                                        {comment.content}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatTimeAgo(comment.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <MessageSquare className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Aucun commentaire pour le moment.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
