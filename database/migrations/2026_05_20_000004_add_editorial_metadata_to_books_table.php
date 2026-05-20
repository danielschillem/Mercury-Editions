<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            if (! Schema::hasColumn('books', 'publication_date')) {
                $table->date('publication_date')->nullable()->after('year');
            }

            if (! Schema::hasColumn('books', 'editorial_director')) {
                $table->string('editorial_director', 120)->nullable()->after('publisher');
            }

            if (! Schema::hasColumn('books', 'public_excerpt')) {
                $table->text('public_excerpt')->nullable()->after('summary');
            }
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            if (Schema::hasColumn('books', 'publication_date')) {
                $table->dropColumn('publication_date');
            }

            if (Schema::hasColumn('books', 'editorial_director')) {
                $table->dropColumn('editorial_director');
            }

            if (Schema::hasColumn('books', 'public_excerpt')) {
                $table->dropColumn('public_excerpt');
            }
        });
    }
};
