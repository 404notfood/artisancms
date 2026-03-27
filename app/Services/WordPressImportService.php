<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleXMLElement;

class WordPressImportService
{
    /** @var array<string, int> */
    private array $categoryMap = [];
    /** @var array<string, int> */
    private array $tagMap = [];
    /** @var list<string> */
    private array $errors = [];

    /**
     * @param array{pages?: bool, posts?: bool, media?: bool} $options
     * @return array{pages: int, posts: int, media: int, categories: int, tags: int, errors: list<string>}
     */
    public function import(string $wxrFilePath, array $options = []): array
    {
        $counts = ['pages' => 0, 'posts' => 0, 'media' => 0, 'categories' => 0, 'tags' => 0];

        libxml_use_internal_errors(true);
        $xml = simplexml_load_file($wxrFilePath);
        if ($xml === false) {
            $this->errors[] = 'Fichier XML invalide ou corrompu.';
            libxml_clear_errors();
            return [...$counts, 'errors' => $this->errors];
        }

        $wp = $xml->channel;
        $nsWp = 'http://wordpress.org/export/1.2/';
        $nsCont = 'http://purl.org/rss/1.0/modules/content/';
        $nsExc = 'http://wordpress.org/export/1.2/excerpt/';

        $counts['categories'] = $this->importTerms($wp, $nsWp, 'category', 'category_nicename', 'cat_name', $this->categoryMap);
        $counts['tags'] = $this->importTerms($wp, $nsWp, 'tag', 'tag_slug', 'tag_name', $this->tagMap);

        $doPages = $options['pages'] ?? true;
        $doPosts = $options['posts'] ?? true;
        $doMedia = $options['media'] ?? true;

        foreach ($wp->item as $item) {
            $wpData = $item->children($nsWp);
            $type = (string) $wpData->post_type;
            try {
                if ($type === 'attachment' && $doMedia) {
                    $this->importMedia($item, $wpData);
                    $counts['media']++;
                } elseif ($type === 'page' && $doPages) {
                    $this->importContent($item, $wpData, $nsCont, Page::class);
                    $counts['pages']++;
                } elseif ($type === 'post' && $doPosts) {
                    $this->importContent($item, $wpData, $nsCont, Post::class, $nsExc);
                    $counts['posts']++;
                }
            } catch (\Throwable $e) {
                $this->errors[] = "\"{$item->title}\" ({$type}): {$e->getMessage()}";
                Log::warning("WP Import error", ['title' => (string) $item->title, 'error' => $e->getMessage()]);
            }
        }

        return [...$counts, 'errors' => $this->errors];
    }

    /**
     * @param array<string, int> $map
     */
    private function importTerms(SimpleXMLElement $channel, string $ns, string $type, string $slugField, string $nameField, array &$map): int
    {
        $isCategory = $type === 'category';
        $taxonomy = Taxonomy::firstOrCreate(
            ['slug' => $isCategory ? 'categories' : 'tags', 'type' => $type],
            ['name' => $isCategory ? 'Categories' : 'Tags', 'hierarchical' => $isCategory, 'applies_to' => ['posts']],
        );
        $count = 0;
        foreach ($channel->children($ns)->$type ?? [] as $item) {
            try {
                $slug = (string) $item->children($ns)->$slugField;
                $name = (string) $item->children($ns)->$nameField;
                if ($slug === '' || $name === '') continue;
                $term = TaxonomyTerm::firstOrCreate(
                    ['taxonomy_id' => $taxonomy->id, 'slug' => $slug],
                    ['name' => $name],
                );
                $map[$slug] = $term->id;
                $count++;
            } catch (\Throwable $e) {
                $this->errors[] = "Erreur {$type}: {$e->getMessage()}";
            }
        }
        return $count;
    }

    private function importMedia(SimpleXMLElement $item, SimpleXMLElement $wpData): void
    {
        $url = (string) $wpData->attachment_url;
        if ($url === '') return;

        $response = Http::timeout(30)->get($url);
        if (!$response->successful()) {
            $this->errors[] = "Téléchargement échoué: {$url}";
            return;
        }

        $originalName = basename(parse_url($url, PHP_URL_PATH) ?? 'file');
        $ext = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'jpg';
        $filename = Str::uuid() . '.' . $ext;
        $path = 'media/wp-import/' . $filename;
        Storage::disk('public')->put($path, $response->body());

        Media::create([
            'filename' => $filename, 'original_filename' => $originalName,
            'path' => $path, 'disk' => 'public',
            'mime_type' => $response->header('Content-Type') ?? 'application/octet-stream',
            'size' => strlen($response->body()),
            'alt_text' => (string) $item->title ?: null,
            'title' => (string) $item->title ?: null,
            'uploaded_by' => Auth::id(), 'folder' => 'wp-import',
        ]);
    }

