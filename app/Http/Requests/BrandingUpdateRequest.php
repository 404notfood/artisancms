<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BrandingUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'brand_name' => ['nullable', 'string', 'max:255'],
            'brand_logo' => ['nullable', 'string', 'max:500'],
            'brand_logo_dark' => ['nullable', 'string', 'max:500'],
            'brand_favicon' => ['nullable', 'string', 'max:500'],
            'brand_color_primary' => ['nullable', 'string', 'max:20'],
            'brand_color_secondary' => ['nullable', 'string', 'max:20'],
            'brand_color_accent' => ['nullable', 'string', 'max:20'],
            'login_background' => ['nullable', 'string', 'max:500'],
            'login_logo' => ['nullable', 'string', 'max:500'],
            'footer_text' => ['nullable', 'string', 'max:500'],
            'show_powered_by' => ['nullable', 'boolean'],
            'custom_css' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
