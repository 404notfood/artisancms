<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\BlockPattern;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class BlockPatternService
{
    /**
     * Get all patterns grouped by category.
     *
     * @return Collection<string, Collection<int, BlockPattern>>
     */
    public function getAllGrouped(): Collection
    {
        return BlockPattern::with('creator')
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');
    }

    /**
     * Get all patterns as flat list.
     *
     * @return Collection<int, BlockPattern>
     */
    public function getAll(): Collection
    {
        return BlockPattern::with('creator')
            ->orderBy('name')
            ->get();
    }

    /**
     * Create a new pattern.
     */
    public function create(array $data): BlockPattern
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        return BlockPattern::create($data);
    }

    /**
     * Update a pattern.
     */
    public function update(BlockPattern $pattern, array $data): BlockPattern
    {
        $pattern->update($data);
        return $pattern;
    }

    /**
     * Delete a pattern.
     */
    public function delete(BlockPattern $pattern): void
    {
        $pattern->delete();
    }

    /**
     * Get available pattern categories.
     *
     * @return array<string>
     */
    public function getCategories(): array
    {
        return BlockPattern::distinct()
            ->pluck('category')
            ->sort()
            ->values()
            ->toArray();
    }
}
