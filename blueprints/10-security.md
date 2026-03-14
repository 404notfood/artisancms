# Blueprint 10 - Sécurité

## Vue d'ensemble
Ce document définit la stratégie de sécurité d'ArtisanCMS. Chaque couche (auth, autorisation, upload, plugins, XSS/CSRF, rate limiting) est couverte avec du code de référence prêt à implémenter.

---

## 1. Authentification

### Stack V1 (Laravel + Inertia)
Le starter kit Laravel React gère l'auth de base (login, register, password reset, email verification). ArtisanCMS étend ce système avec les rôles.

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user()?->load('role'),
            'permissions' => $request->user()?->role?->permissions ?? [],
        ],
    ];
}
```

### Protection des sessions
```php
// config/session.php — Valeurs recommandées
'lifetime' => 120,         // 2h d'inactivité max
'expire_on_close' => false,
'encrypt' => true,
'http_only' => true,
'same_site' => 'lax',
'secure' => env('SESSION_SECURE_COOKIE', true), // true en prod (HTTPS)
```

### Brute-force protection (login)
```php
// Le starter kit inclut déjà un throttle sur le login.
// Renforcer avec config personnalisée si besoin :
// app/Http/Controllers/Auth/AuthenticatedSessionController.php
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip() . '|' . $request->input('email'));
});
```

---

## 2. Autorisation (Policies)

### Système de permissions
Les permissions sont stockées en JSON dans `roles.permissions` :
```json
{
  "admin": ["*"],
  "editor": ["pages.*", "posts.*", "media.*", "menus.*", "taxonomies.*", "settings.view"],
  "author": ["pages.create", "pages.edit_own", "posts.create", "posts.edit_own", "media.upload"],
  "subscriber": ["profile.edit"]
}
```

### Gate globale
```php
// app/Providers/AuthServiceProvider.php (ou dans AppServiceProvider::boot)
use Illuminate\Support\Facades\Gate;

Gate::before(function ($user, $ability) {
    // Les admins ont tous les droits
    if ($user->role?->slug === 'admin') {
        return true;
    }
});

Gate::define('cms.manage', function ($user, string $permission) {
    $permissions = $user->role?->permissions ?? [];

    // Vérifier la permission exacte
    if (in_array($permission, $permissions)) {
        return true;
    }

    // Vérifier le wildcard (ex: "pages.*" autorise "pages.create")
    $parts = explode('.', $permission);
    $wildcard = $parts[0] . '.*';
    return in_array($wildcard, $permissions);
});
```

### Policies par entité
```php
// app/Policies/PagePolicy.php
<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Page;
use App\Models\User;

class PagePolicy
{
    public function viewAny(User $user): bool
    {
        return Gate::allows('cms.manage', 'pages.view');
    }

    public function create(User $user): bool
    {
        return Gate::allows('cms.manage', 'pages.create');
    }

    public function update(User $user, Page $page): bool
    {
        // L'auteur peut éditer ses propres pages
        if ($page->created_by === $user->id) {
            return Gate::allows('cms.manage', 'pages.edit_own');
        }

        return Gate::allows('cms.manage', 'pages.edit');
    }

    public function delete(User $user, Page $page): bool
    {
        if ($page->created_by === $user->id) {
            return Gate::allows('cms.manage', 'pages.delete_own');
        }

        return Gate::allows('cms.manage', 'pages.delete');
    }

    public function publish(User $user, Page $page): bool
    {
        return Gate::allows('cms.manage', 'pages.publish');
    }
}
```

**Policies à créer :**

| Policy | Model | Permissions |
|--------|-------|-------------|
| `PagePolicy` | Page | view, create, edit, edit_own, delete, delete_own, publish |
| `PostPolicy` | Post | view, create, edit, edit_own, delete, delete_own, publish |
| `MediaPolicy` | Media | view, upload, delete, delete_own |
| `MenuPolicy` | Menu | view, create, edit, delete |
| `TaxonomyPolicy` | Taxonomy | view, create, edit, delete |
| `SettingPolicy` | Setting | view, edit |
| `UserPolicy` | User | view, create, edit, delete, assign_role |
| `PluginPolicy` | CmsPlugin | view, install, activate, deactivate, uninstall, configure |
| `ThemePolicy` | CmsTheme | view, activate, customize |

### Middleware admin
```php
// app/Http/Middleware/EnsureAdmin.php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || !in_array($request->user()->role?->slug, ['admin', 'editor', 'author'])) {
            abort(403, 'Accès non autorisé.');
        }

        return $next($request);
    }
}
```

### Vérification côté React
```tsx
// resources/js/hooks/use-permission.ts
import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage().props as { auth: { permissions: string[] } };
    const permissions = auth.permissions ?? [];

    function can(permission: string): boolean {
        if (permissions.includes('*')) return true;
        if (permissions.includes(permission)) return true;

        const [resource] = permission.split('.');
        return permissions.includes(`${resource}.*`);
    }

    return { can };
}

