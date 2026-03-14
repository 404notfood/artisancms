<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

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

    public function test_create_page_with_auto_slug(): void
    {
        $page = $this->service->create([
            'title' => 'My Test Page',
            'status' => 'draft',
        ]);

        $this->assertInstanceOf(Page::class, $page);
        $this->assertEquals('my-test-page', $page->slug);
        $this->assertEquals('draft', $page->status);
    }

    public function test_create_page_generates_revision(): void
    {
        $page = $this->service->create([
            'title' => 'Test Page',
            'status' => 'draft',
        ]);

        $this->assertCount(1, $page->revisions);
    }

    public function test_update_content_creates_revision(): void
    {
        $page = Page::factory()->create();
        $initialRevisionCount = $page->revisions()->count();

        $this->service->update($page, [
            'content' => ['blocks' => [], 'settings' => []],
        ]);

        $this->assertGreaterThan($initialRevisionCount, $page->revisions()->count());
    }

    public function test_update_without_content_change_no_revision(): void
    {
        $page = Page::factory()->create();
        $initialRevisionCount = $page->revisions()->count();

        $this->service->update($page, ['title' => 'New Title']);

        $this->assertEquals($initialRevisionCount, $page->revisions()->count());
    }

    public function test_all_with_status_filter(): void
    {
        $admin = auth()->user();
        Page::factory()->count(3)->published()->create(['created_by' => $admin->id]);
        Page::factory()->count(2)->draft()->create(['created_by' => $admin->id]);

        $published = $this->service->all(['status' => 'published']);
        $this->assertEquals(3, $published->total());

        $drafts = $this->service->all(['status' => 'draft']);
        $this->assertEquals(2, $drafts->total());
    }

    public function test_all_with_search_filter(): void
    {
        $admin = auth()->user();
        Page::factory()->create(['title' => 'Unique Alpha Page', 'created_by' => $admin->id]);
        Page::factory()->create(['title' => 'Other Page', 'created_by' => $admin->id]);

        $result = $this->service->all(['search' => 'Unique Alpha']);
        $this->assertEquals(1, $result->total());
    }

    public function test_delete_soft_deletes(): void
    {
        $page = Page::factory()->create();

        $this->service->delete($page);

        $this->assertSoftDeleted($page);
    }

    public function test_restore_page(): void
    {
        $page = Page::factory()->create();
        $page->delete();

        $this->service->restore($page);

        $this->assertNotSoftDeleted($page);
    }

    public function test_publish_page(): void
    {
        $page = Page::factory()->draft()->create();

        $result = $this->service->publish($page);

        $this->assertEquals('published', $result->status);
        $this->assertNotNull($result->published_at);
    }

    public function test_unpublish_page(): void
    {
        $page = Page::factory()->published()->create();

        $result = $this->service->unpublish($page);

        $this->assertEquals('draft', $result->status);
    }

    public function test_find_page_by_id(): void
    {
        $page = Page::factory()->create();

        $found = $this->service->find($page->id);

        $this->assertEquals($page->id, $found->id);
        $this->assertTrue($found->relationLoaded('author'));
    }

    public function test_force_delete_removes_revisions(): void
    {
        $page = Page::factory()->create();
        $this->service->create([
            'title' => 'Page with revisions',
            'status' => 'draft',
        ]);

        $page2 = Page::latest('id')->first();
        $this->service->forceDelete($page2);

        $this->assertDatabaseMissing('pages', ['id' => $page2->id]);
    }
}
