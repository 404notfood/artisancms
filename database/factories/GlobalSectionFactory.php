<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\GlobalSection;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<GlobalSection>
 */
class GlobalSectionFactory extends Factory
{
    protected $model = GlobalSection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'type' => fake()->randomElement(['header', 'footer', 'sidebar']),
            'content' => [
                'blocks' => [
                    [
                        'id' => Str::uuid()->toString(),
                        'type' => 'text',
                        'props' => ['html' => '<p>' . fake()->sentence() . '</p>'],
                        'children' => [],
                    ],
                ],
            ],
            'status' => 'active',
            'site_id' => null,
        ];
    }

    /**
     * Set the section as active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Set the section as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Set the section as a header.
     */
    public function header(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'header',
        ]);
    }

    /**
     * Set the section as a footer.
     */
    public function footer(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'footer',
        ]);
    }

    /**
     * Set the section as a sidebar.
     */
    public function sidebar(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'sidebar',
        ]);
    }

    /**
     * Assign the section to a specific site.
     */
    public function forSite(int $siteId): static
    {
        return $this->state(fn (array $attributes) => [
            'site_id' => $siteId,
        ]);
    }
}
