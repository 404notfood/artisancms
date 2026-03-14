<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Page>
 */
class PageFactory extends Factory
{
    protected $model = Page::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'content' => [
                'blocks' => [
                    [
                        'id' => Str::uuid()->toString(),
                        'type' => 'text',
                        'props' => ['html' => '<p>' . fake()->paragraph() . '</p>'],
                        'children' => [],
                    ],
                ],
            ],
            'status' => 'draft',
            'template' => 'default',
            'meta_title' => $title,
            'meta_description' => fake()->sentence(),
            'created_by' => User::factory(),
            'order' => 0,
        ];
    }

    /**
     * Set the page as published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Set the page as draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    /**
     * Set a specific author for the page.
     */
    public function byAuthor(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'created_by' => $user->id,
        ]);
    }

    /**
     * Set a parent page.
     */
    public function withParent(Page $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
        ]);
    }
}
