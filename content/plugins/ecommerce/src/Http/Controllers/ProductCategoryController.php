<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryController extends Controller
{
    /**
     * Display the list of categories.
     */
    public function index(): Response
    {
        $categories = ProductCategory::withCount('products')
            ->with('children')
            ->roots()
            ->ordered()
            ->get();

        return Inertia::render('Admin/Ecommerce/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:product_categories,slug',
            'parent_id' => 'nullable|exists:product_categories,id',
            'description' => 'nullable|string',
            'image' => 'nullable|string|max:500',
            'order' => 'integer|min:0',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $validated['order'] = $validated['order'] ?? 0;

        ProductCategory::create($validated);

        return redirect()
            ->back()
            ->with('success', 'Categorie creee avec succes.');
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, ProductCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:product_categories,slug,' . $category->id,
            'parent_id' => 'nullable|exists:product_categories,id',
            'description' => 'nullable|string',
            'image' => 'nullable|string|max:500',
            'order' => 'integer|min:0',
        ]);

        $category->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Categorie mise a jour avec succes.');
    }

    /**
     * Delete the specified category.
     */
    public function destroy(ProductCategory $category): RedirectResponse
    {
        if ($category->products()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Impossible de supprimer une categorie contenant des produits.');
        }

        $category->delete();

        return redirect()
            ->back()
            ->with('success', 'Categorie supprimee avec succes.');
    }
}
