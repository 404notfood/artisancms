<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_page_views', function (Blueprint $table) {
            $table->id();
            $table->string('path', 500);
            $table->nullableMorphs('viewable');
            $table->string('referrer', 500)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->char('country', 2)->nullable();
            $table->string('device_type', 20)->nullable();
            $table->string('browser', 50)->nullable();
            $table->date('date');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['path', 'date']);
            $table->index(['viewable_type', 'viewable_id', 'date']);
            $table->index('date');
        });

        Schema::create('cms_page_views_daily', function (Blueprint $table) {
            $table->id();
            $table->string('path', 500);
            $table->nullableMorphs('viewable');
            $table->date('date');
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('unique_visitors')->default(0);

            $table->unique(['path', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_page_views_daily');
        Schema::dropIfExists('cms_page_views');
    }
};
