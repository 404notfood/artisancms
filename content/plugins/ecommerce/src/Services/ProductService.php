<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\Product;
use Ecommerce\Models\ProductVariant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * Get paginated products with optional filters.
     *
     * @param array<string, mixed> $filters
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Product::with('category');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (!empty($filters['category_id'])) {
            $query->byCategory((int) $filters['category_id']);
        }

        $query->orderByDesc('created_at');

        return $query->paginate((int) ($filters['per_page'] ?? 15));
    }

    /**
     * Create a new product.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Product
    {
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $data['created_by'] = auth()->id();

        $product = Product::create($data);

        if (!empty($data['variants'])) {
            foreach ($data['variants'] as $variantData) {
                $product->variants()->create($variantData);
            }
        }

        return $product;
    }

    /**
     * Update an existing product.
     *
     * @param array<string, mixed> $data
     */
    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        if (isset($data['variants'])) {
            $this->syncVariants($product, $data['variants']);
        }

        return $product->fresh();
    }

    /**
     * Delete a product.
     */
    public function delete(Product $product): void
    {
        $product->delete();
    }

    /**
     * Sync product variants.
     *
     * @param array<int, array<string, mixed>> $variants
     */
    private function syncVariants(Product $product, array $variants): void
    {
        $existingIds = $product->variants()->pluck('id')->toArray();
        $updatedIds = [];

        foreach ($variants as $variantData) {
            if (!empty($variantData['id'])) {
                $variant = ProductVariant::find($variantData['id']);
                if ($variant && $variant->product_id === $product->id) {
                    $variant->update($variantData);
                    $updatedIds[] = $variant->id;
                }
            } else {
                $newVariant = $product->variants()->create($variantData);
                $updatedIds[] = $newVariant->id;
            }
        }

        $toDelete = array_diff($existingIds, $updatedIds);
        if (!empty($toDelete)) {
            ProductVariant::whereIn('id', $toDelete)->delete();
        }
    }
}
