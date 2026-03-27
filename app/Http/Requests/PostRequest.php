<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PostRequest extends FormRequest
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
        $postId = $this->route('post')?->id ?? $this->route('post');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('posts', 'slug')->ignore($postId),
            ],
            'content' => ['nullable', 'json'],
            'excerpt' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'published', 'pending_review', 'approved', 'scheduled', 'trash'])],
            'access_level' => ['sometimes', 'string', 'regex:/^(public|authenticated|role:[a-z0-9_-]+)$/'],
            'featured_image' => ['nullable', 'string'],
            'published_at' => ['nullable', 'date'],
            'allow_comments' => ['sometimes', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:70'],
            'meta_description' => ['nullable', 'string', 'max:200'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
            'og_image' => ['nullable', 'string', 'max:500'],
            'meta_robots' => ['nullable', 'string', 'max:50'],
            'canonical_url' => ['nullable', 'url', 'max:500'],
            'focus_keyword' => ['nullable', 'string', 'max:100'],
        ];
    }
}
