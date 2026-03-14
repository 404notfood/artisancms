<?php

declare(strict_types=1);

namespace ContactForm\Services;

use App\CMS\Facades\CMS;
use App\Models\CmsPlugin;
use ContactForm\Models\FormSubmission;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class FormService
{
    /**
     * Create a new form submission and send notification email.
     *
     * @param array<string, mixed> $data
     */
    public function createSubmission(array $data, string $formName = 'contact', ?string $ipAddress = null, ?string $userAgent = null): FormSubmission
    {
        $submission = FormSubmission::create([
            'form_name' => $formName,
            'data' => $data,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);

        // Fire hook so other plugins can react to submissions
        CMS::fire('contact_form.submitted', $submission);

        // Send notification email
        $this->sendNotificationEmail($submission);

        return $submission;
    }

    /**
     * Send a notification email to the configured recipient.
     */
    private function sendNotificationEmail(FormSubmission $submission): void
    {
        $recipientEmail = $this->getPluginSetting('recipient_email', '');

        if (empty($recipientEmail)) {
            Log::warning('Contact Form: No recipient email configured, skipping notification.');
            return;
        }

        try {
            $data = $submission->data;
            $senderName = $data['name'] ?? 'Visiteur';
            $senderEmail = $data['email'] ?? 'inconnu';
            $message = $data['message'] ?? '';
            $siteName = config('app.name', 'ArtisanCMS');

            Mail::raw(
                $this->buildEmailBody($senderName, $senderEmail, $message),
                function ($mail) use ($recipientEmail, $senderName, $siteName): void {
                    $mail->to($recipientEmail)
                        ->subject("[{$siteName}] Nouveau message de {$senderName}");
                }
            );
        } catch (\Throwable $e) {
            Log::error('Contact Form: Failed to send notification email.', [
                'error' => $e->getMessage(),
                'submission_id' => $submission->id,
            ]);
        }
    }

    /**
     * Build the plain text email body.
     */
    private function buildEmailBody(string $name, string $email, string $message): string
    {
        $siteName = config('app.name', 'ArtisanCMS');
        $date = now()->format('d/m/Y H:i');

        return <<<TEXT
        Nouveau message depuis {$siteName}

        Date : {$date}
        Nom : {$name}
        Email : {$email}

        Message :
        {$message}
        TEXT;
    }

    /**
     * Check if the honeypot field indicates a spam submission.
     */
    public function isSpam(?string $honeypotValue): bool
    {
        $honeypotEnabled = (bool) $this->getPluginSetting('honeypot_enabled', true);

        if (!$honeypotEnabled) {
            return false;
        }

        // If the honeypot field has a value, it's likely spam
        return !empty($honeypotValue);
    }

    /**
     * Get the success message from plugin settings.
     */
    public function getSuccessMessage(): string
    {
        return (string) $this->getPluginSetting('success_message', 'Merci pour votre message !');
    }

    /**
     * Retrieve a plugin setting value from the CMS plugin record.
     */
    private function getPluginSetting(string $key, mixed $default = null): mixed
    {
        $plugin = CmsPlugin::where('slug', 'contact-form')->first();

        if ($plugin === null) {
            return $default;
        }

        $settings = $plugin->settings;

        if (!is_array($settings)) {
            return $default;
        }

        if (isset($settings[$key]['value'])) {
            return $settings[$key]['value'];
        }

        if (isset($settings[$key]['default'])) {
            return $settings[$key]['default'];
        }

        return $settings[$key] ?? $default;
    }
}
