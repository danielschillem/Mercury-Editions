<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('ebook_pdf_path')->nullable()->after('cover_image');
            $table->string('ebook_epub_path')->nullable()->after('ebook_pdf_path');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['ebook_pdf_path', 'ebook_epub_path']);
        });
    }
};
