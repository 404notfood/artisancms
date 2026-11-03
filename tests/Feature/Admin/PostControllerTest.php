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

        $post = Post::where('slug', 'new-blog-post')->firstOrFail();
        $response->assertRedirect(route('admin.posts.edit', $post));
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

    public function test_admin_can_open_article_in_shared_builder(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->create(['created_by' => $admin->id]);

        $this->actingAs($admin)->get(route('admin.posts.builder', $post))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Builder/Edit')
                ->where('post.id', $post->id)
                ->missing('page'));
    }

    public function test_builder_saves_sanitized_nested_content_with_revision(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->draft()->create(['created_by' => $admin->id]);
        $content = [[
            'id' => 'section-1', 'type' => 'section', 'props' => [],
            'children' => [[
                'id' => 'text-1', 'type' => 'text',
                'props' => ['html' => '<p>Article</p><script>alert(1)</script>'],
                'children' => [],
            ]],
        ]];

        $this->actingAs($admin)->put(route('admin.posts.builder.update', $post), ['content' => $content])
            ->assertRedirect()->assertSessionHasNoErrors();

        $post->refresh();
        $this->assertSame('<p>Article</p>', $post->content[0]['children'][0]['props']['html']);
        $this->assertSame('draft', $post->status);
        $this->assertSame($post->content, $post->revisions()->latest('id')->firstOrFail()->data['content']);
    }

    public function test_builder_can_save_empty_content(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->create(['created_by' => $admin->id]);

        $this->actingAs($admin)->put(route('admin.posts.builder.update', $post), ['content' => []])
            ->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame([], $post->fresh()->content);
    }

    public function test_saved_builder_content_is_available_on_published_article(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->draft()->create(['created_by' => $admin->id]);
        $content = [['id' => 'heading-1', 'type' => 'heading', 'props' => ['text' => 'Mon article'], 'children' => []]];

        $this->actingAs($admin)->put(route('admin.posts.builder.update', $post), ['content' => $content])
            ->assertSessionHasNoErrors();
        $this->post(route('admin.posts.publish', $post))->assertRedirect();

        $this->get(route('blog.show', $post->slug))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Front/Blog/Show')
                ->where('post.content.0.props.text', 'Mon article'));
    }

    public function test_builder_rejects_invalid_content_without_changing_article(): void
    {
        $admin = $this->createAdmin();
        $post = Post::factory()->create(['created_by' => $admin->id]);
        $original = $post->content;

        $this->actingAs($admin)->putJson(route('admin.posts.builder.update', $post), ['content' => [['id' => 'invalid']]])
            ->assertUnprocessable()->assertJsonValidationErrors('content.0.type');

        $this->assertSame($original, $post->fresh()->content);
    }

    public function test_builder_requires_permission_to_edit_article(): void
    {
        $subscriber = $this->createSubscriber();
        $post = Post::factory()->create();

        $this->actingAs($subscriber)->get(route('admin.posts.builder', $post))->assertForbidden();
        $this->putJson(route('admin.posts.builder.update', $post), ['content' => []])->assertForbidden();
    }

    public function test_guest_cannot_open_or_save_builder(): void
    {
        $post = Post::factory()->create();

        $this->get(route('admin.posts.builder', $post))->assertRedirect('/login');
        $this->put(route('admin.posts.builder.update', $post), ['content' => []])->assertRedirect('/login');
    }
}
