import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Image, FileText } from 'lucide-react';
import type { MediaItem } from './types';

export function RecentMedia({ recentMedia }: { recentMedia: MediaItem[] }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Image className="h-4 w-4 text-gray-500" />
                    Derniers medias
                </CardTitle>
                <Link
                    href="/admin/media"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                    Voir tout
                </Link>
            </CardHeader>
            <CardContent>
                {recentMedia && recentMedia.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                        {recentMedia.map((media) => (
                            <Link
                                key={media.id}
                                href={`/admin/media/${media.id}`}
                                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 border border-gray-200 hover:border-indigo-300 transition-colors"
                            >
                                {media.mime_type?.startsWith('image/') ? (
                                    <img
                                        src={media.thumbnails?.thumbnail ?? media.url}
                                        alt={media.original_filename}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-6">Aucun media pour le moment.</p>
                )}
            </CardContent>
        </Card>
    );
}
