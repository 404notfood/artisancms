<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_widget_areas', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('site_id')->nullable()->constrained('cms_sites')->nullOnDelete();
            $table->timestamps();

            $table->index('site_id');
        });

        Schema::create('cms_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widget_area_id')->constrained('cms_widget_areas')->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->json('config')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['widget_area_id', 'order']);
            $table->index('type');
            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_widgets');
        Schema::dropIfExists('cms_widget_areas');
    }
};
