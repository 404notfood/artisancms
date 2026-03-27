<?php

declare(strict_types=1);

namespace Tests\Feature\Services;

use App\Models\Post;
use App\Models\Revision;
use App\Services\PostService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CmsTestHelpers;

class PostServiceTest extends TestCase
{
    use CmsTestHelpers, RefreshDatabase;

    private PostService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PostService();
        $this->actingAs($this->createAdmin());
    }

    // ------------------------------------------------------------------
    // CREATE
    // ------------------------------------------------------------------

    public function test_can_create_post(): void
    {
        $post = $this->service->create([
            'title' => 'My First Post',
            'slug' => 'my-first-post',
            'content' => ['blocks' => [['id' => '1', 'type' => 'text', 'props' => ['html' => '<p>Hello</p>']]]],
            'excerpt' => 'A short excerpt',
            'status' => 'draft',
        ]);

        $this->assertInstanceOf(Post::class, $post);
        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'title' => 'My First Post',
            'slug' => 'my-first-post',
            'status' => 'draft',
        ]);
        $this->assertTrue($post->relationLoaded('author'));
        $this->assertNotNull($post->created_by);
    }

    public function test_create_post_generates_initial_revision(): void
    {
        $post = $this->service->create([
            'title' => 'Revision Check',
            'status' => 'draft',
        ]);

        $revisions = $post->revisions()->get();
        $this->assertCount(1, $revisions);
        $this->assertEquals('Post created', $revisions->first()->reason);
    }

    // ------------------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------------------

    public function test_can_update_post(): void
    {
        $post = Post::factory()->create(['created_by' => auth()->id()]);

        $updated = $this->service->update($post, [
            'title' => 'Updated Post Title',
            'excerpt' => 'New excerpt content',
        ]);

        $this->assertEquals('Updated Post Title', $updated->title);
        $this->assertEquals('New excerpt content', $updated->excerpt);
    }

    public function test_creates_revision_on_content_update(): void
    {
        $post = Post::factory()->create(['created_by' => auth()->id()]);
        $initialCount = $post->revisions()->count();

        $this->service->update($post, [
            'content' => ['blocks' => [['id' => 'changed', 'type' => 'heading']]],
        ]);

        $this->assertGreaterThan($initialCount, $post->revisions()->count());

        $latestRevision = $post->revisions()->latest()->first();
        $this->assertEquals('Content updated', $latestRevision->reason);
    }

    public function test_no_revision_when_only_title_changes(): void
    {
        $post = Post::factory()->create(['created_by' => auth()->id()]);
        $initialCount = $post->revisions()->count();

        $this->service->update($post, ['title' => 'Title Only Change']);

        $this->assertEquals($initialCount, $post->revisions()->count());
    }

    // ------------------------------------------------------------------
    // DELETE
    // ------------------------------------------------------------------

    public function test_can_delete_post(): void
    {
        $post = Post::factory()->create(['created_by' => auth()->id()]);

        $result = $this->service->delete($post);

        $this->assertTrue($result);
        $this->assertSoftDeleted($post);
    }

    public function test_can_restore_deleted_post(): void
    {
        $post = Post::factory()->create(['created_by' => auth()->id()]);
        $post->delete();

        $this->service->restore($post);

        $this->assertNotSoftDeleted($post);
    }

    public function test_force_delete_removes_post_and_revisions(): void
    {
        $post = $this->service->create([
            'title' => 'Disposable Post',
            'status' => 'draft',
        ]);
        $postId = $post->id;
        $this->assertGreaterThan(0, $post->revisions()->count());

        $this->service->forceDelete($post);

        $this->assertDatabaseMissing('posts', ['id' => $postId]);
        $this->assertDatabaseMissing('revisions', [
            'revisionable_id' => $postId,
            'revisionable_type' => Post::class,
        ]);
    }

    // ------------------------------------------------------------------
    // FILTER BY STATUS
    // ------------------------------------------------------------------

    public function test_can_filter_by_status_published(): void
    {
        $admin = auth()->user();
        Post::factory()->count(3)->published()->create(['created_by' => $admin->id]);
        Post::factory()->count(2)->draft()->create(['created_by' => $admin->id]);

        $published = $this->service->all(['status' => 'published']);
        $this->assertEquals(3, $published->total());
    }

    public function test_can_filter_by_status_draft(): void
    {
        $admin = auth()->user();
        Post::factory()->count(3)->published()->create(['created_by' => $admin->id]);
        Post::factory()->count(4)->draft()->create(['created_by' => $admin->id]);

        $drafts = $this->service->all(['status' => 'draft']);
        $this->assertEquals(4, $drafts->total());
    }

    public function test_can_filter_by_search(): void
    {
        $admin = auth()->user();
        Post::factory()->create(['title' => 'Unique Omega Post', 'created_by' => $admin->id]);
        Post::factory()->create(['title' => 'Regular Post', 'created_by' => $admin->id]);

        $results = $this->service->all(['search' => 'Unique Omega']);
        $this->assertEquals(1, $results->total());
        $this->assertEquals('Unique Omega Post', $results->first()->title);
    }

    public function test_can_filter_by_author(): void
    {
        $admin = auth()->user();
        $otherUser = $this->createEditor();

        Post::factory()->count(2)->create(['created_by' => $admin->id]);
        Post::factory()->count(3)->create(['created_by' => $otherUser->id]);

        $results = $this->service->all(['created_by' => $admin->id]);
        $this->assertEquals(2, $results->total());
    }

    // ------------------------------------------------------------------
    // PUBLISH / UNPUBLISH
    // ------------------------------------------------------------------

    public function test_publish_sets_status_and_date(): void
    {
        $post = Post::factory()->draft()->create(['created_by' => auth()->id()]);

        $published = $this->service->publish($post);

        $this->assertEquals('published', $published->status);
        $this->assertNotNull($published->published_at);
    }

    public function test_unpublish_resets_to_draft(): void
    {
        $post = Post::factory()->published()->create(['created_by' => auth()->id()]);

        $unpublished = $this->service->unpublish($post);

        $this->assertEquals('draft', $unpublished->status);
    }

    // ------------------------------------------------------------------
    // DUPLICATE
    // ------------------------------------------------------------------

    public function test_can_duplicate_post(): void
    {
        $original = Post::factory()->published()->create([
            'title' => 'Original Post',
            'slug' => 'original-post',
            'created_by' => auth()->id(),
        ]);

        $duplicate = $this->service->duplicate($original);

        $this->assertNotEquals($original->id, $duplicate->id);
        $this->assertEquals('original-post-copy', $duplicate->slug);
        $this->assertEquals('draft', $duplicate->status);
        $this->assertNull($duplicate->published_at);
    }
}
