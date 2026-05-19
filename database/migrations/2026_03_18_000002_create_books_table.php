<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('author_name');
            $table->unsignedInteger('price');
            $table->string('category', 30);
            $table->decimal('rating', 2, 1)->default(0);
            $table->boolean('local')->default(true);
            $table->string('color', 20)->default('#1a1a2e');
            $table->unsignedSmallInteger('year');
            $table->unsignedSmallInteger('pages');
            $table->string('publisher');
            $table->string('language', 30)->default('Français');
            $table->string('isbn', 30)->unique();
            $table->json('tags');
            $table->text('description');
            $table->text('summary');
            $table->text('quote');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
