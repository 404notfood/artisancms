<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MenuItemsRequest;
use App\Http\Requests\MenuRequest;
use App\Models\Menu;
use App\Services\MenuService;
use Illuminate\Http\RedirectResponse;
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

        return Inertia::render('Admin/Menus/Edit', [
            'menu' => $menu,
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
}
