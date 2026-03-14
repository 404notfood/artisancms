# Blueprint 18 - Sauvegarde et Restauration (Plugin officiel)

## Vue d'ensemble
Le systeme de sauvegarde est un **plugin officiel** (`content/plugins/backup/`) qui permet de creer, gerer et restaurer des sauvegardes completes du CMS. Il s'appuie sur le package `spatie/laravel-backup` pour la creation des archives et la gestion de la retention, tout en fournissant une interface d'administration integree et des commandes Artisan dediees.

**Objectifs :**
- Sauvegardes automatiques planifiees (quotidiennes, hebdomadaires, mensuelles)
- Sauvegardes manuelles depuis l'interface admin
- Restauration complete (base de donnees + medias) avec verification d'integrite
- Destinations multiples (local, S3, etc.)
- Politique de retention configurable
- Integration totale avec le systeme de hooks CMS

---

## 1. Structure du plugin

```
content/plugins/backup/
├── artisan-plugin.json
├── src/
│   ├── BackupServiceProvider.php
│   ├── Models/
│   │   └── Backup.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── BackupController.php
│   │   │   └── BackupSettingsController.php
│   │   └── Requests/
│   │       ├── TriggerBackupRequest.php
│   │       └── UpdateBackupSettingsRequest.php
│   ├── Services/
│   │   ├── BackupService.php
│   │   └── RestoreService.php
│   ├── Commands/
│   │   ├── BackupRunCommand.php
│   │   ├── BackupRestoreCommand.php
│   │   └── BackupCleanupCommand.php
│   └── Listeners/
│       ├── BackupStartedListener.php
│       ├── BackupCompletedListener.php
│       └── BackupFailedListener.php
├── database/migrations/
│   └── create_backups_table.php
├── config/
│   └── backup.php
├── resources/
│   ├── js/
│   │   └── admin/
│   │       └── Backups/
│   │           ├── Index.tsx
│   │           └── Settings.tsx
│   └── lang/
│       ├── fr/messages.php
│       └── en/messages.php
├── routes/
│   └── admin.php
└── tests/
    ├── BackupServiceTest.php
    └── RestoreServiceTest.php
```

---

## 2. Manifeste du plugin

```json
{
    "name": "Backup & Restore",
    "slug": "backup",
    "version": "1.0.0",
    "description": "Sauvegarde et restauration completes du CMS (base de donnees, medias, fichiers)",
    "author": {
        "name": "ArtisanCMS",
        "url": "https://artisancms.dev"
    },
    "license": "MIT",
    "requires": {
        "cms": ">=1.0.0",
        "php": ">=8.2"
    },
    "dependencies": [],
    "providers": ["Backup\\BackupServiceProvider"],
    "blocks": [],
    "routes": true,
    "migrations": true,
    "settings": {
        "auto_backup_enabled": {
            "type": "boolean",
            "label": "Sauvegardes automatiques",
            "default": true
        },
        "backup_frequency": {
            "type": "select",
            "label": "Frequence de sauvegarde",
            "options": ["daily", "weekly", "monthly"],
            "default": "daily"
        },
        "backup_time": {
            "type": "string",
            "label": "Heure de sauvegarde (HH:MM)",
            "default": "02:00"
        },
        "backup_disk": {
            "type": "select",
            "label": "Destination principale",
            "options": ["local", "s3"],
            "default": "local"
        },
        "retention_daily": {
            "type": "number",
            "label": "Retention quotidienne (jours)",
            "default": 7
        },
        "retention_weekly": {
            "type": "number",
            "label": "Retention hebdomadaire (semaines)",
            "default": 4
        },
        "retention_monthly": {
            "type": "number",
            "label": "Retention mensuelle (mois)",
            "default": 3
        },
        "max_backup_size_mb": {
            "type": "number",
            "label": "Taille max par sauvegarde (Mo)",
            "default": 512
        }
    },
    "admin_pages": [
        {
            "title": "Sauvegardes",
            "slug": "backups",
            "icon": "hard-drive",
            "parent": "backup"
        },
        {
            "title": "Parametres sauvegardes",
            "slug": "backup-settings",
            "icon": "settings",
            "parent": "backup"
        }
    ]
}
```

---

## 3. Table : backups

```php
Schema::create('backups', function (Blueprint $table) {
    $table->id();
    $table->string('filename');                                         // "backup-2026-03-10-020000.zip"
    $table->string('path');                                             // "backups/backup-2026-03-10-020000.zip"
    $table->string('disk')->default('local');                           // "local", "s3"
    $table->unsignedBigInteger('size')->default(0);                    // Taille en octets
    $table->enum('type', ['full', 'db', 'media'])->default('full');    // Type de sauvegarde
    $table->enum('status', ['pending', 'running', 'completed', 'failed'])->default('pending');
    $table->json('metadata')->nullable();                              // Informations supplementaires
    $table->text('error_message')->nullable();                         // Message d'erreur si echec
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('completed_at')->nullable();
    $table->timestamps();

    $table->index(['status', 'created_at']);
    $table->index(['type', 'status']);
    $table->index('disk');
});
```

### Structure du champ `metadata`

```json
{
    "cms_version": "1.0.0",
    "php_version": "8.2.15",
    "laravel_version": "12.0.0",
    "db_driver": "mysql",
    "db_name": "artisancms",
    "tables_count": 18,
    "total_rows": 4523,
    "media_files_count": 256,
    "media_total_size": 134217728,
    "plugins": ["form-builder", "backup", "seo"],
    "theme": "starter",
    "checksum": "sha256:a1b2c3d4e5f6...",
    "triggered_by": "scheduler",
    "duration_seconds": 45
}
```

---

## 4. Modele Eloquent

```php
<?php

declare(strict_types=1);

namespace Backup\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Backup extends Model
{
    protected $fillable = [
        'filename',
        'path',
        'disk',
        'size',
        'type',
        'status',
        'metadata',
        'error_message',
        'created_by',
        'completed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'size' => 'integer',
        'completed_at' => 'datetime',
    ];

    // --- Relations ---

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // --- Scopes ---

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // --- Accessors ---

    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['o', 'Ko', 'Mo', 'Go'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getDurationAttribute(): ?int
    {
        return $this->metadata['duration_seconds'] ?? null;
    }

    // --- Methods ---

    public function markAsRunning(): void
    {
        $this->update(['status' => 'running']);
    }

    public function markAsCompleted(int $size, array $metadata): void
    {
        $this->update([
            'status' => 'completed',
            'size' => $size,
            'metadata' => $metadata,
            'completed_at' => now(),
        ]);
    }

    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'completed_at' => now(),
        ]);
    }
}
```

