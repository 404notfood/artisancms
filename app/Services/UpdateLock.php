<?php

declare(strict_types=1);

namespace App\Services;

class UpdateLock
{
    public function run(callable $callback): mixed
    {
        $handle = fopen(storage_path('framework/cms-update.lock'), 'c');
        if (!$handle) {
            throw new \RuntimeException('Impossible de verrouiller les mises à jour.');
        }
        if (!flock($handle, LOCK_EX | LOCK_NB)) {
            fclose($handle);
            throw new \RuntimeException('Une mise à jour ou une restauration est déjà en cours.');
        }
        try {
            return $callback();
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
