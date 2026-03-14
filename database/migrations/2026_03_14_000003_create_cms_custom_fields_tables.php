<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_custom_field_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('applies_to');
            $table->string('position')->default('normal');
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('active');
            $table->index('order');
        });

        Schema::create('cms_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('cms_custom_field_groups')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('type');
            $table->string('description')->nullable();
            $table->string('placeholder')->nullable();
            $table->text('default_value')->nullable();
            $table->json('options')->nullable();
            $table->json('validation')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->unique(['group_id', 'slug']);
            $table->index('type');
        });

        Schema::create('cms_custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_id')->constrained('cms_custom_fields')->cascadeOnDelete();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->longText('value')->nullable();
            $table->timestamps();

            $table->unique(['field_id', 'entity_type', 'entity_id']);
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_custom_field_values');
        Schema::dropIfExists('cms_custom_fields');
        Schema::dropIfExists('cms_custom_field_groups');
    }
};
