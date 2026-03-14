<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\Post;
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

    public function test_create_post_with_auto_slug(): void
    {
        $post = $this->service->create([
            'title' => 'My First Blog Post',
            'status' => 'draft',
        ]);

        $this->assertInstanceOf(Post::class, $post);
        $this->assertEquals('my-first-blog-post', $post->slug);
    }

    public function test_create_post_generates_revision(): void
    {
        $post = $this->service->create([
            'title' => 'Test Post',
            'status' => 'draft',
        ]);

        $this->assertCount(1, $post->revisions);
    }

    public function test_update_content_creates_revision(): void
    {
        $post = Post::factory()->create();
        $initialCount = $post->revisions()->count();

        $this->service->update($post, [
            'content' => ['blocks' => [['id' => 'new', 'type' => 'text', 'props' => []]]],
        ]);

        $this->assertGreaterThan($initialCount, $post->revisions()->count());
    }

    public function test_update_title_only_no_revision(): void
    {
        $post = Post::factory()->create();
        $initialCount = $post->revisions()->count();

        $this->service->update($post, ['title' => 'Updated Title']);

        $this->assertEquals($initialCount, $post->revisions()->count());
    }

    public function test_all_with_status_filter(): void
    {
        $admin = auth()->user();
        Post::factory()->count(4)->published()->create(['created_by' => $admin->id]);
        Post::factory()->count(2)->draft()->create(['created_by' => $admin->id]);

        $published = $this->service->all(['status' => 'published']);
        $this->assertEquals(4, $published->total());
    }

    public function test_all_with_search_filter(): void
    {
        $admin = auth()->user();
        Post::factory()->create(['title' => 'Unique Zeta Post', 'created_by' => $admin->id]);
        Post::factory()->create(['title' => 'Other Post', 'created_by' => $admin->id]);

        $result = $this->service->all(['search' => 'Unique Zeta']);
        $this->assertEquals(1, $result->total());
    }

    public function test_delete_soft_deletes(): void
    {
        $post = Post::factory()->create();

        $this->service->delete($post);

        $this->assertSoftDeleted($post);
    }

    public function test_restore_post(): void
    {
        $post = Post::factory()->create();
        $post->delete();

        $this->service->restore($post);

        $this->assertNotSoftDeleted($post);
    }

    public function test_publish_post(): void
    {
        $post = Post::factory()->draft()->create();

        $result = $this->service->publish($post);

        $this->assertEquals('published', $result->status);
        $this->assertNotNull($result->published_at);
    }

    public function test_unpublish_post(): void
    {
        $post = Post::factory()->published()->create();

        $result = $this->service->unpublish($post);

        $this->assertEquals('draft', $result->status);
    }

    public function test_find_post_by_id(): void
    {
        $post = Post::factory()->create();

        $found = $this->service->find($post->id);

        $this->assertEquals($post->id, $found->id);
        $this->assertTrue($found->relationLoaded('author'));
    }

    public function test_force_delete_removes_record(): void
    {
        $post = Post::factory()->create();
        $id = $post->id;

        $this->service->forceDelete($post);

        $this->assertDatabaseMissing('posts', ['id' => $id]);
    }
}
