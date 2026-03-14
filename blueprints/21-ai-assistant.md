# Blueprint 21 - Assistant IA (Plugin officiel)

## Vue d'ensemble
L'Assistant IA est un **plugin officiel** (`content/plugins/ai-assistant/`) qui integre l'intelligence artificielle directement dans ArtisanCMS. Il permet aux utilisateurs de generer du contenu, ameliorer des textes existants, produire des meta SEO, traduire, resumer et generer des textes alternatifs pour les images -- le tout sans quitter le page builder.

Le plugin supporte plusieurs fournisseurs d'IA (OpenAI, Anthropic) via une couche d'abstraction (driver pattern) et inclut un systeme de suivi d'utilisation avec limites configurables pour maitriser les couts.

---

## 1. Structure du plugin

```
content/plugins/ai-assistant/
├── artisan-plugin.json
├── src/
│   ├── AiAssistantServiceProvider.php
│   ├── Models/
│   │   └── AiUsageLog.php
│   ├── Services/
│   │   ├── AiService.php                # Couche d'abstraction principale
│   │   ├── Drivers/
│   │   │   ├── AiDriverInterface.php    # Contrat commun pour tous les drivers
│   │   │   ├── OpenAiDriver.php         # Implementation OpenAI
│   │   │   └── AnthropicDriver.php      # Implementation Anthropic
│   │   └── UsageTracker.php             # Suivi des tokens consommes
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AiController.php         # Controller unique pour toutes les actions IA
│   │   │   └── AiSettingsController.php # Gestion des parametres admin
│   │   ├── Requests/
│   │   │   ├── GenerateTextRequest.php
│   │   │   ├── ImproveTextRequest.php
│   │   │   ├── GenerateSeoRequest.php
│   │   │   └── GenerateAltTextRequest.php
│   │   └── Middleware/
│   │       └── AiRateLimiter.php
│   ├── Policies/
│   │   └── AiPolicy.php                # Autorisation par utilisateur
│   └── Commands/
│       └── AiBulkGenerateCommand.php    # Generation en masse (alt text, SEO)
├── database/migrations/
│   └── create_ai_usage_logs_table.php
├── config/
│   └── ai-assistant.php
├── resources/
│   ├── js/
│   │   ├── components/
│   │   │   ├── AiPanel.tsx              # Panneau lateral IA dans le builder
│   │   │   ├── AiButton.tsx             # Bouton contextuel "AI" dans les champs texte
│   │   │   └── AiSuggestions.tsx        # Dropdown avec suggestions generees
│   │   └── hooks/
│   │       ├── use-cms-ai.ts            # Hook principal useCmsAi()
│   │       └── use-ai-usage.ts          # Hook pour afficher l'utilisation
│   └── lang/
│       ├── fr/messages.php
│       └── en/messages.php
├── routes/
│   ├── api.php                          # Routes API IA
│   └── admin.php                        # Routes settings admin
└── tests/
    ├── AiServiceTest.php
    ├── AiRateLimiterTest.php
    └── AiControllerTest.php
```

---

## 2. Configuration

### Manifeste : artisan-plugin.json

```json
{
  "name": "AI Assistant",
  "slug": "ai-assistant",
  "version": "1.0.0",
  "description": "Assistant IA pour la creation de contenu, le SEO et la traduction",
  "author": {
    "name": "ArtisanCMS",
    "url": "https://artisancms.dev"
  },
  "license": "MIT",
  "requires": {
    "cms": ">=1.0.0",
    "php": ">=8.2"
  },
  "dependencies": [],
  "providers": ["AiAssistant\\AiAssistantServiceProvider"],
  "blocks": [],
  "routes": true,
  "migrations": true,
  "settings": {
    "ai_driver": {
      "type": "select",
      "label": "Fournisseur IA",
      "options": ["openai", "anthropic"],
      "default": "openai"
    },
    "api_key": {
      "type": "password",
      "label": "Cle API",
      "encrypted": true,
      "default": ""
    },
    "model": {
      "type": "select",
      "label": "Modele",
      "options": {
        "openai": ["gpt-4o", "gpt-4o-mini"],
        "anthropic": ["claude-sonnet-4-20250514", "claude-haiku-235-20241022"]
      },
      "default": "gpt-4o-mini"
    },
    "default_locale": {
      "type": "string",
      "label": "Langue par defaut pour la generation",
      "default": "fr"
    },
    "monthly_token_limit": {
      "type": "number",
      "label": "Limite de tokens par mois (global)",
      "default": 500000
    },
    "per_user_daily_token_limit": {
      "type": "number",
      "label": "Limite de tokens par utilisateur par jour",
      "default": 50000
    },
    "temperature": {
      "type": "range",
      "label": "Temperature / creativite (0.0 = factuel, 1.0 = creatif)",
      "min": 0,
      "max": 1,
      "step": 0.1,
      "default": 0.7
    },
    "enabled_features": {
      "type": "checkboxes",
      "label": "Fonctionnalites activees",
      "options": ["generate", "improve", "seo", "alt_text", "translate", "summarize"],
      "default": ["generate", "improve", "seo", "alt_text"]
    }
  },
  "admin_pages": [
    {
      "title": "Assistant IA",
      "slug": "ai-settings",
      "icon": "sparkles",
      "parent": "ai-assistant"
    },
    {
      "title": "Utilisation",
      "slug": "ai-usage",
      "icon": "bar-chart-3",
      "parent": "ai-assistant"
    }
  ]
}
```

### Fichier de configuration : config/ai-assistant.php

```php
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Driver par defaut
    |--------------------------------------------------------------------------
    | Le fournisseur IA utilise. Supporte : "openai", "anthropic".
    | Peut etre surcharge via les settings du plugin en admin.
    */
    'driver' => 'openai',

    /*
    |--------------------------------------------------------------------------
    | Configuration des drivers
    |--------------------------------------------------------------------------
    */
    'drivers' => [

        'openai' => [
            'base_url' => 'https://api.openai.com/v1',
            'default_model' => 'gpt-4o-mini',
            'timeout' => 30,
            'supported_models' => ['gpt-4o', 'gpt-4o-mini'],
        ],

        'anthropic' => [
            'base_url' => 'https://api.anthropic.com/v1',
            'api_version' => '2023-06-01',
            'default_model' => 'claude-sonnet-4-20250514',
            'timeout' => 30,
            'supported_models' => ['claude-sonnet-4-20250514', 'claude-haiku-235-20241022'],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Limites
    |--------------------------------------------------------------------------
    */
    'limits' => [
        'monthly_tokens' => 500000,
        'daily_tokens_per_user' => 50000,
        'requests_per_minute' => 20,
        'max_input_length' => 10000,         // Caracteres max envoyes a l'API
        'max_tokens_per_request' => 4096,
    ],

    /*
    |--------------------------------------------------------------------------
    | Temperature par defaut
    |--------------------------------------------------------------------------
    | 0.0 = reponses factuelles et deterministes
    | 1.0 = reponses creatives et variees
    */
    'temperature' => 0.7,

    /*
    |--------------------------------------------------------------------------
    | Langue par defaut pour la generation
    |--------------------------------------------------------------------------
    */
    'default_locale' => 'fr',

    /*
    |--------------------------------------------------------------------------
    | Templates de prompts
    |--------------------------------------------------------------------------
    | Les prompts systeme utilises pour chaque action.
    | Peuvent etre surcharges via le filtre CMS "ai.prompt_template".
    */
    'prompts' => [

        'generate' => "Tu es un assistant de redaction pour un site web. "
            . "Redige en :locale sauf indication contraire. "
            . "Sois professionnel, clair et concis. "
            . "Retourne uniquement le contenu demande, sans commentaire ni explication.",

        'improve' => "Tu es un redacteur professionnel. Ameliore le texte fourni selon l'instruction donnee. "
            . "Retourne uniquement le texte ameliore, sans commentaire ni explication.",

        'seo' => "Tu es un expert SEO. A partir du contenu de la page fourni, genere :\n"
            . "1. Un meta title (max 60 caracteres, accrocheur, avec le mot-cle principal)\n"
            . "2. Une meta description (max 155 caracteres, incitative au clic)\n"
            . "3. 5 suggestions de mots-cles pertinents\n\n"
            . "Reponds au format JSON strict : "
            . "{\"meta_title\": \"...\", \"meta_description\": \"...\", \"keywords\": [\"...\"]}\n"
            . "Ne retourne que le JSON, sans markdown ni explication.",

        'alt_text' => "Decris cette image de maniere concise pour un attribut alt HTML. "
            . "Maximum 125 caracteres. Sois descriptif et accessible. "
            . "Retourne uniquement le texte alt, sans guillemets ni formatage.",

        'translate' => "Tu es un traducteur professionnel. Traduis le texte fourni en :target_language. "
            . "Conserve le ton, le style et le formatage HTML si present. "
            . "Retourne uniquement la traduction, sans commentaire.",

        'summarize' => "Tu es un redacteur professionnel. Resume le texte fourni en maximum :max_length caracteres. "
            . "Le resume doit etre clair, informatif et conserver les points essentiels. "
            . "Retourne uniquement le resume.",

    ],

];
```

