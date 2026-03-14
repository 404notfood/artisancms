<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix missing database indexes and column defaults identified in the project audit.
 *
 * Issues addressed:
 * 1. pages.slug       — Add explicit index (unique constraint exists, but adding a plain
 *                        index can benefit non-unique look-up queries in some query plans).
 * 2. pages.parent_id  — Add explicit index (FK implicit index exists on InnoDB, but an
 *                        explicit index ensures portability and optimizer hints).
 * 3. taxonomy_terms.parent_id — Same rationale as pages.parent_id.
 * 4. pages.template   — Default to 'default' instead of NULL.
 * 5. media.folder     — Default to '/' instead of allowing NULL.
 * 6. blocks.schema    — Already nullable; no change required.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ---------------------------------------------------------------
        // 1. pages.slug — Add index if not already present
        // ---------------------------------------------------------------
        Schema::table('pages', function (Blueprint $table) {
            if (! $this->hasIndex('pages', 'pages_slug_index')) {
                $table->index('slug');
            }
        });

        // ---------------------------------------------------------------
        // 2. pages.parent_id — Add index if not already present
        // ---------------------------------------------------------------
        Schema::table('pages', function (Blueprint $table) {
            if (! $this->hasIndex('pages', 'pages_parent_id_index')) {
                $table->index('parent_id');
            }
        });

        // ---------------------------------------------------------------
        // 3. taxonomy_terms.parent_id — Add index if not already present
        // ---------------------------------------------------------------
        Schema::table('taxonomy_terms', function (Blueprint $table) {
            if (! $this->hasIndex('taxonomy_terms', 'taxonomy_terms_parent_id_index')) {
                $table->index('parent_id');
            }
        });

        // ---------------------------------------------------------------
        // 4. pages.template — Default to 'default', backfill existing NULLs
        // ---------------------------------------------------------------
        DB::table('pages')
            ->whereNull('template')
            ->update(['template' => 'default']);

        Schema::table('pages', function (Blueprint $table) {
            $table->string('template')->default('default')->change();
        });

        // ---------------------------------------------------------------
        // 5. media.folder — Default to '/', backfill existing NULLs
        // ---------------------------------------------------------------
        DB::table('media')
            ->whereNull('folder')
            ->update(['folder' => '/']);

        Schema::table('media', function (Blueprint $table) {
            $table->string('folder')->default('/')->change();
        });

        // ---------------------------------------------------------------
        // 6. blocks.schema — Already nullable; no action required.
        //    Verified in create_cms_blocks_table migration:
        //    $table->json('schema')->nullable();
        // ---------------------------------------------------------------
    }

    public function down(): void
    {
        // ---------------------------------------------------------------
        // Reverse 5. media.folder — Restore nullable without default
        // ---------------------------------------------------------------
        Schema::table('media', function (Blueprint $table) {
            $table->string('folder')->nullable()->default(null)->change();
        });

        // ---------------------------------------------------------------
        // Reverse 4. pages.template — Restore nullable without default
        // ---------------------------------------------------------------
        Schema::table('pages', function (Blueprint $table) {
            $table->string('template')->nullable()->default(null)->change();
        });

        // ---------------------------------------------------------------
        // Reverse 3. taxonomy_terms.parent_id index
        // ---------------------------------------------------------------
        Schema::table('taxonomy_terms', function (Blueprint $table) {
            if ($this->hasIndex('taxonomy_terms', 'taxonomy_terms_parent_id_index')) {
                $table->dropIndex('taxonomy_terms_parent_id_index');
            }
        });

        // ---------------------------------------------------------------
        // Reverse 2. pages.parent_id index
        // ---------------------------------------------------------------
        Schema::table('pages', function (Blueprint $table) {
            if ($this->hasIndex('pages', 'pages_parent_id_index')) {
                $table->dropIndex('pages_parent_id_index');
            }
        });

        // ---------------------------------------------------------------
        // Reverse 1. pages.slug index
        // ---------------------------------------------------------------
        Schema::table('pages', function (Blueprint $table) {
            if ($this->hasIndex('pages', 'pages_slug_index')) {
                $table->dropIndex('pages_slug_index');
            }
        });
    }

    /**
     * Check whether a given index exists on a table.
     *
     * Uses the doctrine schema manager when available, otherwise falls back
     * to a raw SQL query compatible with MySQL / MariaDB.
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();

        $results = DB::select(
            'SELECT COUNT(*) AS cnt FROM information_schema.statistics '
            . 'WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$databaseName, $table, $indexName]
        );

        return isset($results[0]) && (int) $results[0]->cnt > 0;
    }
};