// Usage dans un composant :
// const { can } = usePermission();
// {can('pages.create') && <Button>Créer une page</Button>}
```

---

## 3. Sécurité des uploads (Media)

### Validation stricte
```php
// app/Http/Requests/UploadMediaRequest.php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:10240', // 10 Mo max
                'mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,mp4,webm,mp3',
            ],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'folder' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\/_-]+$/'],
        ];
    }
}
```

### Service de validation avancée
```php
// Dans MediaService.php
public function validateFile(UploadedFile $file): void
{
    // 1. Vérifier le MIME type réel (pas juste l'extension)
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $realMime = $finfo->file($file->getRealPath());

    $allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/mp3',
    ];

    if (!in_array($realMime, $allowedMimes)) {
        throw new \InvalidArgumentException("Type de fichier non autorisé : {$realMime}");
    }

    // 2. Vérifier que les SVG ne contiennent pas de scripts
    if ($realMime === 'image/svg+xml') {
        $content = file_get_contents($file->getRealPath());
        if (preg_match('/<script|on\w+\s*=|javascript:/i', $content)) {
            throw new \InvalidArgumentException("Le fichier SVG contient du code potentiellement dangereux.");
        }
    }

    // 3. Vérifier la taille maximale par type
    $maxSizes = [
        'image' => 10 * 1024 * 1024,    // 10 Mo
        'video' => 100 * 1024 * 1024,   // 100 Mo
        'application' => 20 * 1024 * 1024, // 20 Mo
    ];

    $category = explode('/', $realMime)[0];
    $maxSize = $maxSizes[$category] ?? 10 * 1024 * 1024;

    if ($file->getSize() > $maxSize) {
        throw new \InvalidArgumentException("Fichier trop volumineux.");
    }
}
```

### Nommage sécurisé des fichiers
```php
// Dans MediaService.php
protected function generateSafeFilename(UploadedFile $file): string
{
    $extension = $file->guessExtension() ?? 'bin';
    $hash = Str::random(32);
    $date = now()->format('Y/m');

    // Structure : media/2026/03/{hash}.{ext}
    // Jamais le nom original dans le path
    return "media/{$date}/{$hash}.{$extension}";
}
```

### Stockage
```php
// Les uploads vont dans storage/app/public/media/ (jamais dans le webroot directement)
// Le lien symbolique `php artisan storage:link` expose via /storage/
// Les fichiers sensibles (PDF privés, etc.) peuvent aller dans storage/app/private/
```

### Thumbnails sécurisés
```php
// Utiliser Intervention Image pour le redimensionnement
// Ne jamais exposer les URLs de génération de thumbnails à l'utilisateur
// Pré-générer les thumbnails à l'upload :
'thumbnails' => [
    'sm' => ['width' => 150, 'height' => 150, 'fit' => 'crop'],
    'md' => ['width' => 400, 'height' => 300, 'fit' => 'contain'],
    'lg' => ['width' => 800, 'height' => 600, 'fit' => 'contain'],
]
```

---

## 4. Sécurité du Page Builder (XSS)

### Sanitisation du contenu JSON
Le page builder stocke du HTML brut dans certains blocs (text, html). Il faut sanitiser avant le rendu.

```php
// app/Services/ContentSanitizer.php
<?php

declare(strict_types=1);

namespace App\Services;

class ContentSanitizer
{
    /**
     * Tags HTML autorisés dans les blocs texte (rich text TipTap)
     */
    protected array $allowedTags = [
        'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre', 'img', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'sub', 'sup', 'hr',
    ];

    /**
     * Attributs autorisés par tag
     */
    protected array $allowedAttributes = [
        'a' => ['href', 'target', 'rel', 'title'],
        'img' => ['src', 'alt', 'width', 'height', 'loading'],
        'span' => ['class', 'style'],
        'div' => ['class', 'style'],
        '*' => ['class'],
    ];

    /**
     * Sanitiser le contenu HTML d'un bloc texte
     */
    public function sanitizeHtml(string $html): string
    {
        // Supprimer les scripts
        $html = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $html);

        // Supprimer les event handlers (onclick, onerror, etc.)
        $html = preg_replace('/\bon\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);

        // Supprimer les URLs javascript:
        $html = preg_replace('/href\s*=\s*["\']javascript:[^"\']*["\']/i', '', $html);

        // Utiliser strip_tags avec les tags autorisés
        $html = strip_tags($html, array_map(fn ($tag) => "<{$tag}>", $this->allowedTags));

        return $html;
    }