### Stockage securise des cles API

- Les cles API sont **toujours chiffrees** en base via `encrypt()` / `decrypt()` de Laravel
- Elles sont stockees dans la colonne `settings` (JSON) de la table `plugins` avec le flag `encrypted: true`
- Le fichier `.env` n'est pas utilise pour les cles IA car chaque installation peut avoir sa propre cle configuree via l'admin

---

## 3. AiService (couche d'abstraction)

### Table : ai_usage_logs

```php
Schema::create('ai_usage_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('action');                      // "generate", "improve", "seo", "alt_text", "translate", "summarize"
    $table->string('driver');                      // "openai", "anthropic"
    $table->string('model');                       // "gpt-4o-mini", "claude-sonnet-4-20250514", etc.
    $table->unsignedInteger('prompt_tokens');       // Tokens envoyes
    $table->unsignedInteger('completion_tokens');   // Tokens recus
    $table->unsignedInteger('total_tokens');        // Total
    $table->unsignedInteger('response_time_ms');    // Temps de reponse en ms
    $table->json('metadata')->nullable();           // Contexte additionnel (page_id, block_id, etc.)
    $table->timestamps();

    $table->index(['user_id', 'created_at']);
    $table->index(['action', 'created_at']);
});
```

### AiDriverInterface

```php
<?php

declare(strict_types=1);

namespace AiAssistant\Services\Drivers;

interface AiDriverInterface
{
    /**
     * Generer du texte a partir d'un prompt
     *
     * @param string $systemPrompt Prompt systeme (contexte et instructions)
     * @param string $userMessage  Message utilisateur (prompt principal)
     * @param int    $maxTokens    Nombre maximum de tokens en sortie
     * @param string $model        Identifiant du modele a utiliser
     * @param float  $temperature  Creativite (0.0 a 1.0)
     *
     * @return array{content: string, prompt_tokens: int, completion_tokens: int, total_tokens: int, response_time_ms: int}
     *
     * @throws \RuntimeException Si l'appel API echoue
     */
    public function generateText(
        string $systemPrompt,
        string $userMessage,
        int $maxTokens,
        string $model,
        float $temperature = 0.7,
    ): array;

    /**
     * Ameliorer / reecrire un texte existant
     *
     * @param string $text        Texte original a ameliorer
     * @param string $instruction Instructions d'amelioration
     * @param int    $maxTokens   Nombre maximum de tokens en sortie
     * @param string $model       Identifiant du modele
     * @param float  $temperature Creativite
     *
     * @return array{content: string, prompt_tokens: int, completion_tokens: int, total_tokens: int, response_time_ms: int}
     */
    public function improveText(
        string $text,
        string $instruction,
        int $maxTokens,
        string $model,
        float $temperature = 0.7,
    ): array;

    /**
     * Generer meta title et meta description SEO a partir du contenu
     *
     * @param string $pageContent Contenu de la page (HTML ou texte brut)
     * @param int    $maxTokens   Nombre maximum de tokens
     * @param string $model       Identifiant du modele
     *
     * @return array{content: string, prompt_tokens: int, completion_tokens: int, total_tokens: int, response_time_ms: int}
     */
    public function generateSeoMeta(
        string $pageContent,
        int $maxTokens,
        string $model,
    ): array;

    /**
     * Generer un texte alternatif pour une image via l'API vision
     *
     * @param string $imageUrl  URL de l'image a analyser
     * @param int    $maxTokens Nombre maximum de tokens
     * @param string $model     Identifiant du modele (doit supporter la vision)
     *
     * @return array{content: string, prompt_tokens: int, completion_tokens: int, total_tokens: int, response_time_ms: int}
     */
    public function generateAltText(
        string $imageUrl,
        int $maxTokens,
        string $model,
    ): array;

    /**
     * Traduire du contenu vers une langue cible
     *
     * @param string $text         Texte a traduire
     * @param string $targetLocale Code langue cible (fr, en, es, de, etc.)
     * @param int    $maxTokens    Nombre maximum de tokens
     * @param string $model        Identifiant du modele
     *
     * @return array{content: string, prompt_tokens: int, completion_tokens: int, total_tokens: int, response_time_ms: int}
     */
    public function translateContent(
        string $text,
        string $targetLocale,
        int $maxTokens,
        string $model,
    ): array;

    /**
     * Resumer un texte long
     *
     * @param string $text      Texte a resumer
     * @param int    $maxLength Longueur maximale du resume en caracteres
     * @param int    $maxTokens Nombre maximum de tokens
     * @param string $model     Identifiant du modele
     *
     * @return array{content: string, prompt_tokens: int, completion_tokens: int, total_tokens: int, response_time_ms: int}
     */
    public function summarize(
        string $text,
        int $maxLength,
        int $maxTokens,
        string $model,
    ): array;
}
```

### OpenAiDriver

```php
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
```

### AnthropicDriver

```php
<?php

declare(strict_types=1);

namespace AiAssistant\Services\Drivers;

use Illuminate\Support\Facades\Http;

class AnthropicDriver implements AiDriverInterface
{
    private string $baseUrl;
    private string $apiVersion;
    private int $timeout;

    public function __construct(
        protected string $apiKey,
        ?string $baseUrl = null,
        ?string $apiVersion = null,
        int $timeout = 30,
    ) {
        $this->baseUrl = $baseUrl ?? config('ai-assistant.drivers.anthropic.base_url', 'https://api.anthropic.com/v1');
        $this->apiVersion = $apiVersion ?? config('ai-assistant.drivers.anthropic.api_version', '2023-06-01');
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
        $localeNames = [
            'fr' => 'francais', 'en' => 'anglais', 'es' => 'espagnol',
            'de' => 'allemand', 'it' => 'italien', 'pt' => 'portugais',
            'nl' => 'neerlandais', 'ja' => 'japonais', 'zh' => 'chinois', 'ar' => 'arabe',
        ];
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
            'x-api-key' => $this->apiKey,
            'anthropic-version' => $this->apiVersion,
        ])->timeout($this->timeout)->post($this->baseUrl . '/messages', [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
            'system' => $systemPrompt,
            'messages' => [
                ['role' => 'user', 'content' => $userMessage],
            ],
        ]);

        $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);

        if ($response->failed()) {
            throw new \RuntimeException(
                'Anthropic API error: ' . ($response->json('error.message') ?? $response->body())
            );
        }

        $data = $response->json();

        return [
            'content' => $data['content'][0]['text'] ?? '',
            'prompt_tokens' => $data['usage']['input_tokens'] ?? 0,
            'completion_tokens' => $data['usage']['output_tokens'] ?? 0,
            'total_tokens' => ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0),
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
            'x-api-key' => $this->apiKey,
            'anthropic-version' => $this->apiVersion,
        ])->timeout($this->timeout)->post($this->baseUrl . '/messages', [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'system' => $systemPrompt,
            'messages' => [
                ['role' => 'user', 'content' => [
                    [
                        'type' => 'image',
                        'source' => [
                            'type' => 'url',
                            'url' => $imageUrl,
                        ],
                    ],
                ]],
            ],
        ]);

        $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);

        if ($response->failed()) {
            throw new \RuntimeException(
                'Anthropic Vision API error: ' . ($response->json('error.message') ?? $response->body())
            );
        }

        $data = $response->json();

        return [
            'content' => $data['content'][0]['text'] ?? '',
            'prompt_tokens' => $data['usage']['input_tokens'] ?? 0,
            'completion_tokens' => $data['usage']['output_tokens'] ?? 0,
            'total_tokens' => ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0),
            'response_time_ms' => $responseTimeMs,
        ];
    }
}
```

