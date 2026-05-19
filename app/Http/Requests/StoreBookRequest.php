<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        $rules = [
            'title' => ['required', 'string', 'min:2', 'max:255'],
            'author_name' => ['required', 'string', 'min:2', 'max:100'],
            'author_id' => ['nullable', 'integer', 'exists:authors,id'],
            'price' => ['required', 'integer', 'min:100', 'max:1000000'],
            'category' => ['required', 'string', Rule::in([
                'roman', 'poesie', 'essai', 'conte', 'jeunesse',
                'developpement', 'sante', 'spiritualite', 'histoire', 'autre'
            ])],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'local' => ['nullable', 'boolean'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'year' => ['nullable', 'integer', 'min:1800', 'max:' . (date('Y') + 1)],
            'pages' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'publisher' => ['nullable', 'string', 'max:200'],
            'language' => ['nullable', 'string', 'max:50'],
            'isbn' => ['nullable', 'string', 'max:20'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'description' => ['nullable', 'string', 'max:5000'],
            'summary' => ['nullable', 'string', 'max:10000'],
            'quote' => ['nullable', 'string', 'max:500'],
            'ebook_pdf_path' => ['nullable', 'string', 'max:500'],
            'ebook_epub_path' => ['nullable', 'string', 'max:500'],
        ];

        // ISBN unique sauf pour le livre actuel (en cas de modification)
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $rules['isbn'][] = Rule::unique('books', 'isbn')->ignore($this->route('book'));
        } else {
            $rules['isbn'][] = 'unique:books,isbn';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre est obligatoire.',
            'author_name.required' => 'Le nom de l\'auteur est obligatoire.',
            'price.required' => 'Le prix est obligatoire.',
            'price.min' => 'Le prix minimum est de 100 FCFA.',
            'category.required' => 'La catégorie est obligatoire.',
            'category.in' => 'Catégorie invalide.',
            'rating.max' => 'La note ne peut pas dépasser 5.',
            'color.regex' => 'La couleur doit être au format hexadécimal (#RRGGBB).',
            'year.max' => 'L\'année de publication ne peut pas être dans le futur.',
            'isbn.unique' => 'Ce numéro ISBN existe déjà.',
        ];
    }
}
