<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Product;
use Ecommerce\Models\ProductCategory;
use Ecommerce\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
    ) {}

    /**
     * Display a paginated list of products.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'search', 'category_id', 'per_page']);

        $products = $this->productService->all($filters);
        $categories = ProductCategory::ordered()->get();

        return Inertia::render('Admin/Ecommerce/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): Response
    {
        $categories = ProductCategory::ordered()->get();

        return Inertia::render('Admin/Ecommerce/Products/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:100',
            'stock' => 'required|integer|min:0',
            'status' => 'required|in:draft,published,archived',
            'featured_image' => 'nullable|string|max:500',
            'gallery' => 'nullable|array',
            'gallery.*' => 'string|max:500',
            'category_id' => 'nullable|exists:product_categories,id',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.attributes' => 'nullable|array',
        ]);

        $this->productService->create($validated);

        return redirect()
            ->route('admin.shop.products.index')
            ->with('success', 'Produit cree avec succes.');
    }

    /**
     * Show the form for editing a product.
     */
    public function edit(Product $product): Response
    {
        $product->load(['category', 'variants']);
        $categories = ProductCategory::ordered()->get();

        return Inertia::render('Admin/Ecommerce/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug,' . $product->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:100',
            'stock' => 'required|integer|min:0',
            'status' => 'required|in:draft,published,archived',
            'featured_image' => 'nullable|string|max:500',
            'gallery' => 'nullable|array',
            'gallery.*' => 'string|max:500',
            'category_id' => 'nullable|exists:product_categories,id',
            'variants' => 'nullable|array',
            'variants.*.id' => 'nullable|integer',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.attributes' => 'nullable|array',
        ]);

        $this->productService->update($product, $validated);

        return redirect()
            ->back()
            ->with('success', 'Produit mis a jour avec succes.');
    }

    /**
     * Delete the specified product.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $this->productService->delete($product);

        return redirect()
            ->route('admin.shop.products.index')
            ->with('success', 'Produit supprime avec succes.');
    }
}
