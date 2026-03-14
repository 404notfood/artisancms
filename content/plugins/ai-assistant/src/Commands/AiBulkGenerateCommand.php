<?php

declare(strict_types=1);

namespace AiAssistant\Commands;

use AiAssistant\Services\AiService;
use App\Models\Media;
use App\Models\Page;
use Illuminate\Console\Command;

class AiBulkGenerateCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ai:bulk-generate
        {--type=alt-text : Type de generation (alt-text, seo)}
        {--missing-only : Ne traiter que les entites sans donnees}
        {--status=published : Statut des pages pour le SEO}
        {--limit=50 : Nombre maximum d\'elements a traiter}';

    /**
     * The console command description.
     */
    protected $description = 'Generation en masse de contenu IA (alt text, meta SEO)';

    public function __construct(
        protected AiService $aiService,
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $type = $this->option('type');
        $limit = (int) $this->option('limit');

        return match ($type) {
            'alt-text' => $this->generateAltTexts($limit),
            'seo' => $this->generateSeoMetas($limit),
            default => $this->invalidType($type),
        };
    }

    /**
     * Generate alt texts for images missing them.
     */
    protected function generateAltTexts(int $limit): int
    {
        $query = Media::where('type', 'image');

        if ($this->option('missing-only')) {
            $query->where(function ($q) {
                $q->whereNull('alt_text')->orWhere('alt_text', '');
            });
        }

        $images = $query->limit($limit)->get();

        if ($images->isEmpty()) {
            $this->info('Aucune image a traiter.');
            return self::SUCCESS;
        }

        $this->info("Traitement de {$images->count()} image(s)...");
        $bar = $this->output->createProgressBar($images->count());
        $bar->start();

        $success = 0;
        $errors = 0;

        foreach ($images as $image) {
            try {
                $result = $this->aiService->generateAltText($image->url);
                $image->update(['alt_text' => $result['alt_text']]);
                $success++;
            } catch (\Exception $e) {
                $this->newLine();
                $this->warn("Erreur pour {$image->filename}: {$e->getMessage()}");
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Termine : {$success} reussi(s), {$errors} erreur(s).");

        return $errors > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Generate SEO meta for pages.
     */
    protected function generateSeoMetas(int $limit): int
    {
        $query = Page::where('status', $this->option('status'));

        if ($this->option('missing-only')) {
            $query->where(function ($q) {
                $q->whereNull('meta_title')->orWhere('meta_title', '');
            });
        }

        $pages = $query->limit($limit)->get();

        if ($pages->isEmpty()) {
            $this->info('Aucune page a traiter.');
            return self::SUCCESS;
        }

        $this->info("Traitement de {$pages->count()} page(s)...");
        $bar = $this->output->createProgressBar($pages->count());
        $bar->start();

        $success = 0;
        $errors = 0;

        foreach ($pages as $page) {
            try {
                $content = is_array($page->content) ? json_encode($page->content) : ($page->content ?? '');
                $result = $this->aiService->generateSeoMeta($content);

                $page->update([
                    'meta_title' => $result['meta_title'],
                    'meta_description' => $result['meta_description'],
                ]);

                $success++;
            } catch (\Exception $e) {
                $this->newLine();
                $this->warn("Erreur pour \"{$page->title}\": {$e->getMessage()}");
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Termine : {$success} reussi(s), {$errors} erreur(s).");

        return $errors > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Handle an invalid type option.
     */
    protected function invalidType(string $type): int
    {
        $this->error("Type invalide : \"{$type}\". Types supportes : alt-text, seo.");

        return self::INVALID;
    }
}
