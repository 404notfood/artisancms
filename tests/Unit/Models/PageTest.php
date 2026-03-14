<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_generates_slug_from_title(): void
    {
        $page = Page::factory()->create(['title' => 'My Test Page', 'slug' => '']);

        $this->assertEquals('my-test-page', $page->slug);
    }

    public function test_content_is_cast_to_array(): void
    {
        $page = Page::factory()->create([
            'content' => ['blocks' => [['id' => '1', 'type' => 'text']]],
        ]);

        $this->assertIsArray($page->content);
        $this->assertArrayHasKey('blocks', $page->content);
    }

    public function test_belongs_to_author(): void
    {
        $user = User::factory()->create();
        $page = Page::factory()->create(['created_by' => $user->id]);

        $this->assertEquals($user->id, $page->author->id);
    }

    public function test_parent_child_relationship(): void
    {
        $parent = Page::factory()->create();
        $child = Page::factory()->create(['parent_id' => $parent->id]);

        $this->assertEquals($parent->id, $child->parent->id);
        $this->assertTrue($parent->children->contains($child));
    }

    public function test_has_revisions(): void
    {
        $page = Page::factory()->create();
        $page->revisions()->create([
            'data' => ['title' => $page->title],
            'reason' => 'test',
        ]);

        $this->assertCount(1, $page->revisions);
    }

    public function test_published_scope(): void
    {
        Page::factory()->published()->create();
        Page::factory()->draft()->create();

        $published = Page::published()->get();

        $this->assertCount(1, $published);
        $this->assertEquals('published', $published->first()->status);
    }

    public function test_draft_scope(): void
    {
        Page::factory()->published()->create();
        Page::factory()->draft()->create();

        $drafts = Page::draft()->get();

        $this->assertCount(1, $drafts);
        $this->assertEquals('draft', $drafts->first()->status);
    }

    public function test_soft_deletes(): void
    {
        $page = Page::factory()->create();
        $page->delete();

        $this->assertSoftDeleted($page);
        $this->assertNotNull(Page::withTrashed()->find($page->id));
    }

    public function test_should_be_searchable_only_when_published(): void
    {
        $published = Page::factory()->published()->make();
        $draft = Page::factory()->draft()->make();

        $this->assertTrue($published->shouldBeSearchable());
        $this->assertFalse($draft->shouldBeSearchable());
    }

    public function test_to_searchable_array_has_required_fields(): void
    {
        $page = Page::factory()->published()->create();
        $array = $page->toSearchableArray();

        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('title', $array);
        $this->assertArrayHasKey('slug', $array);
        $this->assertArrayHasKey('status', $array);
    }
}
