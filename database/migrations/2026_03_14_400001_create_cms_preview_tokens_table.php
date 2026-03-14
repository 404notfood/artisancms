<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_preview_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('previewable_type');
            $table->unsignedBigInteger('previewable_id');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['previewable_type', 'previewable_id']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_preview_tokens');
    }
};
