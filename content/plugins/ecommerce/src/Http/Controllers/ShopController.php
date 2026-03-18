<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Http\Controllers\Concerns\HasEcommerceSettings;
use Ecommerce\Http\Controllers\Concerns\HasThemeAndMenus;
use Ecommerce\Models\Product;
use Ecommerce\Models\ProductCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    use HasEcommerceSettings;
    use HasThemeAndMenus;

    public function index(Request $request): Response
    {
        $query = Product::with('category')->published();

        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        $products = $query->paginate(12)->withQueryString();

        $categories = ProductCategory::withCount(['products' => fn ($q) => $q->published()])
            ->ordered()
            ->get();

        return Inertia::render('Front/Shop/Index', array_merge($this->themeAndMenus(), [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'min_price', 'max_price', 'sort']),
            'settings' => $this->getSettings(),
        ]));
    }

    public function show(string $slug): Response
    {
        $product = Product::with(['variants', 'category'])
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();

        $related = $product->category_id
            ? Product::published()
                ->where('category_id', $product->category_id)
                ->where('id', '!=', $product->id)
                ->limit(4)
                ->get()
            : collect();

        return Inertia::render('Front/Shop/Show', array_merge($this->themeAndMenus(), [
            'product' => $product,
            'relatedProducts' => $related,
            'settings' => $this->getSettings(),
        ]));
    }

    public function category(Request $request, string $slug): Response
    {
        $category = ProductCategory::where('slug', $slug)->firstOrFail();

        $query = Product::with('category')
            ->published()
            ->byCategory($category->id);

        $this->applyFilters($query, $request, skipCategory: true);
        $this->applySorting($query, $request);

        $products = $query->paginate(12)->withQueryString();

        $categories = ProductCategory::withCount(['products' => fn ($q) => $q->published()])
            ->ordered()
            ->get();

        return Inertia::render('Front/Shop/Category', array_merge($this->themeAndMenus(), [
            'category' => $category,
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'min_price', 'max_price', 'sort']),
            'settings' => $this->getSettings(),
        ]));
    }

    /**
     * Apply search, category, and price filters to a product query.
     */
    private function applyFilters(Builder $query, Request $request, bool $skipCategory = false): void
    {
        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        if (!$skipCategory && $request->filled('category')) {
            $category = ProductCategory::where('slug', $request->input('category'))->first();
            if ($category) {
                $query->byCategory($category->id);
            }
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->input('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->input('max_price'));
        }
    }

    private function applySorting(Builder $query, Request $request): void
    {
        match ($request->input('sort', 'recent')) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            default => $query->orderByDesc('created_at'),
        };
    }
}
