<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\UpdateService;
use Illuminate\Console\Command;

class UpdateCore extends Command
{
    protected $signature = 'cms:update';

    protected $description = 'Installe la dernière version stable du cœur avec sauvegarde et vérification SHA-256';

    public function handle(UpdateService $updates): int
    {
        try {
            $log = $updates->updateCore();
            $this->info("ArtisanCMS mis à jour : {$log->from_version} → {$log->to_version}.");

            return self::SUCCESS;
        } catch (\Throwable $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }
    }
}
