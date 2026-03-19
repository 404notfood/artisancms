<?php

declare(strict_types=1);

namespace App\Services\Concerns;

use App\Models\Revision;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Shared revision creation logic for content services (PageService, PostService).
 */
trait CreatesRevisions
{
    /**
     * Create a revision for a content model that has a revisions() morphMany relationship.
     *
     * @param array<string, mixed> $snapshotData The data to snapshot in the revision
     */
    protected function createRevision(
        Model $model,
        array $snapshotData,
        string $type = 'auto',
        string $reason = '',
    ): Revision {
        $maxRevisions = (int) config('cms.revisions.max_per_entity', 30);
        $existingCount = $model->revisions()->count();

        if ($existingCount >= $maxRevisions) {
            $model->revisions()
                ->orderBy('created_at', 'asc')
                ->limit($existingCount - $maxRevisions + 1)
                ->delete();
        }

        $snapshotData['type'] = $type;

        return $model->revisions()->create([
            'data' => $snapshotData,
            'reason' => $reason,
            'created_by' => Auth::id(),
        ]);
    }

    /**
     * Compare two revisions and return the differences.
     *
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function compareRevisions(Revision $revision, Revision $compare): array
    {
        $oldData = $compare->data ?? [];
        $newData = $revision->data ?? [];

        $changes = [];
        $allKeys = array_unique(array_merge(array_keys($oldData), array_keys($newData)));

        foreach ($allKeys as $key) {
            $old = $oldData[$key] ?? null;
            $new = $newData[$key] ?? null;
            if ($old !== $new) {
                $changes[$key] = ['old' => $old, 'new' => $new];
            }
        }

        return $changes;
    }
}
