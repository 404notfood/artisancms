<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Product;
use Ecommerce\Models\ProductReview;
use Ecommerce\Services\ReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviewService,
    ) {}

    /**
     * Display a paginated list of reviews with filters.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'product_id', 'rating', 'search', 'per_page']);

        $reviews = $this->reviewService->all($filters);

        $products = Product::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Ecommerce/Reviews/Index', [
            'reviews' => $reviews,
            'filters' => $filters,
            'products' => $products,
        ]);
    }

    /**
     * Approve a review.
     */
    public function approve(ProductReview $productReview): RedirectResponse
    {
        $this->reviewService->approve($productReview);

        return redirect()
            ->back()
            ->with('success', 'Avis approuve avec succes.');
    }

    /**
     * Reject a review.
     */
    public function reject(ProductReview $productReview): RedirectResponse
    {
        $this->reviewService->reject($productReview);

        return redirect()
            ->back()
            ->with('success', 'Avis rejete.');
    }

    /**
     * Save an admin reply to a review.
     */
    public function reply(Request $request, ProductReview $productReview): RedirectResponse
    {
        $validated = $request->validate([
            'admin_reply' => 'required|string|max:2000',
        ]);

        $this->reviewService->reply($productReview, $validated['admin_reply']);

        return redirect()
            ->back()
            ->with('success', 'Reponse enregistree.');
    }

    /**
     * Delete a review.
     */
    public function destroy(ProductReview $productReview): RedirectResponse
    {
        $this->reviewService->delete($productReview);

        return redirect()
            ->back()
            ->with('success', 'Avis supprime.');
    }
}
