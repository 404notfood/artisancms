<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\NewsletterSubscriber;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class NewsletterService
{
    /**
     * Subscribe an email address.
     *
     * @return array{success: bool, message: string}
     */
    public function subscribe(string $email, ?string $name = null, ?string $ip = null): array
    {
        $existing = NewsletterSubscriber::where('email', $email)->first();

        if ($existing) {
            if ($existing->status === 'active') {
                return ['success' => false, 'message' => __('cms.newsletter.already_subscribed')];
            }

            // Re-subscribe
            $existing->update([
                'status' => 'active',
                'name' => $name ?? $existing->name,
                'subscribed_at' => now(),
                'unsubscribed_at' => null,
                'ip_address' => $ip,
            ]);

            return ['success' => true, 'message' => __('cms.newsletter.resubscribed')];
        }

        NewsletterSubscriber::create([
            'email' => $email,
            'name' => $name,
            'status' => 'active',
            'subscribed_at' => now(),
            'ip_address' => $ip,
        ]);

        return ['success' => true, 'message' => __('cms.newsletter.subscribed')];
    }

    /**
     * Unsubscribe an email address.
     */
    public function unsubscribe(string $email): bool
    {
        $subscriber = NewsletterSubscriber::where('email', $email)->first();

        if (!$subscriber || $subscriber->status === 'unsubscribed') {
            return false;
        }

        $subscriber->update([
            'status' => 'unsubscribed',
            'unsubscribed_at' => now(),
        ]);

        return true;
    }

    /**
     * Get paginated list of subscribers with filters.
     *
     * @param array{search?: string, status?: string} $filters
     * @return LengthAwarePaginator<NewsletterSubscriber>
     */
    public function getSubscribers(array $filters = []): LengthAwarePaginator
    {
        $query = NewsletterSubscriber::query()->orderBy('created_at', 'desc');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(20)->withQueryString();
    }

    /**
     * Export active subscribers as CSV string.
     */
    public function exportCsv(): string
    {
        $subscribers = NewsletterSubscriber::active()
            ->orderBy('subscribed_at', 'desc')
            ->get(['email', 'name', 'subscribed_at']);

        $csv = "Email,Nom,Date d'inscription\n";

        foreach ($subscribers as $subscriber) {
            $csv .= sprintf(
                "%s,%s,%s\n",
                $subscriber->email,
                str_replace(',', ' ', $subscriber->name ?? ''),
                $subscriber->subscribed_at?->format('Y-m-d H:i:s') ?? ''
            );
        }

        return $csv;
    }

    /**
     * Get newsletter statistics.
     *
     * @return array{total: int, active: int, unsubscribed: int, this_month: int}
     */
    public function getStats(): array
    {
        return [
            'total' => NewsletterSubscriber::count(),
            'active' => NewsletterSubscriber::active()->count(),
            'unsubscribed' => NewsletterSubscriber::where('status', 'unsubscribed')->count(),
            'this_month' => NewsletterSubscriber::where('subscribed_at', '>=', Carbon::now()->startOfMonth())->count(),
        ];
    }
}
