<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_generates_slug_from_title(): void
    {
        $post = Post::factory()->create(['title' => 'Blog Post Title', 'slug' => '']);

        $this->assertEquals('blog-post-title', $post->slug);
    }

    public function test_content_is_cast_to_array(): void
    {
        $post = Post::factory()->create([
            'content' => ['blocks' => [['id' => '1', 'type' => 'text']]],
        ]);

        $this->assertIsArray($post->content);
    }

    public function test_belongs_to_author(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['created_by' => $user->id]);

        $this->assertEquals($user->id, $post->author->id);
    }

    public function test_has_revisions(): void
    {
        $post = Post::factory()->create();
        $post->revisions()->create([
            'data' => ['title' => $post->title],
            'reason' => 'test',
        ]);

        $this->assertCount(1, $post->revisions);
    }

    public function test_published_scope(): void
    {
        Post::factory()->published()->create();
        Post::factory()->draft()->create();

        $published = Post::published()->get();

        $this->assertCount(1, $published);
        $this->assertEquals('published', $published->first()->status);
    }

    public function test_draft_scope(): void
    {
        Post::factory()->published()->create();
        Post::factory()->draft()->create();

        $drafts = Post::draft()->get();

        $this->assertCount(1, $drafts);
    }

    public function test_soft_deletes(): void
    {
        $post = Post::factory()->create();
        $post->delete();

        $this->assertSoftDeleted($post);
    }

    public function test_allow_comments_cast_to_boolean(): void
    {
        $post = Post::factory()->create(['allow_comments' => true]);

        $this->assertTrue($post->allow_comments);
    }

    public function test_should_be_searchable_only_when_published(): void
    {
        $published = Post::factory()->published()->make();
        $draft = Post::factory()->draft()->make();

        $this->assertTrue($published->shouldBeSearchable());
        $this->assertFalse($draft->shouldBeSearchable());
    }
}
