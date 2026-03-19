<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_update_log', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // cms, plugin, theme
            $table->string('slug')->nullable(); // plugin/theme slug
            $table->string('from_version');
            $table->string('to_version');
            $table->string('status', 20)->default('pending');
            $table->string('checksum')->nullable(); // SHA-256
            $table->text('changelog')->nullable();
            $table->text('error_message')->nullable();
            $table->json('backup_path')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'slug']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_update_log');
    }
};
