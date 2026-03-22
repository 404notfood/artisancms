<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Redirect;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Redirect>
 */
class RedirectFactory extends Factory
{
    protected $model = Redirect::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'source_path' => '/' . fake()->unique()->slug(3),
            'target_url' => '/' . fake()->slug(2),
            'status_code' => 301,
            'hits' => 0,
            'active' => true,
            'note' => fake()->optional(0.5)->sentence(),
        ];
    }

    /**
     * Set the redirect as active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => true,
        ]);
    }

    /**
     * Set the redirect as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => false,
        ]);
    }

    /**
     * Set the redirect as a 301 (permanent).
     */
    public function permanent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_code' => 301,
        ]);
    }

    /**
     * Set the redirect as a 302 (temporary).
     */
    public function temporary(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_code' => 302,
        ]);
    }

    /**
     * Set the redirect with a specific number of hits.
     */
    public function withHits(int $count = 10): static
    {
        return $this->state(fn (array $attributes) => [
            'hits' => $count,
        ]);
    }
}
