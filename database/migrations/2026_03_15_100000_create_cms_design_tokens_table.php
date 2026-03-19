<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_design_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category', 30);
            $table->json('value');
            $table->integer('order')->default(0);
            $table->foreignId('site_id')->nullable()->constrained('cms_sites')->nullOnDelete();
            $table->timestamps();

            $table->index(['category', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_design_tokens');
    }
};
