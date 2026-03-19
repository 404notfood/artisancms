<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->enum('billing_period', ['monthly', 'yearly', 'lifetime', 'one_time'])->default('monthly');
            $table->unsignedInteger('duration_days')->nullable();
            $table->unsignedInteger('trial_days')->default(0);
            $table->json('features')->nullable();
            $table->json('permissions')->nullable();
            $table->json('restricted_roles')->nullable();
            $table->boolean('is_popular')->default(false);
            $table->boolean('active')->default(true);
            $table->unsignedInteger('order')->default(0);
            $table->string('stripe_price_id')->nullable();
            $table->string('badge_label')->nullable();
            $table->string('badge_color', 20)->nullable();
            $table->unsignedInteger('member_limit')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
