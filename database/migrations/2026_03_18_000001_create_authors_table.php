<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('authors', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('icon')->default('book');
            $table->string('origin');
            $table->string('born', 10);
            $table->string('died', 10)->nullable();
            $table->string('color', 20)->default('#1a1a2e');
            $table->json('genres');
            $table->text('bio');
            $table->json('timeline');
            $table->json('awards');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('authors');
    }
};
