<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Mail\ManuscriptSubmissionAdminNotification;
use App\Mail\ManuscriptSubmissionReceipt;
use App\Models\ManuscriptSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class ManuscriptSubmissionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'title' => ['required', 'string', 'max:180'],
            'collection' => ['required', 'exists:editorial_collections,slug'],
            'genre' => ['nullable', 'string', 'max:80'],
            'page_count' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'manuscript_url' => ['nullable', 'url', 'max:500'],
            'synopsis' => ['required', 'string', 'min:80', 'max:8000'],
            'author_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $submission = ManuscriptSubmission::create($validated)->refresh();

        $this->sendNotifications($submission);

        return response()->json([
            'message' => 'Votre manuscrit a été reçu. Notre équipe éditoriale vous répondra après lecture.',
            'submission' => [
                'id' => $submission->id,
                'status' => $submission->status,
            ],
        ], 201);
    }

    private function sendNotifications(ManuscriptSubmission $submission): void
    {
        rescue(function () use ($submission): void {
            Mail::to($submission->email)->send(new ManuscriptSubmissionReceipt($submission));

            $editorialEmail = (string) config('mercury.editorial_email', '');
            if ($editorialEmail !== '') {
                Mail::to($editorialEmail)->send(new ManuscriptSubmissionAdminNotification($submission));
            }
        }, null, false);
    }
}
