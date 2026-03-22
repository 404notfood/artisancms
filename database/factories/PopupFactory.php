<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Popup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Popup>
 */
class PopupFactory extends Factory
{
    protected $model = Popup::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'title' => fake()->sentence(4),
            'content' => '<p>' . fake()->paragraph() . '</p>',
            'type' => fake()->randomElement(['modal', 'slide-in', 'bar', 'fullscreen']),
            'trigger' => fake()->randomElement(['delay', 'scroll', 'exit-intent', 'click']),
            'trigger_value' => (string) fake()->numberBetween(1, 30),
            'display_frequency' => fake()->randomElement(['always', 'once', 'session', 'daily']),
            'pages' => ['*'],
            'cta_text' => fake()->words(3, true),
            'cta_url' => fake()->url(),
            'style' => [
                'background' => '#ffffff',
                'text_color' => '#000000',
                'overlay' => true,
            ],
            'active' => false,
            'starts_at' => null,
            'ends_at' => null,
        ];
    }

    /**
     * Set the popup as active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => true,
        ]);
    }

    /**
     * Set the popup as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => false,
        ]);
    }

    /**
     * Set the popup with a scheduled date range.
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => true,
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addWeek(),
        ]);
    }

    /**
     * Set the popup as currently running (active and within date range).
     */
    public function current(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => true,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addWeek(),
        ]);
    }

    /**
     * Set the popup as expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => true,
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->subDay(),
        ]);
    }

    /**
     * Set the popup as a modal type.
     */
    public function modal(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'modal',
        ]);
    }

    /**
     * Set the popup with exit-intent trigger.
     */
    public function exitIntent(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger' => 'exit-intent',
            'trigger_value' => null,
        ]);
    }
}
