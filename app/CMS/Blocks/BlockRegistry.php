<?php

declare(strict_types=1);

namespace App\CMS\Blocks;

use App\Models\Block;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class BlockRegistry
{
    /**
     * Register a new block in the database.
     *
     * @param array<string, mixed> $blockData
     */
    public function register(array $blockData): Block
    {
        $block = Block::updateOrCreate(
            ['slug' => $blockData['slug']],
            [
                'name' => $blockData['name'] ?? $blockData['slug'],
                'category' => $blockData['category'] ?? 'general',
                'icon' => $blockData['icon'] ?? null,
                'schema' => $blockData['schema'] ?? [],
                'default_props' => $blockData['default_props'] ?? [],
                'is_core' => $blockData['is_core'] ?? false,
                'source' => $blockData['source'] ?? 'core',
            ],
        );

        Cache::forget('cms.blocks.registry');

        return $block;
    }

    /**
     * Get a block by its slug.
     */
    public function get(string $slug): ?Block
    {
        return Block::where('slug', $slug)->first();
    }

    /**
     * Get all registered blocks.
     *
     * @return Collection<int, Block>
     */
    public function getAll(): Collection
    {
        return Cache::remember('cms.blocks.registry', 3600, fn () => Block::orderBy('category')->orderBy('name')->get());
    }

    /**
     * Get all blocks in a given category.
     *
     * @return Collection<int, Block>
     */
    public function getByCategory(string $category): Collection
    {
        return Cache::remember('cms.blocks.category.' . $category, 3600, fn () => Block::where('category', $category)->orderBy('name')->get());
    }

    /**
     * Unregister a block by slug.
     */
    public function unregister(string $slug): bool
    {
        $deleted = Block::where('slug', $slug)->delete();

        Cache::forget('cms.blocks.registry');

        return $deleted > 0;
    }
}