    /**
     * Sanitiser un arbre de blocs complet
     */
    public function sanitizeBlockTree(array $blocks): array
    {
        return array_map(function (array $block) {
            // Sanitiser les props selon le type de bloc
            if ($block['type'] === 'text' && isset($block['props']['html'])) {
                $block['props']['html'] = $this->sanitizeHtml($block['props']['html']);
            }

            if ($block['type'] === 'html' && isset($block['props']['code'])) {
                // Le bloc HTML custom est réservé aux admins
                // Vérifier le rôle avant d'autoriser
            }

            // Sanitiser les URLs dans les blocs image, button, video
            if (isset($block['props']['url'])) {
                $block['props']['url'] = $this->sanitizeUrl($block['props']['url']);
            }
            if (isset($block['props']['src'])) {
                $block['props']['src'] = $this->sanitizeUrl($block['props']['src']);
            }

            // Récursion sur les enfants
            if (!empty($block['children'])) {
                $block['children'] = $this->sanitizeBlockTree($block['children']);
            }

            return $block;
        }, $blocks);
    }

    /**
     * Sanitiser une URL
     */
    protected function sanitizeUrl(string $url): string
    {
        // Autoriser uniquement http, https, mailto et les chemins relatifs
        if (preg_match('/^(https?:\/\/|mailto:|\/|#)/', $url)) {
            return $url;
        }

        return '#'; // URL invalide → lien mort plutôt que XSS
    }
}
```

### Protection CSRF
```php
// Inertia gère automatiquement le token CSRF via le cookie XSRF-TOKEN.
// Les requêtes API du builder doivent aussi être protégées :
// routes/api.php — utiliser le middleware 'web' (qui inclut VerifyCsrfToken)
Route::middleware(['web', 'auth'])->prefix('api/builder')->group(function () {
    // ...
});
// Note : NE PAS utiliser le middleware 'api' seul car il n'inclut pas la protection CSRF
```

### Bloc HTML custom : restriction admin
```php
// Dans le BuilderController ou le ContentSanitizer
public function saveContent(Request $request, Page $page): JsonResponse
{
    $content = $request->input('content');

    // Vérifier que seuls les admins peuvent utiliser le bloc HTML custom
    if (!$request->user()->role->slug === 'admin') {
        $content['blocks'] = $this->removeBlockType($content['blocks'], 'html');
    }

    // Sanitiser tout le contenu
    $sanitizer = app(ContentSanitizer::class);
    $content['blocks'] = $sanitizer->sanitizeBlockTree($content['blocks']);

    // Sauvegarder
    $page->update(['content' => $content]);

    return response()->json(['success' => true]);
}
```

---

## 5. Sécurité des plugins

### Sandboxing
Les plugins ne peuvent PAS :
- Modifier les fichiers dans `app/`, `config/`, `routes/` (core)
- Accéder aux fichiers d'autres plugins sans dépendance déclarée
- Modifier la table `users` directement (passer par les hooks)
- Exécuter du code système (`exec`, `shell_exec`, `system`, `passthru`)

### Validation du manifeste
```php
// Dans PluginManager::install()
protected function validateManifest(array $manifest): void
{
    $required = ['name', 'slug', 'version', 'providers'];

    foreach ($required as $field) {
        if (empty($manifest[$field])) {
            throw new \RuntimeException("Le manifeste du plugin est invalide : champ '{$field}' manquant.");
        }
    }

    // Vérifier le format du slug
    if (!preg_match('/^[a-z0-9-]+$/', $manifest['slug'])) {
        throw new \RuntimeException("Le slug du plugin est invalide.");
    }

    // Vérifier la compatibilité CMS
    $requires = $manifest['requires'] ?? [];
    if (isset($requires['cms'])) {
        $cmsVersion = config('cms.version');
        if (!version_compare($cmsVersion, ltrim($requires['cms'], '>=<'), '>=')) {
            throw new \RuntimeException("Ce plugin nécessite ArtisanCMS {$requires['cms']} (version actuelle : {$cmsVersion}).");
        }
    }
}
```

### Fonctions PHP interdites
```php
// Dans CMSServiceProvider::boot() — Détecter les fonctions dangereuses dans les plugins
// Note : c'est une protection de surface, pas un vrai sandbox
// La vraie protection passe par le code review avant publication sur la marketplace
protected function auditPluginCode(string $pluginPath): array
{
    $dangerousFunctions = [
        'exec', 'shell_exec', 'system', 'passthru', 'proc_open',
        'popen', 'eval', 'assert', 'create_function',
        'file_put_contents' => 'hors du dossier plugin',
        'unlink' => 'hors du dossier plugin',
    ];

    $warnings = [];
    $files = File::allFiles($pluginPath, true);

    foreach ($files as $file) {
        if ($file->getExtension() !== 'php') continue;

        $content = file_get_contents($file->getRealPath());
        foreach ($dangerousFunctions as $key => $func) {
            $funcName = is_int($key) ? $func : $key;
            if (preg_match('/\b' . $funcName . '\s*\(/i', $content)) {
                $warnings[] = "Fonction dangereuse '{$funcName}' détectée dans {$file->getRelativePathname()}";
            }
        }
    }

    return $warnings;
}
```

---

## 6. Rate Limiting

```php
// bootstrap/app.php ou app/Providers/AppServiceProvider.php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

