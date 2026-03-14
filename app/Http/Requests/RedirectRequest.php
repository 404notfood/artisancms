<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RedirectRequest extends FormRequest
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
        $redirectId = $this->route('redirect')?->id ?? $this->route('redirect');

        return [
            'source_path' => [
                'required',
                'string',
                'max:500',
                Rule::unique('redirects', 'source_path')->ignore($redirectId),
            ],
            'target_url' => ['required', 'string', 'max:500'],
            'status_code' => ['required', 'integer', Rule::in([301, 302])],
            'active' => ['sometimes', 'boolean'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
