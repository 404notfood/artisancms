<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Setting>
 */
class SettingFactory extends Factory
{
    protected $model = Setting::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'group' => 'general',
            'key' => fake()->unique()->word(),
            'value' => fake()->word(),
            'type' => 'string',
            'is_public' => false,
        ];
    }

    /**
     * Set the setting as public.
     */
    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_public' => true,
        ]);
    }

    /**
     * Set a specific group and key.
     */
    public function groupKey(string $group, string $key): static
    {
        return $this->state(fn (array $attributes) => [
            'group' => $group,
            'key' => $key,
        ]);
    }
}
