<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
            'stats' => $this->newsletterService->getStats(),
            'filters' => $filters,
        ]);
    }

    /**
     * Export active subscribers as CSV download.
     */
    public function export(): StreamedResponse
    {
        $csv = $this->newsletterService->exportCsv();
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

        return redirect()
            ->back()
            ->with('success', __('cms.newsletter.deleted'));
    }
}
