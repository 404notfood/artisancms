<?php

declare(strict_types=1);

return [
    'destination' => storage_path('app/backups'),
    'filename_prefix' => 'artisancms',
    'include_media' => true,
    'include_database' => true,
    'retention' => [
        'daily' => 7,
        'weekly' => 4,
        'monthly' => 3,
    ],
    'max_size_mb' => 500,
    'notifications' => [
        'email' => null,
        'on_success' => true,
        'on_failure' => true,
    ],
];