    /**
     * @param class-string<Page|Post> $modelClass
     */
    private function importContent(SimpleXMLElement $item, SimpleXMLElement $wpData, string $nsCont, string $modelClass, ?string $nsExc = null): void
    {
        $title = (string) $item->title;
        $slug = (string) $wpData->post_name ?: Str::slug($title);
        $html = (string) $item->children($nsCont)->encoded;
        $wpStatus = (string) $wpData->status;
        $status = match ($wpStatus) { 'publish' => 'published', 'pending' => 'pending_review', default => 'draft' };

        $data = [
            'title' => $title,
            'slug' => $this->uniqueSlug($slug, $modelClass),
            'content' => $this->htmlToBlocks($html),
            'status' => $status,
            'meta_title' => $title,
            'created_by' => Auth::id(),
            'published_at' => $wpStatus === 'publish' ? now() : null,
        ];

        if ($modelClass === Post::class) {
            $data['excerpt'] = $nsExc ? ((string) $item->children($nsExc)->encoded) ?: null : null;
            $data['allow_comments'] = ((string) $wpData->comment_status) === 'open';
        }

        $record = $modelClass::create($data);

        if ($record instanceof Post) {
            $termIds = [];
            foreach ($item->category ?? [] as $cat) {
                $domain = (string) $cat['domain'];
                $nicename = (string) $cat['nicename'];
                if ($domain === 'category' && isset($this->categoryMap[$nicename])) $termIds[] = $this->categoryMap[$nicename];
                elseif ($domain === 'post_tag' && isset($this->tagMap[$nicename])) $termIds[] = $this->tagMap[$nicename];
            }
            if ($termIds !== []) $record->terms()->syncWithoutDetaching($termIds);
        }
    }

    /**
     * Convert WordPress HTML to ArtisanCMS block JSON.
     *
     * @return list<array<string, mixed>>
     */
    public function htmlToBlocks(string $html): array
    {
        $html = trim($html);
        if ($html === '') return [];

        $html = preg_replace('/<!-- \/?wp:.*?-->/', '', $html) ?? $html;

        libxml_use_internal_errors(true);
        $doc = new \DOMDocument('1.0', 'UTF-8');
        $doc->loadHTML('<?xml encoding="UTF-8"><div>' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NOERROR);
        libxml_clear_errors();

        $blocks = [];
        $wrapper = $doc->getElementsByTagName('div')->item(0);
        if ($wrapper === null) return [$this->block('html', ['content' => $html])];

        foreach ($wrapper->childNodes as $node) {
            $b = $this->nodeToBlock($node, $doc);
            if ($b !== null) $blocks[] = $b;
        }

        return $blocks === [] ? [$this->block('text', ['content' => $html])] : $blocks;
    }

    private function nodeToBlock(\DOMNode $node, \DOMDocument $doc): ?array
    {
        if ($node->nodeType === XML_TEXT_NODE) {
            $t = trim($node->textContent ?? '');
            return $t !== '' ? $this->block('text', ['content' => $t]) : null;
        }
        if (!($node instanceof \DOMElement)) return null;

        $tag = strtolower($node->tagName);
        $inner = '';
        foreach ($node->childNodes as $c) $inner .= $doc->saveHTML($c) ?: '';
        $inner = trim($inner);

        if (preg_match('/^h([1-6])$/', $tag, $m)) {
            return $this->block('heading', ['content' => $node->textContent ?? '', 'level' => (int) $m[1]]);
        }

        return match ($tag) {
            'p' => $this->paragraphBlock($node, $inner),
            'img' => $this->block('image', ['src' => $node->getAttribute('src'), 'alt' => $node->getAttribute('alt')]),
            'blockquote' => $this->block('quote', ['content' => $inner]),
            'ul', 'ol' => $this->block('list', ['style' => $tag === 'ol' ? 'ordered' : 'unordered', 'items' => $this->listItems($node)]),
            'figure' => $this->figureBlock($node, $doc),
            default => $this->block('html', ['content' => $doc->saveHTML($node) ?: '']),
        };
    }

    private function paragraphBlock(\DOMElement $node, string $inner): array
    {
        $imgs = $node->getElementsByTagName('img');
        if ($imgs->length === 1 && trim($node->textContent ?? '') === '') {
            $img = $imgs->item(0);
            return $this->block('image', ['src' => $img?->getAttribute('src') ?? '', 'alt' => $img?->getAttribute('alt') ?? '']);
        }
        return $this->block('text', ['content' => $inner]);
    }

    private function figureBlock(\DOMElement $node, \DOMDocument $doc): array
    {
        $img = $node->getElementsByTagName('img')->item(0);
        if ($img !== null) {
            $caption = $node->getElementsByTagName('figcaption')->item(0);
            return $this->block('image', ['src' => $img->getAttribute('src'), 'alt' => $img->getAttribute('alt'), 'caption' => $caption?->textContent ?? '']);
        }
        return $this->block('html', ['content' => $doc->saveHTML($node) ?: '']);
    }

    /** @return list<string> */
    private function listItems(\DOMElement $list): array
    {
        $items = [];
        foreach ($list->getElementsByTagName('li') as $li) $items[] = trim($li->textContent ?? '');
        return $items;
    }

    /** @return array{id: string, type: string, props: array<string, mixed>} */
    private function block(string $type, array $props): array
    {
        return ['id' => Str::uuid()->toString(), 'type' => $type, 'props' => $props];
    }

    /** @param class-string<Page|Post> $model */
    private function uniqueSlug(string $slug, string $model): string
    {
        $original = $slug;
        $i = 1;
        while ($model::where('slug', $slug)->exists()) $slug = $original . '-' . $i++;
        return $slug;
    }
}
