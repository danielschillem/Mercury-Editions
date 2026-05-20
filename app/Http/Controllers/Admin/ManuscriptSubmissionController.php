<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ManuscriptSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ManuscriptSubmissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ManuscriptSubmission::query();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('collection')) {
            $query->where('collection', $request->input('collection'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('author_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('synopsis', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate(20)
        );
    }

    public function show(ManuscriptSubmission $manuscriptSubmission): JsonResponse
    {
        return response()->json($manuscriptSubmission);
    }

    public function update(Request $request, ManuscriptSubmission $manuscriptSubmission): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(ManuscriptSubmission::STATUSES)],
            'admin_notes' => ['nullable', 'string', 'max:10000'],
        ]);

        $validated['reviewed_at'] = now();
        $manuscriptSubmission->update($validated);

        return response()->json($manuscriptSubmission);
    }
}