---

## 5. Service de sauvegarde

```php
<?php

declare(strict_types=1);

namespace Backup\Services;

use Backup\Models\Backup;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use App\CMS\Facades\CMS;
use Spatie\Backup\Tasks\Backup\BackupJobFactory;

class BackupService
{
    /**
     * Creer une sauvegarde complete (DB + medias)
     */
    public function createFullBackup(?int $userId = null, string $triggeredBy = 'manual'): Backup
    {
        return $this->createBackup('full', $userId, $triggeredBy);
    }

    /**
     * Creer une sauvegarde de la base de donnees uniquement
     */
    public function createDatabaseBackup(?int $userId = null, string $triggeredBy = 'manual'): Backup
    {
        return $this->createBackup('db', $userId, $triggeredBy);
    }

    /**
     * Creer une sauvegarde des medias uniquement
     */
    public function createMediaBackup(?int $userId = null, string $triggeredBy = 'manual'): Backup
    {
        return $this->createBackup('media', $userId, $triggeredBy);
    }

    /**
     * Logique commune de creation de sauvegarde
     */
    protected function createBackup(string $type, ?int $userId, string $triggeredBy): Backup
    {
        $disk = $this->getConfiguredDisk();
        $filename = $this->generateFilename($type);
        $path = "backups/{$filename}";

        // Creer l'enregistrement en base
        $backup = Backup::create([
            'filename' => $filename,
            'path' => $path,
            'disk' => $disk,
            'type' => $type,
            'status' => 'pending',
            'created_by' => $userId,
        ]);

        // Declencher le hook de demarrage
        CMS::fireHook('backup.started', $backup);

        try {
            $backup->markAsRunning();
            $startTime = microtime(true);

            // Executer la sauvegarde via spatie/laravel-backup
            $this->executeBackup($backup, $type);

            // Calculer le checksum
            $checksum = $this->calculateChecksum($backup);

            // Collecter les metadonnees
            $duration = (int) round(microtime(true) - $startTime);
            $size = Storage::disk($disk)->size($path);
            $metadata = $this->collectMetadata($type, $triggeredBy, $checksum, $duration);

            // Verifier la taille max
            $this->validateSize($size);

            $backup->markAsCompleted($size, $metadata);

            CMS::fireHook('backup.completed', $backup);

            Log::info("Backup completed: {$filename}", [
                'type' => $type,
                'size' => $size,
                'duration' => $duration,
            ]);

        } catch (\Throwable $e) {
            $backup->markAsFailed($e->getMessage());

            CMS::fireHook('backup.failed', $backup, $e);

            Log::error("Backup failed: {$filename}", [
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            // Nettoyer le fichier partiel s'il existe
            if (Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);
            }

            throw $e;
        }

        return $backup;
    }

    /**
     * Executer la sauvegarde via spatie/laravel-backup
     */
    protected function executeBackup(Backup $backup, string $type): void
    {
        $options = ['--disable-notifications' => true];

        switch ($type) {
            case 'db':
                $options['--only-db'] = true;
                break;
            case 'media':
                $options['--only-files'] = true;
                break;
            case 'full':
            default:
                // Sauvegarde complete : DB + fichiers
                break;
        }

        Artisan::call('backup:run', $options);

        // Deplacer/renommer le fichier cree par spatie vers notre chemin
        $this->moveLatestSpatieBackup($backup);
    }

    /**
     * Deplacer le dernier backup cree par spatie vers le chemin attendu
     */
    protected function moveLatestSpatieBackup(Backup $backup): void
    {
        $spatieBackupPath = config('backup.backup.destination.disks')[0] ?? 'local';
        $spatieDir = config('backup.backup.name', 'artisancms');

        $files = Storage::disk($spatieBackupPath)->files($spatieDir);
        $latestFile = collect($files)
            ->filter(fn(string $file) => str_ends_with($file, '.zip'))
            ->sortByDesc(fn(string $file) => Storage::disk($spatieBackupPath)->lastModified($file))
            ->first();

        if (!$latestFile) {
            throw new \RuntimeException('Spatie backup file not found after execution.');
        }

        Storage::disk($backup->disk)->put(
            $backup->path,
            Storage::disk($spatieBackupPath)->get($latestFile)
        );

        // Supprimer le fichier temporaire de spatie
        Storage::disk($spatieBackupPath)->delete($latestFile);
    }

    /**
     * Calculer le checksum SHA-256 du fichier de sauvegarde
     */
    protected function calculateChecksum(Backup $backup): string
    {
        $path = Storage::disk($backup->disk)->path($backup->path);
        return 'sha256:' . hash_file('sha256', $path);
    }

    /**
     * Collecter les metadonnees du systeme
     */
    protected function collectMetadata(string $type, string $triggeredBy, string $checksum, int $duration): array
    {
        $metadata = [
            'cms_version' => config('cms.version', '1.0.0'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'db_driver' => config('database.default'),
            'db_name' => config('database.connections.' . config('database.default') . '.database'),
            'checksum' => $checksum,
            'triggered_by' => $triggeredBy,
            'duration_seconds' => $duration,
        ];

        if (in_array($type, ['full', 'db'])) {
            $metadata['tables_count'] = count(DB::select('SHOW TABLES'));
            $metadata['total_rows'] = $this->countTotalRows();
        }

        if (in_array($type, ['full', 'media'])) {
            $mediaFiles = Storage::disk('public')->allFiles('media');
            $metadata['media_files_count'] = count($mediaFiles);
            $metadata['media_total_size'] = collect($mediaFiles)
                ->sum(fn(string $file) => Storage::disk('public')->size($file));
        }

        $metadata['plugins'] = \App\Models\CmsPlugin::where('enabled', true)->pluck('slug')->toArray();
        $metadata['theme'] = \App\Models\CmsTheme::where('active', true)->value('slug');

        return $metadata;
    }

    /**
     * Verifier que la sauvegarde ne depasse pas la taille max
     */
    protected function validateSize(int $size): void
    {
        $maxSize = $this->getMaxSize();
        if ($size > $maxSize) {
            throw new \RuntimeException(
                "Backup size ({$size} bytes) exceeds maximum allowed size ({$maxSize} bytes)."
            );
        }
    }

    /**
     * Supprimer une sauvegarde
     */
    public function delete(Backup $backup): void
    {
        Storage::disk($backup->disk)->delete($backup->path);
        $backup->delete();
    }

    /**
     * Telecharger une sauvegarde
     */
    public function download(Backup $backup): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        return Storage::disk($backup->disk)->download($backup->path, $backup->filename);
    }

    /**
     * Verifier l'integrite d'une sauvegarde
     */
    public function verifyIntegrity(Backup $backup): bool
    {
        $storedChecksum = $backup->metadata['checksum'] ?? null;
        if (!$storedChecksum) {
            return false;
        }

        $currentChecksum = $this->calculateChecksum($backup);
        return $storedChecksum === $currentChecksum;
    }

    /**
     * Nettoyer les anciennes sauvegardes selon la politique de retention
     */
    public function cleanup(): int
    {
        $deleted = 0;
        $settings = $this->getRetentionSettings();

        // Supprimer les sauvegardes quotidiennes au-dela de la retention
        $dailyCutoff = now()->subDays($settings['daily']);
        $dailyToDelete = Backup::completed()
            ->where('created_at', '<', $dailyCutoff)
            ->whereDate('created_at', '!=', DB::raw('DATE_SUB(created_at, INTERVAL (DAYOFWEEK(created_at) - 1) DAY)'))
            ->get();

        foreach ($dailyToDelete as $backup) {
            // Garder les sauvegardes hebdomadaires (lundi) et mensuelles (1er du mois)
            $day = $backup->created_at->dayOfWeek;
            $dayOfMonth = $backup->created_at->day;

            $isWeeklyCandidate = ($day === 1) && $backup->created_at->gte(now()->subWeeks($settings['weekly']));
            $isMonthlyCandidate = ($dayOfMonth === 1) && $backup->created_at->gte(now()->subMonths($settings['monthly']));

            if (!$isWeeklyCandidate && !$isMonthlyCandidate) {
                $this->delete($backup);
                $deleted++;
            }
        }

        // Supprimer les sauvegardes hebdomadaires au-dela de la retention
        $weeklyCutoff = now()->subWeeks($settings['weekly']);
        $weeklyToDelete = Backup::completed()
            ->where('created_at', '<', $weeklyCutoff)
            ->whereRaw('DAYOFWEEK(created_at) = 2') // Lundi
            ->get();

        foreach ($weeklyToDelete as $backup) {
            $dayOfMonth = $backup->created_at->day;
            $isMonthlyCandidate = ($dayOfMonth === 1) && $backup->created_at->gte(now()->subMonths($settings['monthly']));

            if (!$isMonthlyCandidate) {
                $this->delete($backup);
                $deleted++;
            }
        }

        // Supprimer les sauvegardes mensuelles au-dela de la retention
        $monthlyCutoff = now()->subMonths($settings['monthly']);
        $monthlyToDelete = Backup::completed()
            ->where('created_at', '<', $monthlyCutoff)
            ->whereRaw('DAY(created_at) = 1')
            ->get();

        foreach ($monthlyToDelete as $backup) {
            $this->delete($backup);
            $deleted++;
        }

        // Supprimer les sauvegardes echouees de plus de 24h
        Backup::failed()
            ->where('created_at', '<', now()->subDay())
            ->each(function (Backup $backup) use (&$deleted) {
                $this->delete($backup);
                $deleted++;
            });

        return $deleted;
    }

    // --- Helpers prives ---

    protected function generateFilename(string $type): string
    {
        $timestamp = now()->format('Y-m-d-His');
        return "backup-{$type}-{$timestamp}.zip";
    }

    protected function getConfiguredDisk(): string
    {
        return $this->getPluginSetting('backup_disk', 'local');
    }

    protected function getMaxSize(): int
    {
        $maxMb = $this->getPluginSetting('max_backup_size_mb', 512);
        return $maxMb * 1024 * 1024;
    }

    protected function getRetentionSettings(): array
    {
        return [
            'daily' => (int) $this->getPluginSetting('retention_daily', 7),
            'weekly' => (int) $this->getPluginSetting('retention_weekly', 4),
            'monthly' => (int) $this->getPluginSetting('retention_monthly', 3),
        ];
    }

    protected function getPluginSetting(string $key, mixed $default = null): mixed
    {
        $plugin = \App\Models\CmsPlugin::where('slug', 'backup')->first();
        return $plugin?->settings[$key] ?? $default;
    }

    protected function countTotalRows(): int
    {
        $total = 0;
        $tables = DB::select('SHOW TABLES');
        $key = array_key_first((array) $tables[0]);
        foreach ($tables as $table) {
            $name = $table->$key;
            $count = DB::table($name)->count();
            $total += $count;
        }
        return $total;
    }
}
```

