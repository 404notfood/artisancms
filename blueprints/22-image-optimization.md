# Blueprint 22 - Pipeline d'optimisation d'images

## Vue d'ensemble
L'optimisation d'images est intégrée au **core** (MediaService). Chaque image uploadée passe par un pipeline automatique : compression, conversion WebP, génération de tailles responsive, suppression EXIF.

---

## 1. Dépendances

```bash
composer require intervention/image-laravel
# Intervention Image v3 pour Laravel (GD ou Imagick)
```

---

## 2. Configuration

```php
// config/cms.php — section media
'media' => [
    'max_upload_size' => 10 * 1024 * 1024,  // 10 Mo
    'image' => [
        'driver' => 'gd',                    // gd ou imagick
        'quality' => 80,                      // Qualité JPEG/WebP (0-100)
        'webp' => true,                       // Générer une version WebP
        'avif' => false,                      // AVIF (nécessite Imagick + libavif)
        'strip_exif' => true,                 // Supprimer les métadonnées EXIF
        'max_dimension' => 2400,              // Redimensionner si > 2400px de large
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
    'allowed_types' => [
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
        'video' => ['mp4', 'webm'],
        'audio' => ['mp3', 'wav'],
    ],
],
```

---

## 3. Pipeline de traitement

```php
// app/Services/ImageOptimizer.php
<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageOptimizer
{
    protected ImageManager $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Traiter une image uploadée : optimiser + générer les variantes
     */
    public function process(UploadedFile $file, string $basePath): array
    {
        $config = config('cms.media.image');
        $image = $this->manager->read($file->getRealPath());
        $results = [];

        // 1. Supprimer EXIF
        if ($config['strip_exif']) {
            // Intervention v3 gère ça automatiquement via encode
        }

        // 2. Redimensionner si trop grand
        $width = $image->width();
        $height = $image->height();
        $maxDim = $config['max_dimension'];

        if ($width > $maxDim || $height > $maxDim) {
            $image->scaleDown($maxDim, $maxDim);
            $width = $image->width();
            $height = $image->height();
        }

        // 3. Sauvegarder l'original optimisé (JPEG/PNG)
        $originalPath = "{$basePath}.jpg";
        $encoded = $image->toJpeg($config['quality']);
        Storage::disk('public')->put($originalPath, (string) $encoded);
        $results['original'] = $originalPath;

        // 4. Générer la version WebP
        if ($config['webp']) {
            $webpPath = "{$basePath}.webp";
            $webpEncoded = $image->toWebp($config['quality']);
            Storage::disk('public')->put($webpPath, (string) $webpEncoded);
            $results['webp'] = $webpPath;
        }

        // 5. Générer les tailles responsive
        foreach ($config['responsive_sizes'] as $suffix => $targetWidth) {
            if ($width > $targetWidth) {
                $resized = $this->manager->read($file->getRealPath())
                    ->scaleDown($targetWidth);

                $responsivePath = "{$basePath}_{$suffix}.jpg";
                Storage::disk('public')->put($responsivePath, (string) $resized->toJpeg($config['quality']));
                $results["responsive_{$suffix}"] = $responsivePath;

                if ($config['webp']) {
                    $responsiveWebp = "{$basePath}_{$suffix}.webp";
                    Storage::disk('public')->put($responsiveWebp, (string) $resized->toWebp($config['quality']));
                    $results["responsive_{$suffix}_webp"] = $responsiveWebp;
                }
            }
        }

        // 6. Générer les thumbnails
        foreach ($config['thumbnails'] as $name => $thumbConfig) {
            $thumb = $this->manager->read($file->getRealPath());

            if ($thumbConfig['fit'] === 'crop') {
                $thumb->cover($thumbConfig['width'], $thumbConfig['height']);
            } else {
                $thumb->scaleDown($thumbConfig['width'], $thumbConfig['height']);
            }

            $thumbPath = "{$basePath}_{$name}.jpg";
            Storage::disk('public')->put($thumbPath, (string) $thumb->toJpeg($config['quality']));
            $results["thumb_{$name}"] = $thumbPath;
        }

        // 7. Métadonnées
        $results['metadata'] = [
            'width' => $width,
            'height' => $height,
            'original_size' => $file->getSize(),
            'optimized_size' => Storage::disk('public')->size($originalPath),
            'savings_percent' => round((1 - Storage::disk('public')->size($originalPath) / $file->getSize()) * 100, 1),
        ];

        return $results;
    }
}
```

