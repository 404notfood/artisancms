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
            $table->enum('category', ['color', 'typography', 'button', 'spacing', 'shadow', 'border']);
            $table->json('value');
            $table->integer('order')->default(0);
            $table->unsignedBigInteger('site_id')->nullable();
            $table->timestamps();

            $table->index(['category', 'order']);
            $table->index('site_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_design_tokens');
    }
};