---

## 6. Service de restauration

```php
<?php

declare(strict_types=1);

namespace Backup\Services;

use Backup\Models\Backup;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use App\CMS\Facades\CMS;
use ZipArchive;

class RestoreService
{
    public function __construct(
        protected BackupService $backupService,
    ) {}

    /**
     * Restaurer une sauvegarde
     *
     * Flux : verification integrite → sauvegarde pre-restauration → restauration DB → restauration medias
     */
    public function restore(Backup $backup): void
    {
        // 1. Verifier que la sauvegarde est complete
        if ($backup->status !== 'completed') {
            throw new \RuntimeException("Cannot restore backup with status '{$backup->status}'.");
        }

        // 2. Verifier l'integrite du fichier
        if (!$this->backupService->verifyIntegrity($backup)) {
            throw new \RuntimeException(
                'Backup integrity check failed. The file may be corrupted.'
            );
        }

        // 3. Creer une sauvegarde de securite avant restauration
        Log::info('Creating safety backup before restore...');
        $safetyBackup = $this->backupService->createFullBackup(
            userId: null,
            triggeredBy: 'pre-restore-safety'
        );
        Log::info("Safety backup created: {$safetyBackup->filename}");

        // 4. Extraire l'archive dans un repertoire temporaire
        $tempDir = storage_path('app/temp/restore-' . uniqid());
        File::ensureDirectoryExists($tempDir);

        try {
            $this->extractArchive($backup, $tempDir);

            // 5. Restaurer selon le type de sauvegarde
            DB::beginTransaction();

            try {
                if (in_array($backup->type, ['full', 'db'])) {
                    $this->restoreDatabase($tempDir);
                }

                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }

            if (in_array($backup->type, ['full', 'media'])) {
                $this->restoreMedia($tempDir);
            }

            // 6. Vider les caches
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('view:clear');

            CMS::fireHook('backup.restored', $backup);

            Log::info("Backup restored successfully: {$backup->filename}");

        } catch (\Throwable $e) {
            Log::error("Restore failed: {$e->getMessage()}", [
                'backup' => $backup->filename,
                'error' => $e->getTraceAsString(),
            ]);
            throw $e;
        } finally {
            // 7. Nettoyer le repertoire temporaire
            File::deleteDirectory($tempDir);
        }
    }

    /**
     * Extraire l'archive ZIP dans un repertoire temporaire
     */
    protected function extractArchive(Backup $backup, string $tempDir): void
    {
        $archivePath = Storage::disk($backup->disk)->path($backup->path);

        $zip = new ZipArchive();
        $result = $zip->open($archivePath);

        if ($result !== true) {
            throw new \RuntimeException("Failed to open backup archive. Error code: {$result}");
        }

        $zip->extractTo($tempDir);
        $zip->close();
    }

    /**
     * Restaurer la base de donnees depuis le dump SQL
     */
    protected function restoreDatabase(string $tempDir): void
    {
        // Trouver le fichier de dump SQL dans l'archive
        $sqlFiles = File::glob("{$tempDir}/**/*.sql");

        if (empty($sqlFiles)) {
            $sqlFiles = File::glob("{$tempDir}/*.sql");
        }

        if (empty($sqlFiles)) {
            throw new \RuntimeException('No SQL dump file found in backup archive.');
        }

        $sqlFile = $sqlFiles[0];

        // Desactiver les contraintes de cle etrangere pendant la restauration
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Supprimer les tables existantes et restaurer depuis le dump
        $dbName = config('database.connections.' . config('database.default') . '.database');
        $tables = DB::select('SHOW TABLES');
        $key = "Tables_in_{$dbName}";

        foreach ($tables as $table) {
            DB::statement("DROP TABLE IF EXISTS `{$table->$key}`");
        }

        // Importer le dump SQL
        $sql = File::get($sqlFile);
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            fn(string $s) => !empty($s)
        );

        foreach ($statements as $statement) {
            DB::unprepared($statement);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Re-executer les migrations pour s'assurer que le schema est a jour
        Artisan::call('migrate', ['--force' => true]);
    }

    /**
     * Restaurer les fichiers medias
     */
    protected function restoreMedia(string $tempDir): void
    {
        $mediaSourceDir = "{$tempDir}/media";

        if (!File::isDirectory($mediaSourceDir)) {
            // Chercher dans des sous-dossiers (structure spatie)
            $mediaSourceDir = collect(File::directories($tempDir))
                ->first(fn(string $dir) => File::isDirectory("{$dir}/media"));

            if ($mediaSourceDir) {
                $mediaSourceDir .= '/media';
            }
        }

        if (!$mediaSourceDir || !File::isDirectory($mediaSourceDir)) {
            Log::warning('No media directory found in backup archive. Skipping media restore.');
            return;
        }

        $mediaDestination = Storage::disk('public')->path('media');

        // Sauvegarder le dossier media actuel (renommer)
        if (File::isDirectory($mediaDestination)) {
            $backupMediaDir = $mediaDestination . '-pre-restore-' . now()->format('YmdHis');
            File::moveDirectory($mediaDestination, $backupMediaDir);
        }

        // Copier les medias restaures
        File::copyDirectory($mediaSourceDir, $mediaDestination);
    }
}
```

