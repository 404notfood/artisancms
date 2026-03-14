<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MenuItemsRequest extends FormRequest
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
        return [
            'items' => ['required', 'array'],
            'items.*.label' => ['required', 'string', 'max:255'],
            'items.*.type' => ['required', 'string', Rule::in(['page', 'post', 'url', 'custom', 'taxonomy'])],
            'items.*.url' => ['nullable', 'string', 'max:2048'],
            'items.*.target' => ['sometimes', 'string', Rule::in(['_self', '_blank'])],
            'items.*.css_class' => ['nullable', 'string', 'max:255'],
            'items.*.icon' => ['nullable', 'string', 'max:255'],
            'items.*.linkable_id' => ['nullable', 'integer'],
            'items.*.linkable_type' => ['nullable', 'string'],
            'items.*.children' => ['nullable', 'array'],
            'items.*.children.*.label' => ['required', 'string', 'max:255'],
            'items.*.children.*.type' => ['required', 'string', Rule::in(['page', 'post', 'url', 'custom', 'taxonomy'])],
            'items.*.children.*.url' => ['nullable', 'string', 'max:2048'],
            'items.*.children.*.target' => ['sometimes', 'string', Rule::in(['_self', '_blank'])],
        ];
    }
}
