import { useState, useEffect } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderNode {
    name: string;
    path: string;
    count: number;
}

interface MediaFolderTreeProps {
    currentFolder?: string;
    onSelectFolder: (folder: string) => void;
}

export function MediaFolderTree({ currentFolder, onSelectFolder }: MediaFolderTreeProps) {
    const [folders, setFolders] = useState<FolderNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [newFolderName, setNewFolderName] = useState('');
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        fetch('/admin/media/folders', {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                setFolders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [currentFolder]);

    function handleCreateFolder(e: React.FormEvent) {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch('/admin/media/folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                Accept: 'application/json',
            },
            body: JSON.stringify({ name: newFolderName.trim() }),
        })
            .then((res) => res.json())
            .then(() => {
                setNewFolderName('');
                setShowNew(false);
                onSelectFolder(newFolderName.trim());
            })
            .catch(console.error);
    }

    const totalCount = folders.reduce((sum, f) => sum + f.count, 0);

    return (
        <div className="w-48 shrink-0 space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-semibold uppercase text-gray-500">Dossiers</span>
                <button
                    onClick={() => setShowNew(!showNew)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Nouveau dossier"
                >
                    <Plus className="h-3.5 w-3.5" />
                </button>
            </div>

            {showNew && (
                <form onSubmit={handleCreateFolder} className="px-2 mb-2">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Nom du dossier..."
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                        autoFocus
                    />
                </form>
            )}

            {/* All media */}
            <button
                onClick={() => onSelectFolder('')}
                className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    !currentFolder
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50',
                )}
            >
                <Folder className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">Tous les fichiers</span>
                <span className="text-xs text-gray-400">{totalCount}</span>
            </button>

            {loading ? (
                <div className="px-2 py-4 text-center text-xs text-gray-400">Chargement...</div>
            ) : (
                folders.map((folder) => (
                    <button
                        key={folder.path}
                        onClick={() => onSelectFolder(folder.path)}
                        className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                            currentFolder === folder.path
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50',
                        )}
                    >
                        {currentFolder === folder.path ? (
                            <FolderOpen className="h-4 w-4 shrink-0" />
                        ) : (
                            <Folder className="h-4 w-4 shrink-0" />
                        )}
                        <span className="flex-1 truncate text-left">{folder.name}</span>
                        <span className="text-xs text-gray-400">{folder.count}</span>
                    </button>
                ))
            )}
        </div>
    );
}
