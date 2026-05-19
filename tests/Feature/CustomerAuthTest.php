<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_and_fetch_their_profile(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'Aminata Ouedraogo',
            'email' => 'aminata@example.test',
            'phone' => '70123456',
            'password' => 'secret123',
        ])
            ->assertCreated()
            ->assertJsonPath('user.name', 'Aminata Ouedraogo')
            ->assertJsonPath('user.email', 'aminata@example.test')
            ->assertJsonPath('user.phone', '70123456')
            ->assertJsonPath('user.email_verified', false);

        $this->assertAuthenticated();

        $this->getJson('/api/customer/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'aminata@example.test')
            ->assertJsonPath('user.phone', '70123456');

        $this->assertDatabaseHas('users', [
            'email' => 'aminata@example.test',
            'phone' => '70123456',
        ]);
    }
}
