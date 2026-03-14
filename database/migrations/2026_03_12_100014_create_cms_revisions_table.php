<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revisions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('revisionable_id');
            $table->string('revisionable_type');
            $table->json('data');
            $table->string('reason')->default('auto');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['revisionable_type', 'revisionable_id', 'created_at'], 'revisions_type_id_created_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revisions');
    }
};
