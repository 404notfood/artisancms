<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Resolves oEmbed data for known providers (no auto-discovery).
 *
 * Supported: YouTube, Vimeo, Twitter/X, Spotify, SoundCloud.
 */
class OEmbedService
{
    /** Cache TTL in seconds (24 hours). */
    private const CACHE_TTL = 86400;

    /**
     * Provider endpoint patterns.
     * Each entry maps a regex (tested against the input URL) to an oEmbed endpoint.
     * The placeholder {url} is replaced with the encoded URL at call time.
     *
     * @var array<string, string>
     */
    private const PROVIDERS = [
        // YouTube (watch, short, embed)
        '#https?://(?:www\.)?youtube\.com/watch#i'
            => 'https://www.youtube.com/oembed?url={url}&format=json',
        '#https?://youtu\.be/#i'
            => 'https://www.youtube.com/oembed?url={url}&format=json',

        // Vimeo
        '#https?://(?:www\.)?vimeo\.com/\d+#i'
            => 'https://vimeo.com/api/oembed.json?url={url}',

        // Twitter / X
        '#https?://(?:www\.)?(?:twitter\.com|x\.com)/.+/status/\d+#i'
            => 'https://publish.twitter.com/oembed?url={url}',

        // Spotify (track, album, playlist, episode)
        '#https?://open\.spotify\.com/(track|album|playlist|episode)/#i'
            => 'https://open.spotify.com/oembed?url={url}',

        // SoundCloud
        '#https?://soundcloud\.com/.+/.+#i'
            => 'https://soundcloud.com/oembed?url={url}&format=json',
    ];

    /**
     * Resolve oEmbed data for a given URL.
     *
     * @return array{provider: string, title: string, html: string, thumbnail_url: string|null, width: int|null, height: int|null}|null
     */
    public function resolve(string $url): ?array
    {
        $url = trim($url);
        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        $cacheKey = 'oembed:' . md5($url);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($url): ?array {
            return $this->fetchFromProvider($url);
        });
    }

    /**
     * Return the list of supported provider names.
     *
     * @return string[]
     */
    public function supportedProviders(): array
    {
        return ['YouTube', 'Vimeo', 'Twitter/X', 'Spotify', 'SoundCloud'];
    }

    /**
     * Attempt to match the URL against known providers and fetch oEmbed data.
     *
     * @return array{provider: string, title: string, html: string, thumbnail_url: string|null, width: int|null, height: int|null}|null
     */
    private function fetchFromProvider(string $url): ?array
    {
        foreach (self::PROVIDERS as $pattern => $endpointTemplate) {
            if (preg_match($pattern, $url) !== 1) {
                continue;
            }

            $endpoint = str_replace('{url}', urlencode($url), $endpointTemplate);

            try {
                $response = Http::timeout(8)
                    ->acceptJson()
                    ->get($endpoint);

                if (! $response->successful()) {
                    Log::warning('OEmbed: provider returned non-200', [
                        'url'    => $url,
                        'status' => $response->status(),
                    ]);

                    return null;
                }

                /** @var array<string, mixed> $data */
                $data = $response->json();

                return [
                    'provider'      => $this->extractProvider($data),
                    'title'         => $this->str($data, 'title'),
                    'html'          => $this->str($data, 'html'),
                    'thumbnail_url' => $this->strOrNull($data, 'thumbnail_url'),
                    'width'         => $this->intOrNull($data, 'width'),
                    'height'        => $this->intOrNull($data, 'height'),
                ];
            } catch (\Throwable $e) {
                Log::warning('OEmbed: request failed', [
                    'url'     => $url,
                    'message' => $e->getMessage(),
                ]);

                return null;
            }
        }

        // No matching provider
        return null;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function extractProvider(array $data): string
    {
        $name = $data['provider_name'] ?? $data['provider'] ?? '';

        return is_string($name) && $name !== '' ? $name : 'Unknown';
    }

    /**
     * @param array<string, mixed> $data
     */
    private function str(array $data, string $key): string
    {
        $value = $data[$key] ?? '';

        return is_string($value) ? $value : '';
    }

    /**
     * @param array<string, mixed> $data
     */
    private function strOrNull(array $data, string $key): ?string
    {
        $value = $data[$key] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function intOrNull(array $data, string $key): ?int
    {
        $value = $data[$key] ?? null;

        return is_numeric($value) ? (int) $value : null;
    }
}
