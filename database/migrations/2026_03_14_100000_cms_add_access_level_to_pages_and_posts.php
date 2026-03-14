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
            $table->string('access_level')->default('public')->after('status');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->string('access_level')->default('public')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn('access_level');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('access_level');
        });
    }
};
