<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('publication_status', 20)->default('published')->after('is_featured');
            $table->string('rights_status', 30)->default('contracted')->after('publication_status');
            $table->boolean('commercial_distribution_allowed')->default(true)->after('rights_status');
            $table->string('source_url', 1000)->nullable()->after('commercial_distribution_allowed');
            $table->string('license_name', 120)->nullable()->after('source_url');
            $table->string('license_url', 1000)->nullable()->after('license_name');
            $table->text('attribution_text')->nullable()->after('license_url');
            $table->unsignedSmallInteger('author_death_year')->nullable()->after('attribution_text');
            $table->text('rights_notes')->nullable()->after('author_death_year');
            $table->timestamp('rights_reviewed_at')->nullable()->after('rights_notes');
        });

        DB::table('editorial_collections')->updateOrInsert(
            ['slug' => 'patrimoines-savoirs-libres'],
            [
                'name' => 'Mercury Patrimoines & Savoirs libres',
                'description' => 'Classiques, patrimoines et ressources sous licence ouverte, sélectionnés, vérifiés et édités par Mercury.',
                'icon' => 'scroll',
                'color' => '#7C3AED',
                'sort_order' => 40,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('editorial_collections')->where('slug', 'patrimoines-savoirs-libres')->delete();

        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn([
                'publication_status',
                'rights_status',
                'commercial_distribution_allowed',
                'source_url',
                'license_name',
                'license_url',
                'attribution_text',
                'author_death_year',
                'rights_notes',
                'rights_reviewed_at',
            ]);
        });
    }
};