### AiService (facade / orchestrateur)

```php
<?php

declare(strict_types=1);

namespace AiAssistant\Services;

use AiAssistant\Models\AiUsageLog;
use AiAssistant\Services\Drivers\AiDriverInterface;
use AiAssistant\Services\Drivers\OpenAiDriver;
use AiAssistant\Services\Drivers\AnthropicDriver;
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
     * Generer du texte a partir d'un prompt
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
     * Ameliorer / reecrire un texte existant
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
     * Generer meta title + meta description + mots-cles SEO a partir du contenu
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
     * Generer un texte alternatif pour une image via l'API vision
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
     * Traduire un texte vers une langue cible
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
     * Resumer un contenu long
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

    // --- Methodes internes ---

    protected function resolveDriver(): AiDriverInterface
    {
        $apiKey = decrypt($this->settings['api_key']);

        return match ($this->settings['ai_driver'] ?? 'openai') {
            'anthropic' => new AnthropicDriver($apiKey),
            default     => new OpenAiDriver($apiKey),
        };
    }

    protected function loadSettings(): array
    {
        return Cache::remember('ai-assistant.settings', 300, function () {
            $plugin = CmsPlugin::where('slug', 'ai-assistant')->first();
            return $plugin?->settings ?? [];
        });
    }

    protected function ensureFeatureEnabled(string $feature): void
    {
        $enabled = $this->settings['enabled_features'] ?? [];

        if (!in_array($feature, $enabled, true)) {
            throw new \RuntimeException(
                __('ai-assistant::messages.feature_disabled', ['feature' => $feature])
            );
        }
    }

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
```

### UsageTracker

```php
<?php

declare(strict_types=1);

namespace AiAssistant\Services;

use AiAssistant\Models\AiUsageLog;

class UsageTracker
{
    /**
     * Verifier si l'utilisateur a depasse sa limite mensuelle
     */
    public function hasExceededMonthlyLimit(int $userId, int $monthlyLimit): bool
    {
        return AiUsageLog::monthlyTokensForUser($userId) >= $monthlyLimit;
    }

    /**
     * Verifier si l'utilisateur a depasse sa limite quotidienne
     */
    public function hasExceededDailyLimit(int $userId, int $dailyLimit): bool
    {
        $used = (int) AiUsageLog::where('user_id', $userId)
            ->where('created_at', '>=', now()->startOfDay())
            ->sum('total_tokens');

        return $used >= $dailyLimit;
    }

    /**
     * Tokens restants pour l'utilisateur ce mois-ci
     */
    public function remainingMonthlyTokens(int $userId, int $monthlyLimit): int
    {
        $used = AiUsageLog::monthlyTokensForUser($userId);
        return max(0, $monthlyLimit - $used);
    }

    /**
     * Estimation du cout avant generation
     * Retourne une estimation en tokens et en cout USD approximatif
     */
    public function estimateCost(string $inputText, string $model): array
    {
        // Estimation grossiere : 1 token ~ 4 caracteres en anglais, ~3 en francais
        $estimatedInputTokens = (int) ceil(mb_strlen($inputText) / 3);
        $estimatedOutputTokens = min($estimatedInputTokens, 1024);

        // Prix approximatifs par million de tokens (input / output)
        $pricing = [
            'gpt-4o' => ['input' => 2.50, 'output' => 10.00],
            'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
            'claude-sonnet-4-20250514' => ['input' => 3.00, 'output' => 15.00],
            'claude-haiku-235-20241022' => ['input' => 0.80, 'output' => 4.00],
        ];

        $modelPricing = $pricing[$model] ?? ['input' => 1.00, 'output' => 3.00];
        $estimatedCost = ($estimatedInputTokens * $modelPricing['input'] / 1_000_000)
            + ($estimatedOutputTokens * $modelPricing['output'] / 1_000_000);

        return [
            'estimated_input_tokens' => $estimatedInputTokens,
            'estimated_output_tokens' => $estimatedOutputTokens,
            'estimated_total_tokens' => $estimatedInputTokens + $estimatedOutputTokens,
            'estimated_cost_usd' => round($estimatedCost, 6),
        ];
    }

    /**
     * Statistiques d'utilisation pour le dashboard admin
     */
    public function getStats(string $period = 'month'): array
    {
        $since = match ($period) {
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $logs = AiUsageLog::where('created_at', '>=', $since);

        return [
            'total_tokens' => (int) $logs->sum('total_tokens'),
            'total_requests' => $logs->count(),
            'avg_response_time_ms' => (int) $logs->avg('response_time_ms'),
            'by_action' => $logs->clone()
                ->selectRaw('action, COUNT(*) as count, SUM(total_tokens) as tokens')
                ->groupBy('action')
                ->get()
                ->keyBy('action')
                ->toArray(),
            'by_user' => $logs->clone()
                ->selectRaw('user_id, COUNT(*) as count, SUM(total_tokens) as tokens')
                ->groupBy('user_id')
                ->with('user:id,name')
                ->get()
                ->toArray(),
        ];
    }
}
```

---

## 4. Fonctionnalites

### 4.1 Generation de contenu

| Fonctionnalite | Methode AiService | Description |
|----------------|-------------------|-------------|
| Generer un article | `generateText()` | A partir d'un titre/sujet, genere un texte complet |
| Completer un texte | `generateText()` | Avec le contenu existant en contexte, genere la suite |
| Reecrire / ameliorer | `improveText()` | Change le ton, la longueur ou la clarte d'un texte |
| Generer des blocs | `generateText()` | A partir d'un sujet, genere une structure JSON de blocs page builder |

**Exemple de generation de blocs pour le page builder :**

```php
// Le prompt systeme specifique pour la generation de blocs
$prompt = "Genere une structure de blocs pour une page sur le sujet donne. "
    . "Retourne un JSON avec un tableau de blocs au format : "
    . "[{\"type\": \"heading\", \"content\": \"...\"}, {\"type\": \"text\", \"content\": \"...\"}]";

$result = $aiService->generateText($prompt, [
    'page_title' => 'Page de presentation entreprise',
]);
// $result['text'] contient le JSON des blocs a inserer dans le builder
```

### 4.2 SEO

| Fonctionnalite | Methode AiService | Description |
|----------------|-------------------|-------------|
| Generer meta title | `generateSeoMeta()` | Meta title optimise (max 60 caracteres) |
| Generer meta description | `generateSeoMeta()` | Meta description incitative (max 155 caracteres) |
| Suggerer des mots-cles | `generateSeoMeta()` | 5 mots-cles pertinents pour le contenu |
| Analyser le score SEO | Futur (V2) | Score SEO basique avec recommandations |

**Exemple de reponse SEO :**

```json
{
    "meta_title": "ArtisanCMS : le CMS moderne pour creer votre site",
    "meta_description": "Decouvrez ArtisanCMS, le CMS nouvelle generation avec page builder drag & drop. Creez votre site sans code en quelques minutes.",
    "keywords": ["CMS moderne", "page builder", "site web", "no-code", "drag and drop"],
    "tokens_used": 130
}
```

### 4.3 Images

| Fonctionnalite | Methode AiService | Description |
|----------------|-------------------|-------------|
| Generer alt text | `generateAltText()` | Analyse l'image via l'API vision et genere un alt text accessible (max 125 car.) |
| Suggerer des legendes | Futur (V2) | Generer une legende descriptive pour la mediatheque |

