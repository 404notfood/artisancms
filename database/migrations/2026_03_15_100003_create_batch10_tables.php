<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // User sessions tracking
        Schema::create('cms_user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_id')->unique();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('device')->nullable(); // desktop, mobile, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->timestamp('last_activity')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'last_activity']);
        });

        // Media usage tracking
        Schema::create('cms_media_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->morphs('usable'); // pages, posts, etc.
            $table->string('field')->nullable(); // which field references this media
            $table->timestamps();

            $table->index('media_id');
        });

        // Search logs
        Schema::create('cms_search_logs', function (Blueprint $table) {
            $table->id();
            $table->string('query');
            $table->integer('results_count')->default(0);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('source')->default('front'); // front, admin
            $table->timestamps();

            $table->index(['query', 'created_at']);
        });

        // Announcement bars
        Schema::create('cms_announcement_bars', function (Blueprint $table) {
            $table->id();
            $table->string('message');
            $table->string('link_text')->nullable();
            $table->string('link_url')->nullable();
            $table->string('bg_color')->default('#4f46e5');
            $table->string('text_color')->default('#ffffff');
            $table->enum('position', ['top', 'bottom'])->default('top');
            $table->boolean('dismissible')->default(true);
            $table->boolean('active')->default(false);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->integer('priority')->default(0);
            $table->timestamps();

            $table->index(['active', 'starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_announcement_bars');
        Schema::dropIfExists('cms_search_logs');
        Schema::dropIfExists('cms_media_usages');
        Schema::dropIfExists('cms_user_sessions');
    }
};
