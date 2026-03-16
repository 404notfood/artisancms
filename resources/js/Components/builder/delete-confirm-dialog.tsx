import { useBuilderStore, findBlockInTree } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';

export default function DeleteConfirmDialog() {
    const { pendingDeleteId, blocks, setPendingDeleteId, confirmDelete } = useBuilderStore();

    const block = pendingDeleteId ? findBlockInTree(blocks, pendingDeleteId) : null;
    const entry = block ? getBlock(block.type) : null;
    const label = entry?.label || block?.type || 'bloc';

    return (
        <Dialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Supprimer le bloc</DialogTitle>
                    <DialogDescription>
                        Etes-vous sur de vouloir supprimer le bloc "{label}" ?
                        Cette action peut etre annulee avec Ctrl+Z.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
                        Annuler
                    </Button>
                    <Button variant="destructive" onClick={() => confirmDelete()}>
                        Supprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
