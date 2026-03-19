<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix column defaults identified in the project audit.
 *
 * Issues addressed:
 * 1. pages.template — Default to 'default' instead of NULL.
 * 2. media.folder   — Default to '/' instead of allowing NULL.
 */
return new class extends Migration
{
    public function up(): void
    {
        // pages.template — Default to 'default', backfill existing NULLs
        DB::table('pages')
            ->whereNull('template')
            ->update(['template' => 'default']);

        Schema::table('pages', function (Blueprint $table) {
            $table->string('template')->default('default')->change();
        });

        // media.folder — Default to '/', backfill existing NULLs
        DB::table('media')
            ->whereNull('folder')
            ->update(['folder' => '/']);

        Schema::table('media', function (Blueprint $table) {
            $table->string('folder')->default('/')->change();
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('folder')->nullable()->default(null)->change();
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->string('template')->nullable()->default(null)->change();
        });
    }
};
