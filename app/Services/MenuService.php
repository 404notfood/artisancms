<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;

class MenuService
{
    /**
     * Get all menus.
     *
     * @return Collection<int, Menu>
     */
    public function all(): Collection
    {
        return Menu::withCount('items')->orderBy('name')->get();
    }

    /**
     * Find a menu by ID with nested items, ordered.
     *
     * @throws ModelNotFoundException
     */
    public function find(int $id): Menu
    {
        $menu = Menu::with(['rootItems.children' => function ($query): void {
            $query->orderBy('order');
        }])->findOrFail($id);

        // Map rootItems to items for frontend compatibility
        $menu->setRelation('items', $menu->rootItems);
        $menu->unsetRelation('rootItems');

        return $menu;
    }

    /**
     * Create a new menu.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Menu
    {
        $menu = Menu::create($data);

        CMS::fire('menu.created', $menu);

        return $menu;
    }

    /**
     * Update a menu.
     *
     * @param array<string, mixed> $data
     */
    public function update(Menu $menu, array $data): Menu
    {
        $menu->update($data);

        CMS::fire('menu.updated', $menu);

        return $menu->fresh() ?? $menu;
    }

    /**
     * Delete a menu and all its items.
     */
    public function delete(Menu $menu): bool
    {
        CMS::fire('menu.deleting', $menu);

        // Delete all menu items first
        $menu->items()->delete();

        $deleted = (bool) $menu->delete();

        if ($deleted) {
            CMS::fire('menu.deleted', $menu);
        }

        return $deleted;
    }

    /**
     * Get published pages and posts for the menu item linkable dropdown.
     *
     * @return array{pages: Collection, posts: Collection}
     */
    public function getLinkableItems(): array
    {
        return [
            'pages' => Page::where('status', 'published')
                ->orderBy('title')
                ->get(['id', 'title', 'slug']),
            'posts' => Post::published()
                ->orderBy('title')
                ->get(['id', 'title', 'slug']),
        ];
    }

    /**
     * Sync menu items: delete existing items and recreate from nested array structure.
     *
     * Each item in the array should have:
     *   - label: string
     *   - type: string (e.g., 'custom', 'page', 'post')
     *   - url: string|null
     *   - target: string (e.g., '_self', '_blank')
     *   - css_class: string|null
     *   - icon: string|null
     *   - linkable_id: int|null
     *   - linkable_type: string|null
     *   - children: array (same structure, recursive)
     *
     * @param array<int, array<string, mixed>> $items
     */
    public function syncItems(Menu $menu, array $items): Menu
    {
        // Delete all existing items for this menu
        $menu->items()->delete();

        // Recreate items from the nested structure
        $this->createItemsRecursive($menu, $items, null, 0);

        CMS::fire('menu.items_synced', $menu);

        return $menu->fresh(['rootItems.children']) ?? $menu;
    }

    /**
     * Add a single item to a menu.
     *
     * @param array<string, mixed> $data
     */
    public function addItem(Menu $menu, array $data): MenuItem
    {
        return MenuItem::create([
            'menu_id' => $menu->id,
            'label' => $data['label'],
            'type' => $data['type'] ?? 'custom',
            'url' => $data['url'] ?? null,
            'target' => $data['target'] ?? '_self',
            'order' => $data['order'] ?? $menu->items()->count(),
        ]);
    }

    /**
     * Update a single menu item.
     *
     * @param array<string, mixed> $data
     */
    public function updateItem(MenuItem $item, array $data): MenuItem
    {
        $item->update($data);

        return $item->fresh() ?? $item;
    }

    /**
     * Delete a single menu item.
     */
    public function deleteItem(MenuItem $item): bool
    {
        return (bool) $item->delete();
    }

    /**
     * Reorder menu items.
     *
     * @param array<int, array{id: int, order: int}> $items
     */
    public function reorderItems(Menu $menu, array $items): void
    {
        foreach ($items as $itemData) {
            MenuItem::where('id', $itemData['id'])
                ->where('menu_id', $menu->id)
                ->update(['order' => $itemData['order']]);
        }
    }

    /**
     * Recursively create menu items with their children.
     *
     * @param array<int, array<string, mixed>> $items
     */
    private function createItemsRecursive(Menu $menu, array $items, ?int $parentId, int $startOrder): void
    {
        foreach ($items as $index => $itemData) {
            $children = $itemData['children'] ?? [];
            unset($itemData['children']);

            $menuItem = MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'label' => $itemData['label'] ?? '',
                'type' => $itemData['type'] ?? 'custom',
                'url' => $itemData['url'] ?? null,
                'linkable_id' => $itemData['linkable_id'] ?? null,
                'linkable_type' => $itemData['linkable_type'] ?? null,
                'target' => $itemData['target'] ?? '_self',
                'css_class' => $itemData['css_class'] ?? null,
                'icon' => $itemData['icon'] ?? null,
                'is_mega' => $itemData['is_mega'] ?? false,
                'mega_columns' => $itemData['mega_columns'] ?? 3,
                'mega_content' => $itemData['mega_content'] ?? null,
                'mega_image' => $itemData['mega_image'] ?? null,
                'mega_html' => $itemData['mega_html'] ?? null,
                'mega_width' => $itemData['mega_width'] ?? 'auto',
                'badge_text' => $itemData['badge_text'] ?? null,
                'badge_color' => $itemData['badge_color'] ?? null,
                'order' => $startOrder + $index,
            ]);

            if (!empty($children)) {
                $this->createItemsRecursive($menu, $children, $menuItem->id, 0);
            }
        }
    }
}
