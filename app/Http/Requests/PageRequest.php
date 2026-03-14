<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PageRequest extends FormRequest
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
        $pageId = $this->route('page')?->id ?? $this->route('page');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('pages', 'slug')->ignore($pageId),
            ],
            'content' => ['nullable', 'json'],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'published', 'pending_review', 'approved', 'scheduled', 'trash'])],
            'access_level' => ['sometimes', 'string', 'regex:/^(public|authenticated|role:[a-z0-9_-]+)$/'],
            'template' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
            'og_image' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:pages,id'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
