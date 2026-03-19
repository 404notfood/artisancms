<?php

declare(strict_types=1);

namespace Backup\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

/**
 * Handles MySQL database dump operations.
 * Extracted from BackupService to keep file sizes manageable.
 */
class DatabaseDumper
{
    /**
     * Create a MySQL dump file using mysqldump.
     *
     * @throws RuntimeException When the dump fails
     */
    public function dump(string $path): void
    {
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (!$dbConfig || empty($dbConfig['database'])) {
            throw new RuntimeException("Database connection '{$connection}' is not configured.");
        }

        $mysqldump = $this->findBinary();

        $args = [
            $mysqldump,
            '--host=' . ($dbConfig['host'] ?? '127.0.0.1'),
            '--port=' . ($dbConfig['port'] ?? '3306'),
            '--user=' . ($dbConfig['username'] ?? 'root'),
            '--single-transaction',
            '--routines',
            '--triggers',
            '--add-drop-table',
            '--result-file=' . str_replace('/', DIRECTORY_SEPARATOR, $path),
            $dbConfig['database'],
        ];

        // Pass password via environment variable to avoid exposing it in process list
        $env = null;
        $password = $dbConfig['password'] ?? '';
        if ($password !== '') {
            $env = array_merge(getenv() ?: [], ['MYSQL_PWD' => $password]);
        }

        $process = new Process($args, null, $env);
        $process->setTimeout(300);
        $process->run();

        if (!$process->isSuccessful()) {
            $stderr = mb_convert_encoding($process->getErrorOutput(), 'UTF-8', 'UTF-8');
            throw new RuntimeException(
                "mysqldump failed (exit {$process->getExitCode()}): {$stderr}"
            );
        }

        if (!File::exists($path) || filesize($path) === 0) {
            throw new RuntimeException('mysqldump produced an empty file.');
        }
    }

    /**
     * Get the number of tables in the current database.
     */
    public function getTableCount(): int
    {
        $dbName = config('database.connections.' . config('database.default') . '.database');

        try {
            $result = DB::selectOne(
                'SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ?',
                [$dbName]
            );
            return (int) ($result->cnt ?? 0);
        } catch (\Throwable) {
            return 0;
        }
    }

    /**
     * Locate the mysqldump binary, checking PATH first then common local dev paths.
     *
     * @throws RuntimeException When not found
     */
    private function findBinary(): string
    {
        $finder = new ExecutableFinder();
        $found = $finder->find('mysqldump');

        if ($found !== null) {
            return $found;
        }

        // Common local dev paths on Windows
        $patterns = [
            'C:/laragon/bin/mysql/*/bin/mysqldump.exe',
            'C:/xampp/mysql/bin/mysqldump.exe',
            'C:/wamp64/bin/mysql/*/bin/mysqldump.exe',
        ];

        // Try to detect Laragon from the project path
        $basePath = base_path();
        if (preg_match('#([A-Za-z]:[/\\\\].*?[/\\\\]laragon)[/\\\\]#i', $basePath, $m)) {
            array_unshift($patterns, str_replace('\\', '/', $m[1]) . '/bin/mysql/*/bin/mysqldump.exe');
        }

        foreach ($patterns as $pattern) {
            $matches = glob($pattern);
            if (!$matches) {
                continue;
            }
            foreach ($matches as $candidate) {
                if (file_exists($candidate)) {
                    return $candidate;
                }
            }
        }

        throw new RuntimeException(
            'mysqldump not found. Install MySQL client tools or add them to your PATH.'
        );
    }
}
