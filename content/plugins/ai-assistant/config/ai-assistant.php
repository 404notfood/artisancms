<?php

declare(strict_types=1);

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
        'max_input_length' => 10000,
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
