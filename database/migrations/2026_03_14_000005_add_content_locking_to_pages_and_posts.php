<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->foreignId('checked_out_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('checked_out_at')->nullable();
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->foreignId('checked_out_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('checked_out_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->dropForeign(['checked_out_by']);
            $table->dropColumn(['checked_out_by', 'checked_out_at']);
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->dropForeign(['checked_out_by']);
            $table->dropColumn(['checked_out_by', 'checked_out_at']);
        });
    }
};
