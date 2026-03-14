<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_sites', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->unique()->nullable();
            $table->string('subdomain')->unique()->nullable();
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->json('branding')->nullable();
            $table->string('locale')->default('fr');
            $table->string('timezone')->default('Europe/Paris');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('domain');
            $table->index('subdomain');
            $table->index('is_active');
        });

        Schema::create('cms_site_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('cms_sites')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->boolean('is_owner')->default(false);
            $table->timestamps();

            $table->unique(['site_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_site_users');
        Schema::dropIfExists('cms_sites');
    }
};
