<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('url');
            $table->string('secret')->nullable();
            $table->json('events');
            $table->json('headers')->nullable();
            $table->boolean('enabled')->default(true);
            $table->integer('retry_count')->default(3);
            $table->integer('timeout')->default(30);
            $table->integer('consecutive_failures')->default(0);
            $table->timestamp('last_triggered_at')->nullable();
            $table->string('last_status')->nullable();
            $table->timestamps();

            $table->index('enabled');
            $table->index('last_status');
        });

        Schema::create('cms_webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')->constrained('cms_webhooks')->cascadeOnDelete();
            $table->string('event');
            $table->json('payload');
            $table->json('request_headers')->nullable();
            $table->integer('response_code')->nullable();
            $table->text('response_body')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->string('status');
            $table->integer('attempt')->default(1);
            $table->text('error_message')->nullable();
            $table->timestamp('next_retry_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['webhook_id', 'created_at']);
            $table->index('status');
            $table->index('event');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_webhook_deliveries');
        Schema::dropIfExists('cms_webhooks');
    }
};
