<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaxonomyRequest extends FormRequest
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
        $taxonomyId = $this->route('taxonomy')?->id ?? $this->route('taxonomy');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('taxonomies', 'slug')->ignore($taxonomyId),
            ],
            'type' => ['sometimes', 'string', Rule::in(['category', 'tag', 'custom'])],
            'description' => ['nullable', 'string'],
            'hierarchical' => ['sometimes', 'boolean'],
            'applies_to' => ['nullable', 'array'],
            'applies_to.*' => ['string', Rule::in(['pages', 'posts'])],
        ];
    }
}
