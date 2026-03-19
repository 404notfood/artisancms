import { Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Plus, FolderOpen, ExternalLink } from 'lucide-react';

export function QuickActions() {
    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <Link href="/admin/pages/create">
                    <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Nouvelle page
                    </Button>
                </Link>
                <Link href="/admin/posts/create">
                    <Button size="sm" variant="outline" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Nouvel article
                    </Button>
                </Link>
                <Link href="/admin/content-types">
                    <Button size="sm" variant="outline" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Nouveau type de contenu
                    </Button>
                </Link>
                <Link href="/admin/media">
                    <Button size="sm" variant="outline" className="gap-1.5">
                        <FolderOpen className="h-4 w-4" />
                        Gerer les medias
                    </Button>
                </Link>
                <a href="/" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5">
                        <ExternalLink className="h-4 w-4" />
                        Voir le site
                    </Button>
                </a>
            </CardContent>
        </Card>
    );
}
