<?php

declare(strict_types=1);

namespace FormBuilder\Http\Controllers;

use FormBuilder\Models\Form;
use FormBuilder\Services\SpamProtectionService;
use FormBuilder\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;

class PublicFormController extends Controller
{
    public function __construct(
        private readonly SubmissionService $submissionService,
        private readonly SpamProtectionService $spamProtection,
    ) {}

    /**
     * Handle a public form submission.
     */
    public function submit(Request $request, Form $form): JsonResponse
    {
        // Check if form is active
        if (!$form->is_active) {
            return response()->json([
                'success' => false,
                'message' => __('cms.form_inactive'),
            ], 404);
        }

        // Validate form fields dynamically
        $rules = $this->buildValidationRules($form);
        $validated = $request->validate($rules);

        // Check spam protection
        $spamConfig = $form->spam_protection ?? [];

        if (!empty($spamConfig) && !$this->spamProtection->validate($request, $spamConfig)) {
            // Return success to not reveal spam detection, but don't store
            return response()->json([
                'success' => true,
                'message' => $this->getConfirmationMessage($form),
            ]);
        }

        // Filter out only the form field data (exclude spam protection fields)
        $fieldNames = $form->getFieldNames();
        $submissionData = array_intersect_key($validated, array_flip($fieldNames));

        // Store the submission
        $this->submissionService->store($form, $submissionData, $request);

        return response()->json([
            'success' => true,
            'message' => $this->getConfirmationMessage($form),
            'redirect' => $form->confirmation['redirect_url'] ?? null,
        ]);
    }

    /**
     * Build Laravel validation rules from form field definitions.
     *
     * @return array<string, array<int, mixed>>
     */
    private function buildValidationRules(Form $form): array
    {
        $rules = [];
        $fields = $form->fields;

        if (!is_array($fields)) {
            return $rules;
        }

        foreach ($fields as $field) {
            // Skip visual-only fields
            if (in_array($field['type'] ?? '', ['heading', 'paragraph', 'divider'], true)) {
                continue;
            }

            $name = $field['name'] ?? '';

            if (empty($name)) {
                continue;
            }

            $fieldRules = [];

            // Required
            if (!empty($field['required'])) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            // Type-based rules
            $fieldRules = array_merge($fieldRules, $this->getTypeRules($field['type'] ?? 'text'));

            // Custom validation rules from field definition
            if (!empty($field['validation']) && is_array($field['validation'])) {
                foreach ($field['validation'] as $validation) {
                    $rule = $this->mapValidationRule($validation);

                    if ($rule !== null) {
                        $fieldRules[] = $rule;
                    }
                }
            }

            $rules[$name] = $fieldRules;
        }

        return $rules;
    }

    /**
     * Get Laravel validation rules based on field type.
     *
     * @return array<int, string>
     */
    private function getTypeRules(string $type): array
    {
        return match ($type) {
            'email' => ['email', 'max:255'],
            'url' => ['url', 'max:2048'],
            'number' => ['numeric'],
            'phone' => ['string', 'max:50'],
            'text' => ['string', 'max:255'],
            'textarea', 'richtext' => ['string', 'max:10000'],
            'select', 'radio' => ['string', 'max:255'],
            'checkbox' => ['array'],
            'toggle' => ['boolean'],
            'date' => ['date'],
            'time' => ['date_format:H:i'],
            'datetime' => ['date'],
            'file' => ['file'],
            'hidden' => ['string', 'max:255'],
            default => ['string', 'max:255'],
        };
    }

    /**
     * Map a custom validation rule definition to a Laravel rule.
     *
     * @param array<string, mixed> $validation
     */
    private function mapValidationRule(array $validation): ?string
    {
        $type = $validation['type'] ?? '';
        $value = $validation['value'] ?? '';

        return match ($type) {
            'min' => "min:{$value}",
            'max' => "max:{$value}",
            'pattern' => "regex:{$value}",
            'mime' => "mimes:{$value}",
            'maxSize' => 'max:' . (int) ceil((int) $value / 1024),
            default => null,
        };
    }

    /**
     * Get the confirmation message for a form.
     */
    private function getConfirmationMessage(Form $form): string
    {
        $confirmation = $form->confirmation;

        if (is_array($confirmation) && !empty($confirmation['message'])) {
            return $confirmation['message'];
        }

        $settings = $form->settings;

        if (is_array($settings) && !empty($settings['successMessage'])) {
            return $settings['successMessage'];
        }

        return __('cms.form_submitted_success');
    }
}
