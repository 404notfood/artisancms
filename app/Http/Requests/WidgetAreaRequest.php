<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WidgetAreaRequest extends FormRequest
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
        $areaId = $this->route('widgetArea')?->id ?? $this->route('widgetArea');

        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('cms_widget_areas', 'slug')->ignore($areaId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
