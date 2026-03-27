<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\SendNewsletterChunkJob;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class NewsletterService
{
    private const CHUNK_SIZE = 50;

    /**
     * Subscribe with double opt-in: creates unconfirmed subscriber and sends confirmation email.
     *
     * @return array{success: bool, message: string}
     */
    public function subscribe(string $email, ?string $name = null, ?string $ip = null): array
    {
        $existing = NewsletterSubscriber::where('email', $email)->first();

        if ($existing) {
            if ($existing->status === 'active' && $existing->isConfirmed()) {
                return ['success' => false, 'message' => __('cms.newsletter.already_subscribed')];
            }

            // Re-subscribe: generate new token
            $token = $this->generateToken();
            $existing->update([
                'status'             => 'unconfirmed',
                'name'               => $name ?? $existing->name,
                'confirmation_token' => $token,
                'confirmed_at'       => null,
                'unsubscribed_at'    => null,
                'ip_address'         => $ip,
            ]);

            $this->sendConfirmationEmail($existing, $token);

            return ['success' => true, 'message' => __('cms.newsletter.confirmation_sent')];
        }

        $token = $this->generateToken();

        $subscriber = NewsletterSubscriber::create([
            'email'              => $email,
            'name'               => $name,
            'status'             => 'unconfirmed',
            'ip_address'         => $ip,
            'confirmation_token' => $token,
        ]);

        $this->sendConfirmationEmail($subscriber, $token);

        return ['success' => true, 'message' => __('cms.newsletter.confirmation_sent')];
    }

    /**
     * Confirm a subscription via the token received by email.
     */
    public function confirmSubscription(string $token): bool
    {
        $subscriber = NewsletterSubscriber::where('confirmation_token', $token)
            ->where('status', 'unconfirmed')
            ->first();

        if ($subscriber === null) {
            return false;
        }

        $subscriber->update([
            'status'             => 'active',
            'confirmed_at'       => now(),
            'subscribed_at'      => now(),
            'confirmation_token' => null,
        ]);

        return true;
    }

    /**
     * Unsubscribe via a signed token (HMAC of the email).
     */
    public function unsubscribe(string $token): bool
    {
        $email = $this->decodeUnsubscribeToken($token);

        if ($email === null) {
            return false;
        }

        $subscriber = NewsletterSubscriber::where('email', $email)
            ->where('status', 'active')
            ->first();

        if ($subscriber === null) {
            return false;
        }

        $subscriber->update([
            'status'          => 'unsubscribed',
            'unsubscribed_at' => now(),
        ]);

        return true;
    }

    /**
     * Send a campaign to all confirmed subscribers, dispatched via queue in chunks.
     */
    public function sendCampaign(NewsletterCampaign $campaign): void
    {
        if (!$campaign->isDraft() && !$campaign->status === 'scheduled') {
            return;
        }

        $campaign->update(['status' => 'sending']);

        $subscribers = $this->getConfirmedSubscribers($campaign->segment, $campaign->recipient_filter);

        if ($subscribers->isEmpty()) {
            $campaign->update([
                'status'     => 'sent',
                'sent_at'    => now(),
                'sent_count' => 0,
            ]);

            return;
        }

        $chunks = $subscribers->chunk(self::CHUNK_SIZE);

        foreach ($chunks as $index => $chunk) {
            SendNewsletterChunkJob::dispatch(
                $campaign,
                $chunk->pluck('id')->toArray(),
            )->delay(now()->addSeconds($index * 5))->onQueue('newsletter');
        }
    }

    /**
     * Get confirmed subscribers filtered by segment.
     *
     * @param array<string, mixed>|null $recipientFilter
     * @return Collection<int, NewsletterSubscriber>
     */
    public function getConfirmedSubscribers(
        string $segment = 'all',
        ?array $recipientFilter = null,
    ): Collection {
        $query = NewsletterSubscriber::confirmed();

        if ($segment === 'custom' && $recipientFilter !== null) {
            if (!empty($recipientFilter['subscribed_after'])) {
                $query->where('subscribed_at', '>=', $recipientFilter['subscribed_after']);
            }
            if (!empty($recipientFilter['subscribed_before'])) {
                $query->where('subscribed_at', '<=', $recipientFilter['subscribed_before']);
            }
        }

        return $query->get();
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
     * Get paginated list of campaigns.
     *
     * @return LengthAwarePaginator<NewsletterCampaign>
     */
    public function getCampaigns(): LengthAwarePaginator
    {
        return NewsletterCampaign::with('creator:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();
    }

    /**
     * Export active (confirmed) subscribers as CSV string.
     */
    public function exportCsv(): string
    {
        $subscribers = NewsletterSubscriber::confirmed()
            ->orderBy('subscribed_at', 'desc')
            ->get(['email', 'name', 'subscribed_at']);

        $csv = "Email,Nom,Date d'inscription\n";

        foreach ($subscribers as $subscriber) {
            $csv .= sprintf(
                "%s,%s,%s\n",
                $subscriber->email,
                str_replace(',', ' ', $subscriber->name ?? ''),
                $subscriber->subscribed_at?->format('Y-m-d H:i:s') ?? '',
            );
        }

        return $csv;
    }

    /**
     * Get newsletter statistics.
     *
     * @return array{total: int, confirmed: int, unconfirmed: int, unsubscribed: int, this_month: int}
     */
    public function getStats(): array
    {
        return [
            'total'        => NewsletterSubscriber::count(),
            'confirmed'    => NewsletterSubscriber::confirmed()->count(),
            'unconfirmed'  => NewsletterSubscriber::unconfirmed()->count(),
            'unsubscribed' => NewsletterSubscriber::where('status', 'unsubscribed')->count(),
            'this_month'   => NewsletterSubscriber::where('created_at', '>=', Carbon::now()->startOfMonth())->count(),
        ];
    }

    /**
     * Generate a signed unsubscribe token for a subscriber email.
     */
    public function generateUnsubscribeToken(string $email): string
    {
        $signature = hash_hmac('sha256', $email, (string) config('app.key'));

        return base64_encode($email . '|' . $signature);
    }

    /**
     * Build the unsubscribe URL for a subscriber.
     */
    public function getUnsubscribeUrl(string $email): string
    {
        $token = $this->generateUnsubscribeToken($email);

        return URL::to('/newsletter/unsubscribe/' . $token);
    }

    /**
     * Decode and verify an unsubscribe token. Returns email or null.
     */
    private function decodeUnsubscribeToken(string $token): ?string
    {
        $decoded = base64_decode($token, true);

        if ($decoded === false) {
            return null;
        }

        $parts = explode('|', $decoded, 2);

        if (count($parts) !== 2) {
            return null;
        }

        [$email, $signature] = $parts;

        $expected = hash_hmac('sha256', $email, (string) config('app.key'));

        if (!hash_equals($expected, $signature)) {
            return null;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        return $email;
    }

    private function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Send the double opt-in confirmation email.
     */
    private function sendConfirmationEmail(NewsletterSubscriber $subscriber, string $token): void
    {
        $confirmUrl = URL::to('/newsletter/confirm/' . $token);
        $siteName   = (string) config('app.name', 'ArtisanCMS');

        Mail::raw(
            __('cms.newsletter.confirmation_email_body', [
                'site' => $siteName,
                'url'  => $confirmUrl,
            ]),
            function ($message) use ($subscriber, $siteName) {
                $message->to($subscriber->email, $subscriber->name)
                    ->subject(__('cms.newsletter.confirmation_email_subject', [
                        'site' => $siteName,
                    ]));
            },
        );
    }
}
