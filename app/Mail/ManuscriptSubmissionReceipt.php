<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\ManuscriptSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ManuscriptSubmissionReceipt extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ManuscriptSubmission $submission) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Mercury Editions — Manuscrit reçu: ' . $this->submission->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.manuscript-submission-receipt',
            with: [
                'submission' => $this->submission,
            ],
        );
    }
}
