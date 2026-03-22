<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebhookRequest;
use App\Models\Webhook;
use App\Services\WebhookService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WebhookController extends Controller
{
    public function __construct(
        private readonly WebhookService $webhookService,
    ) {}

    /**
     * Display a list of all webhooks with latest delivery status.
     */
    public function index(): Response
    {
        $webhooks = Webhook::withCount('deliveries')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Webhooks/Index', [
            'webhooks'        => $webhooks,
            'availableEvents' => $this->webhookService->getAvailableEvents(),
        ]);
    }

    /**
     * Show the form for creating a new webhook.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Webhooks/Create', [
            'availableEvents' => $this->webhookService->getAvailableEvents(),
            'generatedSecret' => $this->webhookService->generateSecret(),
        ]);
    }

    /**
     * Store a newly created webhook.
     */
    public function store(WebhookRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Auto-generate secret if not provided
        if (empty($data['secret'])) {
            $data['secret'] = $this->webhookService->generateSecret();
        }

        $this->webhookService->createWebhook($data);

        return redirect()
            ->route('admin.webhooks.index')
            ->with('success', __('cms.webhooks.created'));
    }

    /**
     * Show the form for editing a webhook.
     */
    public function edit(Webhook $webhook): Response
    {
        return Inertia::render('Admin/Webhooks/Edit', [
            'webhook'         => $webhook,
            'availableEvents' => $this->webhookService->getAvailableEvents(),
        ]);
    }

    /**
     * Update the specified webhook.
     */
    public function update(WebhookRequest $request, Webhook $webhook): RedirectResponse
    {
        $data = $request->validated();

        // Auto-generate secret if cleared
        if (array_key_exists('secret', $data) && empty($data['secret'])) {
            $data['secret'] = $this->webhookService->generateSecret();
        }

        $this->webhookService->updateWebhook($webhook, $data);

        return redirect()
            ->back()
            ->with('success', __('cms.webhooks.updated'));
    }

    /**
     * Delete the specified webhook.
     */
    public function destroy(Webhook $webhook): RedirectResponse
    {
        $this->webhookService->deleteWebhook($webhook);

        return redirect()
            ->route('admin.webhooks.index')
            ->with('success', __('cms.webhooks.deleted'));
    }

    /**
     * Send a test ping to the webhook.
     */
    public function test(Webhook $webhook): RedirectResponse
    {
        $delivery = $this->webhookService->test($webhook);

        if ($delivery->isSuccess()) {
            return redirect()
                ->back()
                ->with('success', __('cms.webhooks.test_success'));
        }

        return redirect()
            ->back()
            ->with('error', __('cms.webhooks.test_failed', [
                'error' => $delivery->error_message ?? __('cms.webhooks.unknown_error'),
            ]));
    }

    /**
     * Display the delivery log for a webhook.
     */
    public function deliveries(Webhook $webhook): Response
    {
        $deliveries = $webhook->deliveries()
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        return Inertia::render('Admin/Webhooks/Deliveries', [
            'webhook'    => $webhook,
            'deliveries' => $deliveries,
        ]);
    }
}
