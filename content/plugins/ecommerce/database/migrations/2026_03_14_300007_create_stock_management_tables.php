<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->enum('type', ['sale', 'return', 'adjustment', 'restock']);
            $table->integer('quantity');
            $table->string('reference')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->index(['product_id', 'variant_id']);
            $table->index('type');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->integer('low_stock_threshold')->default(5)->after('stock');
            $table->boolean('track_stock')->default(true)->after('low_stock_threshold');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['low_stock_threshold', 'track_stock']);
        });
    }
};
