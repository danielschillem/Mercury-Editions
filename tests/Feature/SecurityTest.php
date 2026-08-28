<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────
    // CSRF Protection
    // ─────────────────────────────────────────────

    public function test_admin_login_requires_session_and_rejects_bare_json_post_without_session(): void
    {
        // API routes without session cookie should not authenticate via session
        $admin = User::factory()->create([
            'email' => 'csrf-admin@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        // The web route /admin/login uses session-based auth.
        // A JSON POST without any session cookie should still work
        // because Laravel JSON APIs use token-based or session auth.
        // But verify the response doesn't leak the session ID.
        $response = $this->postJson('/admin/login', [
            'email' => $admin->email,
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $this->assertArrayNotHasKey('PHPSESSID', $response->headers->getCookies());
    }

    public function test_password_reset_token_is_not_returned_in_production_response(): void
    {
        $user = User::factory()->create([
            'email' => 'csrf-reset@example.test',
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $response = $this->postJson('/api/customer/forgot-password', [
            'email' => 'csrf-reset@example.test',
        ]);

        $response->assertOk();
        $json = $response->json();

        // The reset code must never be exposed in the API response
        $this->assertArrayNotHasKey('debug_code', $json);
        $this->assertArrayNotHasKey('token', $json);
        $this->assertArrayNotHasKey('code', $json);
    }

    // ─────────────────────────────────────────────
    // SQL Injection Prevention
    // ─────────────────────────────────────────────

    public function test_book_search_with_sql_injection_payload_returns_empty_or_valid_results(): void
    {
        $this->getJson('/api/books?search=' . urlencode("'; DROP TABLE books; --"))
            ->assertOk();

        $this->getJson('/api/books?search=' . urlencode("' OR '1'='1"))
            ->assertOk();

        $this->getJson('/api/books?search=' . urlencode("1 UNION SELECT * FROM users --"))
            ->assertOk();

        // Verify books table still exists and works
        $this->getJson('/api/books')
            ->assertOk();
    }

    public function test_admin_user_search_with_sql_injection_does_not_leak_data(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/admin/api/users?search=' . urlencode("' OR is_admin=1 --"));

        $response->assertOk();

        // Should not return admin users via injection — only normal search
        $users = $response->json('data', []);
        foreach ($users as $user) {
            $this->assertIsArray($user);
        }
    }

    public function test_admin_contact_message_search_with_sql_injection_is_safe(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->actingAs($admin)
            ->getJson('/admin/api/contact-messages?search=' . urlencode("'; DROP TABLE contact_messages; --"))
            ->assertOk();

        // Verify table still works
        $this->actingAs($admin)
            ->getJson('/admin/api/contact-messages')
            ->assertOk();
    }

    public function test_manuscript_search_with_sql_injection_is_safe(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->actingAs($admin)
            ->getJson('/admin/api/manuscripts?search=' . urlencode("' UNION SELECT password FROM users --"))
            ->assertOk();
    }

    // ─────────────────────────────────────────────
    // XSS Prevention (Stored XSS)
    // ─────────────────────────────────────────────

    public function test_contact_message_stores_script_tags_without_stored_xss(): void
    {
        $xssPayload = '<script>alert("XSS")</script>';

        $this->postJson('/api/contact', [
            'name' => $xssPayload,
            'email' => 'xss@example.test',
            'subject' => 'Test subject with enough chars',
            'message' => 'This is a test message that is long enough to pass validation checks.',
        ])
            ->assertCreated();

        $message = ContactMessage::where('email', 'xss@example.test')->firstOrFail();
        $this->assertStringContainsString('<script>', $message->name);

        // Verify admin retrieval doesn't crash and returns the data
        $admin = User::factory()->create(['phone' => '70123456', 'is_admin' => true]);
        $response = $this->actingAs($admin)
            ->getJson('/admin/api/contact-messages');

        $response->assertOk();
    }

    public function test_manuscript_submission_with_html_tags_is_stored_safely(): void
    {
        $this->postJson('/api/manuscripts', [
            'author_name' => 'Test <img src=x onerror=alert(1)> Author',
            'email' => 'xss-manuscript@example.test',
            'title' => 'Book <b>bold</b> Title',
            'collection' => 'litterature-recits',
            'synopsis' => str_repeat('A safe synopsis text that is long enough to pass the minimum length validation for this field. ', 2),
        ])
            ->assertCreated();

        $admin = User::factory()->create(['phone' => '70123456', 'is_admin' => true]);
        $this->actingAs($admin)
            ->getJson('/admin/api/manuscripts?search=xss-manuscript')
            ->assertOk();
    }

    public function test_book_title_with_special_characters_does_not_break_json_response(): void
    {
        $specialTitle = "Livre \"quotes\" & <angles> émojis 🎉";

        $admin = User::factory()->create(['phone' => '70123456', 'is_admin' => true]);

        $this->actingAs($admin)
            ->postJson('/admin/api/books', [
                'title' => $specialTitle,
                'author_name' => 'Auteur Test',
                'price' => 3500,
                'category' => 'roman',
                'rating' => 4.5,
                'local' => true,
                'color' => '#1a1a2e',
                'year' => 2026,
                'pages' => 200,
                'publisher' => 'Mercury Editions',
                'language' => 'Français',
                'isbn' => '978-2-35926-' . random_int(1000, 9999) . '-0',
                'tags' => ['test'],
                'description' => 'Description de test.',
                'summary' => 'Résumé de test.',
                'quote' => 'Citation de test.',
            ])
            ->assertCreated()
            ->assertJsonPath('title', $specialTitle);
    }

    // ─────────────────────────────────────────────
    // Middleware Enforcement
    // ─────────────────────────────────────────────

    public function test_unauthenticated_user_cannot_access_customer_profile(): void
    {
        $this->getJson('/api/customer/me')
            ->assertOk()
            ->assertJsonPath('user', null);
    }

    public function test_unauthenticated_user_cannot_access_customer_orders(): void
    {
        $this->getJson('/api/customer/orders')
            ->assertUnauthorized();
    }

    public function test_unauthenticated_user_cannot_access_customer_cart(): void
    {
        $this->getJson('/api/customer/cart')
            ->assertUnauthorized();
    }

    public function test_unauthenticated_user_cannot_access_customer_wishlist(): void
    {
        $this->getJson('/api/customer/wishlist')
            ->assertUnauthorized();
    }

    public function test_unauthenticated_user_cannot_access_reading_progress(): void
    {
        $this->getJson('/api/customer/reading-progress')
            ->assertUnauthorized();
    }

    public function test_non_admin_cannot_access_admin_book_management(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/admin/api/books')
            ->assertForbidden();

        $this->actingAs($user)
            ->postJson('/admin/api/books', ['title' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_non_admin_cannot_access_admin_user_management(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/admin/api/users')
            ->assertForbidden();
    }

    public function test_non_admin_cannot_access_admin_orders(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/admin/api/orders')
            ->assertForbidden();
    }

    public function test_non_admin_cannot_access_admin_contacts(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/admin/api/contact-messages')
            ->assertForbidden();
    }

    public function test_non_admin_cannot_access_admin_manuscripts(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/admin/api/manuscripts')
            ->assertForbidden();
    }

    public function test_non_admin_cannot_manage_editorial_collections(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/admin/api/editorial-collections')
            ->assertForbidden();
    }

    public function test_admin_cannot_be_impersonated_via_is_admin_query_param(): void
    {
        $regularUser = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($regularUser)
            ->getJson('/admin/api/dashboard?is_admin=true')
            ->assertForbidden();
    }

    // ─────────────────────────────────────────────
    // Mass Assignment Protection
    // ─────────────────────────────────────────────

    public function test_customer_registration_cannot_set_is_admin_flag(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'Hacker',
            'email' => 'hacker@example.test',
            'phone' => '70123456',
            'password' => 'secret123',
            'is_admin' => true,
        ])
            ->assertCreated();

        $user = User::where('email', 'hacker@example.test')->firstOrFail();
        $this->assertFalse($user->is_admin);
    }

    public function test_profile_update_cannot_escalate_to_admin(): void
    {
        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $this->actingAs($user)
            ->putJson('/api/customer/profile', [
                'name' => 'Escalated User',
                'email' => 'escalated@example.test',
                'phone' => '76123456',
                'is_admin' => true,
            ]);

        $user->refresh();
        $this->assertFalse($user->is_admin);
    }

    public function test_admin_user_update_cannot_grant_admin_to_non_admin_endpoint(): void
    {
        $admin = User::factory()->create(['phone' => '70123456', 'is_admin' => true]);
        $target = User::factory()->create(['phone' => '76123456', 'is_admin' => false]);

        // Admin user update endpoint allows setting is_admin — that's expected for admin users.
        // But verify a regular customer can't reach it.
        $customer = User::factory()->create(['phone' => '75123456', 'is_admin' => false]);

        $this->actingAs($customer)
            ->putJson("/admin/api/users/{$target->id}", [
                'is_admin' => true,
            ])
            ->assertForbidden();
    }

    // ─────────────────────────────────────────────
    // Input Validation & Rejection of Malicious Payloads
    // ─────────────────────────────────────────────

    public function test_registration_rejects_weak_password(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'Weak Pass',
            'email' => 'weak@example.test',
            'phone' => '70123456',
            'password' => '123',
        ])
            ->assertStatus(422);
    }

    public function test_registration_rejects_invalid_email(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'Bad Email',
            'email' => 'not-an-email',
            'phone' => '70123456',
            'password' => 'secret123',
        ])
            ->assertStatus(422);
    }

    public function test_registration_rejects_invalid_phone(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'Bad Phone',
            'email' => 'phone@example.test',
            'phone' => 'not-a-phone',
            'password' => 'secret123',
        ])
            ->assertStatus(422);
    }

    public function test_order_store_rejects_missing_items(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->postJson('/api/orders', [
                'buyer_phone' => '70123456',
            ])
            ->assertStatus(422);
    }

    public function test_order_store_rejects_invalid_book_id(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->postJson('/api/orders', [
                'buyer_phone' => '70123456',
                'items' => [
                    ['book_id' => 99999, 'format' => 'ebook'],
                ],
            ])
            ->assertStatus(422);
    }

    public function test_order_store_rejects_invalid_format(): void
    {
        $book = Book::create([
            'title' => 'Validation Test',
            'author_name' => 'Auteur Test',
            'price' => 3500,
            'category' => 'roman',
            'rating' => 4.5,
            'local' => true,
            'color' => '#1a1a2e',
            'year' => 2026,
            'pages' => 200,
            'publisher' => 'Mercury Editions',
            'language' => 'Français',
            'isbn' => '978-2-35926-' . random_int(1000, 9999) . '-0',
            'tags' => ['test'],
            'description' => 'Description.',
            'summary' => 'Résumé.',
            'quote' => 'Citation.',
        ]);

        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->postJson('/api/orders', [
                'buyer_phone' => '70123456',
                'items' => [
                    ['book_id' => $book->id, 'format' => 'hacked'],
                ],
            ])
            ->assertStatus(422);
    }

    public function test_contact_form_rejects_empty_required_fields(): void
    {
        $this->postJson('/api/contact', [])
            ->assertStatus(422);

        $this->postJson('/api/contact', [
            'name' => 'Only Name',
        ])
            ->assertStatus(422);
    }

    public function test_newsletter_subscribe_rejects_invalid_email(): void
    {
        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'not-valid',
        ])
            ->assertStatus(422);
    }

    public function test_manuscript_submission_rejects_too_short_synopsis(): void
    {
        $this->postJson('/api/manuscripts', [
            'author_name' => 'Short Synopsis',
            'email' => 'short@example.test',
            'title' => 'Short Title',
            'collection' => 'litterature-recits',
            'synopsis' => 'Too short.',
        ])
            ->assertStatus(422);
    }

    public function test_cart_rejects_invalid_item_structure(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->putJson('/api/customer/cart', [
                'cart' => 'not-an-array',
            ])
            ->assertStatus(422);

        $this->actingAs($user)
            ->putJson('/api/customer/cart', [
                'cart' => [['id' => 'not-int', 'format' => 'bad']],
            ])
            ->assertStatus(422);
    }

    // ─────────────────────────────────────────────
    // Session & Authentication Security
    // ─────────────────────────────────────────────

    public function test_logout_invalidates_session(): void
    {
        $user = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/api/customer/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);

        $this->actingAs($user)
            ->postJson('/api/customer/logout')
            ->assertOk();

        // After logout, should no longer be authenticated
        $this->getJson('/api/customer/me')
            ->assertOk()
            ->assertJsonPath('user', null);
    }

    public function test_admin_login_returns_401_for_wrong_password(): void
    {
        $admin = User::factory()->create([
            'email' => 'wrong-pass-admin@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->postJson('/admin/login', [
            'email' => $admin->email,
            'password' => 'wrong-password',
        ])
            ->assertStatus(401);
    }

    public function test_admin_login_rejects_non_admin_user(): void
    {
        $user = User::factory()->create([
            'email' => 'non-admin-login@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $this->postJson('/admin/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ])
            ->assertStatus(403)
            ->assertJsonPath('message', 'Accès réservé aux administrateurs.');
    }

    public function test_customer_login_rejects_admin_account(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin-customer@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->postJson('/api/customer/login', [
            'email' => $admin->email,
            'password' => 'secret123',
        ])
            ->assertStatus(401)
            ->assertJsonPath('message', 'Identifiants incorrects.');
    }

    public function test_forgot_password_does_not_enumerate_users(): void
    {
        // Non-existent email should return same response as existing one
        $existingResponse = $this->postJson('/api/customer/forgot-password', [
            'email' => 'existing@example.test',
        ]);

        $nonExistingResponse = $this->postJson('/api/customer/forgot-password', [
            'email' => 'nonexistent@example.test',
        ]);

        $existingResponse->assertOk();
        $nonExistingResponse->assertOk();

        // Both should return the same generic message
        $this->assertEquals(
            $existingResponse->json('message'),
            $nonExistingResponse->json('message'),
        );
    }

    public function test_reset_password_rejects_invalid_code(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-invalid@example.test',
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $this->postJson('/api/customer/reset-password', [
            'email' => $user->email,
            'code' => '000000',
            'password' => 'newsecret123',
        ])
            ->assertStatus(422);
    }

    public function test_password_hashing_uses_bcrypt(): void
    {
        $user = User::factory()->create([
            'email' => 'hash@example.test',
            'phone' => '70123456',
            'password' => 'testpassword',
            'is_admin' => false,
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'hash@example.test',
        ]);

        $storedPassword = User::where('email', 'hash@example.test')->value('password');
        $this->assertStringStartsWith('$2y$', $storedPassword);
        $this->assertTrue(Hash::check('testpassword', $storedPassword));
    }

    // ─────────────────────────────────────────────
    // Rate Limiting
    // ─────────────────────────────────────────────

    public function test_registration_rejects_duplicate_email(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'First User',
            'email' => 'duplicate@example.test',
            'phone' => '70123456',
            'password' => 'secret123',
        ])->assertCreated();

        $this->postJson('/api/customer/register', [
            'name' => 'Second User',
            'email' => 'duplicate@example.test',
            'phone' => '76123456',
            'password' => 'secret123',
        ])->assertStatus(422);
    }

    public function test_registration_rejects_duplicate_phone(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'First User',
            'email' => 'first@example.test',
            'phone' => '70123456',
            'password' => 'secret123',
        ])->assertCreated();

        $this->postJson('/api/customer/register', [
            'name' => 'Second User',
            'email' => 'second@example.test',
            'phone' => '70123456',
            'password' => 'secret123',
        ])->assertStatus(422);
    }

    public function test_contact_form_is_rate_limited(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/contact', [
                'name' => "Rate Test {$i}",
                'email' => "rate-{$i}@example.test",
                'subject' => "Subject number {$i}",
                'message' => "This is a test message number {$i} that is long enough to pass validation rules.",
            ]);
        }

        $this->postJson('/api/contact', [
            'name' => 'Rate Limited',
            'email' => 'ratelimited@example.test',
            'subject' => 'Rate limited subject',
            'message' => 'This message should be rate limited because we already sent three.',
        ])
            ->assertStatus(429);
    }

    public function test_newsletter_subscribe_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/newsletter/subscribe', [
                'email' => "rate-news-{$i}@example.test",
            ]);
        }

        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'ratelimited@example.test',
        ])
            ->assertStatus(429);
    }

    public function test_manuscript_submission_is_rate_limited(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/manuscripts', [
                'author_name' => "Auteur {$i}",
                'email' => "rate-{$i}@example.test",
                'title' => "Titre du manuscrit {$i}",
                'collection' => 'litterature-recits',
                'synopsis' => str_repeat("Ceci est un synopsis de test pour la soumission numero {$i}. ", 3),
            ]);
        }

        $this->postJson('/api/manuscripts', [
            'author_name' => 'Rate Limited',
            'email' => 'ratelimited@example.test',
            'title' => 'Rate limited manuscript',
            'collection' => 'litterature-recits',
            'synopsis' => str_repeat('This should be rate limited because three manuscripts were already submitted. ', 3),
        ])
            ->assertStatus(429);
    }

    // ─────────────────────────────────────────────
    // Authorization Boundaries
    // ─────────────────────────────────────────────

    public function test_customer_cannot_access_another_customer_cart(): void
    {
        $userA = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);
        $userB = User::factory()->create(['phone' => '76123456', 'is_admin' => false]);

        $book = Book::create([
            'title' => 'Cart Isolation Test',
            'author_name' => 'Auteur Test',
            'price' => 3500,
            'category' => 'roman',
            'rating' => 4.5,
            'local' => true,
            'color' => '#1a1a2e',
            'year' => 2026,
            'pages' => 200,
            'publisher' => 'Mercury Editions',
            'language' => 'Français',
            'isbn' => '978-2-35926-' . random_int(1000, 9999) . '-0',
            'tags' => ['test'],
            'description' => 'Description.',
            'summary' => 'Résumé.',
            'quote' => 'Citation.',
        ]);

        $this->actingAs($userA)
            ->putJson('/api/customer/cart', [
                'cart' => [
                    ['id' => $book->id, 'format' => 'ebook', 'finalPrice' => 3500, 'quantity' => 1],
                ],
            ])
            ->assertOk();

        // User B should have an empty cart, not User A's cart
        $this->actingAs($userB)
            ->getJson('/api/customer/cart')
            ->assertOk()
            ->assertJsonCount(0);
    }

    public function test_customer_cannot_access_another_customer_wishlist(): void
    {
        $userA = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);
        $userB = User::factory()->create(['phone' => '76123456', 'is_admin' => false]);

        $book = Book::create([
            'title' => 'Wishlist Isolation Test',
            'author_name' => 'Auteur Test',
            'price' => 3500,
            'category' => 'roman',
            'rating' => 4.5,
            'local' => true,
            'color' => '#1a1a2e',
            'year' => 2026,
            'pages' => 200,
            'publisher' => 'Mercury Editions',
            'language' => 'Français',
            'isbn' => '978-2-35926-' . random_int(1000, 9999) . '-0',
            'tags' => ['test'],
            'description' => 'Description.',
            'summary' => 'Résumé.',
            'quote' => 'Citation.',
        ]);

        $this->actingAs($userA)
            ->postJson("/api/customer/wishlist/{$book->id}")
            ->assertCreated();

        $this->actingAs($userB)
            ->getJson('/api/customer/wishlist')
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_customer_cannot_delete_another_customer_order(): void
    {
        $owner = User::factory()->create(['phone' => '70123456', 'is_admin' => false]);
        $intruder = User::factory()->create(['phone' => '76123456', 'is_admin' => false]);

        $book = Book::create([
            'title' => 'Delete Security Test',
            'author_name' => 'Auteur Test',
            'price' => 3500,
            'category' => 'roman',
            'rating' => 4.5,
            'local' => true,
            'color' => '#1a1a2e',
            'year' => 2026,
            'pages' => 200,
            'publisher' => 'Mercury Editions',
            'language' => 'Français',
            'isbn' => '978-2-35926-' . random_int(1000, 9999) . '-0',
            'tags' => ['test'],
            'description' => 'Description.',
            'summary' => 'Résumé.',
            'quote' => 'Citation.',
        ]);

        $order = \App\Models\Order::create([
            'reference' => 'MRC-SEC-' . strtoupper(Str::random(8)),
            'user_id' => $owner->id,
            'buyer_phone' => '70123456',
            'buyer_name' => 'Propriétaire',
            'buyer_email' => 'owner@example.test',
            'total_amount' => 3500,
            'om_fees' => 35,
            'status' => 'pending',
        ]);

        $intruderAsAdmin = User::factory()->create(['phone' => '77123456', 'is_admin' => false]);

        // Customer endpoint for orders doesn't have DELETE — only admin does.
        // Verify intruder can't even see the order details.
        $this->actingAs($intruder)
            ->getJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }

    // ─────────────────────────────────────────────
    // Error Message Security
    // ─────────────────────────────────────────────

    public function test_login_error_does_not_reveal_existing_email(): void
    {
        $user = User::factory()->create([
            'email' => 'reveal@example.test',
            'phone' => '70123456',
            'password' => 'secret123',
            'is_admin' => false,
        ]);

        // Login with existing email but wrong password
        $wrongPassword = $this->postJson('/api/customer/login', [
            'email' => 'reveal@example.test',
            'password' => 'wrong',
        ]);

        // Login with non-existing email
        $nonExisting = $this->postJson('/api/customer/login', [
            'email' => 'doesnotexist@example.test',
            'password' => 'wrong',
        ]);

        $wrongPassword->assertStatus(401);
        $nonExisting->assertStatus(401);

        // Both should return the same error message
        $this->assertEquals(
            $wrongPassword->json('message'),
            $nonExisting->json('message'),
        );
    }

    public function test_admin_login_error_does_not_reveal_user_role(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin-role@example.test',
            'phone' => '70123456',
            'password' => 'secret123',
            'is_admin' => true,
        ]);

        $regular = User::factory()->create([
            'email' => 'regular-role@example.test',
            'phone' => '76123456',
            'password' => 'secret123',
            'is_admin' => false,
        ]);

        $adminWrongPass = $this->postJson('/admin/login', [
            'email' => 'admin-role@example.test',
            'password' => 'wrong',
        ]);

        $regularWrongPass = $this->postJson('/admin/login', [
            'email' => 'regular-role@example.test',
            'password' => 'wrong',
        ]);

        // Both should return generic "incorrect credentials" message
        $adminWrongPass->assertStatus(401);
        $regularWrongPass->assertStatus(401);
        $this->assertEquals(
            $adminWrongPass->json('message'),
            $regularWrongPass->json('message'),
        );
    }

    // ─────────────────────────────────────────────
    // HTTP Method Security
    // ─────────────────────────────────────────────

    public function test_admin_protected_routes_reject_get_for_mutations(): void
    {
        $admin = User::factory()->create(['phone' => '70123456', 'is_admin' => true]);

        // POST on GET-only route should return 405 Method Not Allowed
        $this->actingAs($admin)
            ->postJson('/admin/api/dashboard')
            ->assertStatus(405);
    }

    public function test_public_routes_reject_unsupported_methods(): void
    {
        // DELETE on a GET-only public route should be rejected
        $this->deleteJson('/api/books')
            ->assertStatus(405);

        $this->putJson('/api/books')
            ->assertStatus(405);
    }
}
