<?php

declare(strict_types=1);

use Ecommerce\Http\Controllers\Admin\ReportController;
use Ecommerce\Http\Controllers\Admin\ReviewController as AdminReviewController;
use Ecommerce\Http\Controllers\Admin\ShippingController;
use Ecommerce\Http\Controllers\Admin\TaxController;
use Ecommerce\Http\Controllers\Admin\StockController;
use Ecommerce\Http\Controllers\Admin\PaymentMethodController;
use Ecommerce\Http\Controllers\CartController;
use Ecommerce\Http\Controllers\CheckoutController;
use Ecommerce\Http\Controllers\CouponController;
use Ecommerce\Http\Controllers\CustomerAccountController;
use Ecommerce\Http\Controllers\CustomerController;
use Ecommerce\Http\Controllers\EcommerceSettingsController;
use Ecommerce\Http\Controllers\InvoiceController;
use Ecommerce\Http\Controllers\OrderController;
use Ecommerce\Http\Controllers\PaymentController;
use Ecommerce\Http\Controllers\ProductCategoryController;
use Ecommerce\Http\Controllers\ProductController;
use Ecommerce\Http\Controllers\ReviewController;
use Ecommerce\Http\Controllers\ShopController;
use Ecommerce\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

// ---- Admin Routes ----
Route::prefix('admin/shop')->middleware(['web', 'auth'])->group(function () {
    // Products
    Route::get('products', [ProductController::class, 'index'])->name('admin.shop.products.index');
    Route::get('products/create', [ProductController::class, 'create'])->name('admin.shop.products.create');
    Route::post('products', [ProductController::class, 'store'])->name('admin.shop.products.store');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('admin.shop.products.edit');
    Route::put('products/{product}', [ProductController::class, 'update'])->name('admin.shop.products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('admin.shop.products.destroy');

    // Orders
    Route::get('orders', [OrderController::class, 'index'])->name('admin.shop.orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('admin.shop.orders.show');
    Route::put('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('admin.shop.orders.update-status');

    // Coupons
    Route::get('coupons', [CouponController::class, 'index'])->name('admin.shop.coupons.index');
    Route::get('coupons/create', [CouponController::class, 'create'])->name('admin.shop.coupons.create');
    Route::post('coupons', [CouponController::class, 'store'])->name('admin.shop.coupons.store');
    Route::get('coupons/{coupon}/edit', [CouponController::class, 'edit'])->name('admin.shop.coupons.edit');
    Route::put('coupons/{coupon}', [CouponController::class, 'update'])->name('admin.shop.coupons.update');
    Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])->name('admin.shop.coupons.destroy');

    // Settings
    Route::get('settings', [EcommerceSettingsController::class, 'index'])->name('admin.shop.settings');
    Route::put('settings', [EcommerceSettingsController::class, 'update'])->name('admin.shop.settings.update');

    // Categories
    Route::get('categories', [ProductCategoryController::class, 'index'])->name('admin.shop.categories.index');
    Route::post('categories', [ProductCategoryController::class, 'store'])->name('admin.shop.categories.store');
    Route::put('categories/{category}', [ProductCategoryController::class, 'update'])->name('admin.shop.categories.update');
    Route::delete('categories/{category}', [ProductCategoryController::class, 'destroy'])->name('admin.shop.categories.destroy');

    // Shipping
    Route::get('shipping', [ShippingController::class, 'index'])->name('admin.shop.shipping.index');
    Route::post('shipping/zones', [ShippingController::class, 'storeZone'])->name('admin.shop.shipping.zones.store');
    Route::put('shipping/zones/{shippingZone}', [ShippingController::class, 'updateZone'])->name('admin.shop.shipping.zones.update');
    Route::delete('shipping/zones/{shippingZone}', [ShippingController::class, 'destroyZone'])->name('admin.shop.shipping.zones.destroy');
    Route::post('shipping/zones/{shippingZone}/methods', [ShippingController::class, 'storeMethod'])->name('admin.shop.shipping.methods.store');
    Route::put('shipping/methods/{shippingMethod}', [ShippingController::class, 'updateMethod'])->name('admin.shop.shipping.methods.update');
    Route::delete('shipping/methods/{shippingMethod}', [ShippingController::class, 'destroyMethod'])->name('admin.shop.shipping.methods.destroy');

    // Tax
    Route::get('tax', [TaxController::class, 'index'])->name('admin.shop.tax.index');
    Route::post('tax', [TaxController::class, 'store'])->name('admin.shop.tax.store');
    Route::put('tax/{taxRule}', [TaxController::class, 'update'])->name('admin.shop.tax.update');
    Route::delete('tax/{taxRule}', [TaxController::class, 'destroy'])->name('admin.shop.tax.destroy');

    // Invoices
    Route::get('orders/{order}/invoice', [InvoiceController::class, 'show'])->name('admin.shop.orders.invoice');
    Route::get('orders/{order}/invoice/download', [InvoiceController::class, 'download'])->name('admin.shop.orders.invoice.download');

    // Reviews
    Route::get('reviews', [AdminReviewController::class, 'index'])->name('admin.shop.reviews.index');
    Route::post('reviews/{productReview}/approve', [AdminReviewController::class, 'approve'])->name('admin.shop.reviews.approve');
    Route::post('reviews/{productReview}/reject', [AdminReviewController::class, 'reject'])->name('admin.shop.reviews.reject');
    Route::post('reviews/{productReview}/reply', [AdminReviewController::class, 'reply'])->name('admin.shop.reviews.reply');
    Route::delete('reviews/{productReview}', [AdminReviewController::class, 'destroy'])->name('admin.shop.reviews.destroy');

    // Reports / Analytics
    Route::get('reports', [ReportController::class, 'index'])->name('admin.shop.reports');

    // Stock Management
    Route::get('stock', [StockController::class, 'index'])->name('admin.shop.stock.index');
    Route::post('stock/{product}/adjust', [StockController::class, 'adjust'])->name('admin.shop.stock.adjust');
    Route::get('stock/{product}/movements', [StockController::class, 'movements'])->name('admin.shop.stock.movements');

    // Payment Methods
    Route::post('payment-methods', [PaymentMethodController::class, 'store'])->name('admin.shop.payment-methods.store');
    Route::put('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('admin.shop.payment-methods.update');
    Route::delete('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy'])->name('admin.shop.payment-methods.destroy');
    Route::post('payment-methods/{paymentMethod}/toggle', [PaymentMethodController::class, 'toggle'])->name('admin.shop.payment-methods.toggle');
});

// ---- API JSON Routes (for block renderers) ----
Route::middleware(['web'])->prefix('api/shop')->group(function () {
    Route::get('products', [ProductController::class, 'apiList'])->name('api.shop.products');
    Route::get('cart', [CartController::class, 'apiGet'])->name('api.shop.cart');
    Route::post('cart/add', [CartController::class, 'apiAdd'])->name('api.shop.cart.add');
});

// ---- Front-end Shop Routes ----
Route::middleware(['web'])->group(function () {
    // Shop listing & product detail
    Route::get('shop', [ShopController::class, 'index'])->name('shop.index');
    Route::get('shop/category/{slug}', [ShopController::class, 'category'])->name('shop.category');
    Route::get('shop/{slug}', [ShopController::class, 'show'])->name('shop.show');

    // Product reviews (public, rate limited)
    Route::post('shop/{slug}/reviews', [ReviewController::class, 'store'])
        ->name('shop.reviews.store')
        ->middleware('throttle:5,1');

    // Cart
    Route::get('cart', [CartController::class, 'index'])->name('shop.cart');
    Route::post('cart/add', [CartController::class, 'add'])->name('shop.cart.add');
    Route::put('cart/{cartItem}', [CartController::class, 'update'])->name('shop.cart.update');
    Route::delete('cart/{cartItem}', [CartController::class, 'remove'])->name('shop.cart.remove');

    // Checkout (requires authentication)
    Route::middleware(['auth'])->group(function () {
        Route::get('checkout', [CheckoutController::class, 'index'])->name('shop.checkout');
        Route::post('checkout', [CheckoutController::class, 'store'])->name('shop.checkout.store');
        Route::get('checkout/confirmation/{order}', [CheckoutController::class, 'confirmation'])->name('shop.checkout.confirmation');
        Route::post('checkout/apply-coupon', [CheckoutController::class, 'applyCoupon'])->name('shop.checkout.apply-coupon');

        // Payment
        Route::post('payment/{order}/process', [PaymentController::class, 'process'])->name('shop.payment.process');
        Route::get('payment/{order}/success', [PaymentController::class, 'success'])->name('shop.payment.success');
        Route::get('payment/{order}/cancel', [PaymentController::class, 'cancel'])->name('shop.payment.cancel');

        // Customer account (legacy routes kept for backward compatibility)
        Route::get('account', [CustomerAccountController::class, 'dashboard'])->name('shop.account');
        Route::get('account/addresses', [CustomerAccountController::class, 'addresses'])->name('shop.account.addresses');
        Route::post('account/addresses', [CustomerAccountController::class, 'storeAddress'])->name('shop.account.addresses.store');
        Route::put('account/addresses/{customerAddress}', [CustomerAccountController::class, 'updateAddress'])->name('shop.account.addresses.update');
        Route::delete('account/addresses/{customerAddress}', [CustomerAccountController::class, 'destroyAddress'])->name('shop.account.addresses.destroy');
        Route::get('account/orders', [CustomerAccountController::class, 'orders'])->name('shop.account.orders');
        Route::get('account/orders/{order}', [CustomerAccountController::class, 'orderShow'])->name('shop.account.orders.show');

        // Wishlist
        Route::get('account/wishlist', [WishlistController::class, 'index'])->name('shop.wishlist');
        Route::post('wishlist', [WishlistController::class, 'store'])->name('shop.wishlist.store');
        Route::delete('wishlist/{wishlistItem}', [WishlistController::class, 'destroy'])->name('shop.wishlist.destroy');
        Route::post('wishlist/{wishlistItem}/cart', [WishlistController::class, 'moveToCart'])->name('shop.wishlist.to-cart');
    });
});

// Payment webhooks (public, no auth, no CSRF - signature verified by driver)
Route::post('payment/webhook/{driver}', [PaymentController::class, 'webhook'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->name('payment.webhook');
