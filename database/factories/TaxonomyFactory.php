<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Taxonomy;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Taxonomy>
 */
class TaxonomyFactory extends Factory
{
    protected $model = Taxonomy::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'type' => 'category',
            'description' => fake()->sentence(),
            'hierarchical' => true,
            'applies_to' => ['posts'],
        ];
    }

    /**
     * Create a tag taxonomy (non-hierarchical).
     */
    public function tag(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'tag',
            'hierarchical' => false,
        ]);
    }

    /**
     * Create a category taxonomy (hierarchical).
     */
    public function category(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'category',
            'hierarchical' => true,
        ]);
    }
}
