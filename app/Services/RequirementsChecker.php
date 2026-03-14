<?php

declare(strict_types=1);

namespace App\Services;

class RequirementsChecker
{
    public function check(string $stack = 'laravel'): array
    {
        $requirements = [];
        $isLaravel = $stack === 'laravel';

        $requirements['php_version'] = [
            'label' => 'PHP >= 8.2',
            'required' => $isLaravel,
            'passed' => PHP_VERSION_ID >= 80200,
            'current' => PHP_VERSION,
            'message' => 'PHP 8.2 ou supérieur est requis.',
        ];

        $requiredExtensions = [
            'pdo' => 'PDO',
            'pdo_mysql' => 'PDO MySQL',
            'openssl' => 'OpenSSL',
            'mbstring' => 'Mbstring',
            'tokenizer' => 'Tokenizer',
            'xml' => 'XML',
            'ctype' => 'Ctype',
            'json' => 'JSON',
            'bcmath' => 'BCMath',
            'fileinfo' => 'Fileinfo',
            'curl' => 'cURL',
        ];

        foreach ($requiredExtensions as $ext => $label) {
            $requirements["ext_{$ext}"] = [
                'label' => "Extension {$label}",
                'required' => $isLaravel,
                'passed' => extension_loaded($ext),
                'current' => extension_loaded($ext) ? 'Installée' : 'Manquante',
                'message' => "L'extension PHP {$label} est requise.",
            ];
        }

        $hasGd = extension_loaded('gd');
        $hasImagick = extension_loaded('imagick');
        $requirements['ext_image'] = [
            'label' => 'Extension GD ou Imagick',
            'required' => $isLaravel,
            'passed' => $hasGd || $hasImagick,
            'current' => $hasGd ? 'GD' : ($hasImagick ? 'Imagick' : 'Manquante'),
            'message' => 'GD ou Imagick est requis pour le traitement des images.',
        ];

        $writablePaths = [
            'storage' => storage_path(),
            'bootstrap_cache' => base_path('bootstrap/cache'),
            'env_file' => base_path('.env'),
            'content' => base_path('content'),
        ];

        foreach ($writablePaths as $key => $path) {
            $label = match ($key) {
                'storage' => 'Dossier storage/',
                'bootstrap_cache' => 'Dossier bootstrap/cache/',
                'env_file' => 'Fichier .env',
                'content' => 'Dossier content/',
            };

            $requirements["writable_{$key}"] = [
                'label' => "{$label} accessible en écriture",
                'required' => true,
                'passed' => is_writable($path),
                'current' => is_writable($path) ? 'OK' : 'Non accessible',
                'message' => "{$label} doit être accessible en écriture.",
            ];
        }

        $nodeVersion = $this->getCommandVersion('node -v');
        $requirements['node'] = [
            'label' => 'Node.js >= 20',
            'required' => !$isLaravel,
            'passed' => $nodeVersion !== null && version_compare($nodeVersion, '20.0.0', '>='),
            'current' => $nodeVersion ?? 'Non installé',
            'message' => $isLaravel
                ? 'Node.js 20+ est recommandé pour le build des assets.'
                : 'Node.js 20+ est requis pour Next.js.',
        ];

        $npmVersion = $this->getCommandVersion('npm -v');
        $requirements['npm'] = [
            'label' => 'npm >= 9',
            'required' => !$isLaravel,
            'passed' => $npmVersion !== null && version_compare($npmVersion, '9.0.0', '>='),
            'current' => $npmVersion ?? 'Non installé',
            'message' => $isLaravel
                ? 'npm 9+ est recommandé pour la gestion des dépendances.'
                : 'npm 9+ est requis pour Next.js.',
        ];

        $allRequiredPassed = collect($requirements)
            ->where('required', true)
            ->every(fn ($r) => $r['passed']);

        return [
            'passed' => $allRequiredPassed,
            'requirements' => $requirements,
        ];
    }

    private function getCommandVersion(string $command): ?string
    {
        try {
            $output = [];
            $returnCode = 0;
            exec("{$command} 2>&1", $output, $returnCode);

            if ($returnCode === 0 && !empty($output[0])) {
                return ltrim(trim($output[0]), 'v');
            }
        } catch (\Throwable) {
        }

        return null;
    }
}
