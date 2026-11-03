<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\File;

class ReleaseRegistry
{
    public function register(array $release): void
    {
        $directory = $this->directory($release['type'], $release['slug'] ?? 'core');
        File::ensureDirectoryExists($directory);
        File::replace($directory . '/' . $release['version'] . '.json', json_encode([
            ...$release,
            'published_at' => now()->toIso8601String(),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    }

    public function latest(string $type, string $slug = 'core'): ?array
    {
        $directory = $this->directory($type, $slug);
        $latest = null;
        if (!is_dir($directory)) {
            return null;
        }

        foreach (File::files($directory) as $file) {
            if ($file->getExtension() !== 'json') {
                continue;
            }
            $release = json_decode(File::get($file->getPathname()), true, 512, JSON_THROW_ON_ERROR);
            if ($latest === null || version_compare($release['version'], $latest['version'], '>')) {
                $latest = $release;
            }
        }

        return $latest;
    }

    private function directory(string $type, string $slug): string
    {
        if (!in_array($type, ['cms', 'plugin', 'theme'], true) || !preg_match('/^[a-z0-9][a-z0-9-]*$/D', $slug)) {
            throw new \InvalidArgumentException('Type ou identifiant de release invalide.');
        }

        return config('cms.registry.storage_path', storage_path('app/private/registry')) . '/' . $type . '/' . $slug;
    }

    public function catalog(string $type): array
    {
        $parent = dirname($this->directory($type, 'core'));
        $catalog = [];
        if (is_dir($parent)) {
            foreach (File::directories($parent) as $directory) {
                $release = $this->latest($type, basename($directory));
                if ($release) {
                    $catalog[] = [
                        'slug' => $release['slug'], 'name' => $release['name'] ?? $release['slug'],
                        'version' => $release['version'], 'description' => $release['description'] ?? '',
                        'download_url' => $release['download_url'], 'checksum_sha256' => $release['checksum_sha256'],
                    ];
                }
            }
        }

        return $catalog;
    }
}
