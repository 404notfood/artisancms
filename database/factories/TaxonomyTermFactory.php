<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TaxonomyTerm>
 */
class TaxonomyTermFactory extends Factory
{
    protected $model = TaxonomyTerm::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'taxonomy_id' => Taxonomy::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'parent_id' => null,
            'order' => 0,
        ];
    }

    /**
     * Set the term as a child of another term.
     */
    public function childOf(TaxonomyTerm $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'taxonomy_id' => $parent->taxonomy_id,
            'parent_id' => $parent->id,
        ]);
    }
}
