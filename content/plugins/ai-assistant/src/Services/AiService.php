<?php

declare(strict_types=1);

namespace AiAssistant\Services;

use AiAssistant\Models\AiUsageLog;
use AiAssistant\Services\Drivers\AiDriverInterface;
use AiAssistant\Services\Drivers\AnthropicDriver;
use AiAssistant\Services\Drivers\OpenAiDriver;
use App\CMS\Facades\CMS;
use App\Models\CmsPlugin;
use Illuminate\Support\Facades\Cache;

class AiService
{
    protected AiDriverInterface $driver;
    protected array $settings;

    public function __construct()
    {
        $this->settings = $this->loadSettings();
        $this->driver = $this->resolveDriver();
    }

    /**
     * Generer du texte a partir d'un prompt.
     *
     * @param string $prompt    Le prompt utilisateur
     * @param array  $context   Contexte optionnel (page_title, block_type, existing_content)
     * @param int    $maxTokens Nombre maximum de tokens en sortie
     *
     * @return array{text: string, tokens_used: int}
     */
    public function generateText(string $prompt, array $context = [], int $maxTokens = 1024): array
    {
        $this->ensureFeatureEnabled('generate');

        $systemPrompt = $this->buildSystemPrompt('generate', $context);

        // Filtre CMS : permet aux plugins/themes de modifier le prompt
        $systemPrompt = CMS::applyFilter('ai.prompt_template', $systemPrompt, 'generate', $context);

        // Hook : avant generation
        CMS::fireHook('ai.before_generate', 'generate', $prompt, $context);

        $result = $this->driver->generateText(
            systemPrompt: $systemPrompt,
            userMessage: $prompt,
            maxTokens: $maxTokens,
            model: $this->settings['model'],
            temperature: (float) ($this->settings['temperature'] ?? 0.7),
        );

        $this->logUsage('generate', $result);

        // Hook : apres generation
        CMS::fireHook('ai.after_generate', 'generate', $result);

        return [
            'text' => $result['content'],
            'tokens_used' => $result['total_tokens'],
        ];
    }

    /**
     * Ameliorer / reecrire un texte existant.
     *
     * @param string $text        Texte original
     * @param string $instruction Instructions d'amelioration
     *
     * @return array{text: string, tokens_used: int}
     */
    public function improveText(string $text, string $instruction): array
    {
        $this->ensureFeatureEnabled('improve');

        CMS::fireHook('ai.before_generate', 'improve', $text, ['instruction' => $instruction]);

        $result = $this->driver->improveText(
            text: $text,
            instruction: $instruction,
            maxTokens: max(1024, (int) (mb_strlen($text) / 2)),
            model: $this->settings['model'],
            temperature: (float) ($this->settings['temperature'] ?? 0.7),
        );

        $this->logUsage('improve', $result);

        CMS::fireHook('ai.after_generate', 'improve', $result);

        return [
            'text' => $result['content'],
            'tokens_used' => $result['total_tokens'],
        ];
    }

    /**
     * Generer meta title + meta description + mots-cles SEO a partir du contenu.
     *
     * @param string $pageContent Contenu de la page
     *
     * @return array{meta_title: string, meta_description: string, keywords: array, tokens_used: int}
     */
    public function generateSeoMeta(string $pageContent): array
    {
        $this->ensureFeatureEnabled('seo');

        CMS::fireHook('ai.before_generate', 'seo', $pageContent, []);

        $result = $this->driver->generateSeoMeta(
            pageContent: $pageContent,
            maxTokens: 512,
            model: $this->settings['model'],
        );

        $this->logUsage('seo', $result);

        CMS::fireHook('ai.after_generate', 'seo', $result);

        $parsed = json_decode($result['content'], true);

        return [
            'meta_title' => $parsed['meta_title'] ?? '',
            'meta_description' => $parsed['meta_description'] ?? '',
            'keywords' => $parsed['keywords'] ?? [],
            'tokens_used' => $result['total_tokens'],
        ];
    }

    /**
     * Generer un texte alternatif pour une image via l'API vision.
     *
     * @param string $imageUrl URL de l'image
     *
     * @return array{alt_text: string, tokens_used: int}
     */
    public function generateAltText(string $imageUrl): array
    {
        $this->ensureFeatureEnabled('alt_text');

        CMS::fireHook('ai.before_generate', 'alt_text', $imageUrl, []);

        $result = $this->driver->generateAltText(
            imageUrl: $imageUrl,
            maxTokens: 100,
            model: $this->settings['model'],
        );

        $this->logUsage('alt_text', $result);

        CMS::fireHook('ai.after_generate', 'alt_text', $result);

        return [
            'alt_text' => $result['content'],
            'tokens_used' => $result['total_tokens'],
        ];
    }

