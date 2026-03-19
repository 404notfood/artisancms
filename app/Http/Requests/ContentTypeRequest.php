<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $contentTypeId = $this->route('contentType')?->id ?? $this->route('contentType');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('content_types', 'slug')->ignore($contentTypeId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:50'],
            'fields' => ['nullable', 'array'],
            'fields.*.name' => ['required', 'string', 'max:255'],
            'fields.*.slug' => ['required', 'string', 'max:255'],
            'fields.*.type' => ['required', 'string', Rule::in([
                'text', 'textarea', 'number', 'email', 'url', 'date', 'datetime',
                'select', 'checkbox', 'radio', 'file', 'image', 'color', 'wysiwyg',
            ])],
            'fields.*.required' => ['boolean'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.order' => ['integer'],
            'supports' => ['nullable', 'array'],
            'supports.*' => ['string', Rule::in([
                'title', 'slug', 'featured_image', 'excerpt', 'content',
                'taxonomies', 'revisions', 'comments',
            ])],
            'has_archive' => ['boolean'],
            'public' => ['boolean'],
            'menu_position' => ['integer', 'min:0'],
        ];
    }
}
