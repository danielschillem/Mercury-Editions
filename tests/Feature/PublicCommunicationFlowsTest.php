<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Mail\ManuscriptSubmissionAdminNotification;
use App\Mail\ManuscriptSubmissionReceipt;
use App\Models\EditorialCollection;
use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
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

        $this->postJson("/api/newsletter/unsubscribe/{$subscriber->token}")
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

    public function test_manuscript_submission_can_be_created(): void
    {
        Mail::fake();
        config(['mercury.editorial_email' => 'manuscrits@example.test']);

        $this->postJson('/api/manuscripts', [
            'author_name' => 'Awa Sawadogo',
            'email' => 'awa.manuscrit@example.test',
            'phone' => '+22670123456',
            'title' => 'Les saisons du retour',
            'collection' => 'litterature-recits',
            'genre' => 'Roman',
            'page_count' => 184,
            'manuscript_url' => 'https://example.test/manuscrit.pdf',
            'synopsis' => 'Une jeune femme revient dans son village natal après plusieurs années de migration. Le récit suit son rapport à la famille, aux terres abandonnées, aux souvenirs politiques et aux nouvelles ambitions de la jeunesse locale.',
            'author_note' => 'Premier roman, déjà relu par un cercle de lecteurs.',
        ])
            ->assertCreated()
            ->assertJsonPath('submission.status', 'received');

        $this->assertDatabaseHas('manuscript_submissions', [
            'email' => 'awa.manuscrit@example.test',
            'title' => 'Les saisons du retour',
            'status' => 'received',
        ]);

        Mail::assertSent(ManuscriptSubmissionReceipt::class, function ($mail) {
            return $mail->hasTo('awa.manuscrit@example.test')
                && $mail->submission->title === 'Les saisons du retour';
        });

        Mail::assertSent(ManuscriptSubmissionAdminNotification::class, function ($mail) {
            return $mail->hasTo('manuscrits@example.test')
                && $mail->submission->email === 'awa.manuscrit@example.test';
        });
    }

    public function test_public_editorial_collections_only_expose_active_items(): void
    {
        EditorialCollection::create([
            'name' => 'Archives internes',
            'slug' => 'archives-internes',
            'description' => 'Collection masquée réservée aux tests.',
            'icon' => 'library',
            'color' => '#111827',
            'sort_order' => 99,
            'is_active' => false,
        ]);

        $this->getJson('/api/editorial-collections')
            ->assertOk()
            ->assertJsonFragment(['slug' => 'litterature-recits'])
            ->assertJsonMissing(['slug' => 'archives-internes']);
    }
}
