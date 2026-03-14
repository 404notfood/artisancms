# Blueprint 19 - White Labeling (Personnalisation de marque)

## Vue d'ensemble
Le white labeling permet aux agences et freelances de personnaliser entierement l'apparence de l'interface d'administration d'ArtisanCMS pour leurs clients. Le CMS peut afficher un logo custom, des couleurs personnalisees, un nom de marque different, et une page de connexion sur mesure. Le credit "Propulse par ArtisanCMS" est affiche par defaut mais peut etre desactive par l'utilisateur via un simple toggle.

**Objectifs :**
- Personnaliser le nom, le logo, le favicon et les couleurs de l'admin
- Personnaliser la page de connexion (image de fond, message d'accueil)
- Toggle pour afficher ou masquer le credit "Propulse par ArtisanCMS" (affiche par defaut)
- Injecter du CSS custom dans l'interface admin
- Exporter/importer une configuration de branding pour la replier rapidement sur d'autres sites
- Support multisite : chaque site peut avoir son propre branding

---

## 1. Configuration branding dans settings

Le branding utilise la table `settings` existante (Blueprint 01) avec le groupe `branding`.

### Cles de settings

| Cle | Type | Defaut | Description |
|-----|------|--------|-------------|
| `brand_name` | string | `"ArtisanCMS"` | Nom affiche dans le header admin et la page de login |
| `brand_logo` | image | `null` | Logo principal (header admin, login). Chemin vers le media |
| `brand_logo_dark` | image | `null` | Variante du logo pour le mode sombre |
| `brand_favicon` | image | `null` | Favicon custom (remplace celui par defaut) |
| `brand_color_primary` | string | `"#3b82f6"` | Couleur principale de l'interface admin |
| `brand_color_accent` | string | `"#8b5cf6"` | Couleur d'accent (boutons, liens, focus) |
| `login_background_image` | image | `null` | Image de fond de la page de connexion |
| `login_welcome_message` | string | `null` | Message d'accueil sur la page de connexion |
| `admin_footer_text` | string | `null` | Texte personnalise dans le footer admin |
| `show_cms_credit` | boolean | `true` | Afficher le credit "Propulse par ArtisanCMS" dans le footer |
| `custom_css_admin` | string | `null` | CSS custom injecte dans le `<head>` de l'admin |

### Migration seed des settings branding

```php
// database/seeders/BrandingSettingsSeeder.php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class BrandingSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'group'     => 'branding',
                'key'       => 'brand_name',
                'value'     => json_encode('ArtisanCMS'),
                'type'      => 'string',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'brand_logo',
                'value'     => null,
                'type'      => 'image',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'brand_logo_dark',
                'value'     => null,
                'type'      => 'image',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'brand_favicon',
                'value'     => null,
                'type'      => 'image',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'brand_color_primary',
                'value'     => json_encode('#3b82f6'),
                'type'      => 'string',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'brand_color_accent',
                'value'     => json_encode('#8b5cf6'),
                'type'      => 'string',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'login_background_image',
                'value'     => null,
                'type'      => 'image',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'login_welcome_message',
                'value'     => null,
                'type'      => 'string',
                'is_public' => true,
            ],
            [
                'group'     => 'branding',
                'key'       => 'admin_footer_text',
                'value'     => null,
                'type'      => 'string',
                'is_public' => false,
            ],
            [
                'group'     => 'branding',
                'key'       => 'show_cms_credit',
                'value'     => json_encode(true),
                'type'      => 'boolean',
                'is_public' => false,
            ],
            [
                'group'     => 'branding',
                'key'       => 'custom_css_admin',
                'value'     => null,
                'type'      => 'string',
                'is_public' => false,
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                $setting,
            );
        }
    }
}
```

---

## 2. BrandingService

Service central qui charge les settings de branding avec cache et expose des methodes claires pour chaque element de la marque.

```php
// app/Services/BrandingService.php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class BrandingService
{
    /**
     * Cle de cache pour les settings de branding
     */
    protected const CACHE_KEY = 'cms.branding';

    /**
     * Duree de cache en secondes (1 heure)
     */
    protected const CACHE_TTL = 3600;

    /**
     * Charger toutes les settings de branding (avec cache)
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $settings = Setting::where('group', 'branding')->get();

            $result = [];
            foreach ($settings as $setting) {
                $result[$setting->key] = $this->castValue($setting->value, $setting->type);
            }

            return $result;
        });
    }

    /**
     * Recuperer une setting de branding par cle
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $this->all()[$key] ?? $default;
    }

    /**
     * Nom de la marque (defaut: "ArtisanCMS")
     */
    public function getBrandName(): string
    {
        return (string) $this->get('brand_name', 'ArtisanCMS');
    }

    /**
     * URL du logo principal
     */
    public function getLogo(): ?string
    {
        return $this->get('brand_logo');
    }

    /**
     * URL du logo pour le mode sombre
     */
    public function getLogoDark(): ?string
    {
        return $this->get('brand_logo_dark');
    }

    /**
     * URL du favicon custom
     */
    public function getFavicon(): ?string
    {
        return $this->get('brand_favicon');
    }

    /**
     * Couleur principale
     */
    public function getPrimaryColor(): string
    {
        return (string) $this->get('brand_color_primary', '#3b82f6');
    }

    /**
     * Couleur d'accent
     */
    public function getAccentColor(): string
    {
        return (string) $this->get('brand_color_accent', '#8b5cf6');
    }

    /**
     * Configuration de la page de login
     *
     * @return array{background_image: string|null, welcome_message: string|null, logo: string|null, brand_name: string}
     */
    public function getLoginConfig(): array
    {
        return [
            'background_image'  => $this->get('login_background_image'),
            'welcome_message'   => $this->get('login_welcome_message'),
            'logo'              => $this->getLogo(),
            'logo_dark'         => $this->getLogoDark(),
            'brand_name'        => $this->getBrandName(),
            'primary_color'     => $this->getPrimaryColor(),
        ];
    }

    /**
     * HTML du footer admin : texte custom + credit conditionnel
     */
    public function getFooterHtml(): string
    {
        $parts = [];

        $customText = $this->get('admin_footer_text');
        if ($customText) {
            $parts[] = e($customText);
        }

        if ($this->shouldShowCredit()) {
            $parts[] = __('cms.branding.powered_by', ['name' => 'ArtisanCMS']);
        }

        return implode(' — ', $parts);
    }

    /**
     * Doit-on afficher le credit "Propulse par ArtisanCMS" ?
     * Affiche par defaut (true). L'utilisateur peut le desactiver.
     */
    public function shouldShowCredit(): bool
    {
        return (bool) $this->get('show_cms_credit', true);
    }

    /**
     * CSS custom pour l'admin
     */
    public function getCustomCss(): ?string
    {
        return $this->get('custom_css_admin');
    }

    /**
     * Donnees completes pour le partage via Inertia
     *
     * @return array<string, mixed>
     */
    public function toInertiaShare(): array
    {
        return [
            'brand_name'        => $this->getBrandName(),
            'logo'              => $this->getLogo(),
            'logo_dark'         => $this->getLogoDark(),
            'favicon'           => $this->getFavicon(),
            'primary_color'     => $this->getPrimaryColor(),
            'accent_color'      => $this->getAccentColor(),
            'footer_text'       => $this->get('admin_footer_text'),
            'show_cms_credit'   => $this->shouldShowCredit(),
            'custom_css'        => $this->getCustomCss(),
            'login'             => $this->getLoginConfig(),
        ];
    }

    /**
     * Exporter toutes les settings de branding en JSON
     *
     * @return array<string, mixed>
     */
    public function export(): array
    {
        return [
            'version'  => '1.0',
            'exported_at' => now()->toIso8601String(),
            'branding' => $this->all(),
        ];
    }

    /**
     * Importer des settings de branding depuis un JSON
     *
     * @param array<string, mixed> $data
     */
    public function import(array $data): void
    {
        $branding = $data['branding'] ?? $data;

        // Liste des cles autorisees a l'import
        $allowedKeys = [
            'brand_name', 'brand_color_primary', 'brand_color_accent',
            'login_welcome_message', 'admin_footer_text', 'show_cms_credit',
            'custom_css_admin',
        ];

        foreach ($allowedKeys as $key) {
            if (array_key_exists($key, $branding)) {
                Setting::updateOrCreate(
                    ['group' => 'branding', 'key' => $key],
                    ['value' => json_encode($branding[$key])],
                );
            }
        }

        // Les images (logo, favicon, background) ne sont pas importees
        // car elles referencent des fichiers media locaux.
        // L'utilisateur doit les re-uploader manuellement.

        $this->clearCache();
    }

    /**
     * Sanitiser le CSS custom pour eviter les injections XSS
     * Retire les expressions dangereuses : url(), expression(), javascript:, @import
     */
    public function sanitizeCustomCss(string $css): string
    {
        // Retirer les constructions dangereuses
        $dangerous = [
            '/expression\s*\(/i',
            '/javascript\s*:/i',
            '/@import/i',
            '/behavior\s*:/i',
            '/-moz-binding\s*:/i',
        ];

        $sanitized = preg_replace($dangerous, '/* removed */', $css);

        // Retirer les url() qui pointent vers des protocoles dangereux
        $sanitized = preg_replace(
            '/url\s*\(\s*["\']?\s*(javascript|data|vbscript)\s*:/i',
            'url(/* removed */',
            $sanitized
        );

        return $sanitized;
    }

    /**
     * Vider le cache de branding
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Cast la valeur JSON en type PHP selon le type de la setting
     */
    protected function castValue(mixed $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        $decoded = json_decode($value, true);

        return match ($type) {
            'boolean' => (bool) $decoded,
            'number'  => (int) $decoded,
            'json'    => $decoded,
            'image',
            'string'  => (string) ($decoded ?? ''),
            default   => $decoded,
        };
    }
}
```

### Integration dans HandleInertiaRequests

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user(),
        ],
        // ... autres donnees partagees (locale, translations, etc.)

        // Branding — disponible sur toutes les pages admin
        'branding' => fn () => app(BrandingService::class)->toInertiaShare(),
    ];
}
```

**Note :** La donnee `branding` est wrappee dans une closure (`fn () => ...`) pour beneficier du lazy loading d'Inertia — elle n'est evaluee que si le composant React y accede.

---

## 3. Settings admin UI

### Route

```php
// routes/admin.php
Route::middleware(['web', 'auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // ...
    Route::get('/settings/branding', [BrandingSettingsController::class, 'edit'])
        ->name('settings.branding')
        ->middleware('can:settings.manage');

    Route::put('/settings/branding', [BrandingSettingsController::class, 'update'])
        ->name('settings.branding.update')
        ->middleware('can:settings.manage');

    Route::get('/settings/branding/export', [BrandingSettingsController::class, 'export'])
        ->name('settings.branding.export')
        ->middleware('can:settings.manage');

    Route::post('/settings/branding/import', [BrandingSettingsController::class, 'import'])
        ->name('settings.branding.import')
        ->middleware('can:settings.manage');
});
```

### Controller

```php
// app/Http/Controllers/Admin/BrandingSettingsController.php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBrandingRequest;
use App\Services\BrandingService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandingSettingsController extends Controller
{
    public function __construct(
        protected BrandingService $brandingService,
        protected ActivityLogService $activityLogService,
    ) {}

    /**
     * Afficher la page de configuration du branding
     */
    public function edit(): Response
    {
        return Inertia::render('Admin/Settings/Branding', [
            'branding' => $this->brandingService->all(),
        ]);
    }

    /**
     * Mettre a jour les settings de branding
     */
    public function update(UpdateBrandingRequest $request): \Illuminate\Http\RedirectResponse
    {
        $oldValues = $this->brandingService->all();
        $validated = $request->validated();

        // Sanitiser le CSS custom si present
        if (isset($validated['custom_css_admin']) && $validated['custom_css_admin'] !== null) {
            $validated['custom_css_admin'] = $this->brandingService->sanitizeCustomCss(
                $validated['custom_css_admin']
            );
        }

        foreach ($validated as $key => $value) {
            \App\Models\Setting::updateOrCreate(
                ['group' => 'branding', 'key' => $key],
                [
                    'value' => json_encode($value),
                    'type'  => $this->getSettingType($key),
                ],
            );
        }

        $this->brandingService->clearCache();

        $this->activityLogService->logSettingsUpdated('branding', $oldValues, $validated);

        return redirect()
            ->route('admin.settings.branding')
            ->with('success', __('cms.branding.updated'));
    }

    /**
     * Exporter la configuration de branding en JSON
     */
    public function export(): JsonResponse
    {
        return response()->json($this->brandingService->export(), 200, [
            'Content-Disposition' => 'attachment; filename="branding-config.json"',
        ]);
    }

    /**
     * Importer une configuration de branding depuis un fichier JSON
     */
    public function import(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:json', 'max:1024'],
        ]);

        $content = file_get_contents($request->file('file')->getRealPath());
        $data = json_decode($content, true);

        if ($data === null || !is_array($data)) {
            return redirect()
                ->route('admin.settings.branding')
                ->with('error', __('cms.branding.import_invalid'));
        }

        $this->brandingService->import($data);

        $this->activityLogService->logSettingsUpdated(
            'branding',
            [],
            ['imported' => true],
        );

        return redirect()
            ->route('admin.settings.branding')
            ->with('success', __('cms.branding.imported'));
    }

    /**
     * Determiner le type de setting selon la cle
     */
    protected function getSettingType(string $key): string
    {
        return match ($key) {
            'brand_logo', 'brand_logo_dark', 'brand_favicon',
            'login_background_image' => 'image',
            'show_cms_credit'        => 'boolean',
            default                  => 'string',
        };
    }
}
```

### Form Request

```php
// app/Http/Requests/UpdateBrandingRequest.php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('settings.manage');
    }

    public function rules(): array
    {
        return [
            'brand_name'              => ['nullable', 'string', 'max:100'],
            'brand_logo'              => ['nullable', 'string', 'max:500'],
            'brand_logo_dark'         => ['nullable', 'string', 'max:500'],
            'brand_favicon'           => ['nullable', 'string', 'max:500'],
            'brand_color_primary'     => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'brand_color_accent'      => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'login_background_image'  => ['nullable', 'string', 'max:500'],
            'login_welcome_message'   => ['nullable', 'string', 'max:500'],
            'admin_footer_text'       => ['nullable', 'string', 'max:255'],
            'show_cms_credit'         => ['boolean'],
            'custom_css_admin'        => ['nullable', 'string', 'max:10000'],
        ];
    }

    public function messages(): array
    {
        return [
            'brand_color_primary.regex' => __('cms.branding.invalid_color'),
            'brand_color_accent.regex'  => __('cms.branding.invalid_color'),
        ];
    }
}
```

---

## 4. Integration dans les layouts

### Page de connexion (Login)

La page de login utilise les donnees de branding partagees via Inertia pour afficher un branding personnalise.

```tsx
// resources/js/pages/Auth/Login.tsx
import { useBranding } from '@/hooks/use-branding';
import { BrandLogo } from '@/components/branding/brand-logo';

