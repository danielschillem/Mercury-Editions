<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('manuscript_submissions')) {
            return;
        }

        Schema::create('manuscript_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('author_name', 120);
            $table->string('email', 120);
            $table->string('phone', 30)->nullable();
            $table->string('title', 180);
            $table->string('collection', 80);
            $table->string('genre', 80)->nullable();
            $table->unsignedSmallInteger('page_count')->nullable();
            $table->string('manuscript_url', 500)->nullable();
            $table->text('synopsis');
            $table->text('author_note')->nullable();
            $table->enum('status', [
                'received',
                'reading',
                'accepted',
                'rejected',
                'editing',
                'production',
                'published',
            ])->default('received');
            $table->text('admin_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['collection', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manuscript_submissions');
    }
};
