<?php

declare(strict_types=1);

namespace AiAssistant\Services\Drivers;

interface AiDriverInterface
{
    /**
     * Generer du texte a partir d'un prompt.
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
     * Ameliorer / reecrire un texte existant.
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
     * Generer meta title et meta description SEO a partir du contenu.
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
     * Generer un texte alternatif pour une image via l'API vision.
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
     * Traduire du contenu vers une langue cible.
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
     * Resumer un texte long.
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
