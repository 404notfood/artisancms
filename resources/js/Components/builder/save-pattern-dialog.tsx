import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { useBuilderStore } from '@/stores/builder-store';
import { X, Save } from 'lucide-react';

interface SavePatternDialogProps {
    open: boolean;
    onClose: () => void;
    blockIds?: string[];
}

export default function SavePatternDialog({ open, onClose, blockIds }: SavePatternDialogProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('general');
    const [isSynced, setIsSynced] = useState(false);
    const [saving, setSaving] = useState(false);
    const { blocks, findBlock } = useBuilderStore();

    if (!open) return null;

    const handleSave = async () => {
        // Get the blocks to save
        let content: unknown[];
        if (blockIds && blockIds.length > 0) {
            content = blockIds.map((id) => findBlock(id)).filter(Boolean);
        } else {
            content = blocks;
        }

        if (content.length === 0 || !name.trim()) return;

        setSaving(true);
        try {
            await fetch('/admin/block-patterns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                    ),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name: name.trim(),
                    content,
                    category,
                    is_synced: isSynced,
                }),
            });
            onClose();
            setName('');
        } catch {
            // ignore
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">Sauvegarder comme pattern</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <Label>Nom du pattern</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Hero avec image"
                            className="mt-1"
                            autoFocus
                        />
                    </div>

                    <div>
                        <Label>Categorie</Label>
                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="general"
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is-synced"
                            checked={isSynced}
                            onChange={(e) => setIsSynced(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="is-synced" className="text-sm text-gray-700">
                            Synchronise (les modifications se propagent partout)
                        </label>
                    </div>

                    <p className="text-xs text-gray-400">
                        {blockIds && blockIds.length > 0
                            ? `${blockIds.length} bloc(s) selectionne(s)`
                            : `${blocks.length} bloc(s) au total`}
                    </p>
                </div>

                <div className="flex justify-end gap-2 border-t px-5 py-4">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="gap-1.5"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Sauvegarder
                    </Button>
                </div>
            </div>
        </div>
    );
}
