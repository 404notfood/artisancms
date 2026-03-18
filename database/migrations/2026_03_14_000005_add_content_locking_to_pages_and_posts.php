<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('pages', 'checked_out_by')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->foreignId('checked_out_by')->nullable()->after('published_at')->constrained('users')->nullOnDelete();
                $table->timestamp('checked_out_at')->nullable()->after('checked_out_by');
            });
        }

        if (!Schema::hasColumn('posts', 'checked_out_by')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->foreignId('checked_out_by')->nullable()->after('published_at')->constrained('users')->nullOnDelete();
                $table->timestamp('checked_out_at')->nullable()->after('checked_out_by');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('pages', 'checked_out_by')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->dropForeign(['checked_out_by']);
                $table->dropColumn(['checked_out_by', 'checked_out_at']);
            });
        }

        if (Schema::hasColumn('posts', 'checked_out_by')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->dropForeign(['checked_out_by']);
                $table->dropColumn(['checked_out_by', 'checked_out_at']);
            });
        }
    }
};
