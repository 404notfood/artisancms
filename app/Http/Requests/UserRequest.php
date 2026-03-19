<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'profile_visibility' => ['nullable', 'string', Rule::in(['public', 'members_only', 'private'])],
            'social_links' => ['nullable', 'array'],
            'social_links.website' => ['nullable', 'url', 'max:255'],
            'social_links.twitter' => ['nullable', 'url', 'max:255'],
            'social_links.linkedin' => ['nullable', 'url', 'max:255'],
            'social_links.github' => ['nullable', 'url', 'max:255'],
        ];

        if ($isUpdate) {
            $rules['password'] = ['nullable', 'string', Password::min(8), 'confirmed'];
        } else {
            $rules['password'] = ['required', 'string', Password::min(8), 'confirmed'];
        }

        return $rules;
    }
}
