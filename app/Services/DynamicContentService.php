<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Page;
use App\Models\Post;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;

class DynamicContentService
{
    /**
     * Resolve a dynamic binding reference like "$bind:post_field.title"
     * into an actual value given the current context.
     *
     * @param string $binding The binding expression (e.g. "post_field.title", "setting.site_name")
     * @param array<string, mixed> $context Current page context (page, post, user, etc.)
     * @return mixed The resolved value or the original binding string if unresolvable
     */
    public function resolve(string $binding, array $context = []): mixed
    {
        $parts = explode('.', $binding, 2);
        $source = $parts[0] ?? '';
        $field = $parts[1] ?? '';

        return match ($source) {
            'post_field' => $this->resolvePostField($field, $context),
            'page_field' => $this->resolvePageField($field, $context),
            'setting' => $this->resolveSetting($field),
            'user' => $this->resolveUser($field),
            'date' => $this->resolveDate($field),
            'site' => $this->resolveSite($field),
            default => $binding,
        };
    }

    /**
     * Process an entire block tree, resolving all $bind references in props.
     */
    public function processBlocks(array $blocks, array $context = []): array
    {
        return array_map(function (array $block) use ($context) {
            if (isset($block['props']) && is_array($block['props'])) {
                $block['props'] = $this->processProps($block['props'], $context);
            }
            if (isset($block['children']) && is_array($block['children'])) {
                $block['children'] = $this->processBlocks($block['children'], $context);
            }
            return $block;
        }, $blocks);
    }

    private function processProps(array $props, array $context): array
    {
        foreach ($props as $key => $value) {
            if (is_string($value) && str_starts_with($value, '$bind:')) {
                $binding = substr($value, 6);
                $props[$key] = $this->resolve($binding, $context);
            } elseif (is_array($value)) {
                $props[$key] = $this->processProps($value, $context);
            }
        }
        return $props;
    }

    private function resolvePostField(string $field, array $context): mixed
    {
        $post = $context['post'] ?? null;
        if (!$post) return '';

        return match ($field) {
            'title' => $post->title ?? '',
            'excerpt' => $post->excerpt ?? '',
            'content' => $post->content ?? '',
            'slug' => $post->slug ?? '',
            'featured_image' => $post->featured_image ?? '',
            'author_name' => $post->author?->name ?? '',
            'published_at' => $post->published_at?->format('d/m/Y') ?? '',
            default => $post->{$field} ?? '',
        };
    }

    private function resolvePageField(string $field, array $context): mixed
    {
        $page = $context['page'] ?? null;
        if (!$page) return '';

        return match ($field) {
            'title' => $page->title ?? '',
            'slug' => $page->slug ?? '',
            'meta_title' => $page->meta_title ?? '',
            'meta_description' => $page->meta_description ?? '',
            default => $page->{$field} ?? '',
        };
    }

    private function resolveSetting(string $field): mixed
    {
        return Setting::where('key', $field)->value('value') ?? '';
    }

    private function resolveUser(string $field): mixed
    {
        $user = Auth::user();
        if (!$user) return '';

        return match ($field) {
            'name' => $user->name ?? '',
            'email' => $user->email ?? '',
            default => '',
        };
    }

    private function resolveDate(string $field): string
    {
        return match ($field) {
            'year' => date('Y'),
            'month' => date('m'),
            'day' => date('d'),
            'full' => date('d/m/Y'),
            'time' => date('H:i'),
            default => date('Y-m-d'),
        };
    }

    private function resolveSite(string $field): mixed
    {
        return match ($field) {
            'name' => config('cms.name', 'ArtisanCMS'),
            'url' => config('app.url', '/'),
            'version' => config('cms.version', '1.0.0'),
            default => '',
        };
    }
}
