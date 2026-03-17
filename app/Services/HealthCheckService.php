<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HealthCheckService
{
    /**
     * Run all health checks.
     *
     * @return array{checks: array<int, array{name: string, status: string, message: string, details?: string}>, overall: string, server: array<string, string>}
     */
    public function runAll(): array
    {
        $checks = [
            $this->checkDatabase(),
            $this->checkCache(),
            $this->checkStorage(),
            $this->checkDisk(),
            $this->checkPhp(),
        ];

        $statuses = array_column($checks, 'status');
        $overall = 'healthy';
        if (in_array('error', $statuses, true)) {
            $overall = 'unhealthy';
        } elseif (in_array('warning', $statuses, true)) {
            $overall = 'degraded';
        }

        return [
            'checks' => $checks,
            'overall' => $overall,
            'server' => $this->getServerInfo(),
        ];
    }

    /**
     * @return array{name: string, status: string, message: string, details?: string}
     */
    private function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $ms = round((microtime(true) - $start) * 1000, 1);

            return [
                'name' => 'Database',
                'status' => $ms > 500 ? 'warning' : 'ok',
                'message' => "Connexion OK ({$ms}ms)",
                'details' => 'Driver: ' . config('database.default'),
            ];
        } catch (\Throwable $e) {
            return [
                'name' => 'Database',
                'status' => 'error',
                'message' => 'Connexion échouée',
                'details' => $e->getMessage(),
            ];
        }
    }

    /**
     * @return array{name: string, status: string, message: string, details?: string}
     */
    private function checkCache(): array
    {
        try {
            $key = 'health_check_' . time();
            Cache::put($key, 'ok', 10);
            $value = Cache::get($key);
            Cache::forget($key);

            if ($value === 'ok') {
                return [
                    'name' => 'Cache',
                    'status' => 'ok',
                    'message' => 'Cache fonctionnel',
                    'details' => 'Driver: ' . config('cache.default'),
                ];
            }

            return [
                'name' => 'Cache',
                'status' => 'warning',
                'message' => 'Le cache ne retourne pas les valeurs attendues',
            ];
        } catch (\Throwable $e) {
            return [
                'name' => 'Cache',
                'status' => 'error',
                'message' => 'Cache indisponible',
                'details' => $e->getMessage(),
            ];
        }
    }

    /**
     * @return array{name: string, status: string, message: string, details?: string}
     */
    private function checkStorage(): array
    {
        try {
            $testFile = 'health_check_test.txt';
            Storage::disk('public')->put($testFile, 'ok');
            $content = Storage::disk('public')->get($testFile);
            Storage::disk('public')->delete($testFile);

            if ($content === 'ok') {
                return [
                    'name' => 'Storage',
                    'status' => 'ok',
                    'message' => 'Stockage accessible en lecture/écriture',
                ];
            }

            return [
                'name' => 'Storage',
                'status' => 'warning',
                'message' => 'Le stockage ne retourne pas les valeurs attendues',
            ];
        } catch (\Throwable $e) {
            return [
                'name' => 'Storage',
                'status' => 'error',
                'message' => 'Stockage inaccessible',
                'details' => $e->getMessage(),
            ];
        }
    }

    /**
     * @return array{name: string, status: string, message: string, details?: string}
     */
    private function checkDisk(): array
    {
        $freeSpace = @disk_free_space(storage_path());
        if ($freeSpace === false) {
            return [
                'name' => 'Disk',
                'status' => 'warning',
                'message' => 'Impossible de vérifier l\'espace disque',
            ];
        }

        $freeGB = round($freeSpace / 1073741824, 1);
        $freeMB = round($freeSpace / 1048576);

        if ($freeSpace < 100 * 1024 * 1024) {
            return [
                'name' => 'Disk',
                'status' => 'error',
                'message' => "Espace disque critique ({$freeMB} Mo restants)",
            ];
        }

        if ($freeSpace < 500 * 1024 * 1024) {
            return [
                'name' => 'Disk',
                'status' => 'warning',
                'message' => "Espace disque faible ({$freeMB} Mo restants)",
            ];
        }

        return [
            'name' => 'Disk',
            'status' => 'ok',
            'message' => "{$freeGB} Go disponibles",
        ];
    }

    /**
     * @return array{name: string, status: string, message: string, details?: string}
     */
    private function checkPhp(): array
    {
        $version = PHP_VERSION;
        $requiredExtensions = ['pdo', 'mbstring', 'json', 'openssl', 'xml', 'curl', 'gd'];
        $missing = [];

        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                $missing[] = $ext;
            }
        }

        if (!empty($missing)) {
            return [
                'name' => 'PHP',
                'status' => 'warning',
                'message' => "Extensions manquantes : " . implode(', ', $missing),
                'details' => "PHP {$version}",
            ];
        }

        return [
            'name' => 'PHP',
            'status' => 'ok',
            'message' => "PHP {$version} avec toutes les extensions requises",
        ];
    }

    /**
     * @return array<string, string>
     */
    private function getServerInfo(): array
    {
        $memoryUsage = memory_get_usage(true);
        $memoryMB = round($memoryUsage / 1048576, 1);

        return [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'cms_version' => config('cms.version', '1.0.0'),
            'uptime' => $this->getUptime(),
            'memory_usage' => "{$memoryMB} Mo",
        ];
    }

    private function getUptime(): string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            return 'N/A';
        }

        $uptime = @file_get_contents('/proc/uptime');
        if ($uptime === false) {
            return 'N/A';
        }

        $seconds = (int) explode(' ', $uptime)[0];
        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);

        if ($days > 0) {
            return "{$days}j {$hours}h";
        }
        return "{$hours}h";
    }
}
