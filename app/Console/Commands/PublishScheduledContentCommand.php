<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\CMS\Facades\CMS;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Console\Command;

class PublishScheduledContentCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'cms:publish-scheduled';

    /**
     * @var string
     */
    protected $description = 'Publier automatiquement les contenus planifies';

    public function handle(): int
    {
        $count = 0;

        $pages = Page::where('status', 'scheduled')
            ->where('published_at', '<=', now())
            ->get();

        foreach ($pages as $page) {
            $page->update(['status' => 'published']);
            CMS::fire('content.auto_published', $page);
            $count++;
        }

        $posts = Post::where('status', 'scheduled')
            ->where('published_at', '<=', now())
            ->get();

        foreach ($posts as $post) {
            $post->update(['status' => 'published']);
            CMS::fire('content.auto_published', $post);
            $count++;
        }

        if ($count > 0) {
            $this->info("{$count} contenu(s) planifie(s) publie(s) automatiquement.");
        } else {
            $this->info('Aucun contenu planifie a publier.');
        }

        return self::SUCCESS;
    }
}
