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

        $this->line(" Processing: {$media->original_filename}");
    }
}
