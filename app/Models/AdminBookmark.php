<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminBookmark extends Model
{
    use HasFactory;

    protected $table = 'admin_bookmarks';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'label',
        'url',
        'icon',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
