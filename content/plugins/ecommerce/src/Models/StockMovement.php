<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $table = 'stock_movements';

    /**
     * No updated_at column on this table.
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'product_id',
        'variant_id',
        'type',
        'quantity',
        'reference',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    // ---- Relationships ----

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
