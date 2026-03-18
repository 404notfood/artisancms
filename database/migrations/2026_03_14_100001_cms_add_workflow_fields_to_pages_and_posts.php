<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('pages', 'rejection_reason')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->text('rejection_reason')->nullable()->after('access_level');
                $table->foreignId('reviewed_by')->nullable()->after('rejection_reason')->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            });
        }

        if (!Schema::hasColumn('posts', 'rejection_reason')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->text('rejection_reason')->nullable()->after('access_level');
                $table->foreignId('reviewed_by')->nullable()->after('rejection_reason')->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('pages', 'reviewed_by')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->dropForeign(['reviewed_by']);
                $table->dropColumn(['rejection_reason', 'reviewed_by', 'reviewed_at']);
            });
        }

        if (Schema::hasColumn('posts', 'reviewed_by')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->dropForeign(['reviewed_by']);
                $table->dropColumn(['rejection_reason', 'reviewed_by', 'reviewed_at']);
            });
        }
    }
};
