<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('forms')) {
            Schema::create('forms', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->json('fields');
                $table->json('settings')->nullable();
                $table->json('notifications')->nullable();
                $table->json('confirmation')->nullable();
                $table->json('spam_protection')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->constrained('users');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('form_submissions')) {
            Schema::create('form_submissions', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('form_id')->constrained('forms')->cascadeOnDelete();
                $table->json('data');
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->string('referrer')->nullable();
                $table->enum('status', ['new', 'read', 'replied', 'spam', 'trash'])->default('new');
                $table->timestamps();

                $table->index(['form_id', 'status', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('forms');
    }
};