// API du builder (sauvegarde fréquente mais pas illimitée)
RateLimiter::for('builder-api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

// Upload media (plus restrictif)
RateLimiter::for('media-upload', function (Request $request) {
    return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
});

// API publique (front)
RateLimiter::for('public-api', function (Request $request) {
    return Limit::perMinute(120)->by($request->ip());
});

// Installation (protection contre les bots)
RateLimiter::for('install', function (Request $request) {
    return Limit::perMinute(10)->by($request->ip());
});
```

```php
// Appliquer dans les routes :
Route::middleware(['web', 'auth', 'throttle:builder-api'])->prefix('api/builder')->group(function () {
    // routes builder
});

Route::middleware(['web', 'auth', 'throttle:media-upload'])->group(function () {
    Route::post('/api/builder/media/upload', [BuilderController::class, 'uploadMedia']);
});
```

---

## 7. Protection des données

### Variables d'environnement
```php
// Ne JAMAIS exposer les variables d'environnement au frontend
// Dans HandleInertiaRequests::share(), ne partager que les données nécessaires
// Ne JAMAIS faire : 'dbPassword' => env('DB_PASSWORD')
```

### Logs et erreurs
```php
// config/app.php — En production :
'debug' => false,    // JAMAIS true en prod
'env' => 'production',

// Configurer les logs pour ne pas exposer les stack traces
// config/logging.php — Utiliser 'daily' ou 'stack' (pas 'single' en prod)
```

### Headers de sécurité
```php
// app/Http/Middleware/SecurityHeaders.php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Content Security Policy (adapter selon les besoins)
        if (app()->isProduction()) {
            $response->headers->set('Content-Security-Policy',
                "default-src 'self'; " .
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " . // unsafe-eval nécessaire pour Vite/React
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
                "font-src 'self' https://fonts.gstatic.com; " .
                "img-src 'self' data: blob: https:; " .
                "media-src 'self' blob:; " .
                "connect-src 'self'; " .
                "frame-src 'self';"
            );
        }

        return $response;
    }
}
```

---

## 8. Checklist de sécurité par phase

### Phase 1 (Fondations)
- [ ] Middleware `EnsureAdmin` créé et appliqué aux routes admin
- [ ] Middleware `SecurityHeaders` créé et enregistré globalement
- [ ] Policies créées pour Page, Post, Media, Setting
- [ ] Gate globale configurée avec les permissions par rôle
- [ ] Rate limiting configuré pour login, install, API
- [ ] Sessions configurées (encrypt, http_only, same_site)
- [ ] Hook `usePermission()` côté React

### Phase 2 (Contenu)
- [ ] UploadMediaRequest avec validation MIME stricte
- [ ] MediaService avec `validateFile()` et nommage sécurisé
- [ ] ContentSanitizer pour les blocs texte et HTML
- [ ] Policies appliquées dans tous les controllers CRUD
- [ ] Form Requests pour toutes les entrées utilisateur

### Phase 3 (Page Builder)
- [ ] Sanitisation de l'arbre JSON avant sauvegarde
- [ ] Bloc HTML restreint aux admins
- [ ] Rate limiting sur l'API builder
- [ ] Validation Zod côté client + validation Laravel côté serveur
- [ ] Protection CSRF sur les routes API builder

### Phase 4 (Plugins)
- [ ] Validation du manifeste à l'installation
- [ ] Audit des fonctions dangereuses
- [ ] Plugins isolés dans leur dossier (pas d'accès croisé)
- [ ] Hook `media_upload_rules` filtrable par les plugins

### Phase 5 (E-commerce)
- [ ] Jamais de données de paiement en DB (déléguer à Stripe)
- [ ] Validation webhook Stripe avec signature
- [ ] Rate limiting sur les routes checkout
- [ ] Validation des montants côté serveur (jamais faire confiance au client)

---

## 9. Résumé des middleware

| Middleware | Portée | Description |
|-----------|--------|-------------|
| `EnsureInstalled` | Global | Redirige vers /install si pas installé |
| `EnsureAdmin` | Routes admin | Vérifie que l'utilisateur a un rôle admin/editor/author |
| `SecurityHeaders` | Global | Ajoute les headers de sécurité |
| `VerifyCsrfToken` | Web (inclus) | Protection CSRF (Laravel natif) |
| `ThrottleRequests` | API | Rate limiting par route group |
