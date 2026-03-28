<?php

declare(strict_types=1);

namespace App\CMS\Blocks;

/**
 * Extracts plain text from a page/post JSON block tree.
 *
 * Used by Scout searchable arrays, SearchService fallback, RSS feeds, etc.
 */
final class BlockTextExtractor
{
    /**
     * Extract plain text from a content JSON structure.
     *
     * @param array<string, mixed>|null $content The page/post content column (decoded JSON).
     */
    public static function extract(?array $content): string
    {
        if (! $content || ! isset($content['blocks']) || ! is_array($content['blocks'])) {
            return '';
        }

        return trim(self::extractRecursive($content['blocks']));
    }

    /**
     * Recursively walk the block tree and collect text from props.
     *
     * @param array<int, array<string, mixed>> $blocks
     */
    private static function extractRecursive(array $blocks): string
    {
        $text = '';

        foreach ($blocks as $block) {
            if (! is_array($block)) {
                continue;
            }

            if (isset($block['props']['content'])) {
                $text .= ' ' . strip_tags((string) $block['props']['content']);
            }

            if (isset($block['props']['text'])) {
                $text .= ' ' . strip_tags((string) $block['props']['text']);
            }

            if (isset($block['props']['html'])) {
                $text .= ' ' . strip_tags((string) $block['props']['html']);
            }

            if (isset($block['props']['title'])) {
                $text .= ' ' . strip_tags((string) $block['props']['title']);
            }

            if (isset($block['props']['caption'])) {
                $text .= ' ' . strip_tags((string) $block['props']['caption']);
            }

            if (! empty($block['children']) && is_array($block['children'])) {
                $text .= self::extractRecursive($block['children']);
            }
        }

        return $text;
    }
}