export default function Login({ /* ... */ }) {
    const { login, primaryColor } = useBranding();

    return (
        <div
            className="flex min-h-screen"
            style={{
                '--brand-primary': primaryColor,
            } as React.CSSProperties}
        >
            {/* Panneau gauche : image de fond */}
            {login.background_image && (
                <div
                    className="hidden w-1/2 bg-cover bg-center lg:block"
                    style={{ backgroundImage: `url(${login.background_image})` }}
                />
            )}

            {/* Panneau droit : formulaire */}
            <div className="flex flex-1 flex-col items-center justify-center p-8">
                <BrandLogo className="mb-8 h-12" />

                {login.welcome_message && (
                    <p className="mb-6 text-center text-muted-foreground">
                        {login.welcome_message}
                    </p>
                )}

                {/* Formulaire de connexion... */}
            </div>
        </div>
    );
}
```

### Admin sidebar : logo custom

```tsx
// resources/js/layouts/admin-layout.tsx (extrait)
import { BrandLogo } from '@/components/branding/brand-logo';
import { PoweredBy } from '@/components/branding/powered-by';
import { useBranding } from '@/hooks/use-branding';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { custom_css } = useBranding();

    return (
        <>
            {/* Injection CSS custom */}
            {custom_css && <style dangerouslySetInnerHTML={{ __html: custom_css }} />}

            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside className="flex w-64 flex-col border-r bg-sidebar">
                    <div className="flex h-16 items-center px-6">
                        <BrandLogo className="h-8" />
                    </div>

                    {/* Navigation... */}
                </aside>

                {/* Contenu principal */}
                <div className="flex flex-1 flex-col">
                    <main className="flex-1 p-6">{children}</main>

                    {/* Footer */}
                    <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
                        <PoweredBy />
                    </footer>
                </div>
            </div>
        </>
    );
}
```

### Admin footer : credit conditionnel

Le composant `PoweredBy` (section 6) gere l'affichage conditionnel : si `show_cms_credit` est `true` (defaut), le credit est affiche. L'utilisateur peut le masquer via le toggle dans les settings.

### Favicon dynamique

```tsx
// resources/js/components/branding/dynamic-favicon.tsx
import { useEffect } from 'react';
import { useBranding } from '@/hooks/use-branding';

