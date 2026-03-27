<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Revision;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupRevisionsCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'cms:revisions:cleanup
        {--days=90 : Supprimer les revisions plus anciennes que N jours}
        {--keep=10 : Garder au minimum N revisions par entite}
        {--dry-run : Afficher ce qui serait supprime sans supprimer}';

    /**
     * @var string
     */
    protected $description = 'Supprimer les anciennes revisions en conservant un minimum par entite';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $keep = (int) $this->option('keep');
        $dryRun = (bool) $this->option('dry-run');

        if ($days < 1) {
            $this->error('Le nombre de jours doit etre superieur a 0.');

            return self::FAILURE;
        }

        if ($keep < 1) {
            $this->error('Le nombre minimum de revisions a conserver doit etre superieur a 0.');

            return self::FAILURE;
        }

        $cutoffDate = Carbon::now()->subDays($days);

        if ($dryRun) {
            $this->warn('[DRY-RUN] Aucune revision ne sera supprimee.');
        }

        $this->info("Nettoyage des revisions de plus de {$days} jours (avant le {$cutoffDate->toDateTimeString()})");
        $this->info("Minimum conserve par entite : {$keep}");
        $this->newLine();

        $totalDeleted = 0;
        $totalSizeEstimate = 0;
        $entitiesProcessed = 0;

        $entities = $this->getDistinctEntities();

        if ($entities->isEmpty()) {
            $this->info('Aucune revision trouvee.');

            return self::SUCCESS;
        }

        $this->info("Entites avec revisions : {$entities->count()}");
        $this->newLine();

        $progressBar = $this->output->createProgressBar($entities->count());
        $progressBar->start();

        foreach ($entities as $entity) {
            $result = $this->processEntity(
                (string) $entity->revisionable_type,
                (int) $entity->revisionable_id,
                $cutoffDate,
                $keep,
                $dryRun,
            );

            $totalDeleted += $result['deleted'];
            $totalSizeEstimate += $result['size'];
            if ($result['deleted'] > 0) {
                $entitiesProcessed++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->displaySummary($totalDeleted, $totalSizeEstimate, $entitiesProcessed, $dryRun);

        return self::SUCCESS;
    }

    /**
     * Recupere la liste distincte des entites ayant des revisions.
     *
     * @return \Illuminate\Support\Collection<int, object{revisionable_type: string, revisionable_id: int}>
     */
    private function getDistinctEntities(): \Illuminate\Support\Collection
    {
        return DB::table('revisions')
            ->select('revisionable_type', 'revisionable_id')
            ->groupBy('revisionable_type', 'revisionable_id')
            ->get();
    }

    /**
     * Traite les revisions d'une entite donnee.
     *
     * @return array{deleted: int, size: int}
     */
    private function processEntity(
        string $type,
        int $id,
        Carbon $cutoffDate,
        int $keep,
        bool $dryRun,
    ): array {
        $totalCount = Revision::where('revisionable_type', $type)
            ->where('revisionable_id', $id)
            ->count();

        // Ne jamais supprimer si l'entite a <= keep revisions
        if ($totalCount <= $keep) {
            return ['deleted' => 0, 'size' => 0];
        }

        // Recuperer les IDs des N revisions les plus recentes a conserver
        $protectedIds = Revision::where('revisionable_type', $type)
            ->where('revisionable_id', $id)
            ->orderByDesc('created_at')
            ->limit($keep)
            ->pluck('id');

        // Parmi les revisions non protegees, cibler celles plus anciennes que --days
        $query = Revision::where('revisionable_type', $type)
            ->where('revisionable_id', $id)
            ->whereNotIn('id', $protectedIds)
            ->where('created_at', '<', $cutoffDate);

        $deletableCount = $query->count();

        if ($deletableCount === 0) {
            return ['deleted' => 0, 'size' => 0];
        }

        // Estimer la taille des donnees JSON avant suppression
        $sizeEstimate = (int) (clone $query)->sum(DB::raw('LENGTH(data)'));

        if (!$dryRun) {
            // Supprimer par chunks pour les grosses bases
            (clone $query)->chunkById(500, function ($revisions) {
                Revision::whereIn('id', $revisions->pluck('id'))->delete();
            });
        }

        return ['deleted' => $deletableCount, 'size' => $sizeEstimate];
    }

    /**
     * Affiche le resume du nettoyage.
     */
    private function displaySummary(int $totalDeleted, int $totalSize, int $entitiesProcessed, bool $dryRun): void
    {
        $prefix = $dryRun ? '[DRY-RUN] ' : '';
        $action = $dryRun ? 'auraient ete supprimees' : 'supprimees';

        $this->info("{$prefix}Resume du nettoyage :");
        $this->table(
            ['Metrique', 'Valeur'],
            [
                ['Revisions ' . $action, (string) $totalDeleted],
                ['Entites impactees', (string) $entitiesProcessed],
                ['Espace libere (estime)', $this->formatBytes($totalSize)],
            ],
        );

        if ($totalDeleted === 0) {
            $this->info('Aucune revision a nettoyer.');
        } elseif ($dryRun) {
            $this->warn('Relancez sans --dry-run pour effectuer la suppression.');
        } else {
            $this->info('Nettoyage termine avec succes.');
        }
    }

    /**
     * Formate un nombre d'octets en unite lisible.
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $power = (int) floor(log($bytes, 1024));
        $power = min($power, count($units) - 1);

        return round($bytes / (1024 ** $power), 2) . ' ' . $units[$power];
    }
}
