<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
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
        $allowedMimes = config('cms.media.allowed_mimes', [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/pdf',
            'video/mp4',
            'video/webm',
            'audio/mpeg',
            'audio/wav',
        ]);

        $maxSize = (int) config('cms.media.max_upload_size', 10240);

        return [
            'file' => [
                'required',
                'file',
                'max:' . $maxSize,
                function (string $attribute, mixed $value, \Closure $fail) use ($allowedMimes): void {
                    if ($value && method_exists($value, 'getRealPath')) {
                        // Use finfo for strict content-based MIME detection (not client-provided header)
                        $realPath = $value->getRealPath() ?: $value->getPathname();
                        $finfo = new \finfo(FILEINFO_MIME_TYPE);
                        $mime = $finfo->file($realPath);

                        if ($mime === false || !in_array($mime, $allowedMimes, true)) {
                            $fail(__('The :attribute has an invalid MIME type: :mime.', [
                                'attribute' => $attribute,
                                'mime' => $mime ?: 'unknown',
                            ]));
                        }
                    }
                },
            ],
            'folder' => ['nullable', 'string', 'max:255'],
        ];
    }
}
