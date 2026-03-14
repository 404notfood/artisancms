<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageOptimizer
{
    /**
     * Process an uploaded image: optimize, generate responsive sizes and thumbnails.
     *
     * @return array<string, mixed> Paths and metadata of generated files
     */
    public function process(UploadedFile $file, string $basePath): array
    {
        $config = config('cms.media.image', []);
        $quality = $config['quality'] ?? 80;
        $maxDimension = $config['max_dimension'] ?? 2400;
        $results = [];

        $originalExtension = strtolower($file->getClientOriginalExtension());
        if (in_array($originalExtension, ['svg', 'gif'])) {
            $path = "{$basePath}.{$originalExtension}";
            Storage::disk('public')->putFileAs('', $file, $path);
            $results['original'] = $path;
            $results['metadata'] = [
                'width' => null,
                'height' => null,
                'original_size' => $file->getSize(),
                'optimized_size' => $file->getSize(),
                'savings_percent' => 0,
            ];

            return $results;
        }

        if (!extension_loaded('gd')) {
            $path = "{$basePath}.{$originalExtension}";
            Storage::disk('public')->putFileAs('', $file, $path);
            $results['original'] = $path;
            $results['metadata'] = [
                'width' => null,
                'height' => null,
                'original_size' => $file->getSize(),
                'optimized_size' => $file->getSize(),
                'savings_percent' => 0,
            ];

            return $results;
        }

        $sourceImage = $this->createFromFile($file->getRealPath(), $file->getMimeType());
        if (!$sourceImage) {
            $path = "{$basePath}.{$originalExtension}";
            Storage::disk('public')->putFileAs('', $file, $path);
            $results['original'] = $path;
            $results['metadata'] = [
                'width' => null,
                'height' => null,
                'original_size' => $file->getSize(),
                'optimized_size' => $file->getSize(),
                'savings_percent' => 0,
            ];

            return $results;
        }

        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        // Resize if too large
        if ($width > $maxDimension || $height > $maxDimension) {
            $sourceImage = $this->scaleDown($sourceImage, $width, $height, $maxDimension);
            $width = imagesx($sourceImage);
            $height = imagesy($sourceImage);
        }

        // Strip EXIF by re-encoding
        if ($config['strip_exif'] ?? true) {
            // Re-encoding via GD automatically strips EXIF
        }

        // Save optimized original as JPEG
        $originalPath = "{$basePath}.jpg";
        $this->saveAsJpeg($sourceImage, $originalPath, $quality);
        $results['original'] = $originalPath;

        // Generate WebP version
        if ($config['webp'] ?? true) {
            $webpPath = "{$basePath}.webp";
            $this->saveAsWebp($sourceImage, $webpPath, $quality);
            $results['webp'] = $webpPath;
        }

        // Generate responsive sizes
        $responsiveSizes = $config['responsive_sizes'] ?? ['sm' => 320, 'md' => 640, 'lg' => 1024, 'xl' => 1920];
        foreach ($responsiveSizes as $suffix => $targetWidth) {
            if ($width > $targetWidth) {
                $resized = $this->scaleDown($sourceImage, $width, $height, $targetWidth);

                $responsivePath = "{$basePath}_{$suffix}.jpg";
                $this->saveAsJpeg($resized, $responsivePath, $quality);
                $results["responsive_{$suffix}"] = $responsivePath;

                if ($config['webp'] ?? true) {
                    $responsiveWebp = "{$basePath}_{$suffix}.webp";
                    $this->saveAsWebp($resized, $responsiveWebp, $quality);
                    $results["responsive_{$suffix}_webp"] = $responsiveWebp;
                }

                imagedestroy($resized);
            }
        }

        // Generate thumbnails
        $thumbnails = $config['thumbnails'] ?? [
            'thumb' => ['width' => 150, 'height' => 150, 'fit' => 'crop'],
            'medium' => ['width' => 400, 'height' => 300, 'fit' => 'contain'],
            'large' => ['width' => 800, 'height' => 600, 'fit' => 'contain'],
        ];

        foreach ($thumbnails as $name => $thumbConfig) {
            $thumbWidth = $thumbConfig['width'];
            $thumbHeight = $thumbConfig['height'];
            $fit = $thumbConfig['fit'] ?? 'contain';

            if ($fit === 'crop') {
                $thumb = $this->cropToFit($sourceImage, $width, $height, $thumbWidth, $thumbHeight);
            } else {
                $thumb = $this->scaleToFit($sourceImage, $width, $height, $thumbWidth, $thumbHeight);
            }

            $thumbPath = "{$basePath}_{$name}.jpg";
            $this->saveAsJpeg($thumb, $thumbPath, $quality);
            $results["thumb_{$name}"] = $thumbPath;

            imagedestroy($thumb);
        }

        // Metadata
        $optimizedSize = Storage::disk('public')->size($originalPath);
        $originalSize = $file->getSize();
        $results['metadata'] = [
            'width' => $width,
            'height' => $height,
            'original_size' => $originalSize,
            'optimized_size' => $optimizedSize,
            'savings_percent' => $originalSize > 0
                ? round((1 - $optimizedSize / $originalSize) * 100, 1)
                : 0,
        ];

        imagedestroy($sourceImage);

        return $results;
    }

    /**
     * Create a GD image resource from a file path.
     *
     * @return \GdImage|false
     */
    private function createFromFile(string $path, ?string $mimeType): \GdImage|false
    {
        return match ($mimeType) {
            'image/jpeg' => imagecreatefromjpeg($path),
            'image/png' => imagecreatefrompng($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($path) : false,
            default => false,
        };
    }

    /**
     * Scale down an image maintaining aspect ratio.
     */
    private function scaleDown(\GdImage $image, int $width, int $height, int $maxDimension): \GdImage
    {
        $ratio = min($maxDimension / $width, $maxDimension / $height);
        $newWidth = (int) round($width * $ratio);
        $newHeight = (int) round($height * $ratio);

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        return $resized;
    }

    /**
     * Scale to fit within bounds maintaining aspect ratio.
     */
    private function scaleToFit(\GdImage $image, int $srcWidth, int $srcHeight, int $maxWidth, int $maxHeight): \GdImage
    {
        $ratio = min($maxWidth / $srcWidth, $maxHeight / $srcHeight);
        $ratio = min($ratio, 1.0); // Don't upscale
        $newWidth = (int) round($srcWidth * $ratio);
        $newHeight = (int) round($srcHeight * $ratio);

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $srcWidth, $srcHeight);

        return $resized;
    }

    /**
     * Crop to exact dimensions (center crop).
     */
    private function cropToFit(\GdImage $image, int $srcWidth, int $srcHeight, int $targetWidth, int $targetHeight): \GdImage
    {
        $ratio = max($targetWidth / $srcWidth, $targetHeight / $srcHeight);
        $tempWidth = (int) round($srcWidth * $ratio);
        $tempHeight = (int) round($srcHeight * $ratio);

        $temp = imagecreatetruecolor($tempWidth, $tempHeight);
        imagecopyresampled($temp, $image, 0, 0, 0, 0, $tempWidth, $tempHeight, $srcWidth, $srcHeight);

        $x = (int) round(($tempWidth - $targetWidth) / 2);
        $y = (int) round(($tempHeight - $targetHeight) / 2);

        $cropped = imagecreatetruecolor($targetWidth, $targetHeight);
        imagecopy($cropped, $temp, 0, 0, $x, $y, $targetWidth, $targetHeight);

        imagedestroy($temp);

        return $cropped;
    }

    /**
     * Save image as JPEG to storage.
     */
    private function saveAsJpeg(\GdImage $image, string $path, int $quality): void
    {
        ob_start();
        imagejpeg($image, null, $quality);
        $data = ob_get_clean();

        Storage::disk('public')->put($path, $data);
    }

    /**
     * Save image as WebP to storage.
     */
    private function saveAsWebp(\GdImage $image, string $path, int $quality): void
    {
        if (!function_exists('imagewebp')) {
            return;
        }

        ob_start();
        imagewebp($image, null, $quality);
        $data = ob_get_clean();

        Storage::disk('public')->put($path, $data);
    }
}
