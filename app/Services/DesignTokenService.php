<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DesignToken;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DesignTokenService
{
    private const CACHE_KEY = 'cms.design_tokens';
    private const CACHE_TTL = 3600;

    /**
     * Get all tokens grouped by category.
     *
     * @return Collection<string, Collection<int, DesignToken>>
     */
    public function getAllGrouped(): Collection
    {
        return DesignToken::ordered()->get()->groupBy('category');
    }

    /**
     * Get tokens by category.
     *
     * @return Collection<int, DesignToken>
     */
    public function getByCategory(string $category): Collection
    {
        return DesignToken::category($category)->ordered()->get();
    }

    /**
     * Create a new design token.
     */
    public function create(array $data): DesignToken
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $token = DesignToken::create($data);
        $this->clearCache();

        return $token;
    }

    /**
     * Update an existing design token.
     */
    public function update(DesignToken $token, array $data): DesignToken
    {
        $token->update($data);
        $this->clearCache();

        return $token;
    }

    /**
     * Delete a design token.
     */
    public function delete(DesignToken $token): void
    {
        $token->delete();
        $this->clearCache();
    }

    /**
     * Generate CSS variables string from all tokens.
     */
    public function generateCssVariables(): string
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $tokens = DesignToken::ordered()->get();
            $lines = [];

            foreach ($tokens as $token) {
                $cssVar = '--token-' . $token->slug;
                $value = $this->resolveCssValue($token->category, $token->value);

                if ($value !== null) {
                    $lines[] = "  {$cssVar}: {$value};";
                }
            }

            if (empty($lines)) {
                return '';
            }

            return ":root {\n" . implode("\n", $lines) . "\n}";
        });
    }

    /**
     * Resolve a token value into a CSS-compatible string.
     */
    private function resolveCssValue(string $category, mixed $value): ?string
    {
        if (is_string($value)) {
            return $value;
        }

        if (!is_array($value)) {
            return null;
        }

        return match ($category) {
            'color' => $value['hex'] ?? $value['value'] ?? null,
            'typography' => $this->resolveTypographyValue($value),
            'spacing' => ($value['value'] ?? '0') . ($value['unit'] ?? 'px'),
            'shadow' => $value['value'] ?? null,
            'border' => $this->resolveBorderValue($value),
            'button' => $value['value'] ?? null,
            default => $value['value'] ?? null,
        };
    }

    private function resolveTypographyValue(array $value): ?string
    {
        // Typography tokens return font-size as their CSS variable value
        return ($value['fontSize'] ?? $value['value'] ?? null);
    }

    private function resolveBorderValue(array $value): ?string
    {
        $width = $value['width'] ?? '1px';
        $style = $value['style'] ?? 'solid';
        $color = $value['color'] ?? '#000';

        return "{$width} {$style} {$color}";
    }

    /**
     * Seed default design tokens.
     */
    public function seedDefaults(): void
    {
        $defaults = [
            // Colors
            ['name' => 'Primary', 'slug' => 'color-primary', 'category' => 'color', 'value' => ['hex' => '#4f46e5'], 'order' => 1],
            ['name' => 'Primary Light', 'slug' => 'color-primary-light', 'category' => 'color', 'value' => ['hex' => '#818cf8'], 'order' => 2],
            ['name' => 'Primary Dark', 'slug' => 'color-primary-dark', 'category' => 'color', 'value' => ['hex' => '#3730a3'], 'order' => 3],
            ['name' => 'Secondary', 'slug' => 'color-secondary', 'category' => 'color', 'value' => ['hex' => '#0ea5e9'], 'order' => 4],
            ['name' => 'Accent', 'slug' => 'color-accent', 'category' => 'color', 'value' => ['hex' => '#f59e0b'], 'order' => 5],
            ['name' => 'Success', 'slug' => 'color-success', 'category' => 'color', 'value' => ['hex' => '#10b981'], 'order' => 6],
            ['name' => 'Warning', 'slug' => 'color-warning', 'category' => 'color', 'value' => ['hex' => '#f59e0b'], 'order' => 7],
            ['name' => 'Danger', 'slug' => 'color-danger', 'category' => 'color', 'value' => ['hex' => '#ef4444'], 'order' => 8],
            ['name' => 'Text', 'slug' => 'color-text', 'category' => 'color', 'value' => ['hex' => '#1e293b'], 'order' => 9],
            ['name' => 'Text Light', 'slug' => 'color-text-light', 'category' => 'color', 'value' => ['hex' => '#64748b'], 'order' => 10],
            ['name' => 'Background', 'slug' => 'color-background', 'category' => 'color', 'value' => ['hex' => '#ffffff'], 'order' => 11],
            ['name' => 'Surface', 'slug' => 'color-surface', 'category' => 'color', 'value' => ['hex' => '#f8fafc'], 'order' => 12],

            // Typography
            ['name' => 'Heading 1', 'slug' => 'typo-h1', 'category' => 'typography', 'value' => ['fontSize' => '2.5rem', 'fontWeight' => '700', 'lineHeight' => '1.2', 'fontFamily' => 'inherit'], 'order' => 1],
            ['name' => 'Heading 2', 'slug' => 'typo-h2', 'category' => 'typography', 'value' => ['fontSize' => '2rem', 'fontWeight' => '700', 'lineHeight' => '1.25', 'fontFamily' => 'inherit'], 'order' => 2],
            ['name' => 'Heading 3', 'slug' => 'typo-h3', 'category' => 'typography', 'value' => ['fontSize' => '1.5rem', 'fontWeight' => '600', 'lineHeight' => '1.3', 'fontFamily' => 'inherit'], 'order' => 3],
            ['name' => 'Body', 'slug' => 'typo-body', 'category' => 'typography', 'value' => ['fontSize' => '1rem', 'fontWeight' => '400', 'lineHeight' => '1.6', 'fontFamily' => 'inherit'], 'order' => 4],
            ['name' => 'Small', 'slug' => 'typo-small', 'category' => 'typography', 'value' => ['fontSize' => '0.875rem', 'fontWeight' => '400', 'lineHeight' => '1.5', 'fontFamily' => 'inherit'], 'order' => 5],

            // Spacing
            ['name' => 'XS', 'slug' => 'spacing-xs', 'category' => 'spacing', 'value' => ['value' => '0.25', 'unit' => 'rem'], 'order' => 1],
            ['name' => 'SM', 'slug' => 'spacing-sm', 'category' => 'spacing', 'value' => ['value' => '0.5', 'unit' => 'rem'], 'order' => 2],
            ['name' => 'MD', 'slug' => 'spacing-md', 'category' => 'spacing', 'value' => ['value' => '1', 'unit' => 'rem'], 'order' => 3],
            ['name' => 'LG', 'slug' => 'spacing-lg', 'category' => 'spacing', 'value' => ['value' => '2', 'unit' => 'rem'], 'order' => 4],
            ['name' => 'XL', 'slug' => 'spacing-xl', 'category' => 'spacing', 'value' => ['value' => '4', 'unit' => 'rem'], 'order' => 5],

            // Shadows
            ['name' => 'Small', 'slug' => 'shadow-sm', 'category' => 'shadow', 'value' => ['value' => '0 1px 2px 0 rgba(0,0,0,0.05)'], 'order' => 1],
            ['name' => 'Medium', 'slug' => 'shadow-md', 'category' => 'shadow', 'value' => ['value' => '0 4px 6px -1px rgba(0,0,0,0.1)'], 'order' => 2],
            ['name' => 'Large', 'slug' => 'shadow-lg', 'category' => 'shadow', 'value' => ['value' => '0 10px 15px -3px rgba(0,0,0,0.1)'], 'order' => 3],

            // Borders
            ['name' => 'Default', 'slug' => 'border-default', 'category' => 'border', 'value' => ['width' => '1px', 'style' => 'solid', 'color' => '#e2e8f0'], 'order' => 1],
            ['name' => 'Radius SM', 'slug' => 'border-radius-sm', 'category' => 'border', 'value' => ['value' => '0.25rem'], 'order' => 2],
            ['name' => 'Radius MD', 'slug' => 'border-radius-md', 'category' => 'border', 'value' => ['value' => '0.5rem'], 'order' => 3],
            ['name' => 'Radius LG', 'slug' => 'border-radius-lg', 'category' => 'border', 'value' => ['value' => '1rem'], 'order' => 4],

            // Buttons
            ['name' => 'Primary Button', 'slug' => 'btn-primary-bg', 'category' => 'button', 'value' => ['value' => '#4f46e5'], 'order' => 1],
            ['name' => 'Primary Button Text', 'slug' => 'btn-primary-text', 'category' => 'button', 'value' => ['value' => '#ffffff'], 'order' => 2],
            ['name' => 'Secondary Button', 'slug' => 'btn-secondary-bg', 'category' => 'button', 'value' => ['value' => '#e2e8f0'], 'order' => 3],
            ['name' => 'Secondary Button Text', 'slug' => 'btn-secondary-text', 'category' => 'button', 'value' => ['value' => '#1e293b'], 'order' => 4],
        ];

        foreach ($defaults as $token) {
            DesignToken::firstOrCreate(
                ['slug' => $token['slug']],
                $token,
            );
        }

        $this->clearCache();
    }

    /**
     * Clear the CSS variables cache.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
