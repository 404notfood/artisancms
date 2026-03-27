<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('meta_title')->nullable()->after('excerpt');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->string('meta_keywords')->nullable()->after('meta_description');
            $table->string('og_image')->nullable()->after('meta_keywords');
            $table->string('meta_robots')->default('index, follow')->after('og_image');
            $table->string('canonical_url')->nullable()->after('meta_robots');
            $table->string('focus_keyword')->nullable()->after('canonical_url');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn([
                'meta_title',
                'meta_description',
                'meta_keywords',
                'og_image',
                'meta_robots',
                'canonical_url',
                'focus_keyword',
            ]);
        });
    }
};
