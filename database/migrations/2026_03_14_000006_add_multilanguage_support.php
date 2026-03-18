<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('pages', 'locale')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->string('locale', 10)->default('fr')->after('published_at')->index();
            });
        }

        if (!Schema::hasColumn('posts', 'locale')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->string('locale', 10)->default('fr')->after('published_at')->index();
            });
        }

        if (!Schema::hasTable('content_translations')) {
            Schema::create('content_translations', function (Blueprint $table): void {
                $table->id();
                $table->string('source_type', 100);
                $table->unsignedBigInteger('source_id');
                $table->string('target_type', 100);
                $table->unsignedBigInteger('target_id');
                $table->string('source_locale', 10);
                $table->string('target_locale', 10);
                $table->timestamp('created_at')->nullable();

                $table->index(['source_type', 'source_id'], 'ct_source_index');
                $table->index(['target_type', 'target_id'], 'ct_target_index');
                $table->unique(['source_type', 'source_id', 'target_locale'], 'ct_source_target_locale_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('content_translations');

        if (Schema::hasColumn('pages', 'locale')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->dropIndex(['locale']);
                $table->dropColumn('locale');
            });
        }

        if (Schema::hasColumn('posts', 'locale')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->dropIndex(['locale']);
                $table->dropColumn('locale');
            });
        }
    }
};
