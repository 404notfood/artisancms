<?php

declare(strict_types=1);

namespace AiAssistant\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateTextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('use-ai-assistant');
    }

    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'max:5000'],
            'context' => ['sometimes', 'array'],
            'context.page_title' => ['sometimes', 'string', 'max:255'],
            'context.block_type' => ['sometimes', 'string', 'max:50'],
            'context.existing_content' => ['sometimes', 'string', 'max:10000'],
            'max_tokens' => ['sometimes', 'integer', 'min:50', 'max:4096'],
        ];
    }
}
