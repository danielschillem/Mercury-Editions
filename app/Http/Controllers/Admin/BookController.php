<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    private function persistUploads(Request $request, array &$validated): void
    {
        if ($request->hasFile('cover_upload')) {
            $validated['cover_image'] = Storage::url($request->file('cover_upload')->store('covers', 'public'));
        }

        if ($request->hasFile('ebook_pdf')) {
            $validated['ebook_pdf_path'] = 'private://' . $request->file('ebook_pdf')->store('ebooks/pdf', 'local');
        }

        if ($request->hasFile('ebook_epub')) {
            $validated['ebook_epub_path'] = 'private://' . $request->file('ebook_epub')->store('ebooks/epub', 'local');
        }
    }

    public function index(): JsonResponse
    {
        return response()->json(Book::with('author')->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'author_id'   => ['nullable', 'exists:authors,id'],
            'author_name' => ['required', 'string', 'max:255'],
            'price'       => ['required', 'integer', 'min:0'],
            'category'    => ['required', 'string', 'max:30'],
            'rating'      => ['required', 'numeric', 'min:0', 'max:5'],
            'local'       => ['boolean'],
            'color'       => ['required', 'string', 'max:20'],
            'cover_image' => ['nullable', 'string', 'max:255'],
            'cover_upload'=> ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:4096'],
            'ebook_pdf'   => ['nullable', 'file', 'mimes:pdf', 'max:30720'],
            'ebook_epub'  => ['nullable', 'file', 'mimes:epub', 'max:30720'],
            'year'        => ['required', 'integer', 'min:1800', 'max:2100'],
            'pages'       => ['required', 'integer', 'min:1'],
            'publisher'   => ['required', 'string', 'max:255'],
            'language'    => ['required', 'string', 'max:30'],
            'isbn'        => ['required', 'string', 'max:30', 'unique:books'],
            'tags'        => ['required', 'array'],
            'description' => ['required', 'string'],
            'summary'     => ['required', 'string'],
            'quote'       => ['required', 'string'],
        ]);

        $this->persistUploads($request, $validated);

        $book = Book::create($validated);
        $book->load('author');

        return response()->json($book, 201);
    }

    public function show(Book $book): JsonResponse
    {
        $book->load('author');

        return response()->json($book);
    }

    public function update(Request $request, Book $book): JsonResponse
    {
        $validated = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'author_id'   => ['nullable', 'exists:authors,id'],
            'author_name' => ['sometimes', 'string', 'max:255'],
            'price'       => ['sometimes', 'integer', 'min:0'],
            'category'    => ['sometimes', 'string', 'max:30'],
            'rating'      => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'local'       => ['boolean'],
            'color'       => ['sometimes', 'string', 'max:20'],
            'cover_image' => ['nullable', 'string', 'max:255'],
            'cover_upload'=> ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:4096'],
            'ebook_pdf'   => ['nullable', 'file', 'mimes:pdf', 'max:30720'],
            'ebook_epub'  => ['nullable', 'file', 'mimes:epub', 'max:30720'],
            'year'        => ['sometimes', 'integer', 'min:1800', 'max:2100'],
            'pages'       => ['sometimes', 'integer', 'min:1'],
            'publisher'   => ['sometimes', 'string', 'max:255'],
            'language'    => ['sometimes', 'string', 'max:30'],
            'isbn'        => ['sometimes', 'string', 'max:30', 'unique:books,isbn,' . $book->id],
            'tags'        => ['sometimes', 'array'],
            'description' => ['sometimes', 'string'],
            'summary'     => ['sometimes', 'string'],
            'quote'       => ['sometimes', 'string'],
        ]);

        $this->persistUploads($request, $validated);

        $book->update($validated);
        $book->load('author');

        return response()->json($book);
    }

    public function destroy(Book $book): JsonResponse
    {
        $book->delete();

        return response()->json(['message' => 'Livre supprimé.']);
    }
}
