<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PopupRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string|max:65535',
            'type' => 'required|in:modal,banner,slide-in',
            'trigger' => 'required|in:page_load,exit_intent,scroll,delay',
            'trigger_value' => 'nullable|string|max:50',
            'display_frequency' => 'required|in:always,once,once_per_session',
            'pages' => 'nullable|array',
            'pages.*' => 'string|max:255',
            'cta_text' => 'nullable|string|max:255',
            'cta_url' => 'nullable|string|max:2048',
            'style' => 'nullable|array',
            'style.backgroundColor' => 'nullable|string|max:50',
            'style.textColor' => 'nullable|string|max:50',
            'style.position' => 'nullable|string|max:50',
            'active' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ];
    }
}
