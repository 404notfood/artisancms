<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
use Ecommerce\Models\WishlistItem;
use Ecommerce\Services\WishlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function __construct(
        private readonly WishlistService $wishlistService,
    ) {}

    /**
     * Display the user's wishlist.
     */
    public function index(): Response
    {
        /** @var int $userId */
        $userId = (int) auth()->id();

        $items = $this->wishlistService->getItems($userId);
        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Account/Wishlist', [
            'items' => $items,
            'settings' => $settings,
        ]);
    }

    /**
     * Add an item to the wishlist (JSON response for AJAX).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
        ]);

        /** @var int $userId */
        $userId = (int) auth()->id();

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

    /**
     * Remove an item from the wishlist (JSON response).
     */
    public function destroy(WishlistItem $wishlistItem): JsonResponse
    {
        if ($wishlistItem->user_id !== (int) auth()->id()) {
            abort(403);
        }

        $wishlistItem->delete();

        /** @var int $userId */
        $userId = (int) auth()->id();

        return response()->json([
            'success' => true,
            'message' => 'Produit retire de la liste de souhaits.',
            'count' => $this->wishlistService->count($userId),
        ]);
    }

    /**
     * Move a wishlist item to the cart and remove it.
     */
    public function moveToCart(WishlistItem $wishlistItem): JsonResponse
    {
        if ($wishlistItem->user_id !== (int) auth()->id()) {
            abort(403);
        }

        /** @var int $userId */
        $userId = (int) auth()->id();

        $this->wishlistService->moveToCart($userId, $wishlistItem->id);

        return response()->json([
            'success' => true,
            'message' => 'Produit deplace dans le panier.',
            'count' => $this->wishlistService->count($userId),
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
