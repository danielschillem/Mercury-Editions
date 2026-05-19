<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCommunicationFlowsTest extends TestCase
{
    use RefreshDatabase;

    public function test_newsletter_subscription_can_be_created_unsubscribed_and_reactivated(): void
    {
        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'lecteur@example.test',
        ])
            ->assertCreated()
            ->assertJsonPath('message', 'Inscription confirmée ! Merci.');

        $subscriber = NewsletterSubscriber::query()->firstOrFail();

        $this->getJson("/api/newsletter/unsubscribe/{$subscriber->token}")
            ->assertOk()
            ->assertJsonPath('message', 'Vous avez été désinscrit de la newsletter.');

        $subscriber->refresh();
        $this->assertNotNull($subscriber->unsubscribed_at);

        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'lecteur@example.test',
        ])
            ->assertCreated()
            ->assertJsonPath('message', 'Inscription confirmée ! Merci.');

        $subscriber->refresh();
        $this->assertNull($subscriber->unsubscribed_at);

        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'lecteur@example.test',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Vous êtes déjà inscrit à notre newsletter.');

        $this->assertDatabaseCount('newsletter_subscribers', 1);
    }

    public function test_contact_message_can_be_submitted(): void
    {
        $this->postJson('/api/contact', [
            'name' => 'Awa Sawadogo',
            'email' => 'awa@example.test',
            'subject' => 'Question sur une commande',
            'message' => 'Bonjour, je souhaite verifier la disponibilite d un ouvrage et le suivi de ma commande.',
        ])
            ->assertCreated()
            ->assertJsonPath('message', 'Votre message a été envoyé. Nous vous répondrons dans les meilleurs délais.');

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'awa@example.test',
            'subject' => 'Question sur une commande',
        ]);
    }
}