export function DynamicFavicon() {
    const { favicon } = useBranding();

    useEffect(() => {
        if (!favicon) return;

        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = favicon;
    }, [favicon]);

    return null;
}
```

Ce composant est monte dans le layout racine de l'application pour que le favicon soit toujours a jour.

---

## 5. CSS Variables pour le branding

Les couleurs de branding sont injectees comme CSS variables dans le `<head>` du layout admin. Cela permet a tous les composants UI (shadcn/ui, Tailwind) de s'adapter automatiquement.

### Injection cote serveur (Blade)

```blade
{{-- resources/views/app.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Branding CSS variables --}}
    @php
        $branding = app(\App\Services\BrandingService::class);
    @endphp
    <style>
        :root {
            --brand-primary: {{ $branding->getPrimaryColor() }};
            --brand-accent: {{ $branding->getAccentColor() }};
        }
    </style>

    {{-- Custom CSS admin --}}
    @if($branding->getCustomCss())
        <style>{!! $branding->getCustomCss() !!}</style>
    @endif

    {{-- Favicon dynamique --}}
    @if($branding->getFavicon())
        <link rel="icon" href="{{ $branding->getFavicon() }}" />
    @endif

    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
```

### Variables CSS disponibles

```css
:root {
    /* Couleurs de branding — surchargeables via les settings */
    --brand-primary: var(--cms-brand-primary, #3b82f6);
    --brand-accent: var(--cms-brand-accent, #8b5cf6);

    /* Variantes derivees automatiquement */
    --brand-primary-foreground: #ffffff;
    --brand-primary-hover: color-mix(in srgb, var(--brand-primary) 85%, black);
    --brand-primary-light: color-mix(in srgb, var(--brand-primary) 15%, white);
    --brand-accent-hover: color-mix(in srgb, var(--brand-accent) 85%, black);
    --brand-accent-light: color-mix(in srgb, var(--brand-accent) 15%, white);
}
```

### Integration avec Tailwind CSS v4

```css
/* resources/css/app.css */
@theme {
    --color-brand-primary: var(--brand-primary);
    --color-brand-accent: var(--brand-accent);
    --color-brand-primary-hover: var(--brand-primary-hover);
    --color-brand-accent-hover: var(--brand-accent-hover);
    --color-brand-primary-light: var(--brand-primary-light);
    --color-brand-accent-light: var(--brand-accent-light);
}
```

Utilisation dans les composants :

```tsx
<button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
    Enregistrer
</button>

<a className="text-brand-accent hover:text-brand-accent-hover">
    Voir les details
</a>
```

---

## 6. React components

### Hook useBranding

Le hook `useBranding()` lit les donnees de branding depuis les shared props Inertia et les expose avec une API typee.

```tsx
// resources/js/hooks/use-branding.ts
import { usePage } from '@inertiajs/react';

interface BrandingLoginConfig {
    background_image: string | null;
    welcome_message: string | null;
    logo: string | null;
    logo_dark: string | null;
    brand_name: string;
    primary_color: string;
}

interface BrandingData {
    brand_name: string;
    logo: string | null;
    logo_dark: string | null;
    favicon: string | null;
    primary_color: string;
    accent_color: string;
    footer_text: string | null;
    show_cms_credit: boolean;
    custom_css: string | null;
    login: BrandingLoginConfig;
}

interface PageProps {
    branding: BrandingData;
    [key: string]: unknown;
}

export function useBranding(): BrandingData {
    const { branding } = usePage<PageProps>().props;

    return {
        brand_name: branding.brand_name ?? 'ArtisanCMS',
        logo: branding.logo ?? null,
        logo_dark: branding.logo_dark ?? null,
        favicon: branding.favicon ?? null,
        primary_color: branding.primary_color ?? '#3b82f6',
        accent_color: branding.accent_color ?? '#8b5cf6',
        footer_text: branding.footer_text ?? null,
        show_cms_credit: branding.show_cms_credit ?? true,
        custom_css: branding.custom_css ?? null,
        login: branding.login ?? {
            background_image: null,
            welcome_message: null,
            logo: null,
            logo_dark: null,
            brand_name: 'ArtisanCMS',
            primary_color: '#3b82f6',
        },
    };
}
```

### BrandLogo

Composant qui affiche le logo custom ou, a defaut, le nom de la marque en texte.

```tsx
// resources/js/components/branding/brand-logo.tsx
import { useBranding } from '@/hooks/use-branding';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    className?: string;
    variant?: 'light' | 'dark' | 'auto';
}

export function BrandLogo({ className, variant = 'auto' }: BrandLogoProps) {
    const { brand_name, logo, logo_dark } = useBranding();

    // Selectionner le bon logo selon le variant
    const logoUrl = variant === 'dark' && logo_dark
        ? logo_dark
        : variant === 'light'
            ? logo
            : logo; // 'auto' utilise le logo principal par defaut

    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt={brand_name}
                className={cn('object-contain', className)}
            />
        );
    }

    // Fallback : nom de la marque en texte
    return (
        <span className={cn('text-xl font-bold tracking-tight', className)}>
            {brand_name}
        </span>
    );
}
```

### PoweredBy

Composant conditionnel : affiche le credit "Propulse par ArtisanCMS" uniquement si `show_cms_credit` est `true` (defaut). Le texte custom du footer est affiche independamment.

```tsx
// resources/js/components/branding/powered-by.tsx
import { useBranding } from '@/hooks/use-branding';
import { useTranslation } from '@/hooks/use-translation';

