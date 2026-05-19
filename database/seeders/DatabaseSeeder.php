<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin Mercury',
            'email' => 'admin@mercury.bf',
            'is_admin' => true,
        ]);

        $this->call([
            MercuryRealBooksSeeder::class,
        ]);
    }
}