    /**
     * Traduire un texte vers une langue cible.
     *
     * @param string $text         Texte a traduire
     * @param string $targetLocale Code langue cible (fr, en, es, etc.)
     *
     * @return array{text: string, source_locale: null, target_locale: string, tokens_used: int}
     */
    public function translateContent(string $text, string $targetLocale): array
    {
        $this->ensureFeatureEnabled('translate');

        CMS::fireHook('ai.before_generate', 'translate', $text, ['target_locale' => $targetLocale]);

        $result = $this->driver->translateContent(
            text: $text,
            targetLocale: $targetLocale,
            maxTokens: max(1024, (int) (mb_strlen($text) / 2)),
            model: $this->settings['model'],
        );

        $this->logUsage('translate', $result);

        CMS::fireHook('ai.after_generate', 'translate', $result);

        return [
            'text' => $result['content'],
            'source_locale' => null,
            'target_locale' => $targetLocale,
            'tokens_used' => $result['total_tokens'],
        ];
    }

    /**
     * Resumer un contenu long.
     *
     * @param string $text      Texte a resumer
     * @param int    $maxLength Longueur maximale du resume en caracteres
     *
     * @return array{summary: string, tokens_used: int}
     */
    public function summarize(string $text, int $maxLength = 200): array
    {
        $this->ensureFeatureEnabled('summarize');

        CMS::fireHook('ai.before_generate', 'summarize', $text, ['max_length' => $maxLength]);

        $result = $this->driver->summarize(
            text: $text,
            maxLength: $maxLength,
            maxTokens: 512,
            model: $this->settings['model'],
        );

        $this->logUsage('summarize', $result);

        CMS::fireHook('ai.after_generate', 'summarize', $result);

        return [
            'summary' => $result['content'],
            'tokens_used' => $result['total_tokens'],
        ];
    }

    /**
     * Get the current plugin settings.
     *
     * @return array
     */
    public function getSettings(): array
    {
        return $this->settings;
    }

    // --- Methodes internes ---

    /**
     * Resolve the AI driver based on the current settings.
     */
    protected function resolveDriver(): AiDriverInterface
    {
        $apiKey = decrypt($this->settings['api_key']);

        return match ($this->settings['ai_driver'] ?? 'openai') {
            'anthropic' => new AnthropicDriver($apiKey),
            default     => new OpenAiDriver($apiKey),
        };
    }

    /**
     * Load plugin settings from database with cache.
     */
    protected function loadSettings(): array
    {
        return Cache::remember('ai-assistant.settings', 300, function () {
            $plugin = CmsPlugin::where('slug', 'ai-assistant')->first();
            return $plugin?->settings ?? [];
        });
    }

    /**
     * Ensure a feature is enabled in the plugin settings.
     *
     * @throws \RuntimeException If the feature is disabled
     */
    protected function ensureFeatureEnabled(string $feature): void
    {
        $enabled = $this->settings['enabled_features'] ?? [];

        if (!in_array($feature, $enabled, true)) {
            throw new \RuntimeException(
                __('ai-assistant::messages.feature_disabled', ['feature' => $feature])
            );
        }
    }

    /**
     * Build the system prompt for a given action.
     */
    protected function buildSystemPrompt(string $action, array $context): string
    {
        $locale = $this->settings['default_locale'] ?? 'fr';
        $localeName = $locale === 'fr' ? 'francais' : 'anglais';

        $template = config("ai-assistant.prompts.{$action}", '');
        $base = str_replace(':locale', $localeName, $template);

        if (!empty($context['page_title'])) {
            $base .= "\nContexte : cette page s'intitule \"{$context['page_title']}\".";
        }

        if (!empty($context['block_type'])) {
            $base .= "\nLe contenu sera insere dans un bloc de type \"{$context['block_type']}\".";
        }

        if (!empty($context['existing_content'])) {
            $truncated = mb_substr($context['existing_content'], 0, 1000);
            $base .= "\nContenu existant sur la page (pour contexte) :\n{$truncated}";
        }

        return $base;
    }

    /**
     * Log the AI usage to the database.
     */
    protected function logUsage(string $action, array $result): void
    {
        AiUsageLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'driver' => $this->settings['ai_driver'] ?? 'openai',
            'model' => $this->settings['model'],
            'prompt_tokens' => $result['prompt_tokens'] ?? 0,
            'completion_tokens' => $result['completion_tokens'] ?? 0,
            'total_tokens' => $result['total_tokens'] ?? 0,
            'response_time_ms' => $result['response_time_ms'] ?? 0,
            'metadata' => $result['metadata'] ?? null,
        ]);
    }
}
