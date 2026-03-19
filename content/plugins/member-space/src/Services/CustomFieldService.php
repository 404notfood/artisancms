<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use MemberSpace\Models\MemberCustomField;
use MemberSpace\Models\MemberFieldValue;

class CustomFieldService
{
    public function getFields(string $context = 'profile'): \Illuminate\Database\Eloquent\Collection
    {
        $query = MemberCustomField::active()->ordered();

        return match ($context) {
            'registration' => $query->forRegistration()->get(),
            'directory' => $query->forDirectory()->get(),
            default => $query->forProfile()->get(),
        };
    }

    public function getFieldValues(int $userId): array
    {
        return MemberFieldValue::where('user_id', $userId)
            ->pluck('value', 'field_id')
            ->toArray();
    }

    public function saveFieldValues(int $userId, array $values): void
    {
        foreach ($values as $fieldId => $value) {
            MemberFieldValue::updateOrCreate(
                ['user_id' => $userId, 'field_id' => $fieldId],
                ['value' => $value]
            );
        }
    }

    public function createField(array $data): MemberCustomField
    {
        return MemberCustomField::create($data);
    }

    public function updateField(MemberCustomField $field, array $data): MemberCustomField
    {
        $field->update($data);
        return $field->fresh();
    }

    public function deleteField(MemberCustomField $field): void
    {
        $field->values()->delete();
        $field->delete();
    }

    public function reorder(array $order): void
    {
        foreach ($order as $index => $fieldId) {
            MemberCustomField::where('id', $fieldId)->update(['order' => $index]);
        }
    }

    public function getValidationRules(string $context = 'profile'): array
    {
        $fields = $this->getFields($context);
        $rules = [];

        foreach ($fields as $field) {
            $fieldRules = [];

            if ($field->required) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            match ($field->type) {
                'email' => $fieldRules[] = 'email',
                'url' => $fieldRules[] = 'url',
                'number' => $fieldRules[] = 'numeric',
                'date' => $fieldRules[] = 'date',
                'phone' => $fieldRules[] = 'string|max:30',
                'file' => $fieldRules[] = 'file|max:5120',
                'select', 'radio' => $fieldRules[] = 'in:' . implode(',', $field->options ?? []),
                'checkbox' => $fieldRules[] = 'boolean',
                'textarea' => $fieldRules[] = 'string|max:2000',
                default => $fieldRules[] = 'string|max:255',
            };

            if ($field->validation_rules) {
                $fieldRules[] = $field->validation_rules;
            }

            $rules["custom_fields.{$field->id}"] = implode('|', $fieldRules);
        }

        return $rules;
    }
}
