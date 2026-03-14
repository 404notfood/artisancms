<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SiteRequest extends FormRequest
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
        $siteId = $this->route('site')?->id;

        return [
            'name'      => ['required', 'string', 'max:255'],
            'slug'      => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('cms_sites', 'slug')->ignore($siteId),
            ],
            'domain'    => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('cms_sites', 'domain')->ignore($siteId),
            ],
            'subdomain' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('cms_sites', 'subdomain')->ignore($siteId),
            ],
            'locale'    => ['sometimes', 'string', 'max:10'],
            'timezone'  => ['sometimes', 'string', 'max:100', 'timezone:all'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