---

## 7. Configuration spatie/laravel-backup

```php
// content/plugins/backup/config/backup.php
<?php

return [
    'backup' => [
        'name' => env('APP_NAME', 'artisancms'),

        'source' => [
            'files' => [
                'include' => [
                    storage_path('app/public/media'),
                ],
                'exclude' => [
                    storage_path('app/public/media/cache'),
                    storage_path('app/temp'),
                ],
                'follow_links' => false,
                'ignore_unreadable_directories' => false,
                'relative_path_prefix' => '',
            ],

            'databases' => ['mysql'],
        ],

        'database_dump_compressor' => null,
        'database_dump_file_extension' => '',

        'destination' => [
            'filename_prefix' => '',
            'disks' => ['local'],
        ],

        'temporary_directory' => storage_path('app/backup-temp'),

        'password' => env('BACKUP_ARCHIVE_PASSWORD'),
        'encryption' => 'default',
    ],

    'notifications' => [
        'notifications' => [],  // Desactive : on utilise les hooks CMS a la place
    ],

    'monitor_backups' => [],

    'cleanup' => [
        'strategy' => \Spatie\Backup\Tasks\Cleanup\Strategies\DefaultStrategy::class,

        'default_strategy' => [
            'keep_all_backups_for_days' => 7,
            'keep_daily_backups_for_days' => 7,
            'keep_weekly_backups_for_weeks' => 4,
            'keep_monthly_backups_for_months' => 3,
            'keep_yearly_backups_for_years' => 0,
            'delete_oldest_backups_when_using_more_megabytes_than' => 5000,
        ],
    ],
];
```

### Configuration des disques (filesystems.php)

```php
// A ajouter dans config/filesystems.php > disks
'backup-local' => [
    'driver' => 'local',
    'root' => storage_path('app/backups'),
],

'backup-s3' => [
    'driver' => 's3',
    'key' => env('BACKUP_AWS_ACCESS_KEY_ID'),
    'secret' => env('BACKUP_AWS_SECRET_ACCESS_KEY'),
    'region' => env('BACKUP_AWS_DEFAULT_REGION', 'eu-west-3'),
    'bucket' => env('BACKUP_AWS_BUCKET'),
    'url' => env('BACKUP_AWS_URL'),
    'endpoint' => env('BACKUP_AWS_ENDPOINT'),
    'use_path_style_endpoint' => env('BACKUP_AWS_USE_PATH_STYLE_ENDPOINT', false),
],
```

### Variables d'environnement

```env
# Backup S3 (optionnel)
BACKUP_AWS_ACCESS_KEY_ID=
BACKUP_AWS_SECRET_ACCESS_KEY=
BACKUP_AWS_DEFAULT_REGION=eu-west-3
BACKUP_AWS_BUCKET=artisancms-backups
BACKUP_AWS_URL=
BACKUP_AWS_ENDPOINT=

# Chiffrement des archives (optionnel)
BACKUP_ARCHIVE_PASSWORD=
```

---

## 8. Sauvegardes planifiees

### Service Provider

