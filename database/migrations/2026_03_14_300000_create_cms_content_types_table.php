<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_types', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->json('fields')->nullable();
            $table->json('supports')->nullable();
            $table->boolean('has_archive')->default(false);
            $table->boolean('public')->default(true);
            $table->integer('menu_position')->default(0);
            $table->timestamps();
        });

        Schema::create('content_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('content_type_id')->constrained('content_types')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->json('content')->nullable();
            $table->text('excerpt')->nullable();
            $table->string('featured_image')->nullable();
            $table->string('status')->default('draft');
            $table->json('fields_data')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['content_type_id', 'slug']);
            $table->index(['content_type_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_entries');
        Schema::dropIfExists('content_types');
    }
};
