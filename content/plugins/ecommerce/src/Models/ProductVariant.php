<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'name',
        'sku',
        'price',
        'stock',
        'attributes',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
        'attributes' => 'array',
    ];

    // ---- Relationships ----

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ---- Helpers ----

    public function isInStock(): bool
    {
        return $this->stock > 0;
    }
}
