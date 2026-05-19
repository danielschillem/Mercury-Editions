<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reading_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('book_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_item_id')->nullable()->constrained()->onDelete('set null');
            
            // Position de lecture
            $table->string('format')->default('pdf'); // pdf ou epub
            $table->integer('current_page')->default(1);
            $table->integer('total_pages')->nullable();
            $table->float('progress_percent')->default(0); // 0-100
            
            // Pour EPUB: position plus précise
            $table->string('epub_cfi')->nullable(); // Canonical Fragment Identifier pour EPUB
            $table->string('epub_chapter')->nullable();
            
            // Statistiques de lecture
            $table->integer('reading_time_seconds')->default(0); // Temps de lecture cumulé
            $table->integer('sessions_count')->default(0);
            $table->timestamp('last_read_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable(); // Quand 100% atteint
            
            $table->timestamps();
            
            $table->unique(['user_id', 'book_id']);
            $table->index(['user_id', 'last_read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_progress');
    }
};
