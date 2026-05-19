<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'book_id' => ['required', 'integer', 'exists:books,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:200'],
            'comment' => ['required', 'string', 'min:10', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'book_id.required' => 'Livre non spécifié.',
            'book_id.exists' => 'Ce livre n\'existe pas.',
            'rating.required' => 'La note est obligatoire.',
            'rating.min' => 'La note minimum est de 1 étoile.',
            'rating.max' => 'La note maximum est de 5 étoiles.',
            'comment.required' => 'Votre commentaire est obligatoire.',
            'comment.min' => 'Votre commentaire doit contenir au moins 10 caractères.',
        ];
    }
}