export function PoweredBy() {
    const { footer_text, show_cms_credit } = useBranding();
    const { t } = useTranslation();

    // Si aucun texte custom et credit desactive, ne rien afficher
    if (!footer_text && !show_cms_credit) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
            {/* Texte custom du footer */}
            {footer_text && <span>{footer_text}</span>}

            {/* Separateur si les deux sont presents */}
            {footer_text && show_cms_credit && (
                <span className="mx-1">&mdash;</span>
            )}

            {/* Credit ArtisanCMS (toggle, affiche par defaut) */}
            {show_cms_credit && (
                <span>
                    {t('branding.powered_by', { name: 'ArtisanCMS' })}
                </span>
            )}
        </div>
    );
}
```

**Comportement du toggle `show_cms_credit` :**

| `show_cms_credit` | `footer_text` | Rendu |
|-------------------|---------------|-------|
| `true` (defaut) | `null` | "Propulse par ArtisanCMS" |
| `true` | `"Agence XYZ"` | "Agence XYZ — Propulse par ArtisanCMS" |
| `false` | `"Agence XYZ"` | "Agence XYZ" |
| `false` | `null` | *(rien)* |

### BrandingSettingsForm

```tsx
// resources/js/pages/Admin/Settings/Branding.tsx
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaPicker } from '@/components/media-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { BrandLogo } from '@/components/branding/brand-logo';
import { PoweredBy } from '@/components/branding/powered-by';
import { useTranslation } from '@/hooks/use-translation';

