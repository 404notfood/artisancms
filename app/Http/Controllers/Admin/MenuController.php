<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MenuItemsRequest;
use App\Http\Requests\MenuRequest;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Services\MenuService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function __construct(
        private readonly MenuService $menuService,
    ) {}

    /**
     * Display a list of all menus.
     */
    public function index(): Response
    {
        $menus = $this->menuService->all();

        return Inertia::render('Admin/Menus/Index', [
            'menus' => $menus,
        ]);
    }

    /**
     * Show the form for creating a new menu.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Menus/Create');
    }

    /**
     * Store a newly created menu.
     */
    public function store(MenuRequest $request): RedirectResponse
    {
        $this->menuService->create($request->validated());

        return redirect()
            ->route('admin.menus.index')
            ->with('success', __('cms.menus.created'));
    }

    /**
     * Show the form for editing a menu with its items tree.
     */
    public function edit(Menu $menu): Response
    {
        $menu = $this->menuService->find($menu->id);
        $linkables = $this->menuService->getLinkableItems();

        return Inertia::render('Admin/Menus/Edit', [
            'menu' => $menu,
            'pages' => $linkables['pages'],
            'posts' => $linkables['posts'],
        ]);
    }

    /**
     * Update the specified menu.
     */
    public function update(MenuRequest $request, Menu $menu): RedirectResponse
    {
        $this->menuService->update($menu, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.menus.updated'));
    }

    /**
     * Delete the specified menu.
     */
    public function destroy(Menu $menu): RedirectResponse
    {
        $this->menuService->delete($menu);

        return redirect()
            ->route('admin.menus.index')
            ->with('success', __('cms.menus.deleted'));
    }

    /**
     * Sync the menu items (replace all items with the given tree structure).
     */
    public function syncItems(MenuItemsRequest $request, Menu $menu): RedirectResponse
    {
        $this->menuService->syncItems($menu, $request->validated('items'));

        return redirect()
            ->back()
            ->with('success', __('cms.menus.items_synced'));
    }

    /**
     * Add a single item to a menu.
     */
    public function storeItem(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:page,post,url,custom,taxonomy'],
            'url' => ['nullable', 'string', 'max:2048'],
            'target' => ['sometimes', 'in:_self,_blank'],
            'order' => ['nullable', 'integer'],
        ]);

        $this->menuService->addItem($menu, $validated);

        return redirect()
            ->back()
            ->with('success', __('cms.menus.item_added'));
    }

    /**
     * Update a single menu item.
     */
    public function updateItem(Request $request, Menu $menu, MenuItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:page,post,url,custom,taxonomy'],
            'url' => ['nullable', 'string', 'max:2048'],
            'target' => ['sometimes', 'in:_self,_blank'],
            'css_class' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
            'is_mega' => ['sometimes', 'boolean'],
            'mega_columns' => ['sometimes', 'integer', 'min:1', 'max:6'],
            'badge_text' => ['nullable', 'string', 'max:255'],
            'badge_color' => ['nullable', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
        ]);

        $item->update($validated);

        return redirect()
            ->back()
            ->with('success', __('cms.menus.item_updated'));
    }

    /**
     * Delete a single menu item.
     */
    public function destroyItem(Menu $menu, MenuItem $item): RedirectResponse
    {
        $item->delete();

        return redirect()
            ->back()
            ->with('success', __('cms.menus.item_deleted'));
    }

    /**
     * Reorder menu items.
     */
    public function reorderItems(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer'],
            'items.*.order' => ['required', 'integer'],
        ]);

        $this->menuService->reorderItems($menu, $validated['items']);

        return redirect()
            ->back()
            ->with('success', __('cms.menus.items_reordered'));
    }
}
