<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsletterCampaign extends Model
{
    protected $table = 'cms_newsletter_campaigns';

    /** @var list<string> */
    protected $fillable = [
        'name',
        'subject',
        'body_html',
        'body_text',
        'status',
        'scheduled_at',
        'sent_at',
        'sent_count',
        'open_count',
        'click_count',
        'segment',
        'recipient_filter',
        'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'scheduled_at'     => 'datetime',
            'sent_at'          => 'datetime',
            'sent_count'       => 'integer',
            'open_count'       => 'integer',
            'click_count'      => 'integer',
            'recipient_filter' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @param Builder<NewsletterCampaign> $query */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    /** @param Builder<NewsletterCampaign> $query */
    public function scopeSent(Builder $query): Builder
    {
        return $query->where('status', 'sent');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSending(): bool
    {
        return $this->status === 'sending';
    }

    public function isSent(): bool
    {
        return $this->status === 'sent';
    }
}
