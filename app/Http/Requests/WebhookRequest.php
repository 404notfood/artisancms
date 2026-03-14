<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WebhookRequest extends FormRequest
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
            'name'          => ['required', 'string', 'max:255'],
            'url'           => ['required', 'url', 'max:2048'],
            'events'        => ['required', 'array', 'min:1'],
            'events.*'      => ['required', 'string', 'max:255'],
            'secret'        => ['nullable', 'string', 'max:255'],
            'headers'       => ['nullable', 'array'],
            'headers.*'     => ['nullable', 'string', 'max:1024'],
            'enabled'       => ['sometimes', 'boolean'],
            'retry_count'   => ['sometimes', 'integer', 'min:0', 'max:10'],
            'timeout'       => ['sometimes', 'integer', 'min:5', 'max:60'],
        ];
    }
}
