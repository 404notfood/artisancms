<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(4);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'content' => [
                'blocks' => [
                    [
                        'id' => Str::uuid()->toString(),
                        'type' => 'text',
                        'props' => ['html' => '<p>' . fake()->paragraphs(3, true) . '</p>'],
                        'children' => [],
                    ],
                ],
            ],
            'excerpt' => fake()->sentence(10),
            'status' => 'draft',
            'featured_image' => null,
            'created_by' => User::factory(),
            'allow_comments' => true,
        ];
    }

    /**
     * Set the post as published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Set the post as draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    /**
     * Set a specific author for the post.
     */
    public function byAuthor(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'created_by' => $user->id,
        ]);
    }
}
