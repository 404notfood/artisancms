<?php

declare(strict_types=1);

namespace AiAssistant\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateSeoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('use-ai-assistant');
    }

    public function rules(): array
    {
        return [
            'page_content' => ['required', 'string', 'max:50000'],
        ];
    }
}