```php
<?php

declare(strict_types=1);

namespace Backup;

use Illuminate\Support\ServiceProvider;
use Illuminate\Console\Scheduling\Schedule;
use App\CMS\Facades\CMS;
use Backup\Commands\BackupRunCommand;
use Backup\Commands\BackupRestoreCommand;
use Backup\Commands\BackupCleanupCommand;

class BackupServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/backup.php', 'backup');

        $this->app->singleton(Services\BackupService::class);
        $this->app->singleton(Services\RestoreService::class);
    }

    public function boot(): void
    {
        // Migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Routes admin
        $this->loadRoutesFrom(__DIR__ . '/../routes/admin.php');

        // Traductions
        $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'backup');

        // Commandes Artisan
        if ($this->app->runningInConsole()) {
            $this->commands([
                BackupRunCommand::class,
                BackupRestoreCommand::class,
                BackupCleanupCommand::class,
            ]);
        }

        // Planification des sauvegardes
        $this->app->booted(function () {
            $this->scheduleBackups();
        });

        // Hooks admin sidebar
        CMS::hook('admin_sidebar', function (&$items) {
            $items[] = [
                'label' => __('backup::messages.sidebar_label'),
                'icon' => 'hard-drive',
                'url' => '/admin/backups',
                'permission' => 'backups.manage',
                'children' => [
                    ['label' => __('backup::messages.all_backups'), 'url' => '/admin/backups'],
                    ['label' => __('backup::messages.settings'), 'url' => '/admin/backups/settings'],
                ],
            ];
        });
    }

    /**
     * Planifier les sauvegardes automatiques
     */
    protected function scheduleBackups(): void
    {
        $schedule = $this->app->make(Schedule::class);

        $plugin = \App\Models\CmsPlugin::where('slug', 'backup')->first();
        $settings = $plugin?->settings ?? [];

        if (!($settings['auto_backup_enabled'] ?? true)) {
            return;
        }

        $time = $settings['backup_time'] ?? '02:00';
        $frequency = $settings['backup_frequency'] ?? 'daily';

        // Sauvegarde automatique
        $task = $schedule->command('cms:backup --type=full --triggered-by=scheduler');

        switch ($frequency) {
            case 'weekly':
                $task->weeklyOn(1, $time); // Lundi
                break;
            case 'monthly':
                $task->monthlyOn(1, $time); // 1er du mois
                break;
            case 'daily':
            default:
                $task->dailyAt($time);
                break;
        }

        $task->withoutOverlapping()
            ->onOneServer()
            ->runInBackground();

        // Nettoyage quotidien a 03:00
        $schedule->command('cms:backup:cleanup')
            ->dailyAt('03:00')
            ->withoutOverlapping()
            ->onOneServer();
    }
}
```

---

## 9. Commandes Artisan

### cms:backup

```php
<?php

declare(strict_types=1);

namespace Backup\Commands;

use Illuminate\Console\Command;
use Backup\Services\BackupService;

class BackupRunCommand extends Command
{
    protected $signature = 'cms:backup
        {--type=full : Type de sauvegarde (full, db, media)}
        {--triggered-by=cli : Source du declenchement (cli, scheduler, admin)}';

    protected $description = 'Creer une sauvegarde du CMS';

    public function handle(BackupService $backupService): int
    {
        $type = $this->option('type');
        $triggeredBy = $this->option('triggered-by');

        if (!in_array($type, ['full', 'db', 'media'])) {
            $this->error("Invalid backup type: {$type}. Use: full, db, media.");
            return self::FAILURE;
        }

        $this->info("Starting {$type} backup...");

        try {
            $backup = match ($type) {
                'db' => $backupService->createDatabaseBackup(triggeredBy: $triggeredBy),
                'media' => $backupService->createMediaBackup(triggeredBy: $triggeredBy),
                default => $backupService->createFullBackup(triggeredBy: $triggeredBy),
            };

            $this->info("Backup completed successfully!");
            $this->table(
                ['Field', 'Value'],
                [
                    ['Filename', $backup->filename],
                    ['Size', $backup->human_size],
                    ['Type', $backup->type],
                    ['Disk', $backup->disk],
                    ['Duration', ($backup->duration ?? '?') . 's'],
                ]
            );

            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Backup failed: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
```

### cms:backup:restore

```php
<?php

declare(strict_types=1);

namespace Backup\Commands;

use Illuminate\Console\Command;
use Backup\Models\Backup;
use Backup\Services\RestoreService;

class BackupRestoreCommand extends Command
{
    protected $signature = 'cms:backup:restore
        {filename : Nom du fichier de sauvegarde a restaurer}
        {--force : Ignorer la confirmation}';

    protected $description = 'Restaurer le CMS depuis une sauvegarde';

    public function handle(RestoreService $restoreService): int
    {
        $filename = $this->argument('filename');

        $backup = Backup::where('filename', $filename)
            ->where('status', 'completed')
            ->first();

        if (!$backup) {
            $this->error("Backup not found or not completed: {$filename}");
            $this->info('Available backups:');

            Backup::completed()
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->each(function (Backup $b) {
                    $this->line("  - {$b->filename} ({$b->human_size}, {$b->created_at->format('Y-m-d H:i')})");
                });

            return self::FAILURE;
        }

        // Afficher les informations de la sauvegarde
        $this->warn('You are about to restore the following backup:');
        $this->table(
            ['Field', 'Value'],
            [
                ['Filename', $backup->filename],
                ['Type', $backup->type],
                ['Size', $backup->human_size],
                ['Created', $backup->created_at->format('Y-m-d H:i:s')],
                ['CMS Version', $backup->metadata['cms_version'] ?? 'unknown'],
            ]
        );

        $this->warn('WARNING: This will overwrite the current database and media files.');
        $this->warn('A safety backup will be created automatically before restoring.');

        if (!$this->option('force') && !$this->confirm('Do you wish to continue?')) {
            $this->info('Restore cancelled.');
            return self::SUCCESS;
        }

        $this->info('Starting restore process...');

        try {
            $restoreService->restore($backup);
            $this->info('Restore completed successfully!');
            $this->info('Please verify your site is working correctly.');
            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Restore failed: {$e->getMessage()}");
            $this->warn('Your pre-restore safety backup is available in the backups list.');
            return self::FAILURE;
        }
    }
}
```

### cms:backup:cleanup

```php
<?php

declare(strict_types=1);

namespace Backup\Commands;

use Illuminate\Console\Command;
use Backup\Services\BackupService;

class BackupCleanupCommand extends Command
{
    protected $signature = 'cms:backup:cleanup';

    protected $description = 'Nettoyer les anciennes sauvegardes selon la politique de retention';

    public function handle(BackupService $backupService): int
    {
        $this->info('Cleaning up old backups...');

        try {
            $deleted = $backupService->cleanup();
            $this->info("Cleanup completed. {$deleted} backup(s) deleted.");
            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Cleanup failed: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
```

---

## 10. Controllers admin

### BackupController