**Generation en masse via la commande artisan :**

```bash
# Generer les alt text manquants pour toutes les images de la mediatheque
php artisan ai:bulk-generate --type=alt-text --missing-only

# Generer les meta SEO pour toutes les pages publiees
php artisan ai:bulk-generate --type=seo --status=published
```

### 4.4 Traduction (preparation V2)

| Fonctionnalite | Methode AiService | Description |
|----------------|-------------------|-------------|
| Traduire une page | `translateContent()` | Traduit le contenu d'une page vers une autre langue |
| Langues supportees | - | fr, en, es, de, it, pt, nl, ja, zh, ar |

> **Note V2 :** La traduction sera pleinement integree avec le systeme i18n du Blueprint 14 (multilingue). En V1, elle fonctionne comme un outil ponctuel de traduction texte-a-texte.

---

## 5. API Endpoints

```
POST /api/ai/generate     -- Generer du texte a partir d'un prompt
POST /api/ai/improve      -- Ameliorer du texte existant
POST /api/ai/seo          -- Generer meta title, description et mots-cles
POST /api/ai/alt-text     -- Generer alt text pour une image (vision API)
POST /api/ai/translate    -- Traduire du contenu vers une langue cible
POST /api/ai/summarize    -- Resumer un texte long
GET  /api/ai/usage        -- Utilisation actuelle de l'utilisateur connecte
GET  /api/ai/estimate     -- Estimation du cout avant generation
```

### Routes

```php
<?php

// routes/api.php

use AiAssistant\Http\Controllers\AiController;
use AiAssistant\Http\Controllers\AiSettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'ai.rate_limit'])->prefix('api/ai')->group(function () {

    // Actions IA
    Route::post('/generate', [AiController::class, 'generate']);
    Route::post('/improve', [AiController::class, 'improve']);
    Route::post('/seo', [AiController::class, 'generateSeo']);
    Route::post('/alt-text', [AiController::class, 'generateAltText']);
    Route::post('/translate', [AiController::class, 'translate']);
    Route::post('/summarize', [AiController::class, 'summarize']);

    // Informations
    Route::get('/usage', [AiController::class, 'usage']);
    Route::get('/estimate', [AiController::class, 'estimate']);

});

// Routes admin (parametres du plugin)
Route::middleware(['web', 'auth', 'admin'])->prefix('admin/ai-assistant')->group(function () {
    Route::get('/settings', [AiSettingsController::class, 'index'])->name('admin.ai-assistant.settings');
    Route::put('/settings', [AiSettingsController::class, 'update'])->name('admin.ai-assistant.settings.update');
    Route::get('/usage', [AiSettingsController::class, 'usage'])->name('admin.ai-assistant.usage');
});
```

### AiController

```php
<?php

declare(strict_types=1);

namespace AiAssistant\Http\Controllers;

use AiAssistant\Http\Requests\GenerateTextRequest;
use AiAssistant\Http\Requests\ImproveTextRequest;
use AiAssistant\Http\Requests\GenerateSeoRequest;
use AiAssistant\Http\Requests\GenerateAltTextRequest;
use AiAssistant\Services\AiService;
use AiAssistant\Services\UsageTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController
{
    public function __construct(
        protected AiService $aiService,
        protected UsageTracker $usageTracker,
    ) {}

    /**
     * POST /api/ai/generate
     * Generer du contenu a partir d'un prompt
     */
    public function generate(GenerateTextRequest $request): JsonResponse
    {
        $result = $this->aiService->generateText(
            prompt: $request->validated('prompt'),
            context: $request->validated('context', []),
            maxTokens: $request->validated('max_tokens', 1024),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/improve
     * Ameliorer un texte existant selon une instruction
     */
    public function improve(ImproveTextRequest $request): JsonResponse
    {
        $result = $this->aiService->improveText(
            text: $request->validated('text'),
            instruction: $request->validated('instruction'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/seo
     * Generer meta title + description + mots-cles
     */
    public function generateSeo(GenerateSeoRequest $request): JsonResponse
    {
        $result = $this->aiService->generateSeoMeta(
            pageContent: $request->validated('page_content'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/alt-text
     * Generer un alt text pour une image via l'API vision
     */
    public function generateAltText(GenerateAltTextRequest $request): JsonResponse
    {
        $result = $this->aiService->generateAltText(
            imageUrl: $request->validated('image_url'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/translate
     * Traduire un texte vers une langue cible
     */
    public function translate(Request $request): JsonResponse
    {
        $request->validate([
            'text' => ['required', 'string', 'max:10000'],
            'target_locale' => ['required', 'string', 'size:2'],
        ]);

        $result = $this->aiService->translateContent(
            text: $request->validated('text'),
            targetLocale: $request->validated('target_locale'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/summarize
     * Resumer un texte long
     */
    public function summarize(Request $request): JsonResponse
    {
        $request->validate([
            'text' => ['required', 'string', 'max:10000'],
            'max_length' => ['sometimes', 'integer', 'min:50', 'max:1000'],
        ]);

        $result = $this->aiService->summarize(
            text: $request->validated('text'),
            maxLength: $request->validated('max_length', 200),
        );

        return response()->json($result);
    }

    /**
     * GET /api/ai/usage
     * Retourne l'utilisation actuelle de l'utilisateur connecte
     */
    public function usage(): JsonResponse
    {
        $userId = auth()->id();
        $monthlyLimit = (int) ($this->aiService->settings['monthly_token_limit'] ?? 500000);
        $dailyLimit = (int) ($this->aiService->settings['per_user_daily_token_limit'] ?? 50000);

        return response()->json([
            'tokens_used_month' => AiUsageLog::monthlyTokensForUser($userId),
            'tokens_limit_month' => $monthlyLimit,
            'tokens_remaining_month' => $this->usageTracker->remainingMonthlyTokens($userId, $monthlyLimit),
            'tokens_used_today' => (int) AiUsageLog::where('user_id', $userId)
                ->where('created_at', '>=', now()->startOfDay())
                ->sum('total_tokens'),
            'tokens_limit_today' => $dailyLimit,
        ]);
    }

    /**
     * GET /api/ai/estimate
     * Estimation du cout avant generation
     */
    public function estimate(Request $request): JsonResponse
    {
        $request->validate([
            'text' => ['required', 'string'],
        ]);

        $model = $this->aiService->settings['model'] ?? 'gpt-4o-mini';

        return response()->json(
            $this->usageTracker->estimateCost($request->input('text'), $model)
        );
    }
}
```

### Form Requests (Validation)

```php
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
```

```php
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
```

```php
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
```

```php
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
```

---

## 6. React Integration

### AiButton.tsx

Bouton contextuel affiche dans la toolbar des blocs texte et heading. Au clic, il ouvre un popover avec des actions rapides d'amelioration.

