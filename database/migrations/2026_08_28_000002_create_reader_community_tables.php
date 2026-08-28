<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('reader_alias', 60)->nullable()->after('phone');
            $table->text('reader_bio')->nullable()->after('reader_alias');
            $table->json('reading_interests')->nullable()->after('reader_bio');
            $table->boolean('community_profile_visible')->default(true)->after('reading_interests');
        });

        Schema::create('reading_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('current_book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description');
            $table->string('interest', 40);
            $table->string('visibility', 10)->default('public');
            $table->string('membership_policy', 10)->default('open');
            $table->unsignedSmallInteger('member_limit')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('reading_group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reading_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 12)->default('member');
            $table->string('status', 10)->default('active');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();
            $table->unique(['reading_group_id', 'user_id']);
        });

        Schema::create('reading_group_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reading_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
            $table->index(['reading_group_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_group_posts');
        Schema::dropIfExists('reading_group_members');
        Schema::dropIfExists('reading_groups');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['reader_alias', 'reader_bio', 'reading_interests', 'community_profile_visible']);
        });
    }
};
