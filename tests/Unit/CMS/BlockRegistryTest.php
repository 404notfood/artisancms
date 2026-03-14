<?php

declare(strict_types=1);

namespace Tests\Unit\CMS;

use App\CMS\Blocks\BlockRegistry;
use App\Models\Block;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlockRegistryTest extends TestCase
{
    use RefreshDatabase;

    private BlockRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = new BlockRegistry();
    }

    public function test_register_a_block(): void
    {
        $block = $this->registry->register([
            'slug' => 'heading',
            'name' => 'Heading',
            'category' => 'content',
            'icon' => 'Heading',
            'schema' => ['type' => 'object', 'properties' => ['level' => ['type' => 'number']]],
            'default_props' => ['level' => 2],
            'is_core' => true,
            'source' => 'core',
        ]);

        $this->assertInstanceOf(Block::class, $block);
        $this->assertEquals('heading', $block->slug);
        $this->assertEquals('Heading', $block->name);
        $this->assertEquals('content', $block->category);
        $this->assertTrue($block->is_core);
        $this->assertDatabaseHas('blocks', ['slug' => 'heading']);
    }

    public function test_register_block_with_minimal_data(): void
    {
        $block = $this->registry->register([
            'slug' => 'simple-block',
        ]);

        $this->assertInstanceOf(Block::class, $block);
        $this->assertEquals('simple-block', $block->slug);
        $this->assertEquals('simple-block', $block->name); // defaults to slug
        $this->assertEquals('general', $block->category); // defaults to general
        $this->assertFalse($block->is_core); // defaults to false
    }

    public function test_register_updates_existing_block(): void
    {
        $this->registry->register([
            'slug' => 'text',
            'name' => 'Text Block',
            'category' => 'content',
        ]);

        $this->registry->register([
            'slug' => 'text',
            'name' => 'Updated Text Block',
            'category' => 'content',
        ]);

        $count = Block::where('slug', 'text')->count();
        $this->assertEquals(1, $count);

        $block = Block::where('slug', 'text')->first();
        $this->assertEquals('Updated Text Block', $block->name);
    }

    public function test_get_a_registered_block(): void
    {
        $this->registry->register([
            'slug' => 'image',
            'name' => 'Image',
            'category' => 'content',
        ]);

        $block = $this->registry->get('image');

        $this->assertInstanceOf(Block::class, $block);
        $this->assertEquals('image', $block->slug);
        $this->assertEquals('Image', $block->name);
    }

    public function test_get_returns_null_for_unknown_block(): void
    {
        $block = $this->registry->get('nonexistent-block');

        $this->assertNull($block);
    }

    public function test_get_all_blocks(): void
    {
        $this->registry->register(['slug' => 'heading', 'name' => 'Heading', 'category' => 'content']);
        $this->registry->register(['slug' => 'text', 'name' => 'Text', 'category' => 'content']);
        $this->registry->register(['slug' => 'section', 'name' => 'Section', 'category' => 'layout']);

        $blocks = $this->registry->getAll();

        $this->assertCount(3, $blocks);
    }

    public function test_get_all_blocks_sorted_by_category_and_name(): void
    {
        $this->registry->register(['slug' => 'text', 'name' => 'Text', 'category' => 'content']);
        $this->registry->register(['slug' => 'section', 'name' => 'Section', 'category' => 'layout']);
        $this->registry->register(['slug' => 'heading', 'name' => 'Heading', 'category' => 'content']);

        $blocks = $this->registry->getAll();

        // content category comes before layout, and within content: Heading before Text
        $this->assertEquals('heading', $blocks[0]->slug);
        $this->assertEquals('text', $blocks[1]->slug);
        $this->assertEquals('section', $blocks[2]->slug);
    }

    public function test_get_blocks_by_category(): void
    {
        $this->registry->register(['slug' => 'heading', 'name' => 'Heading', 'category' => 'content']);
        $this->registry->register(['slug' => 'text', 'name' => 'Text', 'category' => 'content']);
        $this->registry->register(['slug' => 'section', 'name' => 'Section', 'category' => 'layout']);

        $contentBlocks = $this->registry->getByCategory('content');
        $layoutBlocks = $this->registry->getByCategory('layout');

        $this->assertCount(2, $contentBlocks);
        $this->assertCount(1, $layoutBlocks);
    }

    public function test_unregister_a_block(): void
    {
        $this->registry->register(['slug' => 'heading', 'name' => 'Heading', 'category' => 'content']);

        $result = $this->registry->unregister('heading');

        $this->assertTrue($result);
        $this->assertNull($this->registry->get('heading'));
        $this->assertDatabaseMissing('blocks', ['slug' => 'heading']);
    }

    public function test_unregister_nonexistent_block_returns_false(): void
    {
        $result = $this->registry->unregister('nonexistent');

        $this->assertFalse($result);
    }
}
