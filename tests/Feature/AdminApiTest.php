<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_log_in_and_access_dashboard(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->postJson('/admin/login', [
            'email' => $admin->email,
            'password' => 'secret123',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@example.test')
            ->assertJsonPath('user.is_admin', true);

        $this->getJson('/admin/api/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'stats' => [
                    'total_books',
                    'total_authors',
                    'total_orders',
                    'completed_orders',
                    'pending_orders',
                    'total_revenue',
                ],
                'dailyRevenue',
                'topBooks',
                'recentOrders',
            ]);
    }

    public function test_non_admin_cannot_access_dashboard(): void
    {
        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $this->actingAs($user)
            ->getJson('/admin/api/dashboard')
            ->assertForbidden();
    }

    public function test_admin_cannot_remove_their_own_admin_role(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->actingAs($admin)
            ->putJson("/admin/api/users/{$admin->id}", [
                'is_admin' => false,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Impossible de retirer vos propres droits administrateur.');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'is_admin' => true,
        ]);
    }

    public function test_admin_can_search_contact_messages(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        ContactMessage::create([
            'name' => 'Awa',
            'email' => 'awa@example.test',
            'subject' => 'Question sur la facture',
            'message' => 'Bonjour, je souhaite comprendre le montant facture.',
            'status' => 'open',
        ]);

        ContactMessage::create([
            'name' => 'Moussa',
            'email' => 'moussa@example.test',
            'subject' => 'Disponibilité',
            'message' => 'Merci de me confirmer la disponibilité du livre.',
            'status' => 'open',
        ]);

        $this->actingAs($admin)
            ->getJson('/admin/api/contact-messages?search=facture')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.email', 'awa@example.test');
    }

    public function test_admin_login_is_rate_limited_after_too_many_attempts(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin-rate-limit@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/admin/login', [
                'email' => $admin->email,
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        $this->postJson('/admin/login', [
            'email' => $admin->email,
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }
}
