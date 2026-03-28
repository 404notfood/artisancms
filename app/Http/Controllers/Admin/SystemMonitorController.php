<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class SystemMonitorController extends Controller
{
    /**
     * Scheduler: list all scheduled tasks.
     */
    public function scheduler(): Response
    {
        $tasks = $this->getScheduledTasks();

        return Inertia::render('Admin/System/Scheduler', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Queues: show queue status and failed jobs.
     */
    public function queues(): Response
    {
        $driver = config('queue.default');
        $isDatabase = $driver === 'database';

        $data = [
            'driver' => $driver,
            'is_database' => $isDatabase,
            'pending' => 0,
            'failed_count' => 0,
            'failed_jobs' => [],
        ];

        if ($isDatabase) {
            $jobsTable = config('queue.connections.database.table', 'jobs');

            $data['pending'] = Schema::hasTable($jobsTable)
                ? DB::table($jobsTable)->count()
                : 0;

            if (Schema::hasTable('failed_jobs')) {
                $data['failed_count'] = DB::table('failed_jobs')->count();
                $data['failed_jobs'] = DB::table('failed_jobs')
                    ->orderByDesc('failed_at')
                    ->limit(20)
                    ->get()
                    ->map(fn ($job) => [
                        'id' => $job->id,
                        'uuid' => $job->uuid ?? null,
                        'connection' => $job->connection,
                        'queue' => $job->queue,
                        'payload_short' => $this->extractJobName($job->payload),
                        'exception_short' => \Illuminate\Support\Str::limit($job->exception, 200),
                        'failed_at' => $job->failed_at,
                    ])
                    ->all();
            }
        }

        return Inertia::render('Admin/System/Queues', $data);
    }

    /**
     * Retry a single failed job.
     */
    public function retryJob(string $id): RedirectResponse
    {
        Artisan::call('queue:retry', ['id' => [$id]]);

        return redirect()->back()->with('success', __('cms.system.job_retried'));
    }

    /**
     * Delete a single failed job.
     */
    public function deleteJob(string $id): RedirectResponse
    {
        Artisan::call('queue:forget', ['id' => $id]);

        return redirect()->back()->with('success', __('cms.system.job_deleted'));
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAll(): RedirectResponse
    {
        Artisan::call('queue:retry', ['id' => ['all']]);

        return redirect()->back()->with('success', __('cms.system.all_jobs_retried'));
    }

    /**
     * Flush all failed jobs.
     */
    public function flushFailed(): RedirectResponse
    {
        Artisan::call('queue:flush');

        return redirect()->back()->with('success', __('cms.system.failed_jobs_flushed'));
    }

    /**
     * Performance: server & application metrics.
     */
    public function performance(): Response
    {
        $dbSize = $this->getDatabaseSize();
        $diskFree = disk_free_space(base_path()) ?: 0;
        $diskTotal = disk_total_space(base_path()) ?: 1;

        $metrics = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'memory_limit' => ini_get('memory_limit') ?: 'N/A',
            'max_execution_time' => (int) ini_get('max_execution_time'),
            'disk_free' => $diskFree,
            'disk_total' => $diskTotal,
            'disk_used_percent' => round((1 - $diskFree / $diskTotal) * 100, 1),
            'db_size' => $dbSize,
            'db_name' => config('database.connections.' . config('database.default') . '.database', 'N/A'),
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
            'session_driver' => config('session.driver'),
            'counts' => [
                'pages' => $this->safeCount('pages'),
                'posts' => $this->safeCount('posts'),
                'media' => $this->safeCount('media'),
                'users' => $this->safeCount('users'),
            ],
            'last_backup' => $this->getLastBackup(),
        ];

        return Inertia::render('Admin/System/Performance', [
            'metrics' => $metrics,
        ]);
    }

    /**
     * Parse schedule:list output to extract tasks.
     */
    private function getScheduledTasks(): array
    {
        try {
            Artisan::call('schedule:list');
            $output = Artisan::output();

            if (empty(trim($output)) || str_contains($output, 'No scheduled commands')) {
                return [];
            }

            $tasks = [];
            $lines = explode("\n", trim($output));

            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '-')) {
                    continue;
                }

                // Parse line: "expression  command  next_due_at  description"
                if (preg_match('/^([\S]+(?:\s+[\S]+){4})\s+(.+?)\s{2,}(Next Due:.+?)(?:\s{2,}(.*))?$/', $line, $m)) {
                    $tasks[] = [
                        'expression' => trim($m[1]),
                        'command' => trim($m[2]),
                        'next_due_at' => str_replace('Next Due: ', '', trim($m[3])),
                        'description' => trim($m[4] ?? ''),
                    ];
                } elseif (preg_match('/^\s*([\*\/\d\,\-]+\s+[\*\/\d\,\-]+\s+[\*\/\d\,\-]+\s+[\*\/\d\,\-]+\s+[\*\/\d\,\-]+)\s+(.+)/', $line, $m)) {
                    $tasks[] = [
                        'expression' => trim($m[1]),
                        'command' => trim($m[2]),
                        'next_due_at' => '',
                        'description' => '',
                    ];
                }
            }

            return $tasks;
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Extract job class name from payload JSON.
     */
    private function extractJobName(string $payload): string
    {
        try {
            $data = json_decode($payload, true);

            return $data['displayName'] ?? $data['job'] ?? 'Unknown';
        } catch (\Throwable) {
            return 'Unknown';
        }
    }

    /**
     * Get total database size in bytes.
     */
    private function getDatabaseSize(): int
    {
        try {
            $dbName = config('database.connections.' . config('database.default') . '.database');
            $result = DB::selectOne(
                "SELECT SUM(data_length + index_length) AS size FROM information_schema.TABLES WHERE table_schema = ?",
                [$dbName]
            );

            return (int) ($result->size ?? 0);
        } catch (\Throwable) {
            return 0;
        }
    }

    /**
     * Safe count for a table (returns 0 if table doesn't exist).
     */
    private function safeCount(string $table): int
    {
        try {
            return Schema::hasTable($table) ? DB::table($table)->count() : 0;
        } catch (\Throwable) {
            return 0;
        }
    }

    /**
     * Get last backup date if backups table exists.
     */
    private function getLastBackup(): ?string
    {
        try {
            if (!Schema::hasTable('backups')) {
                return null;
            }

            $backup = DB::table('backups')->orderByDesc('created_at')->first();

            return $backup?->created_at;
        } catch (\Throwable) {
            return null;
        }
    }
}
