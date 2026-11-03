<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\File;
use RuntimeException;

class CorePackageInstaller
{
    // Site-owned files (storage, .env, content, public uploads) are deliberately outside this list.
    private const PATHS = [
        'app', 'config', 'database/migrations', 'database/factories', 'database/seeders',
        'lang', 'public/build', 'public/index.php', 'resources', 'routes', 'vendor',
        'bootstrap/app.php', 'bootstrap/providers.php', 'artisan', 'composer.json', 'composer.lock',
        'VERSION', 'CHANGELOG.md',
    ];

    public function validate(string $package, string $version): void
    {
        foreach (['artisan', 'VERSION', 'composer.json', 'composer.lock', 'vendor/autoload.php', 'vendor/composer/platform_check.php', 'bootstrap/app.php', 'bootstrap/providers.php', 'config/cms.php', 'public/index.php', 'public/build/manifest.json'] as $file) {
            if (!is_file($package . '/' . $file)) {
                throw new RuntimeException("Archive du CMS incomplète : {$file} manquant.");
            }
        }
        foreach (['app', 'routes', 'resources', 'database/migrations'] as $directory) {
            if (!is_dir($package . '/' . $directory)) {
                throw new RuntimeException("Archive du CMS incomplète : {$directory} manquant.");
            }
        }
        $composer = json_decode(File::get($package . '/composer.json'), true, 512, JSON_THROW_ON_ERROR);
        if (($composer['name'] ?? null) !== 'artisancms/artisancms' || trim(File::get($package . '/VERSION')) !== $version) {
            throw new RuntimeException('Le package ne correspond pas au CMS ou à la version annoncée.');
        }
        if (!preg_match('/[\'"]version[\'"]\s*=>\s*[\'"]' . preg_quote($version, '/') . '[\'"]/', File::get($package . '/config/cms.php'))) {
            throw new RuntimeException('La version de la configuration ne correspond pas au package.');
        }
    }

    public function backup(string $root, string $backup): void
    {
        $paths = [];
        foreach (self::PATHS as $path) {
            $this->assertSafeTarget($root, $path);
            $paths[$path] = file_exists($root . '/' . $path);
            if ($paths[$path]) {
                $this->copy($root . '/' . $path, $backup . '/' . $path);
            }
        }
        File::ensureDirectoryExists($backup);
        File::put($backup . '/snapshot.json', json_encode($paths, JSON_THROW_ON_ERROR));
    }

    public function apply(string $package, string $root): void
    {
        foreach (self::PATHS as $path) {
            if (!file_exists($package . '/' . $path)) {
                continue;
            }
            $this->assertSafeTarget($root, $path);
            $this->remove($root . '/' . $path);
            $this->copy($package . '/' . $path, $root . '/' . $path);
        }
    }

    public function restore(string $backup, string $root): void
    {
        $snapshot = json_decode(File::get($backup . '/snapshot.json'), true, 512, JSON_THROW_ON_ERROR);
        if (array_keys($snapshot) !== self::PATHS) {
            throw new RuntimeException('Sauvegarde du cœur invalide.');
        }
        foreach ($snapshot as $path => $existed) {
            $this->assertSafeTarget($root, $path);
            if ($existed && !file_exists($backup . '/' . $path)) {
                throw new RuntimeException("Sauvegarde incomplète : {$path} manquant.");
            }
        }
        foreach ($snapshot as $path => $existed) {
            $this->remove($root . '/' . $path);
            if ($existed) {
                $this->copy($backup . '/' . $path, $root . '/' . $path);
            }
        }
    }

    private function assertSafeTarget(string $root, string $path): void
    {
        if (!is_dir($root) || is_link($root) || !in_array($path, self::PATHS, true)) {
            throw new RuntimeException('Destination de mise à jour invalide.');
        }
        $target = $root;
        foreach (explode('/', $path) as $segment) {
            $target .= '/' . $segment;
            if (is_link($target)) {
                throw new RuntimeException('Mise à jour impossible sur un lien symbolique.');
            }
        }
        if (is_dir($target)) {
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($target, \FilesystemIterator::SKIP_DOTS));
            foreach ($iterator as $file) {
                if ($file->isLink()) {
                    throw new RuntimeException('Un dossier du cœur contient un lien symbolique.');
                }
            }
        }
    }

    private function remove(string $path): void
    {
        if (is_dir($path) ? !File::deleteDirectory($path) : (is_file($path) && !File::delete($path))) {
            throw new RuntimeException("Impossible de remplacer {$path}.");
        }
    }

    private function copy(string $source, string $target): void
    {
        File::ensureDirectoryExists(dirname($target));
        $success = is_dir($source) ? File::copyDirectory($source, $target) : File::copy($source, $target);
        if (!$success) {
            throw new RuntimeException("Copie impossible vers {$target}.");
        }
    }
}
