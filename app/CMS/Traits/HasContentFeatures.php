<?php

declare(strict_types=1);

namespace App\CMS\Traits;

use App\Models\ContentRelation;
use App\Models\ContentTranslation;
use App\Models\CustomField;
use App\Models\CustomFieldValue;
use App\Models\Revision;
use App\Models\TaxonomyTerm;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

/**
 * Shared content features for Page, Post, and other content models.
 *
 * Provides: revisions, terms, custom fields, content locking, multi-language.
 */
trait HasContentFeatures
{
    // ---- Revisions ----

    /**
     * @return MorphMany<Revision, $this>
     */
    public function revisions(): MorphMany
    {
        return $this->morphMany(Revision::class, 'revisionable');
    }

    // ---- Content Relations ----

    /**
     * @return MorphMany<ContentRelation, $this>
     */
    public function relatedContent(): MorphMany
    {
        return $this->morphMany(ContentRelation::class, 'source');
    }

    // ---- Taxonomy Terms ----

    /**
     * @return MorphToMany<TaxonomyTerm, $this>
     */
    public function terms(): MorphToMany
    {
        return $this->morphToMany(TaxonomyTerm::class, 'termable', 'termables', null, 'term_id');
    }

    // ---- Custom Fields ----

    /**
     * @return MorphMany<CustomFieldValue, $this>
     */
    public function customFieldValues(): MorphMany
    {
        return $this->morphMany(CustomFieldValue::class, 'entity');
    }

    /**
     * Get a custom field value by field slug.
     */
    public function getCustomField(string $slug): mixed
    {
        $fieldValue = $this->customFieldValues()
            ->whereHas('field', fn ($q) => $q->where('slug', $slug))
            ->with('field')
            ->first();

        return $fieldValue?->getValue();
    }

    /**
     * Set a custom field value by field slug.
     */
    public function setCustomField(string $slug, mixed $value): void
    {
        $contentType = strtolower(class_basename(static::class));

        $field = CustomField::where('slug', $slug)
            ->whereHas('group', fn ($q) => $q->whereJsonContains('applies_to', $contentType))
            ->first();

        if ($field === null) {
            return;
        }

        $storedValue = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string) $value;

        $this->customFieldValues()->updateOrCreate(
            ['field_id' => $field->id],
            ['value' => $storedValue],
        );
    }

    // ---- Content Locking ----

    /**
     * @return BelongsTo<User, $this>
     */
    public function checkedOutBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    /**
     * Check if this content is currently checked out (lock is less than 30 minutes old).
     */
    public function isCheckedOut(): bool
    {
        return $this->checked_out_by !== null && $this->checked_out_at?->gt(now()->subMinutes(30));
    }

    /**
     * Check if this content is checked out by a specific user.
     */
    public function isCheckedOutBy(User $user): bool
    {
        return $this->checked_out_by === $user->id;
    }

    // ---- Multi-language ----

    /**
     * @return MorphMany<ContentTranslation, $this>
     */
    public function translations(): MorphMany
    {
        return $this->morphMany(ContentTranslation::class, 'source');
    }

    /**
     * Get the translation of this content in a specific locale.
     */
    public function getTranslation(string $locale): ?static
    {
        $translation = $this->translations()->where('target_locale', $locale)->first();

        return $translation ? static::find($translation->target_id) : null;
    }

    /**
     * Get all available locales for this content (including its own locale).
     *
     * @return array<int, string>
     */
    public function getAvailableLocales(): array
    {
        return $this->translations()->pluck('target_locale')->push($this->locale)->unique()->values()->all();
    }
}
