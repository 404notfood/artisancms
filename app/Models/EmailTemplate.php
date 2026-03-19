<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class EmailTemplate extends Model
{

    /**
     * @var string
     */
    protected $table = 'cms_email_templates';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'subject',
        'body_html',
        'body_text',
        'variables',
        'category',
        'is_system',
        'enabled',
        'default_body_html',
        'default_subject',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'is_system' => 'boolean',
            'enabled' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (EmailTemplate $template): void {
            Cache::forget("email_template:{$template->slug}");
        });

        static::deleted(function (EmailTemplate $template): void {
            Cache::forget("email_template:{$template->slug}");
        });
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Filter only enabled templates.
     *
     * @param Builder<EmailTemplate> $query
     * @return Builder<EmailTemplate>
     */
    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('enabled', true);
    }

    /**
     * Filter templates by category.
     *
     * @param Builder<EmailTemplate> $query
     * @return Builder<EmailTemplate>
     */
    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Filter only system templates.
     *
     * @param Builder<EmailTemplate> $query
     * @return Builder<EmailTemplate>
     */
    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system', true);
    }

    // ─── Static helpers ──────────────────────────────────

    /**
     * Find a template by its slug, with 24-hour cache.
     */
    public static function findBySlug(string $slug): ?self
    {
        return Cache::remember(
            "email_template:{$slug}",
            now()->addHours(24),
            fn () => static::where('slug', $slug)->first(),
        );
    }

    /**
     * Get available template categories with i18n labels.
     *
     * @return array<string, string>
     */
    public static function categories(): array
    {
        return [
            'auth' => __('cms.email_templates.categories.auth'),
            'notification' => __('cms.email_templates.categories.notification'),
            'marketing' => __('cms.email_templates.categories.marketing'),
            'form' => __('cms.email_templates.categories.form'),
        ];
    }

    // ─── Accessors ───────────────────────────────────────

    /**
     * Extract variable keys from the variables definition array.
     *
     * @return array<int, string>
     */
    public function getVariableKeysAttribute(): array
    {
        $variables = $this->variables ?? [];

        return array_map(
            fn (array $variable): string => $variable['key'] ?? '',
            $variables,
        );
    }
}