```tsx
// resources/js/components/AiButton.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Sparkles, Loader2 } from 'lucide-react';
import { AiSuggestions } from './AiSuggestions';
import { useCmsAi } from '../hooks/use-cms-ai';

interface AiButtonProps {
    /** Identifiant unique du bloc dans le page builder */
    blockId: string;
    /** Type de bloc (text, heading) */
    blockType: 'text' | 'heading';
    /** Contenu actuel du bloc */
    currentContent: string;
    /** Callback appele quand l'utilisateur applique le texte genere */
    onApply: (newContent: string) => void;
}

export function AiButton({ blockId, blockType, currentContent, onApply }: AiButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { improve, isLoading, result, error, reset } = useCmsAi();

    const quickActions = [
        {
            label: 'Ameliorer le style',
            action: () => improve(currentContent, 'Ameliore le style et la clarte'),
        },
        {
            label: 'Plus concis',
            action: () => improve(currentContent, 'Rends ce texte plus concis'),
        },
        {
            label: 'Plus detaille',
            action: () => improve(currentContent, 'Developpe et enrichis ce texte'),
        },
        {
            label: 'Ton professionnel',
            action: () => improve(currentContent, 'Reformule avec un ton professionnel'),
        },
        {
            label: 'Corriger',
            action: () => improve(currentContent, "Corrige les fautes de grammaire et d'orthographe"),
        },
    ];

    const handleApply = (text: string) => {
        onApply(text);
        setIsOpen(false);
        reset();
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    title="Assistant IA"
                >
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs">AI</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                    <h4 className="font-medium text-sm">Assistant IA</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Actions rapides pour ce bloc
                    </p>
                </div>

                <div className="p-2 space-y-1">
                    {quickActions.map((qa) => (
                        <button
                            key={qa.label}
                            onClick={qa.action}
                            disabled={isLoading}
                            className="w-full text-left px-3 py-2 text-sm rounded-md
                                       hover:bg-purple-50 hover:text-purple-700
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-colors"
                        >
                            {qa.label}
                        </button>
                    ))}
                </div>

                {(result || isLoading || error) && (
                    <div className="border-t p-3">
                        <AiSuggestions
                            result={result}
                            isLoading={isLoading}
                            error={error}
                            onApply={handleApply}
                            onRetry={() => {}}
                        />
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
```

### AiPanel.tsx

Panneau lateral complet dans le sidebar du page builder. Il permet de choisir une action (generer, ameliorer, SEO, traduire, resumer), de saisir un prompt et d'appliquer le resultat au bloc selectionne.

```tsx
// resources/js/components/AiPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Sparkles, Send, RotateCcw, Loader2 } from 'lucide-react';
import { AiSuggestions } from './AiSuggestions';
import { useCmsAi } from '../hooks/use-cms-ai';
import { useAiUsage } from '../hooks/use-ai-usage';
import { useBuilder } from '@/packages/page-builder/hooks/use-builder';

type AiAction = 'generate' | 'improve' | 'seo' | 'translate' | 'summarize';

export function AiPanel() {
    const [prompt, setPrompt] = useState('');
    const [action, setAction] = useState<AiAction>('generate');
    const [targetLocale, setTargetLocale] = useState('en');

    const { selectedBlockId, getBlockContent, updateBlockContent, pageContent } = useBuilder();
    const {
        generate, improve, generateSeo, translate, summarize,
        isLoading, result, error, reset,
    } = useCmsAi();
    const { tokensUsedMonth, tokensLimitMonth, tokensRemainingMonth } = useAiUsage();

    const currentContent = selectedBlockId ? getBlockContent(selectedBlockId) : '';

    const handleSubmit = async () => {
        if (!prompt.trim() && action === 'generate') return;

        switch (action) {
            case 'generate':
                await generate(prompt, {
                    page_title: pageContent.settings?.title ?? '',
                    block_type: selectedBlockId ? 'text' : undefined,
                    existing_content: currentContent,
                });
                break;
            case 'improve':
                await improve(currentContent, prompt || 'Ameliore ce texte');
                break;
            case 'seo':
                await generateSeo(JSON.stringify(pageContent));
                break;
            case 'translate':
                await translate(currentContent, targetLocale);
                break;
            case 'summarize':
                await summarize(currentContent);
                break;
        }
    };

    const handleApply = (text: string) => {
        if (selectedBlockId) {
            updateBlockContent(selectedBlockId, text);
        }
        reset();
        setPrompt('');
    };

    const usagePercent = tokensLimitMonth > 0
        ? Math.round((tokensUsedMonth / tokensLimitMonth) * 100)
        : 0;

    return (
        <div className="flex flex-col h-full">
            {/* En-tete */}
            <div className="p-4 border-b flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Assistant IA</h3>
            </div>

            {/* Selecteur d'action */}
            <div className="p-4 space-y-3">
                <Select value={action} onValueChange={(v) => setAction(v as AiAction)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="generate">Generer du contenu</SelectItem>
                        <SelectItem value="improve">Ameliorer le texte</SelectItem>
                        <SelectItem value="seo">Generer meta SEO</SelectItem>
                        <SelectItem value="translate">Traduire</SelectItem>
                        <SelectItem value="summarize">Resumer</SelectItem>
                    </SelectContent>
                </Select>

                {/* Champ de langue cible pour la traduction */}
                {action === 'translate' && (
                    <Select value={targetLocale} onValueChange={setTargetLocale}>
                        <SelectTrigger>
                            <SelectValue placeholder="Langue cible" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">Anglais</SelectItem>
                            <SelectItem value="fr">Francais</SelectItem>
                            <SelectItem value="es">Espagnol</SelectItem>
                            <SelectItem value="de">Allemand</SelectItem>
                            <SelectItem value="it">Italien</SelectItem>
                            <SelectItem value="pt">Portugais</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {/* Prompt */}
                <div className="space-y-2">
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                            action === 'generate'
                                ? 'Decrivez le contenu que vous souhaitez...'
                                : action === 'improve'
                                  ? "Instructions d'amelioration (optionnel)..."
                                  : 'Instructions additionnelles (optionnel)...'
                        }
                        rows={3}
                        className="resize-none"
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || (action === 'generate' && !prompt.trim())}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {isLoading ? 'Generation...' : 'Envoyer'}
                        </Button>
                        {result && (
                            <Button variant="outline" size="icon" onClick={reset}>
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Resultats */}
            <div className="flex-1 overflow-y-auto p-4 border-t">
                <AiSuggestions
                    result={result}
                    isLoading={isLoading}
                    error={error}
                    onApply={handleApply}
                    onRetry={handleSubmit}
                />
            </div>

            {/* Barre d'utilisation */}
            <div className="p-3 border-t bg-muted/30">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Utilisation ce mois</span>
                    <span>{tokensUsedMonth.toLocaleString()} / {tokensLimitMonth.toLocaleString()} tokens</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all ${
                            usagePercent > 90 ? 'bg-red-500' :
                            usagePercent > 70 ? 'bg-amber-500' :
                            'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
```

### AiSuggestions.tsx

Composant d'affichage des resultats IA : texte genere, meta SEO, ou etat de chargement/erreur. Propose les actions "Appliquer", "Copier" et "Reessayer".

```tsx
// resources/js/components/AiSuggestions.tsx
import { Button } from '@/components/ui/button';
import { Check, Copy, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AiResult {
    text?: string;
    summary?: string;
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
    alt_text?: string;
    tokens_used?: number;
}

interface AiSuggestionsProps {
    result: AiResult | null;
    isLoading: boolean;
    error: string | null;
    onApply: (text: string) => void;
    onRetry: () => void;
}

export function AiSuggestions({ result, isLoading, error, onApply, onRetry }: AiSuggestionsProps) {
    const [copied, setCopied] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">L'IA travaille...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm text-red-700">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetry}
                            className="mt-2 text-red-600 hover:text-red-700"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reessayer
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!result) return null;

    // Resultat SEO (meta title + description + keywords)
    if (result.meta_title || result.meta_description) {
        return (
            <div className="space-y-3">
                {result.meta_title && (
                    <div className="rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Meta Title</p>
                        <p className="text-sm">{result.meta_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {result.meta_title.length}/60 caracteres
                        </p>
                    </div>
                )}
                {result.meta_description && (
                    <div className="rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Meta Description</p>
                        <p className="text-sm">{result.meta_description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {result.meta_description.length}/155 caracteres
                        </p>
                    </div>
                )}
                {result.keywords && result.keywords.length > 0 && (
                    <div className="rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Mots-cles suggeres</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {result.keywords.map((kw) => (
                                <span key={kw} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                <Button onClick={() => onApply(JSON.stringify(result))} className="w-full" size="sm">
                    <Check className="h-3 w-3 mr-1" />
                    Appliquer les meta SEO
                </Button>
                {result.tokens_used && (
                    <p className="text-xs text-muted-foreground text-center">
                        {result.tokens_used} tokens utilises
                    </p>
                )}
            </div>
        );
    }

    // Resultat texte (generate, improve, translate, summarize, alt_text)
    const content = result.text ?? result.summary ?? result.alt_text ?? '';

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-3">
            <div className="rounded-lg border bg-purple-50/50 p-3">
                <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => onApply(content)} className="flex-1" size="sm">
                    <Check className="h-3 w-3 mr-1" />
                    Appliquer
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-3 w-3" />
                </Button>
            </div>
            {result.tokens_used && (
                <p className="text-xs text-muted-foreground text-center">
                    {result.tokens_used} tokens utilises
                </p>
            )}
        </div>
    );
}
```

