<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->string('locale', 10)->default('fr')->index();
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->string('locale', 10)->default('fr')->index();
        });

        Schema::create('content_translations', function (Blueprint $table): void {
            $table->id();
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->string('target_type');
            $table->unsignedBigInteger('target_id');
            $table->string('source_locale', 10);
            $table->string('target_locale', 10);
            $table->timestamp('created_at')->nullable();

            $table->index(['source_type', 'source_id']);
            $table->index(['target_type', 'target_id']);
            $table->unique(['source_type', 'source_id', 'target_locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_translations');

        Schema::table('pages', function (Blueprint $table): void {
            $table->dropColumn('locale');
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->dropColumn('locale');
        });
    }
};
