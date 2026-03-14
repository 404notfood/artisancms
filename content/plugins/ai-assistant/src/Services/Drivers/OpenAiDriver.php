<?php

declare(strict_types=1);

namespace AiAssistant\Services\Drivers;

use Illuminate\Support\Facades\Http;

class OpenAiDriver implements AiDriverInterface
{
    private string $baseUrl;
    private int $timeout;

    public function __construct(
        protected string $apiKey,
        ?string $baseUrl = null,
        int $timeout = 30,
    ) {
        $this->baseUrl = $baseUrl ?? config('ai-assistant.drivers.openai.base_url', 'https://api.openai.com/v1');
        $this->timeout = $timeout;
    }

    public function generateText(
        string $systemPrompt,
        string $userMessage,
        int $maxTokens,
        string $model,
        float $temperature = 0.7,
    ): array {
        return $this->chat($systemPrompt, $userMessage, $maxTokens, $model, $temperature);
    }

    public function improveText(
        string $text,
        string $instruction,
        int $maxTokens,
        string $model,
        float $temperature = 0.7,
    ): array {
        $systemPrompt = config('ai-assistant.prompts.improve');
        $userMessage = "Instruction : {$instruction}\n\nTexte a ameliorer :\n{$text}";

        return $this->chat($systemPrompt, $userMessage, $maxTokens, $model, $temperature);
    }

    public function generateSeoMeta(
        string $pageContent,
        int $maxTokens,
        string $model,
    ): array {
        $systemPrompt = config('ai-assistant.prompts.seo');
        $truncated = mb_substr(strip_tags($pageContent), 0, 3000);

        return $this->chat($systemPrompt, $truncated, $maxTokens, $model, 0.5);
    }

    public function generateAltText(
        string $imageUrl,
        int $maxTokens,
        string $model,
    ): array {
        $systemPrompt = config('ai-assistant.prompts.alt_text');

        return $this->vision($systemPrompt, $imageUrl, $maxTokens, $model);
    }

    public function translateContent(
        string $text,
        string $targetLocale,
        int $maxTokens,
        string $model,
    ): array {
        $localeNames = $this->getLocaleNames();
        $targetName = $localeNames[$targetLocale] ?? $targetLocale;
        $systemPrompt = str_replace(':target_language', $targetName, config('ai-assistant.prompts.translate'));

        return $this->chat($systemPrompt, $text, $maxTokens, $model, 0.3);
    }

    public function summarize(
        string $text,
        int $maxLength,
        int $maxTokens,
        string $model,
    ): array {
        $systemPrompt = str_replace(':max_length', (string) $maxLength, config('ai-assistant.prompts.summarize'));

        return $this->chat($systemPrompt, $text, $maxTokens, $model, 0.5);
    }

    // --- Methodes internes ---

    protected function chat(
        string $systemPrompt,
        string $userMessage,
        int $maxTokens,
        string $model,
        float $temperature,
    ): array {
        $startTime = microtime(true);

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
        ])->timeout($this->timeout)->post($this->baseUrl . '/chat/completions', [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userMessage],
            ],
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
        ]);

        $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);

        if ($response->failed()) {
            throw new \RuntimeException(
                'OpenAI API error: ' . ($response->json('error.message') ?? $response->body())
            );
        }

        $data = $response->json();

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'prompt_tokens' => $data['usage']['prompt_tokens'] ?? 0,
            'completion_tokens' => $data['usage']['completion_tokens'] ?? 0,
            'total_tokens' => $data['usage']['total_tokens'] ?? 0,
            'response_time_ms' => $responseTimeMs,
        ];
    }

    protected function vision(
        string $systemPrompt,
        string $imageUrl,
        int $maxTokens,
        string $model,
    ): array {
        $startTime = microtime(true);

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
        ])->timeout($this->timeout)->post($this->baseUrl . '/chat/completions', [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => [
                    ['type' => 'image_url', 'image_url' => ['url' => $imageUrl]],
                ]],
            ],
            'max_tokens' => $maxTokens,
        ]);

        $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);

        if ($response->failed()) {
            throw new \RuntimeException(
                'OpenAI Vision API error: ' . ($response->json('error.message') ?? $response->body())
            );
        }

        $data = $response->json();

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'prompt_tokens' => $data['usage']['prompt_tokens'] ?? 0,
            'completion_tokens' => $data['usage']['completion_tokens'] ?? 0,
            'total_tokens' => $data['usage']['total_tokens'] ?? 0,
            'response_time_ms' => $responseTimeMs,
        ];
    }

    protected function getLocaleNames(): array
    {
        return [
            'fr' => 'francais', 'en' => 'anglais', 'es' => 'espagnol',
            'de' => 'allemand', 'it' => 'italien', 'pt' => 'portugais',
            'nl' => 'neerlandais', 'ja' => 'japonais', 'zh' => 'chinois', 'ar' => 'arabe',
        ];
    }
}
