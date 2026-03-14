<?php

declare(strict_types=1);

namespace FormBuilder\Services;

use App\CMS\Facades\CMS;
use FormBuilder\Models\Form;
use FormBuilder\Models\FormSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionService
{
    public function __construct(
        private readonly SpamProtectionService $spamProtection,
    ) {}

    /**
     * Store a new form submission.
     */
    public function store(Form $form, array $data, Request $request): FormSubmission
    {
        $submission = FormSubmission::create([
            'form_id' => $form->id,
            'data' => $data,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer' => $request->headers->get('referer'),
            'status' => 'new',
        ]);

        // Fire hook so other plugins can react
        if (class_exists(CMS::class)) {
            CMS::fire('form.submitted', $form, $submission);
        }

        // Send notification emails
        $this->sendNotifications($form, $submission);

        return $submission;
    }

    /**
     * Mark a submission as read.
     */
    public function markAsRead(FormSubmission $submission): FormSubmission
    {
        $submission->update(['status' => 'read']);

        return $submission;
    }

    /**
     * Mark a submission as spam.
     */
    public function markAsSpam(FormSubmission $submission): FormSubmission
    {
        $submission->update(['status' => 'spam']);

        return $submission;
    }

    /**
     * Mark a submission as replied.
     */
    public function markAsReplied(FormSubmission $submission): FormSubmission
    {
        $submission->update(['status' => 'replied']);

        return $submission;
    }

    /**
     * Update the status of a submission.
     */
    public function updateStatus(FormSubmission $submission, string $status): FormSubmission
    {
        $submission->update(['status' => $status]);

        return $submission;
    }

    /**
     * Export form submissions as CSV data via a streamed response.
     */
    public function export(Form $form): StreamedResponse
    {
        $fields = collect($form->fields)
            ->filter(fn (array $field): bool => !in_array($field['type'] ?? '', ['heading', 'paragraph', 'divider'], true))
            ->pluck('label', 'name');

        return response()->streamDownload(function () use ($form, $fields): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            // Write CSV header
            fputcsv($handle, ['Date', ...$fields->values()->toArray(), 'IP', 'Statut']);

            // Write data rows in chunks
            $form->submissions()
                ->orderByDesc('created_at')
                ->chunk(100, function ($submissions) use ($handle, $fields): void {
                    foreach ($submissions as $submission) {
                        $row = [$submission->created_at->format('Y-m-d H:i')];

                        foreach ($fields->keys() as $fieldName) {
                            $row[] = $submission->data[$fieldName] ?? '';
                        }

                        $row[] = $submission->ip_address ?? '';
                        $row[] = $submission->status;

                        fputcsv($handle, $row);
                    }
                });

            fclose($handle);
        }, "{$form->slug}-submissions.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Send notification emails for a new submission.
     */
    private function sendNotifications(Form $form, FormSubmission $submission): void
    {
        $notifications = $form->notifications;

        if (!is_array($notifications) || empty($notifications)) {
            return;
        }

        foreach ($notifications as $notification) {
            $this->sendNotificationEmail($notification, $form, $submission);
        }
    }

    /**
     * Send a single notification email.
     *
     * @param array<string, mixed> $notification
     */
    private function sendNotificationEmail(array $notification, Form $form, FormSubmission $submission): void
    {
        $to = $notification['to'] ?? null;

        if (empty($to)) {
            return;
        }

        try {
            $subject = $this->replaceFieldPlaceholders(
                $notification['subject'] ?? "New submission: {$form->name}",
                $submission->data,
            );

            $replyTo = $this->replaceFieldPlaceholders(
                $notification['replyTo'] ?? '',
                $submission->data,
            );

            $body = $this->buildEmailBody($form, $submission);

            Mail::raw($body, function ($message) use ($to, $subject, $replyTo): void {
                $message->to($to)->subject($subject);

                if (!empty($replyTo) && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
                    $message->replyTo($replyTo);
                }
            });
        } catch (\Throwable $e) {
            Log::error('Form Builder: Failed to send notification email.', [
                'error' => $e->getMessage(),
                'form_id' => $form->id,
                'submission_id' => $submission->id,
            ]);
        }
    }

    /**
     * Build the plain text email body from form fields and submission data.
     */
    private function buildEmailBody(Form $form, FormSubmission $submission): string
    {
        $siteName = config('app.name', 'ArtisanCMS');
        $date = now()->format('d/m/Y H:i');
        $lines = [
            "New submission from {$form->name}",
            "Site: {$siteName}",
            "Date: {$date}",
            '',
            '---',
            '',
        ];

        $fields = collect($form->fields)
            ->filter(fn (array $field): bool => !in_array($field['type'] ?? '', ['heading', 'paragraph', 'divider'], true));

        foreach ($fields as $field) {
            $name = $field['name'] ?? '';
            $label = $field['label'] ?? $name;
            $value = $submission->data[$name] ?? '';

            if (is_array($value)) {
                $value = implode(', ', $value);
            }

            $lines[] = "{$label}: {$value}";
        }

        $lines[] = '';
        $lines[] = '---';
        $lines[] = "IP: " . ($submission->ip_address ?? 'N/A');

        return implode("\n", $lines);
    }

    /**
     * Replace {field_name} placeholders with actual submission data.
     *
     * @param array<string, mixed> $data
     */
    private function replaceFieldPlaceholders(string $text, array $data): string
    {
        return (string) preg_replace_callback('/\{(\w+)\}/', function (array $matches) use ($data): string {
            $fieldName = $matches[1];
            $value = $data[$fieldName] ?? '';

            if (is_array($value)) {
                return implode(', ', $value);
            }

            return (string) $value;
        }, $text);
    }
}
