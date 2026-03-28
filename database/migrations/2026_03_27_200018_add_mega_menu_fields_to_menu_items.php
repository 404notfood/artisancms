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
            if (! Schema::hasColumn('menu_items', 'mega_image')) {
                $table->string('mega_image')->nullable()->after('mega_content');
            }
            if (! Schema::hasColumn('menu_items', 'mega_html')) {
                $table->text('mega_html')->nullable()->after('mega_image');
            }
            if (! Schema::hasColumn('menu_items', 'mega_width')) {
                $table->enum('mega_width', ['auto', 'full', 'fixed'])->default('auto')->after('mega_html');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('menu_items', 'mega_image')) {
                $columns[] = 'mega_image';
            }
            if (Schema::hasColumn('menu_items', 'mega_html')) {
                $columns[] = 'mega_html';
            }
            if (Schema::hasColumn('menu_items', 'mega_width')) {
                $columns[] = 'mega_width';
            }
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
