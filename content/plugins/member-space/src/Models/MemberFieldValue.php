<?php

declare(strict_types=1);

namespace MemberSpace\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberFieldValue extends Model
{
    protected $table = 'member_field_values';

    protected $fillable = [
        'user_id',
        'field_id',
        'value',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<MemberCustomField, $this>
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(MemberCustomField::class, 'field_id');
    }
}
