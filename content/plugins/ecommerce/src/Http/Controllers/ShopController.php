<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
use Ecommerce\Models\Product;
use Ecommerce\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    /**
     * Display the product listing page with filters.
     */
    public function index(Request $request): Response
    {
        $query = Product::with('category')->published();

        // Search filter
        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        // Category filter
        if ($request->filled('category')) {
            $category = ProductCategory::where('slug', $request->input('category'))->first();
            if ($category) {
                $query->byCategory($category->id);
            }
        }

        // Price range filter
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->input('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->input('max_price'));
        }

        // Sorting
        $sort = $request->input('sort', 'recent');
        match ($sort) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            default => $query->orderByDesc('created_at'),
        };

        $products = $query->paginate(12)->withQueryString();

        $categories = ProductCategory::withCount(['products' => function ($q) {
            $q->published();
        }])->ordered()->get();

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'min_price', 'max_price', 'sort']),
            'settings' => $settings,
        ]);
    }

    /**
     * Display a single product detail page.
     */
    public function show(string $slug): Response
    {
        $product = Product::with(['variants', 'category'])
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();

        // Load related products from the same category (max 4)
        $relatedProducts = collect();
        if ($product->category_id) {
            $relatedProducts = Product::published()
                ->where('category_id', $product->category_id)
                ->where('id', '!=', $product->id)
                ->limit(4)
                ->get();
        }

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'settings' => $settings,
        ]);
    }

    /**
     * Display products filtered by category.
     */
    public function category(Request $request, string $slug): Response
    {
        $category = ProductCategory::where('slug', $slug)->firstOrFail();

        $query = Product::with('category')
            ->published()
            ->byCategory($category->id);

        // Search filter
        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        // Price range filter
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->input('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->input('max_price'));
        }

        // Sorting
        $sort = $request->input('sort', 'recent');
        match ($sort) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            default => $query->orderByDesc('created_at'),
        };

        $products = $query->paginate(12)->withQueryString();

        $categories = ProductCategory::withCount(['products' => function ($q) {
            $q->published();
        }])->ordered()->get();

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Category', [
            'category' => $category,
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'min_price', 'max_price', 'sort']),
            'settings' => $settings,
        ]);
    }

    /**
     * Get current e-commerce settings with defaults.
     *
     * @return array<string, mixed>
     */
    private function getSettings(): array
    {
        $defaults = [
            'store_name' => 'Ma Boutique',
            'currency' => 'EUR',
            'currency_symbol' => "\u{20AC}",
            'tax_rate' => 20,
            'shipping_cost' => 5.99,
            'free_shipping_threshold' => 50,
        ];

        $plugin = CmsPlugin::where('slug', 'ecommerce')->first();

        if (!$plugin || empty($plugin->settings)) {
            return $defaults;
        }

        return array_merge($defaults, $plugin->settings);
    }
}
