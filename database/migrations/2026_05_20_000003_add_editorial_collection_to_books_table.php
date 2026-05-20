<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            if (! Schema::hasColumn('books', 'editorial_collection_id')) {
                $table->foreignId('editorial_collection_id')
                    ->nullable()
                    ->after('author_id')
                    ->constrained('editorial_collections')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            if (Schema::hasColumn('books', 'editorial_collection_id')) {
                $table->dropConstrainedForeignId('editorial_collection_id');
            }
        });
    }
};
