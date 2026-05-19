<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'phone' => [
                'required',
                'string',
                'regex:/^[0-9]{8}$/',
                'unique:users,phone',
            ],
            'email' => ['nullable', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'min:6',
                'max:100',
                'regex:/^(?=.*[A-Z])(?=.*\d).{6,}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est obligatoire.',
            'name.min' => 'Le nom doit contenir au moins 2 caractères.',
            'phone.required' => 'Le numéro de téléphone est obligatoire.',
            'phone.regex' => 'Entrez un numéro à 8 chiffres (ex: 70123456).',
            'phone.unique' => 'Ce numéro est déjà utilisé.',
            'email.email' => 'Adresse email invalide.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
            'password.regex' => 'Le mot de passe doit contenir au moins une majuscule et un chiffre.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $phone = preg_replace('/[^0-9]/', '', $this->phone);
            $phone = preg_replace('/^(00226|226|\+226)/', '', $phone);
            $this->merge(['phone' => $phone]);
        }
    }
}
