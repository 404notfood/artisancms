<?php

declare(strict_types=1);

namespace AiAssistant\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImproveTextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('use-ai-assistant');
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:10000'],
            'instruction' => ['required', 'string', 'max:1000'],
        ];
    }
}
