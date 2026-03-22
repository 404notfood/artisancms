<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DesignTokenRequest extends FormRequest
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
        $tokenId = $this->route('design_token')?->id ?? $this->route('design_token');

        return [
            'name' => 'required|string|max:100',
            'slug' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('cms_design_tokens', 'slug')->ignore($tokenId),
            ],
            'category' => 'required|in:color,typography,button,spacing,shadow,border',
            'value' => 'required|array',
            'order' => 'nullable|integer|min:0',
        ];
    }
}
