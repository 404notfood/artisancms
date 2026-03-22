<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// If vendor is missing (fresh git clone / FTP upload), redirect to setup.php
if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
    // Check if setup.php exists
    if (file_exists(__DIR__.'/setup.php')) {
        header('Location: /setup.php');
        exit;
    }

    // Fallback: show a minimal error page
    http_response_code(503);
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>ArtisanCMS</title>';
    echo '<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b}';
    echo '.c{text-align:center;max-width:500px;padding:2rem}.h{font-size:1.5rem;font-weight:700;margin-bottom:1rem}';
    echo '.h span{color:#6366f1}code{background:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:.9rem}</style></head>';
    echo '<body><div class="c"><div class="h">Artisan<span>CMS</span></div>';
    echo '<p>Les dépendances ne sont pas installées.</p>';
    echo '<p style="margin-top:1rem">Exécutez ces commandes :</p>';
    echo '<p style="margin-top:.5rem"><code>composer install</code></p>';
    echo '<p style="margin-top:.5rem"><code>npm install && npm run build</code></p>';
    echo '</div></body></html>';
    exit;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
