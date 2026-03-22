<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Media;
use App\Services\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MediaOptimizeCommand extends Command
{
    protected $signature = 'cms:media:optimize
        {--all : Re-optimize all images}
        {--id= : Optimize a specific media by ID}
        {--missing : Only generate missing variants}';

    protected $description = 'Optimize media images (generate responsive sizes, WebP, thumbnails)';

    public function handle(ImageOptimizer $optimizer): int
    {
        if ($this->option('id')) {
            $media = Media::find($this->option('id'));
            if (!$media) {
                $this->error('Media not found.');

                return self::FAILURE;
            }

            $this->processMedia($media, $optimizer);

            return self::SUCCESS;
        }

        $query = Media::where('mime_type', 'like', 'image/%')
            ->where('mime_type', '!=', 'image/svg+xml');

        $count = $query->count();
        $this->info("Found {$count} images to process.");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $query->chunk(50, function ($medias) use ($optimizer, $bar): void {
            foreach ($medias as $media) {
                $this->processMedia($media, $optimizer);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Done.');

        return self::SUCCESS;
    }

    private function processMedia(Media $media, ImageOptimizer $optimizer): void
    {
        $disk = Storage::disk($media->disk ?? 'public');

        if (!$disk->exists($media->path)) {
            $this->warn("File not found: {$media->path}");

            return;
        }

        // For --missing flag, skip if metadata already has responsive sizes
        if ($this->option('missing') && !empty($media->metadata['responsive'] ?? [])) {
            return;
        }

        try {
            $fullPath = $disk->path($media->path);
            $basePath = preg_replace('/\.[^.]+$/', '', $media->path);

            $sourceImage = match ($media->mime_type) {
                'image/jpeg' => imagecreatefromjpeg($fullPath),
                'image/png' => imagecreatefrompng($fullPath),
                'image/webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($fullPath) : false,
                default => false,
            };

            if ($sourceImage === false) {
                $this->warn("  Cannot process: {$media->original_filename} (unsupported format)");

                return;
            }

            $config = config('cms.media.image', []);
            $quality = $config['quality'] ?? 80;
            $width = imagesx($sourceImage);
            $height = imagesy($sourceImage);

            // Generate responsive sizes
            $responsiveSizes = $config['responsive_sizes'] ?? ['sm' => 320, 'md' => 640, 'lg' => 1024, 'xl' => 1920];
            $responsive = [];
            foreach ($responsiveSizes as $suffix => $targetWidth) {
                if ($width > $targetWidth) {
                    $ratio = $targetWidth / $width;
                    $newHeight = (int) round($height * $ratio);
                    $resized = imagecreatetruecolor($targetWidth, $newHeight);
                    imagecopyresampled($resized, $sourceImage, 0, 0, 0, 0, $targetWidth, $newHeight, $width, $height);

                    $responsivePath = "{$basePath}_{$suffix}.jpg";
                    ob_start();
                    imagejpeg($resized, null, $quality);
                    $disk->put($responsivePath, ob_get_clean());
                    imagedestroy($resized);
                    $responsive[$suffix] = $responsivePath;
                }
            }

            // Generate WebP
            if (($config['webp'] ?? true) && function_exists('imagewebp')) {
                $webpPath = "{$basePath}.webp";
                ob_start();
                imagewebp($sourceImage, null, $quality);
                $disk->put($webpPath, ob_get_clean());
            }

            // Update metadata
            $metadata = $media->metadata ?? [];
            $metadata['width'] = $width;
            $metadata['height'] = $height;
            $metadata['responsive'] = $responsive;
            $media->update(['metadata' => $metadata]);

            imagedestroy($sourceImage);

            $this->line("  Optimized: {$media->original_filename} ({$width}x{$height})");
        } catch (\Throwable $e) {
            $this->error("  Error processing {$media->original_filename}: {$e->getMessage()}");
        }
    }
}
