<?php

declare(strict_types=1);

return [
    'version' => '1.0.0',
    'name' => 'ArtisanCMS',
    'paths' => [
        'plugins' => base_path('content/plugins'),
        'themes' => base_path('content/themes'),
        'media' => storage_path('app/public/media'),
    ],
    'media' => [
        'max_upload_size' => 10240, // KB
        'allowed_types' => [
            'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
            'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
            'video' => ['mp4', 'webm'],
            'audio' => ['mp3', 'wav'],
        ],
        'allowed_mimes' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'video/mp4'],
        'image' => [
            'driver' => 'gd',
            'quality' => 80,
            'webp' => true,
            'strip_exif' => true,
            'max_dimension' => 2400,
            'responsive_sizes' => [
                'sm' => 320,
                'md' => 640,
                'lg' => 1024,
                'xl' => 1920,
            ],
            'thumbnails' => [
                'thumb' => ['width' => 150, 'height' => 150, 'fit' => 'crop'],
                'medium' => ['width' => 400, 'height' => 300, 'fit' => 'contain'],
                'large' => ['width' => 800, 'height' => 600, 'fit' => 'contain'],
            ],
        ],
    ],
    'admin' => [
        'prefix' => env('CMS_ADMIN_PREFIX', 'admin'),
        'middleware' => ['web', 'auth'],
    ],
    'auth' => [
        'login_path' => env('CMS_LOGIN_PATH', 'login'),
        'register_path' => env('CMS_REGISTER_PATH', 'register'),
    ],
    'cache' => [
        'enabled' => env('CMS_CACHE_ENABLED', true),
        'ttl' => [
            'settings' => 3600,
            'theme' => 3600,
            'plugins' => 3600,
            'blocks' => 3600,
            'menus' => 1800,
            'pages' => 600,
            'media_list' => 300,
        ],
    ],
    'search' => [
        'enabled' => true,
        'min_query_length' => 2,
        'results_per_page' => 20,
        'searchable_types' => ['pages', 'posts'],
    ],
    'revisions' => [
        'max_per_entity' => 30,
    ],
    'analytics' => [
        'enabled' => env('CMS_ANALYTICS_ENABLED', true),
        'respect_dnt' => true,
        'exclude_admins' => true,
        'raw_data_days' => 90,
    ],
    'multisite' => [
        'enabled' => env('CMS_MULTISITE_ENABLED', false),
        'base_domain' => env('CMS_BASE_DOMAIN', 'artisancms.dev'),
        'allow_custom_domains' => true,
    ],
    'locales' => [
        'default' => 'fr',
        'available' => ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl'],
    ],
    'cookie_consent' => [
        'enabled' => env('CMS_COOKIE_CONSENT_ENABLED', true),
        'position' => 'bottom', // bottom, top
        'type' => 'opt-in', // opt-in, opt-out, info-only
    ],
];
