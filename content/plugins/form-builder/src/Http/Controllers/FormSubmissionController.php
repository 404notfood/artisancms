<?php

declare(strict_types=1);

namespace FormBuilder\Http\Controllers;

use App\Http\Controllers\Controller;
use FormBuilder\Models\Form;
use FormBuilder\Models\FormSubmission;
use FormBuilder\Services\SubmissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FormSubmissionController extends Controller
{
    public function __construct(
        private readonly SubmissionService $submissionService,
    ) {}

    /**
     * Display a listing of submissions for a given form.
     */
    public function index(Request $request, Form $form): InertiaResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.read'), 403);
        $query = $form->submissions()->orderByDesc('created_at');

        $status = $request->query('status');

        if (is_string($status) && in_array($status, ['new', 'read', 'replied', 'spam', 'trash'], true)) {
            $query->byStatus($status);
        }

        $submissions = $query->paginate(20);

        return Inertia::render('Admin/Forms/Submissions/Index', [
            'form' => $form,
            'submissions' => $submissions,
            'filters' => [
                'status' => $status,
            ],
            'counts' => [
                'new' => $form->submissions()->new()->count(),
                'read' => $form->submissions()->byStatus('read')->count(),
                'replied' => $form->submissions()->byStatus('replied')->count(),
                'spam' => $form->submissions()->spam()->count(),
                'trash' => $form->submissions()->byStatus('trash')->count(),
            ],
        ]);
    }

    /**
     * Display the details of a single submission.
     */
    public function show(FormSubmission $submission): InertiaResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.read'), 403);
        $submission->load('form');

        // Auto-mark as read when viewed
        if ($submission->status === 'new') {
            $this->submissionService->markAsRead($submission);
        }

        return Inertia::render('Admin/Forms/Submissions/Show', [
            'submission' => $submission,
        ]);
    }

    /**
     * Update the status of a submission.
     */
    public function updateStatus(Request $request, FormSubmission $submission): RedirectResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.update'), 403);
        $validated = $request->validate([
            'status' => ['required', Rule::in(['new', 'read', 'replied', 'spam', 'trash'])],
        ]);

        $this->submissionService->updateStatus($submission, $validated['status']);

        return redirect()
            ->back()
            ->with('success', __('cms.submission_status_updated'));
    }

    /**
     * Export submissions for a form as CSV.
     */
    public function export(Form $form): StreamedResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.read'), 403);
        return $this->submissionService->export($form);
    }

    /**
     * Delete a submission.
     */
    public function destroy(FormSubmission $submission): RedirectResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.delete'), 403);
        $formId = $submission->form_id;

        $submission->delete();

        return redirect()
            ->route('admin.forms.submissions.index', $formId)
            ->with('success', __('cms.submission_deleted'));
    }
}
