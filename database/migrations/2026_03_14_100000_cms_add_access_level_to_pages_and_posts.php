<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('pages', 'access_level')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->string('access_level', 30)->default('public')->after('status')->index();
            });
        }

        if (!Schema::hasColumn('posts', 'access_level')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->string('access_level', 30)->default('public')->after('status')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('pages', 'access_level')) {
            Schema::table('pages', function (Blueprint $table): void {
                $table->dropIndex(['access_level']);
                $table->dropColumn('access_level');
            });
        }

        if (Schema::hasColumn('posts', 'access_level')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->dropIndex(['access_level']);
                $table->dropColumn('access_level');
            });
        }
    }
};
