<?php

declare(strict_types=1);

namespace App\CMS\Themes;

use App\Models\CmsTheme;

class ThemeCssGenerator
{
    /**
     * CSS variable prefix per section.
     */
    private const SECTION_PREFIXES = [
        'colors' => '--color-',
        'fonts' => '--font-',
        'layout' => '--',
        'header' => '--header-',
        'footer' => '--footer-',
        'ecommerce' => '--ecommerce-',
        'global_styles' => '--global-',
        'spacing' => '--spacing-',
    ];

    /**
     * Field types that should NOT produce CSS variables.
     */
    private const NON_CSS_TYPES = ['boolean', 'image', 'text'];

    /**
     * Semantic mappings for values that need CSS transformation.
     */
    private const SEMANTIC_MAPPINGS = [
        'spacing_scale' => [
            '0.75' => '0.75', '0.875' => '0.875', '1' => '1',
            '1.125' => '1.125', '1.25' => '1.25',
        ],
        'shadow_intensity' => [
            'none' => 'none',
            'light' => '0 1px 3px 0 rgb(0 0 0 / 0.05)',
            'medium' => '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            'strong' => '0 10px 15px -3px rgb(0 0 0 / 0.15)',
        ],
        'button_style' => [
            'square' => '0', 'rounded' => '0.375rem', 'pill' => '9999px',
        ],
        'letter_spacing' => [
            '-0.025em' => '-0.025em', '0' => '0', '0.025em' => '0.025em',
            '0.05em' => '0.05em', '0.1em' => '0.1em',
        ],
    ];

    /**
     * Generate CSS custom properties from a theme's customization config and overrides.
     *
     * @param array<string, mixed> $customization The manifest customization schema
     * @param array<string, mixed> $overrides     DB-stored overrides
     */
    public function generate(array $customization, array $overrides): string
    {
        $variables = [];

        foreach ($customization as $section => $fields) {
            if (!is_array($fields)) {
                continue;
            }

            $prefix = self::SECTION_PREFIXES[$section] ?? "--{$section}-";

            foreach ($fields as $key => $definition) {
                if (!is_array($definition)) {
                    continue;
                }

                $fieldType = $definition['type'] ?? 'text';
                if (in_array($fieldType, self::NON_CSS_TYPES, true)) {
                    continue;
                }

                $value = self::resolveFieldValue($section, $key, $definition, $overrides);
                if ($value === null || $value === '') {
                    continue;
                }

                if (isset(self::SEMANTIC_MAPPINGS[$key][$value])) {
                    $value = self::SEMANTIC_MAPPINGS[$key][$value];
                }

                $cssKey = $prefix . str_replace('_', '-', $key);
                $variables[$cssKey] = (string) $value;
            }
        }

        if (empty($variables)) {
            return '';
        }

        $lines = array_map(
            fn (string $prop, string $val) => "    {$prop}: {$val};",
            array_keys($variables),
            array_values($variables),
        );

        return ":root {\n" . implode("\n", $lines) . "\n}";
    }

    /**
     * Get all customization values (including non-CSS like booleans, text, images).
     *
     * @param array<string, mixed> $customization The manifest customization schema
     * @param array<string, mixed> $overrides     DB-stored overrides
     * @return array<string, mixed>
     */
    public function getAllValues(array $customization, array $overrides): array
    {
        $result = [];

        foreach ($customization as $section => $fields) {
            if (!is_array($fields)) {
                continue;
            }
            foreach ($fields as $key => $definition) {
                if (!is_array($definition)) {
                    continue;
                }
                $result["{$section}.{$key}"] = self::resolveFieldValue($section, $key, $definition, $overrides) ?? '';
            }
        }

        return $result;
    }

    /**
     * Resolve a single field value from overrides or definition default.
     */
    public static function resolveFieldValue(string $section, string $key, array $definition, array $overrides): mixed
    {
        $dotKey = "{$section}.{$key}";

        return $overrides[$dotKey]
            ?? (isset($overrides[$section]) && is_array($overrides[$section]) ? ($overrides[$section][$key] ?? null) : null)
            ?? $definition['default']
            ?? null;
    }
}
