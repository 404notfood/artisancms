<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type', 30); // text, textarea, select, checkbox, radio, url, email, phone, date, number, file
            $table->json('options')->nullable();
            $table->string('placeholder')->nullable();
            $table->string('description')->nullable();
            $table->boolean('required')->default(false);
            $table->boolean('show_on_registration')->default(false);
            $table->boolean('show_on_profile')->default(true);
            $table->boolean('show_in_directory')->default(false);
            $table->boolean('admin_only')->default(false);
            $table->json('visibility_roles')->nullable();
            $table->string('validation_rules')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_custom_fields');
    }
};
