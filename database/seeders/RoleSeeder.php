<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrateur',
                'slug' => 'admin',
                'permissions' => ['*'],
                'is_system' => true,
            ],
            [
                'name' => 'Éditeur',
                'slug' => 'editor',
                'permissions' => [
                    'pages.*', 'posts.*', 'media.*', 'menus.*',
                    'taxonomies.*', 'settings.read',
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Auteur',
                'slug' => 'author',
                'permissions' => [
                    'pages.create', 'pages.read', 'pages.update.own',
                    'posts.create', 'posts.read', 'posts.update.own',
                    'media.create', 'media.read',
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Abonné',
                'slug' => 'subscriber',
                'permissions' => ['profile.read', 'profile.update'],
                'is_system' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role,
            );
        }
    }
}
