<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('subject');
            $table->text('body_html');
            $table->text('body_text')->nullable();
            $table->json('variables');
            $table->string('category');
            $table->boolean('is_system')->default(false);
            $table->boolean('enabled')->default(true);
            $table->text('default_body_html')->nullable();
            $table->string('default_subject')->nullable();
            $table->timestamps();

            $table->index('category');
            $table->index('enabled');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_email_templates');
    }
};
