<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\BrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class ManifestController extends Controller
{
    private const int CACHE_TTL_SECONDS = 3600;

    public function __invoke(BrandingService $branding): JsonResponse
    {
        $manifest = Cache::remember('pwa:manifest', self::CACHE_TTL_SECONDS, function () use ($branding): array {
            $siteName = (string) Setting::get('general.site_name', 'ArtisanCMS');
            $siteDescription = (string) Setting::get('general.site_description', '');
            $primaryColor = (string) $branding->get('brand_color_primary', '#ffffff');
            $favicon = $branding->get('brand_favicon');

            $icons = [];

            if ($favicon) {
                foreach ([48, 72, 96, 144, 192, 512] as $size) {
                    $icons[] = [
                        'src' => $favicon,
                        'sizes' => "{$size}x{$size}",
                        'type' => 'image/png',
                    ];
                }
            } else {
                $icons[] = [
                    'src' => '/favicon.ico',
                    'sizes' => '48x48',
                    'type' => 'image/x-icon',
                ];
            }

            return [
                'name' => $siteName,
                'short_name' => mb_substr($siteName, 0, 12),
                'description' => $siteDescription,
                'start_url' => '/',
                'display' => 'standalone',
                'background_color' => '#ffffff',
                'theme_color' => $primaryColor,
                'icons' => $icons,
            ];
        });

        return response()
            ->json($manifest, 200, ['Content-Type' => 'application/manifest+json'])
            ->setCache(['public' => true, 'max_age' => self::CACHE_TTL_SECONDS]);
    }
}
