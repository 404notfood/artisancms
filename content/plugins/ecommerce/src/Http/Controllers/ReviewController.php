<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Product;
use Ecommerce\Services\ReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviewService,
    ) {}

    /**
     * Store a new product review (public, rate limited).
     */
    public function store(Request $request, string $slug): RedirectResponse
    {
        $product = Product::where('slug', $slug)
            ->published()
            ->firstOrFail();

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:5000',
            'author_name' => 'required_without:user_id|string|max:255',
            'author_email' => 'required_without:user_id|email|max:255',
        ]);

        $user = $request->user();

        $this->reviewService->store([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'author_name' => $validated['author_name'] ?? $user?->name ?? '',
            'author_email' => $validated['author_email'] ?? $user?->email ?? '',
            'rating' => $validated['rating'],
            'title' => $validated['title'],
            'content' => $validated['content'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Merci pour votre avis ! Il sera publie apres moderation.');
    }
}
