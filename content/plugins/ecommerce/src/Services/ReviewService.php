<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\Order;
use Ecommerce\Models\OrderItem;
use Ecommerce\Models\ProductReview;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    /**
     * Get approved reviews for a product, paginated.
     */
    public function getForProduct(int $productId, int $perPage = 10): LengthAwarePaginator
    {
        return ProductReview::with('user')
            ->where('product_id', $productId)
            ->approved()
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Get all reviews with optional filters (admin).
     *
     * @param array<string, mixed> $filters
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = ProductReview::with(['product', 'user']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['product_id'])) {
            $query->where('product_id', (int) $filters['product_id']);
        }

        if (!empty($filters['rating'])) {
            $query->where('rating', (int) $filters['rating']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('author_name', 'like', "%{$search}%")
                  ->orWhere('author_email', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $query->orderByDesc('created_at');

        return $query->paginate((int) ($filters['per_page'] ?? 15));
    }

    /**
     * Create a new review.
     *
     * @param array<string, mixed> $data
     */
    public function store(array $data): ProductReview
    {
        $verifiedPurchase = false;

        if (!empty($data['user_id'])) {
            $verifiedPurchase = $this->hasVerifiedPurchase(
                (int) $data['user_id'],
                (int) $data['product_id']
            );
        }

        $data['verified_purchase'] = $verifiedPurchase;

        // Auto-approve if auto_approve setting is enabled and verified purchase
        $autoApprove = config('ecommerce.reviews_auto_approve', false);
        if ($autoApprove && $verifiedPurchase) {
            $data['status'] = 'approved';
        } else {
            $data['status'] = $data['status'] ?? 'pending';
        }

        return ProductReview::create($data);
    }

    /**
     * Approve a review.
     */
    public function approve(ProductReview $review): ProductReview
    {
        $review->update(['status' => 'approved']);

        return $review->fresh();
    }

    /**
     * Reject a review.
     */
    public function reject(ProductReview $review): ProductReview
    {
        $review->update(['status' => 'rejected']);

        return $review->fresh();
    }

    /**
     * Save an admin reply to a review.
     */
    public function reply(ProductReview $review, string $text): ProductReview
    {
        $review->update(['admin_reply' => $text]);

        return $review->fresh();
    }

    /**
     * Delete a review.
     */
    public function delete(ProductReview $review): void
    {
        $review->delete();
    }

    /**
     * Get review statistics for a product.
     *
     * @return array{average: float, total: int, distribution: array<int, int>}
     */
    public function getStats(int $productId): array
    {
        $reviews = ProductReview::where('product_id', $productId)
            ->approved()
            ->select([
                DB::raw('COUNT(*) as total'),
                DB::raw('AVG(rating) as average'),
            ])
            ->first();

        $distribution = ProductReview::where('product_id', $productId)
            ->approved()
            ->select([
                'rating',
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Ensure all ratings 1-5 are present
        $fullDistribution = [];
        for ($i = 5; $i >= 1; $i--) {
            $fullDistribution[$i] = (int) ($distribution[$i] ?? 0);
        }

        return [
            'average' => round((float) ($reviews->average ?? 0), 1),
            'total' => (int) ($reviews->total ?? 0),
            'distribution' => $fullDistribution,
        ];
    }

    /**
     * Check if a user has purchased a product (verified purchase).
     */
    private function hasVerifiedPurchase(int $userId, int $productId): bool
    {
        return OrderItem::where('product_id', $productId)
            ->whereHas('order', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->where('status', 'completed');
            })
            ->exists();
    }
}
