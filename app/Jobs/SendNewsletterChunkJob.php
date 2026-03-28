<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use App\Services\NewsletterService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendNewsletterChunkJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $queue = 'newsletter';

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 120, 600];

    /**
     * @param array<int, int> $subscriberIds
     */
    public function __construct(
        public readonly NewsletterCampaign $campaign,
        public readonly array $subscriberIds,
    ) {}

    public function handle(NewsletterService $newsletterService): void
    {
        $campaign = $this->campaign->fresh();

        if ($campaign === null || $campaign->status === 'failed') {
            return;
        }

        $subscribers = NewsletterSubscriber::whereIn('id', $this->subscriberIds)
            ->confirmed()
            ->get();

        $sentCount = 0;

        foreach ($subscribers as $subscriber) {
            try {
                $unsubscribeUrl = $newsletterService->getUnsubscribeUrl($subscriber->email);

                Mail::send([], [], function ($message) use ($subscriber, $campaign, $unsubscribeUrl) {
                    $message->to($subscriber->email, $subscriber->name)
                        ->subject($campaign->subject)
                        ->html($campaign->body_html . $this->unsubscribeFooter($unsubscribeUrl))
                        ->text($campaign->body_text ?? strip_tags($campaign->body_html));

                    $message->getHeaders()->addTextHeader(
                        'List-Unsubscribe',
                        '<' . $unsubscribeUrl . '>',
                    );
                });

                $sentCount++;
            } catch (\Throwable $e) {
                Log::warning('Newsletter send failed', [
                    'campaign_id'   => $campaign->id,
                    'subscriber_id' => $subscriber->id,
                    'error'         => $e->getMessage(),
                ]);
            }
        }

        $campaign->increment('sent_count', $sentCount);

        $this->markCampaignSentIfComplete($campaign, $newsletterService);
    }

    private function markCampaignSentIfComplete(
        NewsletterCampaign $campaign,
        NewsletterService $newsletterService,
    ): void {
        $campaign->refresh();

        $expectedRecipients = $newsletterService->getConfirmedSubscribers(
            $campaign->segment ?? 'all',
            $campaign->recipient_filter,
        )->count();

        if ($campaign->sent_count >= $expectedRecipients) {
            $campaign->update([
                'status'  => 'sent',
                'sent_at' => now(),
            ]);
        }
    }

    private function unsubscribeFooter(string $url): string
    {
        return '<p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;">'
            . '<a href="' . e($url) . '">' . __('cms.newsletter.unsubscribe_link') . '</a>'
            . '</p>';
    }
}
