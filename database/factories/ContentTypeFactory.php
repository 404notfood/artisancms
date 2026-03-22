<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ContentType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ContentType>
 */
class ContentTypeFactory extends Factory
{
    protected $model = ContentType::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'icon' => fake()->randomElement(['file-text', 'star', 'briefcase', 'users', 'heart', 'bookmark']),
            'fields' => [
                [
                    'name' => 'subtitle',
                    'type' => 'text',
                    'label' => 'Subtitle',
                    'required' => false,
                ],
            ],
            'supports' => ['title', 'editor', 'excerpt', 'thumbnail'],
            'has_archive' => true,
            'public' => true,
            'menu_position' => fake()->numberBetween(1, 100),
        ];
    }

    /**
     * Set the content type as public.
     */
    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'public' => true,
            'has_archive' => true,
        ]);
    }

    /**
     * Set the content type as private (not public).
     */
    public function private(): static
    {
        return $this->state(fn (array $attributes) => [
            'public' => false,
            'has_archive' => false,
        ]);
    }

    /**
     * Set the content type with no archive.
     */
    public function withoutArchive(): static
    {
        return $this->state(fn (array $attributes) => [
            'has_archive' => false,
        ]);
    }

    /**
     * Set specific fields for the content type.
     *
     * @param array<int, array<string, mixed>> $fields
     */
    public function withFields(array $fields): static
    {
        return $this->state(fn (array $attributes) => [
            'fields' => $fields,
        ]);
    }
}
