<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Menu;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Menu>
 */
class MenuFactory extends Factory
{
    protected $model = Menu::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'location' => fake()->randomElement(['header', 'footer', 'sidebar']),
        ];
    }

    /**
     * Set the menu location to header.
     */
    public function header(): static
    {
        return $this->state(fn (array $attributes) => [
            'location' => 'header',
        ]);
    }

    /**
     * Set the menu location to footer.
     */
    public function footer(): static
    {
        return $this->state(fn (array $attributes) => [
            'location' => 'footer',
        ]);
    }
}
