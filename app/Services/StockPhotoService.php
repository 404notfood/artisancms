<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;

class StockPhotoService
{
    /**
     * Search Unsplash for photos.
     *
     * @return array<int, array{id: string, url: string, thumb: string, author: string, download_url: string}>
     */
    public function searchUnsplash(string $query, int $perPage = 20): array
    {
        $apiKey = config('services.unsplash.access_key');
        if (!$apiKey) {
            return [];
        }

        try {
            $response = Http::get('https://api.unsplash.com/search/photos', [
                'query' => $query,
                'per_page' => $perPage,
                'client_id' => $apiKey,
            ]);

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json();
            $results = [];

            foreach ($data['results'] ?? [] as $photo) {
                $results[] = [
                    'id' => $photo['id'],
                    'url' => $photo['urls']['regular'] ?? '',
                    'thumb' => $photo['urls']['thumb'] ?? '',
                    'author' => $photo['user']['name'] ?? '',
                    'download_url' => $photo['links']['download'] ?? '',
                ];
            }

            return $results;
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Search Pexels for photos.
     *
     * @return array<int, array{id: string, url: string, thumb: string, author: string, download_url: string}>
     */
    public function searchPexels(string $query, int $perPage = 20): array
    {
        $apiKey = config('services.pexels.api_key');
        if (!$apiKey) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $apiKey,
            ])->get('https://api.pexels.com/v1/search', [
                'query' => $query,
                'per_page' => $perPage,
            ]);

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json();
            $results = [];

            foreach ($data['photos'] ?? [] as $photo) {
                $results[] = [
                    'id' => (string) $photo['id'],
                    'url' => $photo['src']['large'] ?? '',
                    'thumb' => $photo['src']['tiny'] ?? '',
                    'author' => $photo['photographer'] ?? '',
                    'download_url' => $photo['src']['original'] ?? '',
                ];
            }

            return $results;
        } catch (\Throwable) {
            return [];
        }
    }
}
