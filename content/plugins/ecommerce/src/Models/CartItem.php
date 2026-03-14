<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $table = 'cart_items';

    protected $fillable = [
        'user_id',
        'session_id',
        'product_id',
        'variant_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    // ---- Relationships ----

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    // ---- Helpers ----

    public function getPrice(): float
    {
        if ($this->variant) {
            return (float) $this->variant->price;
        }

        return (float) $this->product->price;
    }

    public function getTotal(): float
    {
        return $this->getPrice() * $this->quantity;
    }
}
