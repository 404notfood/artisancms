<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use ZipArchive;

class UpdateArchive
{
    public function download(string $url, string $checksum): string
    {
        if (!preg_match('/^[a-f0-9]{64}$/iD', $checksum) || parse_url($url, PHP_URL_SCHEME) !== 'https') {
            throw new RuntimeException('Une URL HTTPS et une empreinte SHA-256 valide sont requises.');
        }
        $directory = config('cms.updates.temp_dir', storage_path('app/updates'));
        File::ensureDirectoryExists($directory);
        $path = $directory . '/' . bin2hex(random_bytes(16)) . '.zip';
        try {
            $response = Http::timeout(120)->withOptions(['sink' => $path, 'allow_redirects' => ['protocols' => ['https']]])->get($url);
            if (!$response->successful() || !is_file($path) || !hash_equals(strtolower($checksum), hash_file('sha256', $path))) {
                throw new RuntimeException('Téléchargement incomplet ou empreinte SHA-256 incorrecte.');
            }

            return $path;
        } catch (\Throwable $e) {
            File::delete($path);
            throw $e;
        }
    }

    /** Extract into a caller-owned staging directory, without accepting links or unsafe paths. */
    public function extract(string $archive, string $directory): string
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('L’extension PHP zip est nécessaire pour installer les mises à jour.');
        }
        $zip = new ZipArchive();
        if ($zip->open($archive) !== true) {
            throw new RuntimeException('Archive ZIP invalide.');
        }
        try {
            $size = 0;
            $names = [];
            if ($zip->numFiles > 100000) {
                throw new RuntimeException('Archive trop volumineuse.');
            }
            for ($index = 0; $index < $zip->numFiles; $index++) {
                $entry = $zip->statIndex($index);
                $name = $entry['name'];
                $segments = explode('/', rtrim($name, '/'));
                $reserved = array_filter($segments, fn (string $segment) => preg_match('/[. ]$/D', $segment)
                    || preg_match('/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i', $segment));
                $zip->getExternalAttributesIndex($index, $system, $attributes);
                if ($name === '' || str_starts_with($name, '/') || str_contains($name, '\\') || str_contains($name, ':')
                    || str_contains($name, "\0") || in_array('..', $segments, true) || in_array('.', $segments, true)
                    || in_array('', $segments, true) || (($attributes >> 16) & 0170000) === 0120000
                    || $reserved || isset($names[strtolower($name)])) {
                    throw new RuntimeException('Archive refusée : chemin non sûr ou lien symbolique.');
                }
                $names[strtolower($name)] = true;
                $size += $entry['size'];
                if ($size > config('cms.updates.max_extracted_bytes', 1073741824)) {
                    throw new RuntimeException('Archive décompressée trop volumineuse.');
                }
            }
            File::ensureDirectoryExists($directory);
            if (!$zip->extractTo($directory)) {
                throw new RuntimeException('Impossible de décompresser la mise à jour.');
            }
        } finally {
            $zip->close();
        }

        $entries = array_values(array_diff(scandir($directory), ['.', '..']));
        if (count($entries) === 1 && is_dir($directory . '/' . $entries[0])) {
            return $directory . '/' . $entries[0];
        }

        return $directory;
    }
}
