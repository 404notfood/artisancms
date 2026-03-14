<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use App\Models\CustomFieldValue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CustomFieldService
{
    /**
     * Get field groups that apply to a given entity type.
     *
     * @return Collection<int, CustomFieldGroup>
     */
    public function getGroupsForEntity(string $type, ?string $template = null): Collection
    {
        return CustomFieldGroup::active()
            ->forEntity($type, $template)
            ->with('fields')
            ->orderBy('order')
            ->get();
    }

    /**
     * Get all custom field values for an entity, keyed by field slug.
     *
     * @return array<string, mixed>
     */
    public function getValuesForEntity(Model $entity): array
    {
        $values = CustomFieldValue::where('entity_type', $entity->getMorphClass())
            ->where('entity_id', $entity->getKey())
            ->with('field')
            ->get();

        $result = [];
        foreach ($values as $fieldValue) {
            if ($fieldValue->field !== null) {
                $result[$fieldValue->field->slug] = $fieldValue->getValue();
            }
        }

        return $result;
    }

    /**
     * Save or update custom field values for an entity.
     * Keys are field slugs, values are the field values.
     *
     * @param array<string, mixed> $values
     */
    public function saveValues(Model $entity, array $values): void
    {
        $entityType = $entity->getMorphClass();
        $entityId   = $entity->getKey();

        // Resolve field slugs to field IDs
        $fields = CustomField::whereIn('slug', array_keys($values))->get();

        foreach ($fields as $field) {
            $rawValue = $values[$field->slug] ?? null;

            // Encode arrays/complex values to JSON
            $storedValue = null;
            if ($rawValue !== null) {
                $storedValue = is_array($rawValue)
                    ? json_encode($rawValue, JSON_UNESCAPED_UNICODE)
                    : (string) $rawValue;
            }

            CustomFieldValue::updateOrCreate(
                [
                    'field_id'    => $field->id,
                    'entity_type' => $entityType,
                    'entity_id'   => $entityId,
                ],
                [
                    'value' => $storedValue,
                ],
            );
        }
    }

    /**
     * Create a new custom field group with its fields.
     *
     * @param array<string, mixed> $data
     */
    public function createGroup(array $data): CustomFieldGroup
    {
        $fields = $data['fields'] ?? [];
        unset($data['fields']);

        // Auto-generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Ensure slug uniqueness
        $data['slug'] = $this->ensureUniqueSlug($data['slug']);

        /** @var CustomFieldGroup $group */
        $group = CustomFieldGroup::create($data);

        $this->syncFields($group, $fields);

        return $group->load('fields');
    }

    /**
     * Update an existing custom field group and sync its fields.
     *
     * @param array<string, mixed> $data
     */
    public function updateGroup(CustomFieldGroup $group, array $data): CustomFieldGroup
    {
        $fields = $data['fields'] ?? [];
        unset($data['fields']);

        // If slug changed, ensure uniqueness
        if (isset($data['slug']) && $data['slug'] !== $group->slug) {
            $data['slug'] = $this->ensureUniqueSlug($data['slug'], $group->id);
        }

        $group->update($data);

        $this->syncFields($group, $fields);

        return $group->load('fields');
    }

    /**
     * Delete a custom field group along with all fields and values.
     */
    public function deleteGroup(CustomFieldGroup $group): void
    {
        // Values are cascade-deleted via foreign key on fields,
        // and fields cascade-deleted via foreign key on group.
        $group->delete();
    }

    // ─── Internal methods ─────────────────────────────────

    /**
     * Sync fields for a group: create new, update existing, delete removed.
     *
     * @param array<int, array<string, mixed>> $fields
     */
    protected function syncFields(CustomFieldGroup $group, array $fields): void
    {
        $existingFieldIds = $group->fields()->pluck('id')->all();
        $incomingFieldIds = [];

        foreach ($fields as $index => $fieldData) {
            $fieldData['order'] = $fieldData['order'] ?? $index;
            $fieldData['group_id'] = $group->id;

            // Auto-generate slug if not provided
            if (empty($fieldData['slug'])) {
                $fieldData['slug'] = Str::slug($fieldData['name'], '_');
            }

            if (!empty($fieldData['id']) && in_array($fieldData['id'], $existingFieldIds, true)) {
                // Update existing field
                $field = CustomField::find($fieldData['id']);
                if ($field !== null) {
                    $field->update($fieldData);
                    $incomingFieldIds[] = $field->id;
                }
            } else {
                // Create new field
                unset($fieldData['id']);
                $field = CustomField::create($fieldData);
                $incomingFieldIds[] = $field->id;
            }
        }

        // Delete fields that were removed
        $toDelete = array_diff($existingFieldIds, $incomingFieldIds);
        if (!empty($toDelete)) {
            CustomField::whereIn('id', $toDelete)->delete();
        }
    }

    /**
     * Ensure a group slug is unique, appending a number if needed.
     */
    protected function ensureUniqueSlug(string $slug, ?int $excludeId = null): string
    {
        $query = CustomFieldGroup::where('slug', $slug);
        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        if (!$query->exists()) {
            return $slug;
        }

        $counter = 1;
        do {
            $newSlug = "{$slug}-{$counter}";
            $exists = CustomFieldGroup::where('slug', $newSlug)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->exists();
            $counter++;
        } while ($exists);

        return $newSlug;
    }
}
