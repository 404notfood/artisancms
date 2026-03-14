<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('termables', function (Blueprint $table) {
            $table->foreignId('term_id')->constrained('taxonomy_terms')->cascadeOnDelete();
            $table->unsignedBigInteger('termable_id');
            $table->string('termable_type');

            $table->primary(['term_id', 'termable_id', 'termable_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('termables');
    }
};
