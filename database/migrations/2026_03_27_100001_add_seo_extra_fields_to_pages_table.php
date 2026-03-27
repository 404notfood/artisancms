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
            $table->string('meta_robots')->default('index, follow')->after('og_image');
            $table->string('canonical_url')->nullable()->after('meta_robots');
            $table->string('focus_keyword')->nullable()->after('canonical_url');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn(['meta_robots', 'canonical_url', 'focus_keyword']);
        });
    }
};
