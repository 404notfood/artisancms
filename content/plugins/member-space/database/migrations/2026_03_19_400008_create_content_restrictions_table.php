<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_restrictions', function (Blueprint $table) {
            $table->id();
            $table->morphs('restrictable');
            $table->enum('restriction_type', ['role', 'plan', 'logged_in'])->default('logged_in');
            $table->json('allowed_roles')->nullable();
            $table->json('allowed_plans')->nullable();
            $table->string('redirect_url')->nullable();
            $table->text('restricted_message')->nullable();
            $table->boolean('show_excerpt')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_restrictions');
    }
};