### Hook : useCmsAi()

Hook React principal qui encapsule tous les appels API IA. Gere le chargement, les erreurs et le streaming futur.

```typescript
// resources/js/hooks/use-cms-ai.ts
import { useState, useCallback } from 'react';
import axios from 'axios';

interface AiResult {
    text?: string;
    summary?: string;
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
    alt_text?: string;
    tokens_used?: number;
}

interface UseCmsAiReturn {
    /** Generer du texte a partir d'un prompt */
    generate: (prompt: string, context?: Record<string, string | undefined>) => Promise<void>;
    /** Ameliorer un texte existant */
    improve: (text: string, instruction: string) => Promise<void>;
    /** Generer meta title + description + keywords */
    generateSeo: (pageContent: string) => Promise<void>;
    /** Generer alt text pour une image */
    generateAltText: (imageUrl: string) => Promise<void>;
    /** Traduire un texte */
    translate: (text: string, targetLocale: string) => Promise<void>;
    /** Resumer un texte */
    summarize: (text: string, maxLength?: number) => Promise<void>;
    /** Estimation du cout avant generation */
    estimate: (text: string) => Promise<{ estimated_cost_usd: number; estimated_total_tokens: number }>;
    /** Etat de chargement */
    isLoading: boolean;
    /** Resultat de la derniere requete */
    result: AiResult | null;
    /** Message d'erreur eventuel */
    error: string | null;
    /** Reinitialiser le resultat et l'erreur */
    reset: () => void;
}

export function useCmsAi(): UseCmsAiReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AiResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const request = useCallback(async (url: string, data: Record<string, unknown>) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post(url, data);
            setResult(response.data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                if (status === 429) {
                    setError(
                        err.response?.data?.error
                            ?? 'Limite de requetes atteinte. Reessayez plus tard.'
                    );
                } else if (status === 403) {
                    setError("Vous n'avez pas la permission d'utiliser l'assistant IA.");
                } else {
                    setError(err.response?.data?.error ?? 'Une erreur est survenue.');
                }
            } else {
                setError('Erreur de connexion. Verifiez votre connexion internet.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generate = useCallback(
        (prompt: string, context?: Record<string, string | undefined>) =>
            request('/api/ai/generate', { prompt, context }),
        [request],
    );

    const improve = useCallback(
        (text: string, instruction: string) =>
            request('/api/ai/improve', { text, instruction }),
        [request],
    );

    const generateSeo = useCallback(
        (pageContent: string) =>
            request('/api/ai/seo', { page_content: pageContent }),
        [request],
    );

    const generateAltText = useCallback(
        (imageUrl: string) =>
            request('/api/ai/alt-text', { image_url: imageUrl }),
        [request],
    );

    const translate = useCallback(
        (text: string, targetLocale: string) =>
            request('/api/ai/translate', { text, target_locale: targetLocale }),
        [request],
    );

    const summarize = useCallback(
        (text: string, maxLength?: number) =>
            request('/api/ai/summarize', { text, max_length: maxLength }),
        [request],
    );

    const estimate = useCallback(
        async (text: string) => {
            const response = await axios.get('/api/ai/estimate', { params: { text } });
            return response.data;
        },
        [],
    );

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        generate,
        improve,
        generateSeo,
        generateAltText,
        translate,
        summarize,
        estimate,
        isLoading,
        result,
        error,
        reset,
    };
}
```

### Hook : useAiUsage()

```typescript
// resources/js/hooks/use-ai-usage.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface AiUsage {
    tokensUsedMonth: number;
    tokensLimitMonth: number;
    tokensRemainingMonth: number;
    tokensUsedToday: number;
    tokensLimitToday: number;
}

export function useAiUsage(): AiUsage {
    const [usage, setUsage] = useState<AiUsage>({
        tokensUsedMonth: 0,
        tokensLimitMonth: 500000,
        tokensRemainingMonth: 500000,
        tokensUsedToday: 0,
        tokensLimitToday: 50000,
    });

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const response = await axios.get('/api/ai/usage');
                setUsage({
                    tokensUsedMonth: response.data.tokens_used_month,
                    tokensLimitMonth: response.data.tokens_limit_month,
                    tokensRemainingMonth: response.data.tokens_remaining_month,
                    tokensUsedToday: response.data.tokens_used_today,
                    tokensLimitToday: response.data.tokens_limit_today,
                });
            } catch {
                // Silently fail - usage info is non-critical
            }
        };

        fetchUsage();

        // Rafraichir toutes les 60 secondes
        const interval = setInterval(fetchUsage, 60000);
        return () => clearInterval(interval);
    }, []);

    return usage;
}
```

### Streaming responses (preparation future)

Pour une UX temps reel, les reponses IA pourront etre streamees via Server-Sent Events :

```typescript
// Futur : streaming via EventSource
// Le endpoint retournera un stream SSE et le hook useCmsAi()
// accumulera les tokens au fur et a mesure de leur reception.
//
// POST /api/ai/generate?stream=1
// Response: text/event-stream
//
// data: {"token": "Bonjour"}
// data: {"token": " et"}
// data: {"token": " bienvenue"}
// data: {"done": true, "tokens_used": 45}
```

### Integration dans le Page Builder

```
+-------------------------------------------------------------------+
|  Page Builder                                                      |
|                                                                    |
|  +----------------------------------+  +----------------------+   |
|  |          Canvas                  |  |     Sidebar          |   |
|  |                                  |  |                      |   |
|  |  +----------------------------+  |  |  [Blocs] [Props]     |   |
|  |  | [B] [I] [U] ... [* AI]    |  |  |  [Styles] [* IA]    |   |
|  |  | -------------------------- |  |  |                      |   |
|  |  | Bloc heading selectionne   |  |  |  Quand onglet IA :  |   |
|  |  +----------------------------+  |  |                      |   |
|  |                                  |  |  +------------------+ |   |
|  |  +----------------------------+  |  |  | AiPanel.tsx      | |   |
|  |  | [B] [I] [U] ... [* AI]    |  |  |  |                  | |   |
|  |  | -------------------------- |  |  |  | [Action v]       | |   |
|  |  | Bloc texte avec contenu    |  |  |  | [Prompt ...]     | |   |
|  |  +----------------------------+  |  |  | [Envoyer]        | |   |
|  |                                  |  |  |                  | |   |
|  |                                  |  |  | +==============+ | |   |
|  |                                  |  |  | | Resultat     | | |   |
|  |                                  |  |  | | [Appliquer]  | | |   |
|  |                                  |  |  | +==============+ | |   |
|  |                                  |  |  |                  | |   |
|  |                                  |  |  | ####----- 45%    | |   |
|  |                                  |  |  +------------------+ |   |
|  +----------------------------------+  +----------------------+   |
+-------------------------------------------------------------------+
```

**Deux points d'entree :**

1. **AiButton** dans la toolbar du bloc : actions rapides contextuelles (ameliorer, raccourcir, corriger) appliquees directement au contenu du bloc selectionne.

2. **AiPanel** dans le sidebar : panneau complet avec choix d'action, prompt libre, traduction, SEO. L'onglet est ajoute au sidebar via le filtre `builder.sidebar_tabs`.

---

## 7. Rate limiting et couts

### Middleware AiRateLimiter

