<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'menu_id' => Menu::factory(),
            'parent_id' => null,
            'label' => fake()->words(2, true),
            'type' => 'url',
            'url' => fake()->url(),
            'linkable_id' => null,
            'linkable_type' => null,
            'target' => '_self',
            'css_class' => null,
            'icon' => null,
            'order' => fake()->numberBetween(0, 10),
        ];
    }

    /**
     * Set the menu item as a child of another item.
     */
    public function childOf(MenuItem $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'menu_id' => $parent->menu_id,
            'parent_id' => $parent->id,
        ]);
    }

    /**
     * Set the menu item to open in a new tab.
     */
    public function newTab(): static
    {
        return $this->state(fn (array $attributes) => [
            'target' => '_blank',
        ]);
    }
}