```php
<?php

declare(strict_types=1);

namespace Backup\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Backup\Models\Backup;
use Backup\Services\BackupService;
use Backup\Services\RestoreService;
use Backup\Http\Requests\TriggerBackupRequest;

class BackupController
{
    public function __construct(
        protected BackupService $backupService,
        protected RestoreService $restoreService,
    ) {}

    /**
     * Liste des sauvegardes
     */
    public function index(): Response
    {
        $backups = Backup::orderByDesc('created_at')
            ->paginate(20)
            ->through(fn(Backup $backup) => [
                'id' => $backup->id,
                'filename' => $backup->filename,
                'type' => $backup->type,
                'status' => $backup->status,
                'size' => $backup->human_size,
                'disk' => $backup->disk,
                'created_at' => $backup->created_at->format('Y-m-d H:i'),
                'completed_at' => $backup->completed_at?->format('Y-m-d H:i'),
                'duration' => $backup->duration,
                'triggered_by' => $backup->metadata['triggered_by'] ?? null,
                'error_message' => $backup->error_message,
                'creator' => $backup->creator?->name,
            ]);

        $stats = [
            'total_backups' => Backup::completed()->count(),
            'total_size' => Backup::completed()->sum('size'),
            'last_backup' => Backup::completed()->orderByDesc('created_at')->first()?->created_at,
            'failed_count' => Backup::failed()->where('created_at', '>=', now()->subWeek())->count(),
        ];

        return Inertia::render('Admin/Backups/Index', [
            'backups' => $backups,
            'stats' => $stats,
        ]);
    }

    /**
     * Lancer une sauvegarde manuelle
     */
    public function store(TriggerBackupRequest $request): RedirectResponse
    {
        $type = $request->validated('type');

        // Lancer en arriere-plan via une job
        dispatch(function () use ($type, $request) {
            $this->backupService->createBackup(
                type: $type,
                userId: $request->user()->id,
                triggeredBy: 'admin'
            );
        })->afterResponse();

        return redirect()->route('admin.backups.index')
            ->with('message', __('backup::messages.backup_started'));
    }

    /**
     * Telecharger une sauvegarde
     */
    public function download(Backup $backup)
    {
        if ($backup->status !== 'completed') {
            return redirect()->route('admin.backups.index')
                ->with('error', __('backup::messages.cannot_download'));
        }

        return $this->backupService->download($backup);
    }

    /**
     * Restaurer une sauvegarde (confirmation + execution)
     */
    public function restore(Request $request, Backup $backup): RedirectResponse
    {
        if ($backup->status !== 'completed') {
            return redirect()->route('admin.backups.index')
                ->with('error', __('backup::messages.cannot_restore'));
        }

        // Verification d'integrite
        if (!$this->backupService->verifyIntegrity($backup)) {
            return redirect()->route('admin.backups.index')
                ->with('error', __('backup::messages.integrity_failed'));
        }

        // Lancer la restauration en arriere-plan
        dispatch(function () use ($backup) {
            $this->restoreService->restore($backup);
        })->afterResponse();

        return redirect()->route('admin.backups.index')
            ->with('message', __('backup::messages.restore_started'));
    }

    /**
     * Supprimer une sauvegarde
     */
    public function destroy(Backup $backup): RedirectResponse
    {
        $this->backupService->delete($backup);

        return redirect()->route('admin.backups.index')
            ->with('message', __('backup::messages.backup_deleted'));
    }
}
```

### TriggerBackupRequest

```php
<?php

declare(strict_types=1);

namespace Backup\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TriggerBackupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('backups.manage');
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['full', 'db', 'media'])],
        ];
    }
}
```

---

## 11. Routes admin

```php
// content/plugins/backup/routes/admin.php
<?php

use Illuminate\Support\Facades\Route;
use Backup\Http\Controllers\BackupController;
use Backup\Http\Controllers\BackupSettingsController;

Route::middleware(['web', 'auth', 'admin'])
    ->prefix('admin/backups')
    ->name('admin.backups.')
    ->group(function () {
        // Liste et creation de sauvegardes
        Route::get('/', [BackupController::class, 'index'])->name('index');
        Route::post('/', [BackupController::class, 'store'])->name('store');

        // Actions sur une sauvegarde
        Route::get('/{backup}/download', [BackupController::class, 'download'])->name('download');
        Route::post('/{backup}/restore', [BackupController::class, 'restore'])->name('restore');
        Route::delete('/{backup}', [BackupController::class, 'destroy'])->name('destroy');

        // Parametres
        Route::get('/settings', [BackupSettingsController::class, 'edit'])->name('settings');
        Route::put('/settings', [BackupSettingsController::class, 'update'])->name('settings.update');
    });
```

---

## 12. Pages admin React

### Backups/Index.tsx

