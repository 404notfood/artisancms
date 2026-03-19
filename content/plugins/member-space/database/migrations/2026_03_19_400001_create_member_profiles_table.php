<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->text('bio')->nullable();
            $table->string('avatar')->nullable();
            $table->string('cover_photo')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('website')->nullable();
            $table->string('location')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('company')->nullable();
            $table->string('job_title')->nullable();
            $table->json('social_links')->nullable();
            $table->enum('profile_visibility', ['public', 'members_only', 'private'])->default('public');
            $table->boolean('show_in_directory')->default(true);
            $table->boolean('show_email')->default(false);
            $table->boolean('show_phone')->default(false);
            $table->unsignedTinyInteger('profile_completion')->default(0);
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();

            $table->fullText(['display_name', 'bio', 'location', 'company']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_profiles');
    }
};
