<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Author;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Author::withCount('books')->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug'     => ['required', 'string', 'max:100', 'unique:authors'],
            'name'     => ['required', 'string', 'max:255'],
            'icon'     => ['required', 'string', 'max:30'],
            'origin'   => ['required', 'string', 'max:255'],
            'born'     => ['required', 'string', 'max:10'],
            'died'     => ['nullable', 'string', 'max:10'],
            'color'    => ['required', 'string', 'max:20'],
            'genres'   => ['required', 'array'],
            'bio'      => ['required', 'string'],
            'timeline' => ['required', 'array'],
            'awards'   => ['required', 'array'],
        ]);

        $author = Author::create($validated);
        $author->loadCount('books');

        return response()->json($author, 201);
    }

    public function show(Author $author): JsonResponse
    {
        $author->loadCount('books');

        return response()->json($author);
    }

    public function update(Request $request, Author $author): JsonResponse
    {
        $validated = $request->validate([
            'slug'     => ['sometimes', 'string', 'max:100', 'unique:authors,slug,' . $author->id],
            'name'     => ['sometimes', 'string', 'max:255'],
            'icon'     => ['sometimes', 'string', 'max:30'],
            'origin'   => ['sometimes', 'string', 'max:255'],
            'born'     => ['sometimes', 'string', 'max:10'],
            'died'     => ['nullable', 'string', 'max:10'],
            'color'    => ['sometimes', 'string', 'max:20'],
            'genres'   => ['sometimes', 'array'],
            'bio'      => ['sometimes', 'string'],
            'timeline' => ['sometimes', 'array'],
            'awards'   => ['sometimes', 'array'],
        ]);

        $author->update($validated);
        $author->loadCount('books');

        return response()->json($author);
    }

    public function destroy(Author $author): JsonResponse
    {
        $author->books()->update(['author_id' => null]);
        $author->delete();

        return response()->json(['message' => 'Auteur supprimé.']);
    }
}
