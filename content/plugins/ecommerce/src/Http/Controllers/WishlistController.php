<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Http\Controllers\Concerns\HasEcommerceSettings;
use Ecommerce\Http\Controllers\Concerns\HasThemeAndMenus;
use Ecommerce\Models\WishlistItem;
use Ecommerce\Services\WishlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    use HasEcommerceSettings;
    use HasThemeAndMenus;

    public function __construct(
        private readonly WishlistService $wishlistService,
    ) {}

    public function index(): Response
    {
        $userId = $this->userId();

        return Inertia::render('Front/Shop/Account/Wishlist', array_merge($this->themeAndMenus(), [
            'items' => $this->wishlistService->getItems($userId),
            'settings' => $this->getSettings(),
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
        ]);

        $userId = $this->userId();

        $item = $this->wishlistService->add(
            $userId,
            (int) $validated['product_id'],
            isset($validated['variant_id']) ? (int) $validated['variant_id'] : null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Produit ajoute a la liste de souhaits.',
            'item' => $item,
            'count' => $this->wishlistService->count($userId),
        ]);
    }

    public function destroy(WishlistItem $wishlistItem): JsonResponse
    {
        $this->authorizeWishlistItem($wishlistItem);

        $userId = $this->userId();

        $this->wishlistService->remove(
            $userId,
            $wishlistItem->product_id,
            $wishlistItem->variant_id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Produit retire de la liste de souhaits.',
            'count' => $this->wishlistService->count($userId),
        ]);
    }

    public function moveToCart(WishlistItem $wishlistItem): JsonResponse
    {
        $this->authorizeWishlistItem($wishlistItem);

        $userId = $this->userId();

        $this->wishlistService->moveToCart($userId, $wishlistItem->id);

        return response()->json([
            'success' => true,
            'message' => 'Produit deplace dans le panier.',
            'count' => $this->wishlistService->count($userId),
        ]);
    }

    private function userId(): int
    {
        return (int) auth()->id();
    }

    private function authorizeWishlistItem(WishlistItem $item): void
    {
        if ($item->user_id !== $this->userId()) {
            abort(403);
        }
    }
}
