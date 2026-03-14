<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\PageView;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class TrackPageViewJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(
        public readonly array $data,
    ) {
        $this->onQueue('analytics');
    }

    /**
     * Creer l'enregistrement de page view a partir des donnees collectees.
     */
    public function handle(): void
    {
        PageView::create([
            'path'          => $this->data['path'],
            'viewable_type' => $this->data['viewable_type'] ?? null,
            'viewable_id'   => $this->data['viewable_id'] ?? null,
            'referrer'      => $this->data['referrer'] ?? null,
            'user_agent'    => $this->data['user_agent'] ?? null,
            'country'       => $this->data['country'] ?? null,
            'device_type'   => $this->data['device_type'] ?? null,
            'browser'       => $this->data['browser'] ?? null,
            'date'          => $this->data['date'],
            'created_at'    => now(),
        ]);
    }
}
