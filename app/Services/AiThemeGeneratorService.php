<?php

declare(strict_types=1);

namespace App\Services;

use AiAssistant\Services\AiService;
use App\CMS\Themes\ThemeManager;
use App\Models\CmsTheme;
use App\Models\DesignToken;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AiThemeGeneratorService
{
    public function __construct(
        private readonly AiService $aiService,
        private readonly ThemeManager $themeManager,
    ) {}

    /**
     * Generate a theme design from a natural language prompt.
     *
     * @param string $prompt      User description of the desired site
     * @param array  $options     industry, style, primary_color, secondary_color
     *
     * @return array{theme_name: string, colors: array, fonts: array, css_variables: array, suggested_pages: array, tokens_used: int}
     *
     * @throws RuntimeException
     */
    public function generate(string $prompt, array $options = []): array
    {
        $systemPrompt = $this->buildSystemPrompt($options);
        $userMessage = $this->buildUserMessage($prompt, $options);

        $result = $this->aiService->generateText($userMessage, [
            'page_title' => 'AI Theme Generator',
            'block_type' => 'theme-generation',
        ], 2048);

        $parsed = $this->parseJsonResponse($result['text']);

        return [
            'theme_name' => $parsed['theme_name'] ?? $this->generateThemeName($options),
            'colors' => $parsed['colors'] ?? [],
            'fonts' => $parsed['fonts'] ?? [],
            'css_variables' => $parsed['css_variables'] ?? [],
            'suggested_pages' => $parsed['suggested_pages'] ?? [],
            'tokens_used' => $result['tokens_used'],
        ];
    }

    /**
     * Apply generated theme data to the active theme's customizations.
     *
     * @throws RuntimeException
     */
    public function applyToTheme(string $themeSlug, array $generatedData): void
    {
        $theme = CmsTheme::where('slug', $themeSlug)->firstOrFail();

        $customizations = is_array($theme->customizations) ? $theme->customizations : [];

        // Map generated colors to theme customization keys
        $colorMap = [
            'primary' => 'colors.primary',
            'secondary' => 'colors.secondary',
            'accent' => 'colors.accent',
            'background' => 'colors.background',
            'surface' => 'colors.surface',
            'text' => 'colors.text',
        ];

        foreach ($colorMap as $genKey => $themeKey) {
            if (!empty($generatedData['colors'][$genKey])) {
                $customizations[$themeKey] = $generatedData['colors'][$genKey];
            }
        }

        // Map generated fonts
        if (!empty($generatedData['fonts']['heading'])) {
            $customizations['fonts.heading'] = $generatedData['fonts']['heading'];
        }
        if (!empty($generatedData['fonts']['body'])) {
            $customizations['fonts.body'] = $generatedData['fonts']['body'];
        }

        $theme->update(['customizations' => $customizations]);

        // Update design tokens in DB
        $this->syncDesignTokens($generatedData);

        Log::info('AI theme applied', [
            'theme' => $themeSlug,
            'colors' => $generatedData['colors'] ?? [],
            'fonts' => $generatedData['fonts'] ?? [],
        ]);
    }

    /**
     * Generate page content blocks for a given page type.
     *
     * @return array Page blocks tree (JSON-compatible)
     *
     * @throws RuntimeException
     */
    public function generatePageContent(string $pageType, string $industry, string $style): array
    {
        $prompt = $this->buildPagePrompt($pageType, $industry, $style);

        $result = $this->aiService->generateText($prompt, [
            'page_title' => ucfirst($pageType),
            'block_type' => 'page-generation',
        ], 2048);

        $parsed = $this->parseJsonResponse($result['text']);

        return $parsed['blocks'] ?? $parsed['content'] ?? [];
    }

    /**
     * Build the system-level context for theme generation.
     */
    private function buildSystemPrompt(array $options): string
    {
        $parts = [
            'Tu es un designer web expert. Tu generes des themes pour un CMS.',
            'Tu dois repondre UNIQUEMENT en JSON valide, sans commentaire ni texte avant/apres.',
        ];

        if (!empty($options['industry'])) {
            $parts[] = "Le site est dans le secteur : {$options['industry']}.";
        }

        if (!empty($options['style'])) {
            $parts[] = "Le style souhaite est : {$options['style']}.";
        }

        return implode(' ', $parts);
    }

    /**
     * Build the user message with the structured JSON request.
     */
    private function buildUserMessage(string $prompt, array $options): string
    {
        $constraints = [];

        if (!empty($options['primary_color'])) {
            $constraints[] = "Couleur principale imposee : {$options['primary_color']}";
        }
        if (!empty($options['secondary_color'])) {
            $constraints[] = "Couleur secondaire imposee : {$options['secondary_color']}";
        }

        $constraintText = !empty($constraints) ? "\n\nContraintes :\n- " . implode("\n- ", $constraints) : '';

        return <<<PROMPT
        Genere un theme web complet pour la description suivante :
        "{$prompt}"
        {$constraintText}

        Reponds en JSON strict avec cette structure exacte :
        {
          "theme_name": "Nom du theme (court, en anglais)",
          "colors": {
            "primary": "#hex",
            "secondary": "#hex",
            "accent": "#hex",
            "background": "#hex",
            "surface": "#hex",
            "text": "#hex"
          },
          "fonts": {
            "heading": "Nom Google Font pour les titres",
            "body": "Nom Google Font pour le corps"
          },
          "css_variables": {
            "--color-primary": "#hex",
            "--color-secondary": "#hex",
            "--color-accent": "#hex",
            "--color-background": "#hex",
            "--color-surface": "#hex",
            "--color-text": "#hex",
            "--font-heading": "'FontName', sans-serif",
            "--font-body": "'FontName', sans-serif",
            "--border-radius": "valeur rem",
            "--section-padding": "valeur px"
          },
          "suggested_pages": [
            {
              "type": "homepage|about|contact|services|portfolio|blog",
              "title": "Titre de la page",
              "description": "Description courte du contenu suggere"
            }
          ]
        }
        PROMPT;
    }

    /**
     * Build the prompt for page content generation.
     */
    private function buildPagePrompt(string $pageType, string $industry, string $style): string
    {
        return <<<PROMPT
        Genere le contenu d'une page "{$pageType}" pour un site "{$industry}" avec un style "{$style}".

        Reponds en JSON strict avec cette structure :
        {
          "blocks": [
            {
              "id": "unique-id",
              "type": "hero-section|text-block|image-text|features-grid|cta-section|testimonials|contact-form",
              "props": {
                "title": "Titre du bloc",
                "subtitle": "Sous-titre optionnel",
                "content": "Contenu texte HTML simple",
                "alignment": "left|center|right",
                "background": "light|dark|primary|transparent"
              },
              "children": []
            }
          ]
        }

        Genere entre 4 et 8 blocs pertinents pour cette page.
        Utilise du contenu realiste et professionnel, pas de lorem ipsum.
        PROMPT;
    }

    /**
     * Parse the AI response as JSON, handling common formatting issues.
     *
     * @throws RuntimeException
     */
    private function parseJsonResponse(string $text): array
    {
        // Strip markdown code fences if present
        $cleaned = preg_replace('/^```(?:json)?\s*\n?/i', '', trim($text));
        $cleaned = preg_replace('/\n?```\s*$/i', '', $cleaned);
        $cleaned = trim($cleaned);

        $data = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('AI theme generation returned invalid JSON', [
                'error' => json_last_error_msg(),
                'raw' => mb_substr($text, 0, 500),
            ]);

            throw new RuntimeException(
                __('cms.ai_theme.invalid_json_response')
            );
        }

        return $data;
    }

    /**
     * Sync generated colors/fonts as design tokens in the database.
     */
    private function syncDesignTokens(array $generatedData): void
    {
        $order = 0;

        foreach (($generatedData['colors'] ?? []) as $name => $value) {
            DesignToken::updateOrCreate(
                ['slug' => "ai-color-{$name}", 'category' => 'color'],
                [
                    'name' => "AI " . ucfirst($name),
                    'value' => ['hex' => $value],
                    'order' => $order++,
                ],
            );
        }

        foreach (($generatedData['fonts'] ?? []) as $name => $value) {
            DesignToken::updateOrCreate(
                ['slug' => "ai-font-{$name}", 'category' => 'font'],
                [
                    'name' => "AI " . ucfirst($name),
                    'value' => ['family' => $value],
                    'order' => $order++,
                ],
            );
        }
    }

    /**
     * Generate a fallback theme name from options.
     */
    private function generateThemeName(array $options): string
    {
        $parts = array_filter([
            $options['industry'] ?? null,
            $options['style'] ?? null,
        ]);

        return !empty($parts)
            ? ucwords(implode(' ', $parts)) . ' Theme'
            : 'AI Generated Theme';
    }
}
