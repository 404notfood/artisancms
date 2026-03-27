<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use App\Services\NewsletterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NewsletterController extends Controller
{
    public function __construct(
        private readonly NewsletterService $newsletterService,
    ) {}

    /**
     * Display the newsletter subscribers list with stats.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);

        return Inertia::render('Admin/Newsletter/Index', [
            'subscribers' => $this->newsletterService->getSubscribers($filters),
            'stats'       => $this->newsletterService->getStats(),
            'filters'     => $filters,
        ]);
    }

    /**
     * Export active subscribers as CSV download.
     */
    public function export(): StreamedResponse
    {
        $csv      = $this->newsletterService->exportCsv();
        $filename = sprintf('newsletter-subscribers-%s.csv', now()->format('Y-m-d'));

        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Delete a subscriber.
     */
    public function destroy(NewsletterSubscriber $subscriber): RedirectResponse
    {
        $subscriber->delete();

        return redirect()->back()->with('success', __('cms.newsletter.deleted'));
    }

    // -----------------------------------------------------------------------
    // Campaigns
    // -----------------------------------------------------------------------

    /**
     * Display the list of campaigns.
     */
    public function campaigns(): Response
    {
        return Inertia::render('Admin/Newsletter/Campaigns', [
            'campaigns' => $this->newsletterService->getCampaigns(),
            'stats'     => $this->newsletterService->getStats(),
        ]);
    }

    /**
     * Show create campaign form.
     */
    public function createCampaign(): Response
    {
        return Inertia::render('Admin/Newsletter/CampaignForm', [
            'campaign' => null,
        ]);
    }

    /**
     * Store a new campaign.
     */
    public function storeCampaign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'subject'          => 'required|string|max:255',
            'body_html'        => 'required|string|max:65000',
            'body_text'        => 'nullable|string|max:65000',
            'segment'          => 'required|in:all,custom',
            'recipient_filter' => 'nullable|array',
            'scheduled_at'     => 'nullable|date|after:now',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['status']     = !empty($validated['scheduled_at']) ? 'scheduled' : 'draft';

        NewsletterCampaign::create($validated);

        return redirect()
            ->route('admin.newsletter.campaigns')
            ->with('success', __('cms.newsletter.campaign_created'));
    }

    /**
     * Send a campaign immediately.
     */
    public function sendCampaign(NewsletterCampaign $campaign): RedirectResponse
    {
        if (!$campaign->isDraft() && $campaign->status !== 'scheduled') {
            return redirect()->back()->with('error', __('cms.newsletter.campaign_not_sendable'));
        }

        $this->newsletterService->sendCampaign($campaign);

        return redirect()
            ->route('admin.newsletter.campaigns')
            ->with('success', __('cms.newsletter.campaign_sending'));
    }

    /**
     * Delete a campaign (only drafts).
     */
    public function destroyCampaign(NewsletterCampaign $campaign): RedirectResponse
    {
        if (!$campaign->isDraft()) {
            return redirect()->back()->with('error', __('cms.newsletter.campaign_not_deletable'));
        }

        $campaign->delete();

        return redirect()
            ->route('admin.newsletter.campaigns')
            ->with('success', __('cms.newsletter.campaign_deleted'));
    }
}
