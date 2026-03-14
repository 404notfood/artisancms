<?php

declare(strict_types=1);

namespace AiAssistant\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateAltTextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('use-ai-assistant');
    }

    public function rules(): array
    {
        return [
            'image_url' => ['required', 'url', 'max:2048'],
        ];
    }
}
