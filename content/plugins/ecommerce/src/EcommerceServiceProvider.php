<?php

declare(strict_types=1);

namespace Ecommerce;

use App\CMS\Blocks\BlockRegistry;
use App\CMS\Facades\CMS;
use Ecommerce\Models\Coupon;
use Ecommerce\Models\Order;
use Ecommerce\Models\Product;
use Ecommerce\Observers\ProductStockObserver;
use Ecommerce\Policies\CouponPolicy;
use Ecommerce\Policies\OrderPolicy;
use Ecommerce\Policies\ProductPolicy;
use Illuminate\Support\Facades\Gate;
use Ecommerce\Services\CartService;
use Ecommerce\Services\CouponService;
use Ecommerce\Services\CustomerService;
use Ecommerce\Services\InvoiceService;
use Ecommerce\Services\OrderService;
use Ecommerce\Services\PaymentService;
use Ecommerce\Services\ProductService;
use Ecommerce\Services\ReviewService;
use Ecommerce\Services\ShippingService;
use Ecommerce\Services\StockService;
use Ecommerce\Services\TaxService;
use Ecommerce\Services\SalesReportService;
use Ecommerce\Services\WishlistService;
use Illuminate\Support\ServiceProvider;

class EcommerceServiceProvider extends ServiceProvider
{
    /**
     * Register any plugin services.
     */
    public function register(): void
    {
        $this->app->singleton(ProductService::class, function ($app): ProductService {
            return new ProductService();
        });

        $this->app->singleton(CartService::class, function ($app): CartService {
            return new CartService();
        });

        $this->app->singleton(OrderService::class, function ($app): OrderService {
            return new OrderService(
                $app->make(CartService::class),
                $app->make(CouponService::class)
            );
        });

        $this->app->singleton(CouponService::class, function ($app): CouponService {
            return new CouponService();
        });

        $this->app->singleton(PaymentService::class, function ($app): PaymentService {
            return new PaymentService();
        });

        $this->app->singleton(ShippingService::class, function ($app): ShippingService {
            return new ShippingService();
        });

        $this->app->singleton(TaxService::class, function ($app): TaxService {
            return new TaxService();
        });

        $this->app->singleton(InvoiceService::class, function ($app): InvoiceService {
            return new InvoiceService();
        });

        $this->app->singleton(ReviewService::class, function ($app): ReviewService {
            return new ReviewService();
        });

        $this->app->singleton(CustomerService::class, function ($app): CustomerService {
            return new CustomerService();
        });

        $this->app->singleton(WishlistService::class, function ($app): WishlistService {
            return new WishlistService();
        });

        $this->app->singleton(StockService::class, function ($app): StockService {
            return new StockService();
        });

        $this->app->singleton(SalesReportService::class, function ($app): SalesReportService {
            return new SalesReportService();
        });
    }

    /**
     * Bootstrap the E-commerce plugin.
     */
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');

        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'ecommerce');

        // Register observers
        Product::observe(ProductStockObserver::class);

        // Register policies
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Coupon::class, CouponPolicy::class);

        // Register e-commerce blocks in the block registry
        $this->registerBlocks();
    }

    /**
     * Register e-commerce blocks in the BlockRegistry.
     */
    private function registerBlocks(): void
    {
        $registry = $this->app->make(BlockRegistry::class);

        $blocks = [
            [
                'slug' => 'product-card',
                'name' => 'Fiche produit',
                'category' => 'ecommerce',
                'icon' => 'shopping-bag',
                'schema' => [
                    'properties' => [
                        'productId' => ['type' => 'number', 'default' => null],
                        'showImage' => ['type' => 'boolean', 'default' => true],
                        'showPrice' => ['type' => 'boolean', 'default' => true],
                        'showButton' => ['type' => 'boolean', 'default' => true],
                        'buttonText' => ['type' => 'string', 'default' => 'Ajouter au panier'],
                        'imageHeight' => ['type' => 'string', 'default' => '200px'],
                    ],
                ],
                'default_props' => [
                    'productId' => null,
                    'showImage' => true,
                    'showPrice' => true,
                    'showButton' => true,
                    'buttonText' => 'Ajouter au panier',
                    'imageHeight' => '200px',
                ],
                'is_core' => false,
                'source' => 'ecommerce',
            ],
            [
                'slug' => 'product-grid',
                'name' => 'Grille produits',
                'category' => 'ecommerce',
                'icon' => 'layout-grid',
                'schema' => [
                    'properties' => [
                        'columns' => ['type' => 'number', 'default' => 3, 'minimum' => 2, 'maximum' => 4],
                        'categoryId' => ['type' => 'number', 'default' => null],
                        'limit' => ['type' => 'number', 'default' => 6, 'minimum' => 1, 'maximum' => 24],
                        'showPagination' => ['type' => 'boolean', 'default' => false],
                        'gap' => ['type' => 'string', 'default' => '1.5rem'],
                    ],
                ],
                'default_props' => [
                    'columns' => 3,
                    'categoryId' => null,
                    'limit' => 6,
                    'showPagination' => false,
                    'gap' => '1.5rem',
                ],
                'is_core' => false,
                'source' => 'ecommerce',
            ],
            [
                'slug' => 'cart-widget',
                'name' => 'Panier',
                'category' => 'ecommerce',
                'icon' => 'shopping-cart',
                'schema' => [
                    'properties' => [
                        'style' => ['type' => 'string', 'default' => 'icon', 'enum' => ['icon', 'sidebar', 'dropdown']],
                        'showCount' => ['type' => 'boolean', 'default' => true],
                        'showTotal' => ['type' => 'boolean', 'default' => true],
                        'position' => ['type' => 'string', 'default' => 'top-right', 'enum' => ['top-right', 'top-left']],
                    ],
                ],
                'default_props' => [
                    'style' => 'icon',
                    'showCount' => true,
                    'showTotal' => true,
                    'position' => 'top-right',
                ],
                'is_core' => false,
                'source' => 'ecommerce',
            ],
            [
                'slug' => 'checkout-form',
                'name' => 'Formulaire commande',
                'category' => 'ecommerce',
                'icon' => 'credit-card',
                'schema' => [
                    'properties' => [
                        'showOrderSummary' => ['type' => 'boolean', 'default' => true],
                        'requireAccount' => ['type' => 'boolean', 'default' => false],
                        'termsUrl' => ['type' => 'string', 'default' => ''],
                    ],
                ],
                'default_props' => [
                    'showOrderSummary' => true,
                    'requireAccount' => false,
                    'termsUrl' => '',
                ],
                'is_core' => false,
                'source' => 'ecommerce',
            ],
            [
                'slug' => 'featured-products',
                'name' => 'Produits vedettes',
                'category' => 'ecommerce',
                'icon' => 'star',
                'schema' => [
                    'properties' => [
                        'title' => ['type' => 'string', 'default' => 'Produits en vedette'],
                        'limit' => ['type' => 'number', 'default' => 4, 'minimum' => 1, 'maximum' => 12],
                        'layout' => ['type' => 'string', 'default' => 'scroll', 'enum' => ['scroll', 'grid']],
                        'showArrows' => ['type' => 'boolean', 'default' => true],
                        'autoplay' => ['type' => 'boolean', 'default' => false],
                    ],
                ],
                'default_props' => [
                    'title' => 'Produits en vedette',
                    'limit' => 4,
                    'layout' => 'scroll',
                    'showArrows' => true,
                    'autoplay' => false,
                ],
                'is_core' => false,
                'source' => 'ecommerce',
            ],
        ];

        foreach ($blocks as $block) {
            $registry->register($block);
        }
    }
}
