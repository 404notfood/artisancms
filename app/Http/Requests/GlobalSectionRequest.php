<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GlobalSectionRequest extends FormRequest
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
        $sectionId = $this->route('global_section')?->id ?? $this->route('global_section');

        return [
            'name'    => ['required', 'string', 'max:255'],
            'slug'    => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('cms_global_sections', 'slug')->ignore($sectionId),
            ],
            'type'    => ['required', 'string', Rule::in(['header', 'footer'])],
            'content' => ['nullable', 'array'],
            'status'  => ['sometimes', 'string', Rule::in(['active', 'inactive'])],
            'site_id' => ['nullable', 'integer', 'exists:cms_sites,id'],
        ];
    }
}
