<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('editorial_collections')) {
            return;
        }

        Schema::create('editorial_collections', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 120)->unique();
            $table->text('description');
            $table->string('icon', 40)->default('bookOpen');
            $table->string('color', 20)->default('#B91C1C');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('editorial_collections')->insert([
            [
                'name' => 'Littérature & récits',
                'slug' => 'litterature-recits',
                'description' => 'Romans, nouvelles, poésie et textes de scène pour faire entendre les imaginaires du Burkina et du continent.',
                'icon' => 'bookOpen',
                'color' => '#B91C1C',
                'sort_order' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Savoirs & société',
                'slug' => 'savoirs-societe',
                'description' => 'Essais, histoire, droit, citoyenneté et sciences sociales pour publier des idées utiles au débat public.',
                'icon' => 'library',
                'color' => '#D97706',
                'sort_order' => 20,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Jeunesse & transmission',
                'slug' => 'jeunesse-transmission',
                'description' => 'Albums, contes, manuels et textes courts pour accompagner les jeunes lecteurs, les familles et les écoles.',
                'icon' => 'graduation',
                'color' => '#059669',
                'sort_order' => 30,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('editorial_collections');
    }
};
