<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WishlistItem extends Model
{
    protected $table = 'wishlists';

    /**
     * No updated_at column on this table.
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'product_id',
        'variant_id',
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
}
