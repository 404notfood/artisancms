<?php

declare(strict_types=1);

namespace ContactForm\Http\Controllers;

use App\Http\Controllers\Controller;
use ContactForm\Models\FormSubmission;
use ContactForm\Services\FormService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class FormController extends Controller
{
    public function __construct(
        private readonly FormService $formService,
    ) {}

    /**
     * Handle a contact form submission.
     */
    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
        ]);

        // Honeypot check: hidden field that should remain empty
        $honeypotValue = $request->input('_hp_name');

        if ($this->formService->isSpam($honeypotValue)) {
            // Return success to not reveal spam detection, but don't store
            return response()->json([
                'success' => true,
                'message' => $this->formService->getSuccessMessage(),
            ]);
        }

        $this->formService->createSubmission(
            data: $validated,
            formName: 'contact',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'success' => true,
            'message' => $this->formService->getSuccessMessage(),
        ]);
    }

    /**
     * Display the list of form submissions (admin).
     */
    public function index(Request $request): InertiaResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.read'), 403);
        $submissions = FormSubmission::query()
            ->forForm('contact')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/Plugins/ContactForm/Submissions', [
            'submissions' => $submissions,
            'unreadCount' => FormSubmission::forForm('contact')->unread()->count(),
        ]);
    }

    /**
     * Show a single submission and mark it as read.
     */
    public function show(FormSubmission $submission): JsonResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.read'), 403);
        if (!$submission->isRead()) {
            $submission->markAsRead();
        }

        return response()->json([
            'submission' => $submission,
        ]);
    }

    /**
     * Delete a submission.
     */
    public function destroy(FormSubmission $submission): JsonResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.delete'), 403);
        $submission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Soumission supprimee.',
        ]);
    }
}
