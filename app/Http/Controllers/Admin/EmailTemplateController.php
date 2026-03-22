<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\EmailTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailTemplateController extends Controller
{
    public function __construct(
        private readonly EmailTemplateService $emailTemplateService,
    ) {}

    /**
     * Display a list of email templates grouped by category.
     */
    public function index(): Response
    {
        $templates = $this->emailTemplateService->all();

        $grouped = $templates->groupBy('category');

        $categories = $templates->pluck('category')->unique()->values()->all();

        return Inertia::render('Admin/EmailTemplates/Index', [
            'templatesByCategory' => $grouped,
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for editing an email template.
     */
    public function edit(EmailTemplate $emailTemplate): Response
    {
        $availableVariables = $this->emailTemplateService->getAvailableVariables($emailTemplate->slug);

        return Inertia::render('Admin/EmailTemplates/Edit', [
            'emailTemplate' => $emailTemplate,
            'availableVariables' => $availableVariables,
            'categories' => EmailTemplate::categories(),
        ]);
    }

    /**
     * Update the specified email template.
     */
    public function update(Request $request, EmailTemplate $emailTemplate): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'body_html' => ['required', 'string'],
            'body_text' => ['nullable', 'string'],
            'enabled' => ['sometimes', 'boolean'],
        ]);

        $this->emailTemplateService->update($emailTemplate, $validated);

        return redirect()
            ->back()
            ->with('success', __('cms.email_templates.updated'));
    }

    /**
     * Send a test email for the specified template.
     */
    public function sendTest(Request $request, EmailTemplate $emailTemplate): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        try {
            $this->emailTemplateService->sendTest($emailTemplate->slug, $validated['email']);

            return redirect()
                ->back()
                ->with('success', __('cms.email_templates.test_sent', ['email' => $validated['email']]));
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Reset the template to its default subject and body.
     */
    public function reset(EmailTemplate $emailTemplate): RedirectResponse
    {
        try {
            $this->emailTemplateService->resetToDefault($emailTemplate);

            return redirect()
                ->back()
                ->with('success', __('cms.email_templates.reset_success'));
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }
}