---

## 4. Intégration dans MediaService

```php
// app/Services/MediaService.php
public function upload(UploadedFile $file, string $folder = '/'): Media
{
    $this->validateFile($file);

    $hash = Str::random(32);
    $date = now()->format('Y/m');
    $basePath = "media/{$date}/{$hash}";

    $isImage = str_starts_with($file->getMimeType(), 'image/')
        && $file->getMimeType() !== 'image/svg+xml';

    if ($isImage) {
        // Pipeline d'optimisation
        $results = app(ImageOptimizer::class)->process($file, $basePath);
        $path = $results['original'];
        $metadata = $results['metadata'];
        $thumbnails = [
            'thumb' => $results['thumb_thumb'] ?? null,
            'medium' => $results['thumb_medium'] ?? null,
            'large' => $results['thumb_large'] ?? null,
        ];
        $responsive = array_filter($results, fn ($k) => str_starts_with($k, 'responsive_'), ARRAY_FILTER_USE_KEY);
    } else {
        // Fichier non-image : stocker directement
        $ext = $file->guessExtension() ?? 'bin';
        $path = "{$basePath}.{$ext}";
        Storage::disk('public')->putFileAs('', $file, $path);
        $metadata = [];
        $thumbnails = [];
        $responsive = [];
    }

    return Media::create([
        'filename' => basename($path),
        'original_filename' => $file->getClientOriginalName(),
        'path' => $path,
        'disk' => 'public',
        'mime_type' => $file->getMimeType(),
        'size' => $file->getSize(),
        'metadata' => array_merge($metadata, ['responsive' => $responsive]),
        'thumbnails' => $thumbnails,
        'folder' => $folder,
        'uploaded_by' => auth()->id(),
    ]);
}
```

---

## 5. Rendu responsive dans les blocs

```tsx
// packages/blocks/src/renderers/ImageRenderer.tsx
interface ImageRendererProps {
    src: string;
    alt: string;
    responsive?: Record<string, string>;  // { sm: "/path_sm.jpg", md: "/path_md.jpg", ... }
    webp?: string;                         // Version WebP
    objectFit?: 'cover' | 'contain' | 'fill';
    styles?: React.CSSProperties;
}

export function ImageRenderer({ src, alt, responsive, webp, objectFit, styles }: ImageRendererProps) {
    // Construire le srcset
    const srcSet = responsive
        ? Object.entries(responsive)
            .map(([size, path]) => {
                const widths: Record<string, number> = { sm: 320, md: 640, lg: 1024, xl: 1920 };
                return `${path} ${widths[size] || 800}w`;
            })
            .join(', ')
        : undefined;

    if (webp) {
        return (
            <picture>
                <source srcSet={webp} type="image/webp" />
                <img
                    src={src}
                    srcSet={srcSet}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    style={{ objectFit, ...styles }}
                />
            </picture>
        );
    }

    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            alt={alt}
            loading="lazy"
            decoding="async"
            style={{ objectFit, ...styles }}
        />
    );
}
```

---

## 6. Commande de ré-optimisation

```bash
# Ré-optimiser toutes les images existantes (après changement de config)
php artisan cms:media:optimize --all
php artisan cms:media:optimize --id=42
php artisan cms:media:optimize --missing  # Seulement les variantes manquantes
```

---

## 7. Gains attendus

| Métrique | Avant | Après |
|----------|-------|-------|
| Taille moyenne d'une image hero | 2.5 Mo | ~200 Ko (WebP) |
| Lighthouse Performance | ~60 | ≥ 90 |
| LCP (Largest Contentful Paint) | > 4s | < 2.5s |
| Nombre de requêtes images | 1 par image | 1 (WebP avec fallback) |
