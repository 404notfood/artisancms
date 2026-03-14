<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->jobTitle();

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'permissions' => [],
            'is_system' => false,
        ];
    }

    /**
     * Create an admin role with full permissions.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Administrateur',
            'slug' => 'admin',
            'permissions' => ['*'],
            'is_system' => true,
        ]);
    }

    /**
     * Create an editor role.
     */
    public function editor(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Éditeur',
            'slug' => 'editor',
            'permissions' => ['pages.*', 'posts.*', 'media.*', 'menus.*', 'taxonomies.*'],
            'is_system' => true,
        ]);
    }

    /**
     * Create an author role.
     */
    public function author(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Auteur',
            'slug' => 'author',
            'permissions' => ['pages.create', 'pages.update.own', 'posts.create', 'posts.update.own', 'media.create'],
            'is_system' => true,
        ]);
    }

    /**
     * Create a subscriber role.
     */
    public function subscriber(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Abonné',
            'slug' => 'subscriber',
            'permissions' => ['profile.edit'],
            'is_system' => true,
        ]);
    }

    /**
     * Mark the role as a system role.
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_system' => true,
        ]);
    }

    /**
     * Set custom permissions for the role.
     *
     * @param list<string> $permissions
     */
    public function withPermissions(array $permissions): static
    {
        return $this->state(fn (array $attributes) => [
            'permissions' => $permissions,
        ]);
    }
}
