<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\CustomField;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomFieldGroupRequest extends FormRequest
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
        $groupId = $this->route('custom_field')?->id;

        return [
            'name'                     => ['required', 'string', 'max:255'],
            'slug'                     => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('cms_custom_field_groups', 'slug')->ignore($groupId),
            ],
            'description'              => ['nullable', 'string', 'max:1000'],
            'applies_to'               => ['required', 'array', 'min:1'],
            'applies_to.*'             => ['required', 'string', 'max:255'],
            'position'                 => ['sometimes', 'string', Rule::in(['normal', 'side'])],
            'order'                    => ['sometimes', 'integer', 'min:0'],
            'active'                   => ['sometimes', 'boolean'],
            'fields'                   => ['required', 'array', 'min:1'],
            'fields.*.id'              => ['nullable', 'integer'],
            'fields.*.name'            => ['required', 'string', 'max:255'],
            'fields.*.slug'            => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:_[a-z0-9]+)*$/'],
            'fields.*.type'            => ['required', 'string', Rule::in(CustomField::availableTypes())],
            'fields.*.description'     => ['nullable', 'string', 'max:500'],
            'fields.*.placeholder'     => ['nullable', 'string', 'max:255'],
            'fields.*.default_value'   => ['nullable', 'string', 'max:10000'],
            'fields.*.options'         => ['nullable', 'array'],
            'fields.*.options.*.label' => ['required_with:fields.*.options', 'string', 'max:255'],
            'fields.*.options.*.value' => ['required_with:fields.*.options', 'string', 'max:255'],
            'fields.*.validation'      => ['nullable', 'array'],
            'fields.*.order'           => ['sometimes', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex'          => 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets.',
            'fields.*.slug.regex' => 'Le slug du champ doit contenir uniquement des lettres minuscules, chiffres et underscores.',
            'fields.required'     => 'Au moins un champ est requis.',
            'fields.min'          => 'Au moins un champ est requis.',
            'applies_to.required' => 'Sélectionnez au moins un type de contenu.',
            'applies_to.min'      => 'Sélectionnez au moins un type de contenu.',
        ];
    }
}
