<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\EmailTemplate;
use DateTimeInterface;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class EmailTemplateService
{
    /**
     * Render a template by slug with the given variables.
     *
     * @param array<string, mixed> $variables
     * @return array{subject: string, html: string, text: string}
     *
     * @throws RuntimeException
     */
    public function render(string $slug, array $variables = []): array
    {
        $template = EmailTemplate::findBySlug($slug);

        if ($template === null) {
            throw new RuntimeException(__('cms.email_templates.not_found', ['slug' => $slug]));
        }

        if (!$template->enabled) {
            throw new RuntimeException(__('cms.email_templates.disabled', ['slug' => $slug]));
        }

        $variables = $this->mergeGlobalVariables($variables);

        $subject = $this->compileString($template->subject, $variables);
        $bodyHtml = $this->compileString($template->body_html, $variables);
        $html = $this->wrapInLayout($bodyHtml, $subject);

        $text = $template->body_text
            ? $this->compileString($template->body_text, $variables)
            : $this->generatePlainText($bodyHtml);

        return [
            'subject' => $subject,
            'html' => $html,
            'text' => $text,
        ];
    }

    /**
     * Compile a template string by replacing {{ variable }} placeholders.
     *
     * Supports dot notation (e.g., user.name resolves to $variables['user']['name']).
     */
    public function compileString(string $template, array $variables): string
    {
        return (string) preg_replace_callback(
            '/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/',
            function (array $matches) use ($variables): string {
                $resolved = $this->resolveVariable($matches[1], $variables);

                return $resolved !== null ? $this->formatValue($resolved) : $matches[0];
            },
            $template,
        );
    }

    /**
     * Resolve a variable key from the variables array.
     *
     * Tries direct key first, then dot notation via data_get().
     */
    public function resolveVariable(string $key, array $variables): mixed
    {
        // Try direct key first
        if (array_key_exists($key, $variables)) {
            return $variables[$key];
        }

        // Try dot notation via data_get
        return data_get($variables, $key);
    }

    /**
     * Format a value for insertion into a template string.
     */
    public function formatValue(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? __('cms.yes') : __('cms.no');
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('d/m/Y H:i');
        }

        if (is_array($value)) {
            return implode(', ', array_map(
                fn (mixed $item): string => $this->formatValue($item),
                $value,
            ));
        }

        return e((string) $value);
    }

    /**
     * Merge global variables (site info, current year) into the variables array.
     *
     * @param array<string, mixed> $variables
     * @return array<string, mixed>
     */
    public function mergeGlobalVariables(array $variables): array
    {
        $globals = [
            'site' => [
                'name' => config('app.name', 'ArtisanCMS'),
                'url' => config('app.url', ''),
            ],
            'current_year' => (string) date('Y'),
        ];

        return array_replace_recursive($globals, $variables);
    }

    /**
     * Wrap the rendered body HTML in a responsive email layout.
     */
    public function wrapInLayout(string $bodyHtml, string $subject): string
    {
        $layout = $this->getBaseLayout();

        $siteName = e((string) config('app.name', 'ArtisanCMS'));

        $layout = str_replace('{{SUBJECT}}', e($subject), $layout);
        $layout = str_replace('{{CONTENT}}', $bodyHtml, $layout);
        $layout = str_replace('{{SITE_NAME}}', $siteName, $layout);
        $layout = str_replace('{{YEAR}}', (string) date('Y'), $layout);

        return $layout;
    }

    /**
     * Return a clean, Gmail/Outlook-compatible HTML email layout template.
     *
     * Uses table-based layout for maximum email client compatibility.
     */
    public function getBaseLayout(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{SUBJECT}}</title>
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f4f4f7; }
        .email-wrapper { width: 100%; background-color: #f4f4f7; padding: 20px 0; }
        .email-content { width: 100%; max-width: 600px; margin: 0 auto; }
        .email-header { padding: 25px 0; text-align: center; }
        .email-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .email-body { background-color: #ffffff; border-radius: 8px; padding: 40px 30px; }
        .email-body p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #51545e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .email-body a { color: #3869d4; text-decoration: underline; }
        .email-body h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .email-footer { padding: 25px 0; text-align: center; }
        .email-footer p { margin: 0; font-size: 13px; line-height: 1.5; color: #a8aaaf; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
</head>
<body>
    <table class="email-wrapper" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
        <tr>
            <td align="center">
                <table class="email-content" role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin: 0 auto;">
                    <!-- Header -->
                    <tr>
                        <td class="email-header" style="padding: 25px 0; text-align: center;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">{{SITE_NAME}}</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td class="email-body" style="background-color: #ffffff; border-radius: 8px; padding: 40px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #51545e;">
                            {{CONTENT}}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="email-footer" style="padding: 25px 0; text-align: center;">
                            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #a8aaaf; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">&copy; {{YEAR}} {{SITE_NAME}}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Send a test email for a template using example variable values.
     *
     * @throws RuntimeException
     */
    public function sendTest(string $slug, string $email): bool
    {
        $template = EmailTemplate::findBySlug($slug);

        if ($template === null) {
            throw new RuntimeException(__('cms.email_templates.not_found', ['slug' => $slug]));
        }

        // Build example variables from template variable definitions
        $exampleVariables = $this->buildExampleVariables($template);

        $rendered = $this->render($slug, $exampleVariables);

        Mail::html($rendered['html'], function ($message) use ($email, $rendered): void {
            /** @var \Illuminate\Mail\Message $message */
            $message->to($email)
                ->subject('[TEST] ' . $rendered['subject']);
        });

        return true;
    }

    /**
     * Reset a template to its default subject and body.
     *
     * @throws RuntimeException
     */
    public function resetToDefault(EmailTemplate $template): void
    {
        if ($template->default_body_html === null && $template->default_subject === null) {
            throw new RuntimeException(__('cms.email_templates.no_default'));
        }

        $data = [];

        if ($template->default_subject !== null) {
            $data['subject'] = $template->default_subject;
        }

        if ($template->default_body_html !== null) {
            $data['body_html'] = $template->default_body_html;
        }

        $template->update($data);
    }

    /**
     * Get all available variables for a template (template + global).
     *
     * @return array<int, array<string, string>>
     */
    public function getAvailableVariables(string $slug): array
    {
        $template = EmailTemplate::findBySlug($slug);

        $templateVariables = $template ? ($template->variables ?? []) : [];

        $globalVariables = [
            ['key' => 'site.name', 'label' => __('cms.email_templates.variables.site_name'), 'example' => config('app.name', 'ArtisanCMS')],
            ['key' => 'site.url', 'label' => __('cms.email_templates.variables.site_url'), 'example' => config('app.url', '')],
            ['key' => 'current_year', 'label' => __('cms.email_templates.variables.current_year'), 'example' => (string) date('Y')],
        ];

        return array_merge($templateVariables, $globalVariables);
    }

    /**
     * Send an email using a template.
     *
     * @param array<string, mixed> $variables
     *
     * @throws RuntimeException
     */
    public function send(string $slug, string $to, array $variables, ?string $fromName = null): void
    {
        $rendered = $this->render($slug, $variables);

        Mail::html($rendered['html'], function ($message) use ($to, $rendered, $fromName): void {
            /** @var \Illuminate\Mail\Message $message */
            $message->to($to)
                ->subject($rendered['subject']);

            if ($fromName !== null) {
                $fromAddress = config('mail.from.address', 'noreply@example.com');
                $message->from($fromAddress, $fromName);
            }
        });
    }

    /**
     * Build example variable values from a template's variable definitions.
     *
     * @return array<string, string>
     */
    private function buildExampleVariables(EmailTemplate $template): array
    {
        $examples = [];

        foreach ($template->variables ?? [] as $variable) {
            $key = $variable['key'] ?? '';
            $example = $variable['example'] ?? $variable['label'] ?? $key;

            if ($key === '') {
                continue;
            }

            // Support dot notation keys by building nested arrays
            data_set($examples, $key, $example);
        }

        return $examples;
    }

    /**
     * Generate plain text version from HTML by stripping tags.
     */
    private function generatePlainText(string $html): string
    {
        // Convert <br> and block-level tags to newlines
        $text = (string) preg_replace('/<br\s*\/?>/i', "\n", $html);
        $text = (string) preg_replace('/<\/(p|div|h[1-6]|li|tr)>/i', "\n", $text);
        $text = (string) preg_replace('/<(hr)\s*\/?>/i', "\n---\n", $text);

        // Convert links to text format
        $text = (string) preg_replace('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)<\/a>/i', '$2 ($1)', $text);

        // Strip remaining tags
        $text = strip_tags($text);

        // Clean up whitespace
        $text = (string) preg_replace('/[ \t]+/', ' ', $text);
        $text = (string) preg_replace('/\n{3,}/', "\n\n", $text);

        return trim($text);
    }
}
