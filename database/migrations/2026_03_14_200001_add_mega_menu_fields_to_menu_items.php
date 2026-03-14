<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->boolean('is_mega')->default(false)->after('icon');
            $table->unsignedTinyInteger('mega_columns')->default(3)->after('is_mega');
            $table->json('mega_content')->nullable()->after('mega_columns');
            $table->string('badge_text')->nullable()->after('mega_content');
            $table->string('badge_color')->nullable()->after('badge_text');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn([
                'is_mega',
                'mega_columns',
                'mega_content',
                'badge_text',
                'badge_color',
            ]);
        });
    }
};
