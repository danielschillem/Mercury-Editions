<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'buyer_phone' => [
                'required',
                'string',
                'regex:/^(00226|226|\+226)?[0-9]{8}$/',
            ],
            'buyer_name' => ['required', 'string', 'min:2', 'max:100'],
            'buyer_email' => ['nullable', 'email:rfc,dns', 'max:255'],
            'shipping_address' => ['nullable', 'string', 'max:500'],
            'shipping_city' => ['nullable', 'string', 'max:100'],
            'shipping_country' => ['nullable', 'string', 'max:100'],
            'delivery_notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.book_id' => ['required', 'integer', 'exists:books,id'],
            'items.*.format' => ['required', Rule::in(['ebook', 'physical'])],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'buyer_phone.required' => 'Le numéro de téléphone est obligatoire.',
            'buyer_phone.regex' => 'Veuillez entrer un numéro de téléphone burkinabè valide.',
            'buyer_name.required' => 'Le nom est obligatoire.',
            'buyer_name.min' => 'Le nom doit contenir au moins 2 caractères.',
            'items.required' => 'Votre panier est vide.',
            'items.min' => 'Votre panier doit contenir au moins un article.',
            'items.*.book_id.exists' => 'Un des livres sélectionnés n\'existe pas.',
            'items.*.format.in' => 'Format invalide. Choisissez ebook ou papier.',
            'items.*.quantity.max' => 'Maximum 10 exemplaires par livre.',
        ];
    }

    /**
     * Normalise le numéro de téléphone burkinabè
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('buyer_phone')) {
            $phone = preg_replace('/[^0-9]/', '', $this->buyer_phone);
            // Enlève les préfixes internationaux
            $phone = preg_replace('/^(00226|226)/', '', $phone);
            $this->merge(['buyer_phone' => $phone]);
        }
    }
}
