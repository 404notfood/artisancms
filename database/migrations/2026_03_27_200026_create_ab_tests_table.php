<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ab_tests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->json('variant_a_content');
            $table->json('variant_b_content');
            $table->enum('status', ['draft', 'running', 'completed'])->default('draft');
            $table->unsignedTinyInteger('traffic_split')->default(50);
            $table->enum('winner', ['a', 'b'])->nullable();
            $table->unsignedBigInteger('impressions_a')->default(0);
            $table->unsignedBigInteger('impressions_b')->default(0);
            $table->unsignedBigInteger('conversions_a')->default(0);
            $table->unsignedBigInteger('conversions_b')->default(0);
            $table->enum('goal_type', ['click', 'page_view', 'form_submit'])->default('page_view');
            $table->string('goal_target')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('page_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ab_tests');
    }
};
