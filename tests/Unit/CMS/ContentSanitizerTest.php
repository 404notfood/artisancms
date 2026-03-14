<?php

declare(strict_types=1);

namespace Tests\Unit\CMS;

use App\Services\ContentSanitizer;
use PHPUnit\Framework\TestCase;

class ContentSanitizerTest extends TestCase
{
    private ContentSanitizer $sanitizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = new ContentSanitizer();
    }

    public function test_removes_script_tags(): void
    {
        $html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
        $result = $this->sanitizer->sanitizeHtml($html);

        $this->assertStringNotContainsString('<script>', $result);
        $this->assertStringNotContainsString('alert', $result);
        $this->assertStringContainsString('<p>Hello</p>', $result);
        $this->assertStringContainsString('<p>World</p>', $result);
    }

    public function test_removes_event_handlers(): void
    {
        $html = '<img src="photo.jpg" onerror="alert(1)" />';
        $result = $this->sanitizer->sanitizeHtml($html);

        $this->assertStringNotContainsString('onerror', $result);
        $this->assertStringContainsString('src="photo.jpg"', $result);
    }

    public function test_removes_javascript_urls(): void
    {
        $html = '<a href="javascript:alert(1)">Click</a>';
        $result = $this->sanitizer->sanitizeHtml($html);

        $this->assertStringNotContainsString('javascript:', $result);
        $this->assertStringContainsString('href="#"', $result);
    }

    public function test_allows_safe_html(): void
    {
        $html = '<p>Hello <strong>world</strong></p><ul><li>Item</li></ul>';
        $result = $this->sanitizer->sanitizeHtml($html);

        $this->assertEquals($html, $result);
    }

    public function test_strips_disallowed_tags(): void
    {
        $html = '<p>Safe</p><iframe src="evil.com"></iframe><p>Also safe</p>';
        $result = $this->sanitizer->sanitizeHtml($html);

        $this->assertStringNotContainsString('<iframe', $result);
        $this->assertStringContainsString('<p>Safe</p>', $result);
    }

    public function test_removes_data_urls_for_non_images(): void
    {
        $html = '<img src="data:text/html,<script>alert(1)</script>" />';
        $result = $this->sanitizer->sanitizeHtml($html);

        $this->assertStringNotContainsString('data:text/html', $result);
    }

    public function test_sanitize_block_tree_cleans_text_blocks(): void
    {
        $blocks = [
            [
                'type' => 'text',
                'props' => ['html' => '<p>OK</p><script>bad()</script>'],
                'children' => [],
            ],
        ];

        $result = $this->sanitizer->sanitizeBlockTree($blocks);

        $this->assertStringNotContainsString('<script>', $result[0]['props']['html']);
        $this->assertStringContainsString('<p>OK</p>', $result[0]['props']['html']);
    }

    public function test_sanitize_block_tree_strips_html_block_for_non_admin(): void
    {
        $blocks = [
            [
                'type' => 'html',
                'props' => ['code' => '<div>Custom HTML</div>'],
                'children' => [],
            ],
        ];

        $result = $this->sanitizer->sanitizeBlockTree($blocks, isAdmin: false);

        $this->assertEquals('', $result[0]['props']['code']);
    }

    public function test_sanitize_block_tree_allows_html_block_for_admin(): void
    {
        $blocks = [
            [
                'type' => 'html',
                'props' => ['code' => '<div>Custom HTML</div>'],
                'children' => [],
            ],
        ];

        $result = $this->sanitizer->sanitizeBlockTree($blocks, isAdmin: true);

        $this->assertEquals('<div>Custom HTML</div>', $result[0]['props']['code']);
    }

    public function test_sanitize_block_tree_strips_heading_html(): void
    {
        $blocks = [
            [
                'type' => 'heading',
                'props' => ['text' => '<b>Title</b><script>x</script>'],
                'children' => [],
            ],
        ];

        $result = $this->sanitizer->sanitizeBlockTree($blocks);

        $this->assertEquals('Titlex', $result[0]['props']['text']);
    }

    public function test_sanitize_url_blocks_javascript_protocol(): void
    {
        $blocks = [
            [
                'type' => 'button',
                'props' => ['url' => 'javascript:void(0)'],
                'children' => [],
            ],
        ];

        $result = $this->sanitizer->sanitizeBlockTree($blocks);

        $this->assertEquals('#', $result[0]['props']['url']);
    }

    public function test_sanitize_url_allows_valid_protocols(): void
    {
        $blocks = [
            [
                'type' => 'button',
                'props' => ['url' => 'https://example.com'],
                'children' => [],
            ],
        ];

        $result = $this->sanitizer->sanitizeBlockTree($blocks);

        $this->assertEquals('https://example.com', $result[0]['props']['url']);
    }

    public function test_sanitize_block_tree_recurses_children(): void
    {
        $blocks = [
            [
                'type' => 'section',
                'props' => [],
                'children' => [
                    [
                        'type' => 'text',
                        'props' => ['html' => '<p>OK</p><script>bad()</script>'],
                        'children' => [],
                    ],
                ],
            ],
        ];

        $result = $this->sanitizer->sanitizeBlockTree($blocks);

        $this->assertStringNotContainsString('<script>', $result[0]['children'][0]['props']['html']);
    }
}