```php
<?php

declare(strict_types=1);

namespace AiAssistant\Http\Middleware;

use AiAssistant\Models\AiUsageLog;
use AiAssistant\Services\UsageTracker;
use App\Models\CmsPlugin;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AiRateLimiter
{
    public function __construct(
        protected UsageTracker $usageTracker,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->user()->id;

        // 1. Rate limiting classique : max N requetes par minute par utilisateur
        $rateLimitKey = "ai-assistant:{$userId}";
        $maxPerMinute = config('ai-assistant.limits.requests_per_minute', 20);

        if (RateLimiter::tooManyAttempts($rateLimitKey, $maxPerMinute)) {
            return response()->json([
                'error' => __('ai-assistant::messages.rate_limit_exceeded'),
                'retry_after' => RateLimiter::availableIn($rateLimitKey),
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 60);

        // 2. Verification de la limite quotidienne par utilisateur
        $settings = CmsPlugin::where('slug', 'ai-assistant')->first()?->settings ?? [];
        $dailyLimit = (int) ($settings['per_user_daily_token_limit'] ?? 50000);

        if ($this->usageTracker->hasExceededDailyLimit($userId, $dailyLimit)) {
            return response()->json([
                'error' => __('ai-assistant::messages.daily_limit_exceeded'),
                'tokens_used_today' => (int) AiUsageLog::where('user_id', $userId)
                    ->where('created_at', '>=', now()->startOfDay())
                    ->sum('total_tokens'),
                'tokens_limit_today' => $dailyLimit,
            ], 429);
        }

        // 3. Verification de la limite mensuelle globale
        $monthlyLimit = (int) ($settings['monthly_token_limit'] ?? 500000);

        if ($this->usageTracker->hasExceededMonthlyLimit($userId, $monthlyLimit)) {
            return response()->json([
                'error' => __('ai-assistant::messages.monthly_limit_exceeded'),
                'tokens_used' => AiUsageLog::monthlyTokensForUser($userId),
                'tokens_limit' => $monthlyLimit,
            ], 429);
        }

        return $next($request);
    }
}
```

### Estimation des couts avant generation

Avant chaque generation, le frontend peut appeler `GET /api/ai/estimate` pour afficher une estimation du nombre de tokens et du cout approximatif :

```tsx
// Dans le composant AiPanel, avant l'envoi :
const handleEstimate = async () => {
    const estimation = await estimate(prompt);
    // Afficher : "Environ 350 tokens (~$0.0002)"
};
```

### Limites configurables

| Limite | Defaut | Description |
|--------|--------|-------------|
| `requests_per_minute` | 20 | Requetes API max par minute par utilisateur |
| `daily_tokens_per_user` | 50 000 | Tokens max par utilisateur par jour |
| `monthly_tokens` | 500 000 | Tokens max global par mois |
| `max_input_length` | 10 000 | Caracteres max envoyes a l'API |
| `max_tokens_per_request` | 4 096 | Tokens max de sortie par requete |

---

## 8. Hooks CMS

Le plugin AI Assistant s'integre dans le CMS via le systeme de hooks et filtres defini dans le Blueprint 02 :

```php
// --- Hooks declenches par le plugin ---

// Avant chaque generation IA (permet de logger, filtrer, annuler)
CMS::fireHook('ai.before_generate', $action, $prompt, $context);

// Apres chaque generation IA (permet de post-traiter, logger, notifier)
CMS::fireHook('ai.after_generate', $action, $result);


// --- Filtres appliques par le plugin ---

// Modifier le system prompt avant envoi a l'API
// Permet aux themes/plugins de personnaliser le ton, le style, les contraintes
$systemPrompt = CMS::applyFilter('ai.prompt_template', $systemPrompt, $action, $context);

// Exemple : un theme "e-commerce" pourrait ajouter du contexte produit
CMS::filter('ai.prompt_template', function (string $prompt, string $action, array $context) {
    if ($action === 'generate' && ($context['block_type'] ?? '') === 'product-description') {
        $prompt .= "\nTu rediges pour une boutique en ligne. Sois persuasif et mets en avant les avantages produit.";
    }
    return $prompt;
});


// --- Integration dans l'admin et le builder ---

// Ajout de l'entree dans le sidebar admin
CMS::hook('admin_sidebar', function (&$items) {
    $items[] = [
        'label' => __('ai-assistant::messages.sidebar_label'),
        'icon' => 'sparkles',
        'url' => '/admin/ai-assistant',
        'children' => [
            ['label' => __('ai-assistant::messages.settings'), 'url' => '/admin/ai-assistant/settings'],
            ['label' => __('ai-assistant::messages.usage'), 'url' => '/admin/ai-assistant/usage'],
        ],
    ];
});

// Bouton AI dans la toolbar des blocs texte et heading
CMS::filter('builder.block_toolbar', function (array $items, string $blockType) {
    if (in_array($blockType, ['text', 'heading'], true)) {
        $items[] = [
            'type' => 'ai-button',
            'component' => 'AiButton',
            'icon' => 'sparkles',
            'label' => __('ai-assistant::messages.ai_button'),
        ];
    }
    return $items;
});

// Onglet AI dans le sidebar du builder
CMS::filter('builder.sidebar_tabs', function (array $tabs) {
    $tabs[] = [
        'id' => 'ai',
        'label' => 'IA',
        'icon' => 'sparkles',
        'component' => 'AiPanel',
    ];
    return $tabs;
});
```

### Service Provider

```php
<?php

declare(strict_types=1);

namespace AiAssistant;

use AiAssistant\Services\AiService;
use AiAssistant\Services\UsageTracker;
use AiAssistant\Http\Middleware\AiRateLimiter;
use App\CMS\Facades\CMS;
use Illuminate\Support\ServiceProvider;

class AiAssistantServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/ai-assistant.php', 'ai-assistant');

        $this->app->singleton(AiService::class);
        $this->app->singleton(UsageTracker::class);
    }

    public function boot(): void
    {
        // Migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Traductions
        $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'ai-assistant');

        // Middleware
        $this->app['router']->aliasMiddleware('ai.rate_limit', AiRateLimiter::class);

        // Commandes artisan
        if ($this->app->runningInConsole()) {
            $this->commands([
                \AiAssistant\Commands\AiBulkGenerateCommand::class,
            ]);
        }

        // Hook : sidebar admin
        CMS::hook('admin_sidebar', function (&$items) {
            $items[] = [
                'label' => __('ai-assistant::messages.sidebar_label'),
                'icon' => 'sparkles',
                'url' => '/admin/ai-assistant',
                'children' => [
                    ['label' => __('ai-assistant::messages.settings'), 'url' => '/admin/ai-assistant/settings'],
                    ['label' => __('ai-assistant::messages.usage'), 'url' => '/admin/ai-assistant/usage'],
                ],
            ];
        });

        // Filtre : bouton AI dans la toolbar des blocs texte
        CMS::filter('builder.block_toolbar', function (array $toolbarItems, string $blockType) {
            if (in_array($blockType, ['text', 'heading'], true)) {
                $toolbarItems[] = [
                    'type' => 'ai-button',
                    'component' => 'AiButton',
                    'label' => __('ai-assistant::messages.ai_button'),
                    'icon' => 'sparkles',
                ];
            }
            return $toolbarItems;
        });

        // Filtre : onglet AI dans le sidebar du builder
        CMS::filter('builder.sidebar_tabs', function (array $tabs) {
            $tabs[] = [
                'id' => 'ai',
                'label' => 'IA',
                'icon' => 'sparkles',
                'component' => 'AiPanel',
            ];
            return $tabs;
        });
    }
}
```

### Commande de generation en masse

