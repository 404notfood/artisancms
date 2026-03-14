<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('access_level');
            $table->foreignId('reviewed_by')->nullable()->after('rejection_reason')->constrained('users');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('access_level');
            $table->foreignId('reviewed_by')->nullable()->after('rejection_reason')->constrained('users');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn(['rejection_reason', 'reviewed_by', 'reviewed_at']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn(['rejection_reason', 'reviewed_by', 'reviewed_at']);
        });
    }
};
