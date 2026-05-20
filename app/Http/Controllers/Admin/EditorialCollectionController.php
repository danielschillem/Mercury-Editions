<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EditorialCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EditorialCollectionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(EditorialCollection::query()->ordered()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateCollection($request);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $collection = EditorialCollection::create($validated);

        return response()->json($collection, 201);
    }

    public function update(Request $request, EditorialCollection $editorialCollection): JsonResponse
    {
        $validated = $this->validateCollection($request, $editorialCollection);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $editorialCollection->update($validated);

        return response()->json($editorialCollection);
    }

    public function destroy(EditorialCollection $editorialCollection): JsonResponse
    {
        $editorialCollection->delete();

        return response()->json(['message' => 'Collection supprimée.']);
    }

    private function validateCollection(Request $request, ?EditorialCollection $collection = null): array
    {
        $ignoreId = $collection?->id;

        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'nullable',
                'string',
                'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('editorial_collections', 'slug')->ignore($ignoreId),
            ],
            'description' => ['required', 'string', 'max:2000'],
            'icon' => ['required', 'string', 'max:40'],
            'color' => ['required', 'string', 'max:20'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:1000'],
            'is_active' => ['boolean'],
        ]);
    }
}