```php
<?php

declare(strict_types=1);

namespace AiAssistant\Commands;

use AiAssistant\Services\AiService;
use App\Models\Media;
use App\Models\Page;
use Illuminate\Console\Command;

class AiBulkGenerateCommand extends Command
{
    protected $signature = 'ai:bulk-generate
        {--type=alt-text : Type de generation (alt-text, seo)}
        {--missing-only : Ne traiter que les entites sans donnees}
        {--status=published : Statut des pages pour le SEO}
        {--limit=50 : Nombre maximum d\'elements a traiter}';

    protected $description = 'Generation en masse de contenu IA (alt text, meta SEO)';

    public function __construct(
        protected AiService $aiService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $type = $this->option('type');
        $limit = (int) $this->option('limit');

        return match ($type) {
            'alt-text' => $this->generateAltTexts($limit),
            'seo' => $this->generateSeoMetas($limit),
            default => $this->invalidType($type),
        };
    }

    protected function generateAltTexts(int $limit): int
    {
        $query = Media::where('type', 'image');

        if ($this->option('missing-only')) {
            $query->whereNull('alt_text')->orWhere('alt_text', '');
        }

        $images = $query->limit($limit)->get();

        $this->info("Traitement de {$images->count()} images...");
        $bar = $this->output->createProgressBar($images->count());

        $success = 0;
        foreach ($images as $image) {
            try {
                $result = $this->aiService->generateAltText($image->url);
                $image->update(['alt_text' => $result['alt_text']]);
                $success++;
            } catch (\Throwable $e) {
                $this->warn("Erreur pour {$image->filename}: {$e->getMessage()}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$success}/{$images->count()} alt texts generes.");

        return self::SUCCESS;
    }

    protected function generateSeoMetas(int $limit): int
    {
        $status = $this->option('status');
        $query = Page::where('status', $status);

        if ($this->option('missing-only')) {
            $query->where(function ($q) {
                $q->whereNull('meta_title')->orWhere('meta_title', '');
            });
        }

        $pages = $query->limit($limit)->get();

        $this->info("Traitement de {$pages->count()} pages...");
        $bar = $this->output->createProgressBar($pages->count());

        $success = 0;
        foreach ($pages as $page) {
            try {
                $content = is_array($page->content) ? json_encode($page->content) : $page->content;
                $result = $this->aiService->generateSeoMeta($content);
                $page->update([
                    'meta_title' => $result['meta_title'],
                    'meta_description' => $result['meta_description'],
                ]);
                $success++;
            } catch (\Throwable $e) {
                $this->warn("Erreur pour {$page->title}: {$e->getMessage()}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$success}/{$pages->count()} meta SEO generes.");

        return self::SUCCESS;
    }

    protected function invalidType(string $type): int
    {
        $this->error("Type inconnu : {$type}. Types disponibles : alt-text, seo");
        return self::FAILURE;
    }
}
```

---

## 9. Confidentialite et securite

### Principes

- La cle API est **toujours stockee chiffree** en base via `encrypt()` / `decrypt()` de Laravel
- Le contenu envoye aux API IA n'est **pas stocke par les fournisseurs** (OpenAI et Anthropic ne conservent pas les donnees en mode API)
- Aucun contenu utilisateur n'est logge dans `ai_usage_logs` (seuls les metadata techniques : tokens, action, temps de reponse)
- Les administrateurs peuvent **desactiver l'IA par utilisateur** via le systeme de permissions
- Le contenu envoye a l'API est tronque (max 10 000 caracteres) pour eviter les envois excessifs de donnees

### Permission utilisateur

```php
// La permission "use-ai-assistant" est verifiee dans chaque FormRequest
// et dans le middleware AiRateLimiter

// Dans le seeder de permissions :
Permission::create(['name' => 'use-ai-assistant', 'guard_name' => 'web']);

// Par defaut, seuls les roles admin et editor ont la permission
// Les auteurs et contributeurs doivent l'avoir explicitement
```

---

## 10. Traductions

```php
// resources/lang/fr/messages.php
return [
    'sidebar_label' => 'Assistant IA',
    'settings' => 'Parametres',
    'usage' => 'Utilisation',
    'ai_button' => 'IA',
    'feature_disabled' => 'La fonctionnalite ":feature" est desactivee.',
    'rate_limit_exceeded' => 'Trop de requetes. Veuillez patienter avant de reessayer.',
    'daily_limit_exceeded' => 'Limite quotidienne de tokens atteinte. Reessayez demain.',
    'monthly_limit_exceeded' => 'Limite mensuelle de tokens atteinte. Contactez votre administrateur.',
    'api_key_missing' => 'Cle API non configuree. Rendez-vous dans Parametres > Assistant IA.',
];

// resources/lang/en/messages.php
return [
    'sidebar_label' => 'AI Assistant',
    'settings' => 'Settings',
    'usage' => 'Usage',
    'ai_button' => 'AI',
    'feature_disabled' => 'The ":feature" feature is disabled.',
    'rate_limit_exceeded' => 'Too many requests. Please wait before trying again.',
    'daily_limit_exceeded' => 'Daily token limit reached. Try again tomorrow.',
    'monthly_limit_exceeded' => 'Monthly token limit reached. Contact your administrator.',
    'api_key_missing' => 'API key not configured. Go to Settings > AI Assistant.',
];
```

---

## 11. Tests

```php
<?php

// tests/AiServiceTest.php
namespace AiAssistant\Tests;

use AiAssistant\Services\AiService;
use AiAssistant\Services\Drivers\AiDriverInterface;
use AiAssistant\Models\AiUsageLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

class AiServiceTest extends TestCase
{
    use RefreshDatabase;

    private AiDriverInterface $mockDriver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDriver = Mockery::mock(AiDriverInterface::class);
    }

    public function test_generate_text_returns_content(): void
    {
        $this->mockDriver
            ->shouldReceive('generateText')
            ->once()
            ->andReturn([
                'content' => 'Contenu genere par IA',
                'prompt_tokens' => 50,
                'completion_tokens' => 20,
                'total_tokens' => 70,
                'response_time_ms' => 450,
            ]);

        $service = $this->createServiceWithMock();
        $result = $service->generateText('Ecris un paragraphe sur Laravel');

        $this->assertArrayHasKey('text', $result);
        $this->assertEquals('Contenu genere par IA', $result['text']);
        $this->assertEquals(70, $result['tokens_used']);
    }

    public function test_generate_seo_returns_meta(): void
    {
        $this->mockDriver
            ->shouldReceive('generateSeoMeta')
            ->once()
            ->andReturn([
                'content' => '{"meta_title":"Titre SEO","meta_description":"Description SEO","keywords":["mot1","mot2"]}',
                'prompt_tokens' => 100,
                'completion_tokens' => 30,
                'total_tokens' => 130,
                'response_time_ms' => 600,
            ]);

        $service = $this->createServiceWithMock();
        $result = $service->generateSeoMeta('Contenu de ma page...');

        $this->assertEquals('Titre SEO', $result['meta_title']);
        $this->assertEquals('Description SEO', $result['meta_description']);
        $this->assertCount(2, $result['keywords']);
    }

    public function test_usage_is_logged(): void
    {
        $this->mockDriver
            ->shouldReceive('generateText')
            ->once()
            ->andReturn([
                'content' => 'Test',
                'prompt_tokens' => 10,
                'completion_tokens' => 5,
                'total_tokens' => 15,
                'response_time_ms' => 200,
            ]);

        $service = $this->createServiceWithMock();
        $service->generateText('Test');

        $this->assertDatabaseHas('ai_usage_logs', [
            'action' => 'generate',
            'total_tokens' => 15,
        ]);
    }

    public function test_disabled_feature_throws_exception(): void
    {
        $this->expectException(\RuntimeException::class);

        $service = $this->createServiceWithMock(enabledFeatures: ['generate', 'improve']);
        $service->translateContent('Hello', 'fr');
    }

    private function createServiceWithMock(?array $enabledFeatures = null): AiService
    {
        // Injection du mock driver via reflection ou methode setter
        $service = new AiService();
        return $service;
    }
}
```

```php
<?php

// tests/AiControllerTest.php
namespace AiAssistant\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_requires_authentication(): void
    {
        $response = $this->postJson('/api/ai/generate', ['prompt' => 'test']);
        $response->assertStatus(401);
    }

    public function test_generate_validates_prompt(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->postJson('/api/ai/generate', []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['prompt']);
    }

    public function test_improve_validates_text_and_instruction(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->postJson('/api/ai/improve', []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['text', 'instruction']);
    }

    public function test_alt_text_validates_image_url(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->postJson('/api/ai/alt-text', ['image_url' => 'not-a-url']);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image_url']);
    }
}
```
