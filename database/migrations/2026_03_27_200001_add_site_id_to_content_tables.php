<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables that need a site_id column for multi-site support.
     *
     * @var list<string>
     */
    private array $tables = [
        'pages',
        'posts',
        'media',
        'menus',
        'settings',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'site_id')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->foreignId('site_id')
                        ->nullable()
                        ->after('id')
                        ->constrained('cms_sites')
                        ->nullOnDelete();

                    $blueprint->index('site_id');
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'site_id')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->dropForeign(['site_id']);
                    $blueprint->dropIndex(['site_id']);
                    $blueprint->dropColumn('site_id');
                });
            }
        }
    }
};
