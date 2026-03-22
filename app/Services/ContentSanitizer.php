<?php

declare(strict_types=1);

namespace App\Services;

class ContentSanitizer
{
    protected array $allowedTags = [
        'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre', 'img', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'sub', 'sup', 'hr',
    ];

    protected array $allowedAttributes = [
        'a' => ['href', 'target', 'rel', 'title'],
        'img' => ['src', 'alt', 'width', 'height', 'loading'],
        'span' => ['class', 'style'],
        'div' => ['class', 'style'],
        '*' => ['class'],
    ];

    public function sanitizeHtml(string $html): string
    {
        // Remove script tags and their content (including inside SVG/foreignObject)
        $html = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $html);

        // Remove SVG elements and all their content (SVGs can embed scripts in many ways)
        $html = preg_replace('/<svg\b[^>]*>.*?<\/svg>/is', '', $html);

        // Remove standalone SVG-specific elements that can carry event handlers
        // (animate, set, animateTransform, animateMotion, foreignObject, use, etc.)
        $html = preg_replace('/<\/?(?:animate|animateMotion|animateTransform|set|foreignObject|use)\b[^>]*>/i', '', $html);

        // Remove event handlers (onclick, onerror, onload, onbegin, onend, onrepeat, etc.)
        $html = preg_replace('/\bon\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);
        $html = preg_replace('/\bon\w+\s*=\s*\S+/i', '', $html);

        // Remove javascript: URLs (href, src, xlink:href, action, formaction)
        $html = preg_replace('/href\s*=\s*["\']javascript:[^"\']*["\']/i', 'href="#"', $html);
        $html = preg_replace('/src\s*=\s*["\']javascript:[^"\']*["\']/i', 'src=""', $html);
        $html = preg_replace('/xlink:href\s*=\s*["\']javascript:[^"\']*["\']/i', '', $html);

        // Remove data: URLs in src (except raster images — block SVG data URIs which can embed scripts)
        $html = preg_replace('/src\s*=\s*["\']data:(?!image\/(?:png|jpe?g|gif|webp|avif|bmp|ico)\b)[^"\']*["\']/i', 'src=""', $html);

        // Also block data:image/svg+xml in href/xlink:href (SVG data URIs can contain scripts)
        $html = preg_replace('/(?:xlink:)?href\s*=\s*["\']data:image\/svg\+xml[^"\']*["\']/i', 'href="#"', $html);

        // Strip disallowed tags
        $allowedTagsStr = implode('', array_map(fn ($tag) => "<{$tag}>", $this->allowedTags));
        $html = strip_tags($html, $allowedTagsStr);

        return $html;
    }

    public function sanitizeBlockTree(array $blocks, bool $isAdmin = false): array
    {
        return array_map(function (array $block) use ($isAdmin) {
            // Sanitize text block HTML
            if ($block['type'] === 'text' && isset($block['props']['html'])) {
                $block['props']['html'] = $this->sanitizeHtml($block['props']['html']);
            }

            // HTML custom block: strip for non-admins
            if ($block['type'] === 'html' && !$isAdmin) {
                $block['props']['code'] = '';
            }

            // Sanitize URLs
            foreach (['url', 'src', 'href'] as $urlProp) {
                if (isset($block['props'][$urlProp])) {
                    $block['props'][$urlProp] = $this->sanitizeUrl($block['props'][$urlProp]);
                }
            }

            // Sanitize heading text (strip all tags)
            if ($block['type'] === 'heading' && isset($block['props']['text'])) {
                $block['props']['text'] = strip_tags($block['props']['text']);
            }

            // Recurse children
            if (!empty($block['children'])) {
                $block['children'] = $this->sanitizeBlockTree($block['children'], $isAdmin);
            }

            return $block;
        }, $blocks);
    }

    protected function sanitizeUrl(string $url): string
    {
        $url = trim($url);

        if ($url === '' || $url === '#') {
            return $url;
        }

        if (preg_match('/^(https?:\/\/|mailto:|tel:|\/|#)/', $url)) {
            return $url;
        }

        return '#';
    }
}
