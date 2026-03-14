<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CmsTestHelpers;

class PostControllerTest extends TestCase
{
    use CmsTestHelpers, RefreshDatabase;

    public function test_admin_can_view_posts_index(): void
    {
        $admin = $this->createAdmin();
        Post::factory()->count(3)->create(['created_by' => $admin->id]);

        $response = $this->actingAs($admin)->get('/admin/posts');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Admin/Posts/Index')
            ->has('posts.data', 3)
        );
    }

    public function test_admin_can_create_post(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/posts', [
            'title' => 'New Blog Post',
            'slug' => 'new-blog-post',
            'status' => 'draft',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('posts', ['slug' => 'new-blog-post']);
    }

    public function test_admin_can_update_post(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->create(['created_by' => $admin->id]);

        $response = $this->actingAs($admin)->put("/admin/posts/{$post->id}", [
            'title' => 'Updated Title',
            'slug' => $post->slug,
            'status' => 'draft',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('posts', ['id' => $post->id, 'title' => 'Updated Title']);
    }

    public function test_admin_can_delete_post(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->create(['created_by' => $admin->id]);

        $response = $this->actingAs($admin)->delete("/admin/posts/{$post->id}");

        $response->assertRedirect();
        $this->assertSoftDeleted($post);
    }

    public function test_admin_can_publish_post(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->draft()->create(['created_by' => $admin->id]);

        $response = $this->actingAs($admin)->post("/admin/posts/{$post->id}/publish");

        $response->assertRedirect();
        $this->assertEquals('published', $post->fresh()->status);
    }

    public function test_admin_can_unpublish_post(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->published()->create(['created_by' => $admin->id]);

        $response = $this->actingAs($admin)->post("/admin/posts/{$post->id}/unpublish");

        $response->assertRedirect();
        $this->assertEquals('draft', $post->fresh()->status);
    }

    public function test_guest_cannot_access_posts(): void
    {
        $response = $this->get('/admin/posts');

        $response->assertRedirect('/login');
    }

    public function test_admin_can_restore_deleted_post(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->create(['created_by' => $admin->id]);
        $post->delete();

        $response = $this->actingAs($admin)->post("/admin/posts/{$post->id}/restore");

        $response->assertRedirect();
        $this->assertNotSoftDeleted($post);
    }
}
