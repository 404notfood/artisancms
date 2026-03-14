<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('redirects', function (Blueprint $table): void {
            $table->id();
            $table->string('source_path')->unique();
            $table->string('target_url');
            $table->smallInteger('status_code')->default(301);
            $table->unsignedInteger('hits')->default(0);
            $table->boolean('active')->default(true);
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index('source_path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redirects');
    }
};