```tsx
// content/plugins/backup/resources/js/admin/Backups/Index.tsx
import { Head, router, usePage } from '@inertiajs/react';
import {
    HardDrive,
    Download,
    RotateCcw,
    Trash2,
    Play,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    Database,
    Image,
    Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface Backup {
    id: number;
    filename: string;
    type: 'full' | 'db' | 'media';
    status: 'pending' | 'running' | 'completed' | 'failed';
    size: string;
    disk: string;
    created_at: string;
    completed_at: string | null;
    duration: number | null;
    triggered_by: string | null;
    error_message: string | null;
    creator: string | null;
}

interface BackupStats {
    total_backups: number;
    total_size: number;
    last_backup: string | null;
    failed_count: number;
}

interface Props {
    backups: {
        data: Backup[];
        links: Record<string, string | null>;
        meta: Record<string, unknown>;
    };
    stats: BackupStats;
}

const typeIcons = {
    full: Archive,
    db: Database,
    media: Image,
};

const statusConfig = {
    pending: { icon: Clock, color: 'secondary', label: 'En attente' },
    running: { icon: Loader2, color: 'default', label: 'En cours' },
    completed: { icon: CheckCircle, color: 'success', label: 'Termine' },
    failed: { icon: XCircle, color: 'destructive', label: 'Echoue' },
};

function formatBytes(bytes: number): string {
    const units = ['o', 'Ko', 'Mo', 'Go'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
}

export default function BackupsIndex({ backups, stats }: Props) {
    const [backupType, setBackupType] = useState<'full' | 'db' | 'media'>('full');

    const triggerBackup = (type: 'full' | 'db' | 'media') => {
        router.post('/admin/backups', { type }, {
            preserveScroll: true,
        });
    };

    const restoreBackup = (backup: Backup) => {
        router.post(`/admin/backups/${backup.id}/restore`, {}, {
            preserveScroll: true,
        });
    };

    const deleteBackup = (backup: Backup) => {
        router.delete(`/admin/backups/${backup.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Sauvegardes" />

            <div className="space-y-6">
                {/* En-tete */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Sauvegardes</h1>
                        <p className="text-muted-foreground">
                            Gerez les sauvegardes et restaurations de votre site
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Play className="mr-2 h-4 w-4" />
                                Nouvelle sauvegarde
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => triggerBackup('full')}>
                                <Archive className="mr-2 h-4 w-4" />
                                Sauvegarde complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => triggerBackup('db')}>
                                <Database className="mr-2 h-4 w-4" />
                                Base de donnees uniquement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => triggerBackup('media')}>
                                <Image className="mr-2 h-4 w-4" />
                                Medias uniquement
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Statistiques */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total sauvegardes</CardDescription>
                            <CardTitle className="text-2xl">{stats.total_backups}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Espace utilise</CardDescription>
                            <CardTitle className="text-2xl">{formatBytes(stats.total_size)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Derniere sauvegarde</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.last_backup
                                    ? new Date(stats.last_backup).toLocaleDateString('fr-FR')
                                    : 'Aucune'}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Echecs (7 jours)</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.failed_count > 0 ? (
                                    <span className="text-destructive">{stats.failed_count}</span>
                                ) : (
                                    <span className="text-green-600">0</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Tableau des sauvegardes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historique des sauvegardes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fichier</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Taille</TableHead>
                                    <TableHead>Duree</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.data.map((backup) => {
                                    const TypeIcon = typeIcons[backup.type];
                                    const statusCfg = statusConfig[backup.status];
                                    const StatusIcon = statusCfg.icon;

                                    return (
                                        <TableRow key={backup.id}>
                                            <TableCell className="font-mono text-sm">
                                                {backup.filename}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <TypeIcon className="h-4 w-4" />
                                                    <span className="capitalize">{backup.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusCfg.color as any}>
                                                    <StatusIcon className={`mr-1 h-3 w-3 ${
                                                        backup.status === 'running' ? 'animate-spin' : ''
                                                    }`} />
                                                    {statusCfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{backup.size}</TableCell>
                                            <TableCell>
                                                {backup.duration ? `${backup.duration}s` : '-'}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {backup.triggered_by ?? '-'}
                                            </TableCell>
                                            <TableCell>{backup.created_at}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {backup.status === 'completed' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                asChild
                                                            >
                                                                <a href={`/admin/backups/${backup.id}/download`}>
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>

                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <RotateCcw className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            Restaurer cette sauvegarde ?
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            <div className="space-y-2">
                                                                                <p>
                                                                                    Cette action va restaurer la base
                                                                                    de donnees et les medias depuis la
                                                                                    sauvegarde <strong>{backup.filename}</strong>.
                                                                                </p>
                                                                                <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-800">
                                                                                    <AlertTriangle className="h-4 w-4" />
                                                                                    <span>
                                                                                        Une sauvegarde de securite sera
                                                                                        creee automatiquement avant la
                                                                                        restauration.
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => restoreBackup(backup)}
                                                                        >
                                                                            Restaurer
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </>
                                                    )}

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Supprimer cette sauvegarde ?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Le fichier sera definitivement supprime du disque.
                                                                    Cette action est irreversible.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteBackup(backup)}
                                                                    className="bg-destructive text-destructive-foreground"
                                                                >
                                                                    Supprimer
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
```

### Backups/Settings.tsx

```tsx
// content/plugins/backup/resources/js/admin/Backups/Settings.tsx
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

interface BackupSettings {
    auto_backup_enabled: boolean;
    backup_frequency: 'daily' | 'weekly' | 'monthly';
    backup_time: string;
    backup_disk: 'local' | 's3';
    retention_daily: number;
    retention_weekly: number;
    retention_monthly: number;
    max_backup_size_mb: number;
}

interface Props {
    settings: BackupSettings;
}

export default function BackupSettingsPage({ settings }: Props) {
    const { data, setData, put, processing, errors } = useForm<BackupSettings>({
        auto_backup_enabled: settings.auto_backup_enabled,
        backup_frequency: settings.backup_frequency,
        backup_time: settings.backup_time,
        backup_disk: settings.backup_disk,
        retention_daily: settings.retention_daily,
        retention_weekly: settings.retention_weekly,
        retention_monthly: settings.retention_monthly,
        max_backup_size_mb: settings.max_backup_size_mb,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/backups/settings');
    };

    return (
        <>
            <Head title="Parametres de sauvegarde" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Parametres de sauvegarde</h1>
                    <p className="text-muted-foreground">
                        Configurez les sauvegardes automatiques et la politique de retention
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Planification */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Planification</CardTitle>
                            <CardDescription>
                                Configurez les sauvegardes automatiques
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Sauvegardes automatiques</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Activer les sauvegardes planifiees
                                    </p>
                                </div>
                                <Switch
                                    checked={data.auto_backup_enabled}
                                    onCheckedChange={(checked) => setData('auto_backup_enabled', checked)}
                                />
                            </div>

                            {data.auto_backup_enabled && (
                                <>
                                    <Separator />
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="backup_frequency">Frequence</Label>
                                            <Select
                                                value={data.backup_frequency}
                                                onValueChange={(value) =>
                                                    setData('backup_frequency', value as BackupSettings['backup_frequency'])
                                                }
                                            >
                                                <SelectTrigger id="backup_frequency">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Quotidienne</SelectItem>
                                                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                                    <SelectItem value="monthly">Mensuelle</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="backup_time">Heure</Label>
                                            <Input
                                                id="backup_time"
                                                type="time"
                                                value={data.backup_time}
                                                onChange={(e) => setData('backup_time', e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Recommande : entre 02:00 et 05:00
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Destination */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Destination</CardTitle>
                            <CardDescription>
                                Ou stocker les sauvegardes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="backup_disk">Disque de stockage</Label>
                                <Select
                                    value={data.backup_disk}
                                    onValueChange={(value) =>
                                        setData('backup_disk', value as BackupSettings['backup_disk'])
                                    }
                                >
                                    <SelectTrigger id="backup_disk">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local">Local (serveur)</SelectItem>
                                        <SelectItem value="s3">Amazon S3 / Compatible</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_backup_size_mb">Taille maximale (Mo)</Label>
                                <Input
                                    id="max_backup_size_mb"
                                    type="number"
                                    min={50}
                                    max={10240}
                                    value={data.max_backup_size_mb}
                                    onChange={(e) => setData('max_backup_size_mb', parseInt(e.target.value))}
                                />
                                {errors.max_backup_size_mb && (
                                    <p className="text-sm text-destructive">{errors.max_backup_size_mb}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Retention */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Politique de retention</CardTitle>
                            <CardDescription>
                                Combien de sauvegardes conserver automatiquement
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="retention_daily">Retention quotidienne</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="retention_daily"
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={data.retention_daily}
                                            onChange={(e) => setData('retention_daily', parseInt(e.target.value))}
                                        />
                                        <span className="text-sm text-muted-foreground">jours</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="retention_weekly">Retention hebdomadaire</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="retention_weekly"
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={data.retention_weekly}
                                            onChange={(e) => setData('retention_weekly', parseInt(e.target.value))}
                                        />
                                        <span className="text-sm text-muted-foreground">semaines</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="retention_monthly">Retention mensuelle</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="retention_monthly"
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={data.retention_monthly}
                                            onChange={(e) => setData('retention_monthly', parseInt(e.target.value))}
                                        />
                                        <span className="text-sm text-muted-foreground">mois</span>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Par defaut : 7 sauvegardes quotidiennes, 4 hebdomadaires (lundi), 3 mensuelles (1er du mois).
                                Les sauvegardes echouees sont supprimees apres 24 heures.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Bouton de sauvegarde */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Enregistrement...' : 'Enregistrer les parametres'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
```

---

## 13. Securite et integrite

### Verification avant restauration

Le flux de restauration applique les controles de securite suivants dans l'ordre :

```
1. Verifier le statut de la sauvegarde (doit etre "completed")
       ↓
2. Verifier le checksum SHA-256 (integrite du fichier)
       ↓
3. Creer une sauvegarde de securite automatique (pre-restore)
       ↓
4. Extraire dans un repertoire temporaire isole
       ↓
5. Restaurer la DB dans une transaction (rollback si erreur)
       ↓
6. Restaurer les medias (ancien dossier renomme, pas supprime)
       ↓
7. Vider tous les caches
       ↓
8. Nettoyer le repertoire temporaire
```

### Points de securite

```php
// Verification d'integrite avant restauration
public function verifyIntegrity(Backup $backup): bool
{
    // 1. Le fichier existe-t-il sur le disque ?
    if (!Storage::disk($backup->disk)->exists($backup->path)) {
        Log::warning("Backup file not found: {$backup->path}");
        return false;
    }

    // 2. Le checksum correspond-il ?
    $storedChecksum = $backup->metadata['checksum'] ?? null;
    if (!$storedChecksum) {
        Log::warning("No checksum stored for backup: {$backup->filename}");
        return false;
    }

    $currentChecksum = $this->calculateChecksum($backup);
    if ($storedChecksum !== $currentChecksum) {
        Log::error("Checksum mismatch for backup: {$backup->filename}", [
            'stored' => $storedChecksum,
            'current' => $currentChecksum,
        ]);
        return false;
    }

    // 3. Le fichier ZIP est-il valide ?
    $path = Storage::disk($backup->disk)->path($backup->path);
    $zip = new \ZipArchive();
    $result = $zip->open($path, \ZipArchive::CHECKCONS);
    if ($result !== true) {
        Log::error("Invalid ZIP archive: {$backup->filename}");
        return false;
    }
    $zip->close();

    return true;
}
```

### Permissions requises

```php
// L'acces aux sauvegardes necessite la permission "backups.manage"
// Cette permission est attribuee uniquement au role "admin" par defaut

// Dans les roles par defaut :
[
    'admin' => ['*'],                   // Acces total, inclut backups.manage
    'editor' => ['pages.*', '...'],     // Pas d'acces aux sauvegardes
    'author' => ['pages.create', '...'],
    'subscriber' => ['profile.edit'],
]
```

---

## 14. Hooks du plugin

```php
// Le plugin backup s'integre via le systeme de hooks CMS :

// --- Hooks emis par le plugin ---

// Declenchement : quand une sauvegarde demarre
CMS::fireHook('backup.started', $backup);
// $backup : instance Backup\Models\Backup (status = "running")

// Declenchement : quand une sauvegarde se termine avec succes
CMS::fireHook('backup.completed', $backup);
// $backup : instance Backup\Models\Backup (status = "completed")

// Declenchement : quand une sauvegarde echoue
CMS::fireHook('backup.failed', $backup, $exception);
// $backup : instance Backup\Models\Backup (status = "failed")
// $exception : instance \Throwable

// Declenchement : quand une restauration reussit
CMS::fireHook('backup.restored', $backup);
// $backup : instance Backup\Models\Backup (la sauvegarde qui a ete restauree)


// --- Exemple d'ecoute par d'autres plugins ---

// Envoyer une notification email apres un echec de sauvegarde
CMS::hook('backup.failed', function (Backup $backup, \Throwable $e) {
    Mail::to(config('cms.admin_email'))->send(
        new BackupFailedNotification($backup, $e)
    );
});

// Logger les restaurations dans un audit trail
CMS::hook('backup.restored', function (Backup $backup) {
    AuditLog::create([
        'action' => 'backup.restored',
        'details' => "Restored from backup: {$backup->filename}",
        'user_id' => auth()->id(),
    ]);
});

// Integration sidebar admin
CMS::hook('admin_sidebar', function (&$items) {
    $items[] = [
        'label' => 'Sauvegardes',
        'icon' => 'hard-drive',
        'url' => '/admin/backups',
        'permission' => 'backups.manage',
        'children' => [
            ['label' => 'Toutes les sauvegardes', 'url' => '/admin/backups'],
            ['label' => 'Parametres', 'url' => '/admin/backups/settings'],
        ],
    ];
});
```

---

## 15. Phase d'implementation

Le plugin backup est un **feature Phase 6** (apres le systeme de medias et les plugins de base). Il necessite que le core CMS, le systeme de plugins et le systeme de medias soient fonctionnels.

**Etapes :**
1. Installer `spatie/laravel-backup` via Composer
2. Creer la structure du plugin dans `content/plugins/backup/`
3. Creer la migration et le modele `Backup`
4. Implementer `BackupService` avec integration spatie
5. Implementer `RestoreService` avec verification d'integrite
6. Creer les 3 commandes Artisan (`cms:backup`, `cms:backup:restore`, `cms:backup:cleanup`)
7. Creer les controllers et routes admin
8. Creer les pages React (Index + Settings)
9. Configurer le scheduler pour les sauvegardes automatiques
10. Implementer les hooks et les ecouter
11. Ecrire les tests (unitaires pour les services, integration pour le flux complet)
12. Documenter la configuration S3 et les variables d'environnement