interface BrandingSettings {
    brand_name: string | null;
    brand_logo: string | null;
    brand_logo_dark: string | null;
    brand_favicon: string | null;
    brand_color_primary: string;
    brand_color_accent: string;
    login_background_image: string | null;
    login_welcome_message: string | null;
    admin_footer_text: string | null;
    show_cms_credit: boolean;
    custom_css_admin: string | null;
}

interface Props {
    branding: BrandingSettings;
}

export default function BrandingSettingsPage({ branding }: Props) {
    const { t } = useTranslation();

    const { data, setData, put, processing, errors } = useForm<BrandingSettings>({
        brand_name: branding.brand_name ?? '',
        brand_logo: branding.brand_logo,
        brand_logo_dark: branding.brand_logo_dark,
        brand_favicon: branding.brand_favicon,
        brand_color_primary: branding.brand_color_primary ?? '#3b82f6',
        brand_color_accent: branding.brand_color_accent ?? '#8b5cf6',
        login_background_image: branding.login_background_image,
        login_welcome_message: branding.login_welcome_message ?? '',
        admin_footer_text: branding.admin_footer_text ?? '',
        show_cms_credit: branding.show_cms_credit ?? true,
        custom_css_admin: branding.custom_css_admin ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(route('admin.settings.branding.update'));
    }

    function handleExport() {
        window.location.href = route('admin.settings.branding.export');
    }

    function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        router.post(route('admin.settings.branding.import'), formData);
    }

    return (
        <AdminLayout>
            <Head title={t('branding.page_title')} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('branding.page_title')}</h1>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleExport}>
                            {t('branding.export')}
                        </Button>
                        <label>
                            <Button type="button" variant="outline" asChild>
                                <span>{t('branding.import')}</span>
                            </Button>
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleImport}
                            />
                        </label>
                    </div>
                </div>

                {/* --- Identite de marque --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('branding.identity')}</CardTitle>
                        <CardDescription>{t('branding.identity_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="brand_name">{t('branding.brand_name')}</Label>
                            <Input
                                id="brand_name"
                                value={data.brand_name ?? ''}
                                onChange={(e) => setData('brand_name', e.target.value)}
                                placeholder="ArtisanCMS"
                            />
                            {errors.brand_name && (
                                <p className="text-sm text-destructive">{errors.brand_name}</p>
                            )}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{t('branding.logo')}</Label>
                                <MediaPicker
                                    value={data.brand_logo}
                                    onChange={(url) => setData('brand_logo', url)}
                                    accept="image/*"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('branding.logo_dark')}</Label>
                                <MediaPicker
                                    value={data.brand_logo_dark}
                                    onChange={(url) => setData('brand_logo_dark', url)}
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('branding.favicon')}</Label>
                            <MediaPicker
                                value={data.brand_favicon}
                                onChange={(url) => setData('brand_favicon', url)}
                                accept="image/x-icon,image/png,image/svg+xml"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* --- Couleurs --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('branding.colors')}</CardTitle>
                        <CardDescription>{t('branding.colors_description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{t('branding.color_primary')}</Label>
                                <ColorPicker
                                    value={data.brand_color_primary}
                                    onChange={(color) => setData('brand_color_primary', color)}
                                />
                                {errors.brand_color_primary && (
                                    <p className="text-sm text-destructive">
                                        {errors.brand_color_primary}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>{t('branding.color_accent')}</Label>
                                <ColorPicker
                                    value={data.brand_color_accent}
                                    onChange={(color) => setData('brand_color_accent', color)}
                                />
                                {errors.brand_color_accent && (
                                    <p className="text-sm text-destructive">
                                        {errors.brand_color_accent}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Preview des couleurs en temps reel */}
                        <div className="mt-6 rounded-lg border p-4">
                            <p className="mb-3 text-sm font-medium text-muted-foreground">
                                {t('branding.preview')}
                            </p>
                            <div className="flex gap-3">
                                <div
                                    className="flex h-10 items-center rounded-md px-4 text-sm font-medium text-white"
                                    style={{ backgroundColor: data.brand_color_primary }}
                                >
                                    {t('branding.primary_button')}
                                </div>
                                <div
                                    className="flex h-10 items-center rounded-md px-4 text-sm font-medium text-white"
                                    style={{ backgroundColor: data.brand_color_accent }}
                                >
                                    {t('branding.accent_button')}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- Page de connexion --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('branding.login_page')}</CardTitle>
                        <CardDescription>{t('branding.login_page_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>{t('branding.login_background')}</Label>
                            <MediaPicker
                                value={data.login_background_image}
                                onChange={(url) => setData('login_background_image', url)}
                                accept="image/*"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="login_welcome_message">
                                {t('branding.login_welcome')}
                            </Label>
                            <Input
                                id="login_welcome_message"
                                value={data.login_welcome_message ?? ''}
                                onChange={(e) => setData('login_welcome_message', e.target.value)}
                                placeholder={t('branding.login_welcome_placeholder')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* --- Footer et credit --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('branding.footer')}</CardTitle>
                        <CardDescription>{t('branding.footer_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="admin_footer_text">
                                {t('branding.footer_text')}
                            </Label>
                            <Input
                                id="admin_footer_text"
                                value={data.admin_footer_text ?? ''}
                                onChange={(e) => setData('admin_footer_text', e.target.value)}
                                placeholder={t('branding.footer_text_placeholder')}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                                <Label htmlFor="show_cms_credit">
                                    {t('branding.show_credit')}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('branding.show_credit_description')}
                                </p>
                            </div>
                            <Switch
                                id="show_cms_credit"
                                checked={data.show_cms_credit}
                                onCheckedChange={(checked) => setData('show_cms_credit', checked)}
                            />
                        </div>

                        {/* Preview du footer */}
                        <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide">
                                {t('branding.footer_preview')}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                {data.admin_footer_text && (
                                    <span>{data.admin_footer_text}</span>
                                )}
                                {data.admin_footer_text && data.show_cms_credit && (
                                    <span>&mdash;</span>
                                )}
                                {data.show_cms_credit && (
                                    <span>{t('branding.powered_by', { name: 'ArtisanCMS' })}</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- CSS personnalise --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('branding.custom_css')}</CardTitle>
                        <CardDescription>{t('branding.custom_css_description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={data.custom_css_admin ?? ''}
                            onChange={(e) => setData('custom_css_admin', e.target.value)}
                            placeholder={t('branding.custom_css_placeholder')}
                            className="min-h-[200px] font-mono text-sm"
                        />
                        {errors.custom_css_admin && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.custom_css_admin}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* --- Bouton de sauvegarde --- */}
                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? t('common.saving') : t('common.save')}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
```

---

## 7. Export/Import branding

L'export et l'import permettent aux agences de repliquer rapidement une configuration de branding d'un site a un autre.

### Format du fichier JSON exporte

```json
{
    "version": "1.0",
    "exported_at": "2026-03-10T14:30:00+01:00",
    "branding": {
        "brand_name": "Agence XYZ",
        "brand_color_primary": "#1e40af",
        "brand_color_accent": "#7c3aed",
        "login_welcome_message": "Bienvenue sur votre espace client",
        "admin_footer_text": "Agence XYZ - Support: support@agence-xyz.fr",
        "show_cms_credit": true,
        "custom_css_admin": ".sidebar { border-radius: 0; }"
    }
}
```

### Ce qui est exporte / ce qui ne l'est pas

| Donnee | Exportee | Raison |
|--------|----------|--------|
| `brand_name` | Oui | Texte simple |
| `brand_color_primary` | Oui | Texte simple |
| `brand_color_accent` | Oui | Texte simple |
| `login_welcome_message` | Oui | Texte simple |
| `admin_footer_text` | Oui | Texte simple |
| `show_cms_credit` | Oui | Boolean |
| `custom_css_admin` | Oui | Texte simple |
| `brand_logo` | Non | Reference a un fichier media local |
| `brand_logo_dark` | Non | Reference a un fichier media local |
| `brand_favicon` | Non | Reference a un fichier media local |
| `login_background_image` | Non | Reference a un fichier media local |

**Note :** Les images ne sont pas exportees car elles referencent des fichiers dans la media library locale. Apres import, l'utilisateur doit re-uploader les images via l'interface. Une evolution future pourrait inclure un export ZIP avec les assets.

### Flux d'import

1. L'utilisateur selectionne un fichier `.json` via le bouton "Importer"
2. Le fichier est valide (format JSON, structure attendue)
3. Seules les cles textuelles sont importees (pas les images)
4. Le cache de branding est vide
5. La page se recharge avec les nouvelles valeurs

---

## 8. Multisite considerations

Lorsque le multisite est active (Blueprint 16), chaque site dispose de son propre branding independant.

### Scoping par site_id

La table `settings` possede deja un `site_id` (ajoute par la migration multisite du Blueprint 16). Le `BrandingService` doit etre conscient du site courant :

```php
// app/Services/BrandingService.php — version multisite
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class BrandingService
{
    protected const CACHE_TTL = 3600;

    /**
     * Recuperer la cle de cache scopee par site
     */
    protected function getCacheKey(): string
    {
        $siteId = app()->bound('current_site')
            ? app('current_site')->id
            : 'global';

        return "cms.branding.site.{$siteId}";
    }

    /**
     * Charger les settings de branding pour le site courant
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return Cache::remember($this->getCacheKey(), self::CACHE_TTL, function () {
            $query = Setting::where('group', 'branding');

            // Si multisite actif, scoper par site_id
            if (app()->bound('current_site')) {
                $query->where('site_id', app('current_site')->id);
            }

            $settings = $query->get();

            $result = [];
            foreach ($settings as $setting) {
                $result[$setting->key] = $this->castValue($setting->value, $setting->type);
            }

            return $result;
        });
    }

    /**
     * Vider le cache pour le site courant
     */
    public function clearCache(): void
    {
        Cache::forget($this->getCacheKey());
    }

    // ... les autres methodes restent identiques
}
```

### Isolation du branding entre sites

```
┌────────────────────────────────────┐
│    Installation ArtisanCMS         │
│                                    │
│  ┌──────────┐  ┌──────────┐       │
│  │  Site A   │  │  Site B   │      │
│  │ Logo: X   │  │ Logo: Y   │      │
│  │ Couleur:  │  │ Couleur:  │      │
│  │  #1e40af  │  │  #dc2626  │      │
│  │ Credit:   │  │ Credit:   │      │
│  │  visible  │  │  masque   │      │
│  └──────────┘  └──────────┘       │
│                                    │
│  Meme code, meme DB,              │
│  branding different par site_id    │
└────────────────────────────────────┘
```

### Super admin : branding global

Le site principal (`is_primary = true`) peut definir un branding par defaut herite par les nouveaux sites. Chaque site peut ensuite surcharger les valeurs.

```php
// Logique de fallback dans BrandingService::all()
// Si une cle n'a pas de valeur pour le site courant,
// on utilise la valeur du site principal (branding par defaut)
public function allWithFallback(): array
{
    $siteSettings = $this->all();

    if (app()->bound('current_site') && !app('current_site')->is_primary) {
        $globalSettings = Cache::remember('cms.branding.site.global', self::CACHE_TTL, function () {
            return Setting::where('group', 'branding')
                ->whereNull('site_id')
                ->get()
                ->mapWithKeys(fn ($s) => [$s->key => $this->castValue($s->value, $s->type)])
                ->toArray();
        });

        // Merger : les settings du site surchargent les globales
        return array_merge($globalSettings, array_filter($siteSettings, fn ($v) => $v !== null));
    }

    return $siteSettings;
}
```

---

## 9. Traductions (i18n)

```php
// lang/fr/cms.php — section branding
'branding' => [
    'page_title'               => 'Personnalisation de la marque',
    'identity'                 => 'Identite de marque',
    'identity_description'     => 'Personnalisez le nom, le logo et le favicon de votre CMS.',
    'brand_name'               => 'Nom de la marque',
    'logo'                     => 'Logo principal',
    'logo_dark'                => 'Logo (mode sombre)',
    'favicon'                  => 'Favicon',
    'colors'                   => 'Couleurs',
    'colors_description'       => 'Definissez les couleurs principales de l\'interface d\'administration.',
    'color_primary'            => 'Couleur principale',
    'color_accent'             => 'Couleur d\'accent',
    'preview'                  => 'Apercu',
    'primary_button'           => 'Bouton principal',
    'accent_button'            => 'Bouton accent',
    'login_page'               => 'Page de connexion',
    'login_page_description'   => 'Personnalisez l\'apparence de la page de connexion.',
    'login_background'         => 'Image de fond',
    'login_welcome'            => 'Message d\'accueil',
    'login_welcome_placeholder'=> 'Bienvenue sur votre espace de gestion',
    'footer'                   => 'Footer',
    'footer_description'       => 'Personnalisez le pied de page de l\'interface d\'administration.',
    'footer_text'              => 'Texte du footer',
    'footer_text_placeholder'  => 'Votre agence - support@exemple.fr',
    'footer_preview'           => 'Apercu du footer',
    'show_credit'              => 'Afficher le credit ArtisanCMS',
    'show_credit_description'  => 'Affiche "Propulse par ArtisanCMS" dans le footer. Vous pouvez choisir de le montrer ou de le masquer.',
    'powered_by'               => 'Propulse par :name',
    'custom_css'               => 'CSS personnalise',
    'custom_css_description'   => 'Injectez du CSS custom dans l\'interface d\'administration. Attention : du CSS invalide peut casser l\'affichage.',
    'custom_css_placeholder'   => '/* Votre CSS personnalise ici */',
    'export'                   => 'Exporter',
    'import'                   => 'Importer',
    'updated'                  => 'Branding mis a jour avec succes.',
    'imported'                 => 'Configuration de branding importee avec succes.',
    'import_invalid'           => 'Le fichier importe est invalide.',
    'invalid_color'            => 'Le format de couleur doit etre hexadecimal (#RRGGBB).',
],
```

```php
// lang/en/cms.php — section branding
'branding' => [
    'page_title'               => 'Brand Customization',
    'identity'                 => 'Brand Identity',
    'identity_description'     => 'Customize the name, logo and favicon of your CMS.',
    'brand_name'               => 'Brand Name',
    'logo'                     => 'Main Logo',
    'logo_dark'                => 'Logo (Dark Mode)',
    'favicon'                  => 'Favicon',
    'colors'                   => 'Colors',
    'colors_description'       => 'Set the main colors of the admin interface.',
    'color_primary'            => 'Primary Color',
    'color_accent'             => 'Accent Color',
    'preview'                  => 'Preview',
    'primary_button'           => 'Primary Button',
    'accent_button'            => 'Accent Button',
    'login_page'               => 'Login Page',
    'login_page_description'   => 'Customize the appearance of the login page.',
    'login_background'         => 'Background Image',
    'login_welcome'            => 'Welcome Message',
    'login_welcome_placeholder'=> 'Welcome to your management area',
    'footer'                   => 'Footer',
    'footer_description'       => 'Customize the admin interface footer.',
    'footer_text'              => 'Footer Text',
    'footer_text_placeholder'  => 'Your agency - support@example.com',
    'footer_preview'           => 'Footer Preview',
    'show_credit'              => 'Show ArtisanCMS Credit',
    'show_credit_description'  => 'Displays "Powered by ArtisanCMS" in the footer. You can choose to show or hide it.',
    'powered_by'               => 'Powered by :name',
    'custom_css'               => 'Custom CSS',
    'custom_css_description'   => 'Inject custom CSS into the admin interface. Warning: invalid CSS may break the layout.',
    'custom_css_placeholder'   => '/* Your custom CSS here */',
    'export'                   => 'Export',
    'import'                   => 'Import',
    'updated'                  => 'Branding updated successfully.',
    'imported'                 => 'Branding configuration imported successfully.',
    'import_invalid'           => 'The imported file is invalid.',
    'invalid_color'            => 'Color format must be hexadecimal (#RRGGBB).',
],
```

---

## 10. Integration dans le menu admin

```php
// Dans CMSServiceProvider::boot() ou via le hook system
CMS::hook('admin_sidebar', function (&$items) {
    // Ajouter dans le sous-menu Settings
    $items[] = [
        'label'      => __('cms.branding.page_title'),
        'icon'       => 'palette',           // Icone Lucide
        'url'        => '/admin/settings/branding',
        'parent'     => 'settings',          // Sous-menu de Settings
        'position'   => 20,
        'permission' => 'settings.manage',
    ];
});
```

---

## 11. Securite

### Sanitisation du CSS custom

Le CSS custom injecte dans l'admin est un vecteur potentiel d'attaque XSS. La methode `sanitizeCustomCss()` du `BrandingService` retire les constructions dangereuses :

- `expression()` — execution de JavaScript dans les anciennes versions d'IE
- `javascript:` — protocole dangereux dans les `url()`
- `@import` — chargement de feuilles de style externes
- `behavior:` — execution de scripts via HTC (IE)
- `-moz-binding:` — execution de scripts via XBL (ancien Firefox)
- `url(data:...)` / `url(vbscript:...)` — protocoles dangereux

### Validation des couleurs

Les couleurs sont validees par regex dans le `UpdateBrandingRequest` pour n'accepter que le format hexadecimal `#RRGGBB`.

### Permissions

Seuls les utilisateurs avec la permission `settings.manage` peuvent acceder a la page de branding. Cette permission est typiquement reservee aux administrateurs.

---

## 12. Relations avec les autres blueprints

| Blueprint | Relation |
|-----------|----------|
| **01 - Database Schema** | Utilise la table `settings` avec le groupe `branding` |
| **05 - Laravel Inertia** | Partage les donnees via `HandleInertiaRequests::share()` |
| **10 - Security** | Sanitisation du CSS custom, permissions `settings.manage` |
| **13 - Cache** | Cache des settings de branding (TTL 1h, invalidation a la mise a jour) |
| **14 - i18n** | Toutes les chaines passent par le systeme de traduction |
| **16 - Multisite** | Branding scope par `site_id` si multisite actif |
| **20 - Activity Log** | Les modifications de branding sont tracees via `logSettingsUpdated()` |

---

## 13. Checklist d'implementation

### Phase 1 (Fondations)
- [ ] Seeder `BrandingSettingsSeeder` cree et execute
- [ ] Service `BrandingService` cree dans `app/Services/`
- [ ] Methodes : `all()`, `get()`, `getBrandName()`, `getLogo()`, `getLoginConfig()`, `getFooterHtml()`, `shouldShowCredit()`
- [ ] Cache integre avec invalidation
- [ ] Integration dans `HandleInertiaRequests::share()` via lazy loading

### Phase 2 (Interface admin)
- [ ] `UpdateBrandingRequest` cree avec validation des couleurs
- [ ] `BrandingSettingsController` cree (edit, update, export, import)
- [ ] Routes enregistrees dans `routes/admin.php`
- [ ] Page Inertia `Admin/Settings/Branding.tsx` avec formulaire complet
- [ ] Preview en temps reel des couleurs et du footer
- [ ] Integration dans le menu sidebar admin (sous-menu Settings)

### Phase 3 (Composants React)
- [ ] Hook `useBranding()` cree dans `resources/js/hooks/`
- [ ] Composant `BrandLogo` cree
- [ ] Composant `PoweredBy` cree avec logique conditionnelle
- [ ] Composant `DynamicFavicon` cree
- [ ] Integration dans `AdminLayout` (sidebar, footer)
- [ ] Integration dans la page Login (logo, couleurs, message, fond)

### Phase 4 (CSS et theming)
- [ ] CSS variables `--brand-primary` et `--brand-accent` injectees dans le layout Blade
- [ ] Integration avec Tailwind CSS v4 via `@theme`
- [ ] CSS custom injecte dans le `<head>` admin
- [ ] Sanitisation du CSS custom implementee

### Phase 5 (Export/Import)
- [ ] Export JSON fonctionnel via endpoint GET
- [ ] Import JSON fonctionnel via upload de fichier
- [ ] Validation du format JSON a l'import
- [ ] Images exclues de l'export (avec note a l'utilisateur)

### Phase 6 (Multisite)
- [ ] `BrandingService` scope par `site_id` quand multisite actif
- [ ] Cache scope par site
- [ ] Fallback vers le branding global pour les nouvelles cles

### Phase 7 (Traductions et tests)
- [ ] Fichier `lang/fr/cms.php` section branding complete
- [ ] Fichier `lang/en/cms.php` section branding complete
- [ ] Tests unitaires pour `BrandingService`
- [ ] Tests Feature pour `BrandingSettingsController` (edit, update, export, import)
- [ ] Tests pour la sanitisation du CSS custom
