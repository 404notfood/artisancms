<?php

declare(strict_types=1);

namespace Tests\Feature\Services;

use App\Models\Page;
use App\Services\PageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CmsTestHelpers;

class PageServiceTest extends TestCase
{
    use CmsTestHelpers, RefreshDatabase;

    private PageService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PageService();
        $this->actingAs($this->createAdmin());
    }

    // ------------------------------------------------------------------
    // CREATE
    // ------------------------------------------------------------------

    public function test_can_create_page(): void
    {
        $page = $this->service->create([
            'title' => 'About Us',
            'slug' => 'about-us',
            'content' => ['blocks' => []],
            'status' => 'draft',
            'template' => 'default',
        ]);

        $this->assertInstanceOf(Page::class, $page);
        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'About Us',
            'slug' => 'about-us',
            'status' => 'draft',
        ]);
        $this->assertTrue($page->relationLoaded('author'));
        $this->assertNotNull($page->created_by);
    }

    public function test_create_page_auto_generates_slug(): void
    {
        $page = $this->service->create([
            'title' => 'Contact Page',
            'status' => 'draft',
        ]);

        $this->assertEquals('contact-page', $page->slug);
    }

    public function test_create_page_generates_initial_revision(): void
    {
        $page = $this->service->create([
            'title' => 'Revision Test',
            'content' => ['blocks' => [['id' => '1', 'type' => 'text']]],
            'status' => 'draft',
        ]);

        $revisions = $page->revisions()->get();
        $this->assertCount(1, $revisions);
        $this->assertEquals('Page created', $revisions->first()->reason);
    }

    // ------------------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------------------

    public function test_can_update_page(): void
    {
        $page = Page::factory()->create(['created_by' => auth()->id()]);

        $updated = $this->service->update($page, [
            'title' => 'Updated Title',
            'meta_description' => 'Updated description',
        ]);

        $this->assertEquals('Updated Title', $updated->title);
        $this->assertEquals('Updated description', $updated->meta_description);
    }

    public function test_creates_revision_on_content_update(): void
    {
        $page = Page::factory()->create(['created_by' => auth()->id()]);
        $initialCount = $page->revisions()->count();

        $this->service->update($page, [
            'content' => ['blocks' => [['id' => 'new-block', 'type' => 'heading']]],
        ]);

        $this->assertGreaterThan($initialCount, $page->revisions()->count());
    }

    public function test_no_revision_when_content_unchanged(): void
    {
        $page = Page::factory()->create(['created_by' => auth()->id()]);
        $initialCount = $page->revisions()->count();

        $this->service->update($page, ['title' => 'Only title changed']);

        $this->assertEquals($initialCount, $page->revisions()->count());
    }

    // ------------------------------------------------------------------
    // DELETE
    // ------------------------------------------------------------------

    public function test_can_delete_page(): void
    {
        $page = Page::factory()->create(['created_by' => auth()->id()]);

        $result = $this->service->delete($page);

        $this->assertTrue($result);
        $this->assertEquals('trash', $page->fresh()->status);
    }

    public function test_force_delete_removes_page_and_revisions(): void
    {
        $page = $this->service->create([
            'title' => 'To Be Removed',
            'status' => 'draft',
        ]);
        $pageId = $page->id;

        // Ensure there is at least one revision
        $this->assertGreaterThan(0, $page->revisions()->count());

        $this->service->forceDelete($page);

        $this->assertDatabaseMissing('pages', ['id' => $pageId]);
        $this->assertDatabaseMissing('revisions', [
            'revisionable_id' => $pageId,
            'revisionable_type' => Page::class,
        ]);
    }

    // ------------------------------------------------------------------
    // DUPLICATE
    // ------------------------------------------------------------------

    public function test_can_duplicate_page(): void
    {
        $original = Page::factory()->published()->create([
            'title' => 'Original Page',
            'slug' => 'original-page',
            'content' => ['blocks' => [['id' => '1', 'type' => 'text']]],
            'created_by' => auth()->id(),
        ]);

        $duplicate = $this->service->duplicate($original);

        $this->assertNotEquals($original->id, $duplicate->id);
        $this->assertEquals('original-page-copy', $duplicate->slug);
        $this->assertEquals('draft', $duplicate->status);
        $this->assertNull($duplicate->published_at);
        $this->assertEquals($original->content, $duplicate->content);
    }

    // ------------------------------------------------------------------
    // PUBLISH / UNPUBLISH
    // ------------------------------------------------------------------

    public function test_publish_sets_status_and_date(): void
    {
        $page = Page::factory()->draft()->create(['created_by' => auth()->id()]);

        $published = $this->service->publish($page);

        $this->assertEquals('published', $published->status);
        $this->assertNotNull($published->published_at);
    }

    public function test_publish_creates_revision(): void
    {
        $page = Page::factory()->draft()->create(['created_by' => auth()->id()]);
        $countBefore = $page->revisions()->count();

        $this->service->publish($page);

        $this->assertGreaterThan($countBefore, $page->revisions()->count());
    }

    public function test_unpublish_resets_status_to_draft(): void
    {
        $page = Page::factory()->published()->create(['created_by' => auth()->id()]);

        $unpublished = $this->service->unpublish($page);

        $this->assertEquals('draft', $unpublished->status);
    }

    // ------------------------------------------------------------------
    // RESTORE
    // ------------------------------------------------------------------

    public function test_restore_trashed_page(): void
    {
        $page = Page::factory()->create(['created_by' => auth()->id()]);
        $this->service->delete($page);
        $this->assertEquals('trash', $page->fresh()->status);

        $this->service->restore($page->fresh());

        $this->assertEquals('draft', $page->fresh()->status);
    }

    // ------------------------------------------------------------------
    // FILTERING
    // ------------------------------------------------------------------

    public function test_all_excludes_trashed_by_default(): void
    {
        $admin = auth()->user();
        Page::factory()->count(2)->create(['created_by' => $admin->id]);
        $trashed = Page::factory()->create([
            'created_by' => $admin->id,
            'status' => 'trash',
        ]);

        $results = $this->service->all();

        $resultIds = $results->pluck('id')->all();
        $this->assertNotContains($trashed->id, $resultIds);
        $this->assertEquals(2, $results->total());
    }

    public function test_all_filters_by_search(): void
    {
        $admin = auth()->user();
        Page::factory()->create(['title' => 'Alpha Unique', 'created_by' => $admin->id]);
        Page::factory()->create(['title' => 'Beta Page', 'created_by' => $admin->id]);

        $results = $this->service->all(['search' => 'Alpha Unique']);

        $this->assertEquals(1, $results->total());
        $this->assertEquals('Alpha Unique', $results->first()->title);
    }
}
