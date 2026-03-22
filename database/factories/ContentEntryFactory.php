<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ContentEntry>
 */
class ContentEntryFactory extends Factory
{
    protected $model = ContentEntry::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'content_type_id' => ContentType::factory(),
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
            'excerpt' => fake()->sentence(10),
            'featured_image' => null,
            'status' => 'draft',
            'fields_data' => [],
            'created_by' => User::factory(),
            'published_at' => null,
        ];
    }

    /**
     * Set the entry as published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Set the entry as draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    /**
     * Set a specific author for the entry.
     */
    public function byAuthor(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'created_by' => $user->id,
        ]);
    }

    /**
     * Set a specific content type for the entry.
     */
    public function forType(ContentType $contentType): static
    {
        return $this->state(fn (array $attributes) => [
            'content_type_id' => $contentType->id,
        ]);
    }

    /**
     * Set custom fields data.
     *
     * @param array<string, mixed> $data
     */
    public function withFieldsData(array $data): static
    {
        return $this->state(fn (array $attributes) => [
            'fields_data' => $data,
        ]);
    }
}
