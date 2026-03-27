<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NewsletterSubscriber extends Model
{
    use HasFactory;

    protected $table = 'cms_newsletter_subscribers';

    /** @var list<string> */
    protected $fillable = [
        'email',
        'name',
        'status',
        'subscribed_at',
        'unsubscribed_at',
        'ip_address',
        'confirmation_token',
        'confirmed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'subscribed_at'   => 'datetime',
            'unsubscribed_at' => 'datetime',
            'confirmed_at'    => 'datetime',
        ];
    }

    /** @param Builder<NewsletterSubscriber> $query */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /** @param Builder<NewsletterSubscriber> $query */
    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->whereNotNull('confirmed_at')->where('status', 'active');
    }

    /** @param Builder<NewsletterSubscriber> $query */
    public function scopeUnconfirmed(Builder $query): Builder
    {
        return $query->where('status', 'unconfirmed');
    }

    public function isConfirmed(): bool
    {
        return $this->confirmed_at !== null && $this->status === 'active';
    }
}
