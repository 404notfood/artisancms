<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use App\Models\DesignToken;
use App\Models\EmailTemplate;
use App\Models\Menu;
use App\Models\Role;
use App\Models\Setting;
use App\Models\WidgetArea;
use Illuminate\Support\Facades\DB;

class ConfigExportService
{
    private const SENSITIVE_PATTERNS = ['/password/i', '/secret/i', '/\bkey\b/i', '/token/i'];
    private const SCHEMA_VERSION = '1.0';

    /**
     * Export the full site configuration.
     *
     * @return array<string, mixed>
     */
    public function export(): array
    {
        return [
            '_meta' => [
                'schema_version' => self::SCHEMA_VERSION,
                'cms_version' => config('cms.version', '1.0.0'),
                'exported_at' => now()->toIso8601String(),
            ],
            'settings' => $this->exportSettings(),
            'roles' => $this->exportRoles(),
            'menus' => $this->exportMenus(),
            'active_theme' => $this->exportActiveTheme(),
            'active_plugins' => CmsPlugin::where('enabled', true)->pluck('slug')->all(),
            'design_tokens' => $this->exportDesignTokens(),
            'email_templates' => $this->exportEmailTemplates(),
            'widget_areas' => $this->exportWidgetAreas(),
        ];
    }

    public function exportToJson(): string
    {
        return (string) json_encode($this->export(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Import configuration. Options: mode = 'merge' (default) | 'replace'.
     *
     * @return array<string, int> Counts per section.
     */
    public function import(array $data, array $options = []): array
    {
        $mode = $options['mode'] ?? 'merge';
        $summary = [];

        DB::transaction(function () use ($data, $mode, &$summary): void {
            $map = [
                'settings' => 'importSettings', 'roles' => 'importRoles',
                'menus' => 'importMenus', 'active_theme' => 'importActiveTheme',
                'active_plugins' => 'importActivePlugins', 'design_tokens' => 'importDesignTokens',
                'email_templates' => 'importEmailTemplates', 'widget_areas' => 'importWidgetAreas',
            ];
            foreach ($map as $key => $method) {
                if (isset($data[$key])) {
                    $summary[$key] = $this->{$method}($data[$key], $mode);
                }
            }
        });

        return $summary;
    }

    public function importFromJson(string $json, array $options = []): array
    {
        $data = json_decode($json, true);
        if (!is_array($data)) {
            throw new \InvalidArgumentException('Invalid JSON provided.');
        }
        return $this->import($data, $options);
    }

    // ─── Export helpers ──────────────────────────────────

    private function exportSettings(): array
    {
        return Setting::all()
            ->filter(fn (Setting $s) => !$this->isSensitiveKey($s->key))
            ->map(fn (Setting $s) => [
                'group' => $s->group, 'key' => $s->key, 'value' => $s->value,
                'type' => $s->type, 'is_public' => $s->is_public,
            ])->values()->all();
    }

    private function exportRoles(): array
    {
        return Role::all()->map(fn (Role $r) => [
            'name' => $r->name, 'slug' => $r->slug,
            'permissions' => $r->permissions, 'is_system' => $r->is_system,
        ])->all();
    }

    private function exportMenus(): array
    {
        return Menu::with('items')->get()->map(fn (Menu $m) => [
            'name' => $m->name, 'slug' => $m->slug, 'location' => $m->location,
            'items' => $m->items->map(fn ($i) => [
                'label' => $i->label, 'type' => $i->type, 'url' => $i->url,
                'target' => $i->target, 'css_class' => $i->css_class, 'icon' => $i->icon,
                'order' => $i->order, 'parent_id' => $i->parent_id,
                'is_mega' => $i->is_mega, 'mega_columns' => $i->mega_columns,
                'mega_content' => $i->mega_content,
            ])->all(),
        ])->all();
    }

    private function exportActiveTheme(): ?array
    {
        $theme = CmsTheme::active()->first();
        return $theme ? ['slug' => $theme->slug, 'customizations' => $theme->customizations] : null;
    }

    private function exportDesignTokens(): array
    {
        return DesignToken::ordered()->get()->map(fn (DesignToken $t) => [
            'name' => $t->name, 'slug' => $t->slug, 'category' => $t->category,
            'value' => $t->value, 'order' => $t->order,
        ])->all();
    }

    private function exportEmailTemplates(): array
    {
        return EmailTemplate::all()->map(fn (EmailTemplate $t) => [
            'slug' => $t->slug, 'name' => $t->name, 'subject' => $t->subject,
            'body_html' => $t->body_html, 'body_text' => $t->body_text,
            'category' => $t->category, 'enabled' => $t->enabled,
        ])->all();
    }

    private function exportWidgetAreas(): array
    {
        return WidgetArea::with('widgets')->get()->map(fn (WidgetArea $wa) => [
            'name' => $wa->name, 'slug' => $wa->slug, 'description' => $wa->description,
            'widgets' => $wa->widgets->map(fn ($w) => [
                'type' => $w->type, 'title' => $w->title, 'config' => $w->config,
                'order' => $w->order, 'active' => $w->active,
            ])->all(),
        ])->all();
    }

    // ─── Import helpers ─────────────────────────────────

    private function importSettings(array $settings, string $mode): int
    {
        if ($mode === 'replace') {
            Setting::all()->filter(fn (Setting $s) => !$this->isSensitiveKey($s->key))->each->delete();
        }
        $count = 0;
        foreach ($settings as $s) {
            if ($this->isSensitiveKey($s['key'] ?? '')) {
                continue;
            }
            Setting::updateOrCreate(
                ['group' => $s['group'], 'key' => $s['key']],
                ['value' => $s['value'] ?? null, 'type' => $s['type'] ?? 'string', 'is_public' => $s['is_public'] ?? false],
            );
            $count++;
        }
        return $count;
    }

    private function importRoles(array $roles, string $mode): int
    {
        if ($mode === 'replace') {
            Role::where('is_system', false)->delete();
        }
        $count = 0;
        foreach ($roles as $r) {
            Role::updateOrCreate(
                ['slug' => $r['slug']],
                ['name' => $r['name'], 'permissions' => $r['permissions'] ?? [], 'is_system' => $r['is_system'] ?? false],
            );
            $count++;
        }
        return $count;
    }

    private function importMenus(array $menus, string $mode): int
    {
        if ($mode === 'replace') {
            Menu::query()->each(function (Menu $m): void { $m->items()->delete(); $m->delete(); });
        }
        $count = 0;
        foreach ($menus as $md) {
            $menu = Menu::updateOrCreate(
                ['slug' => $md['slug']],
                ['name' => $md['name'], 'location' => $md['location'] ?? null],
            );
            $menu->items()->delete();
            foreach ($md['items'] ?? [] as $item) {
                unset($item['parent_id']);
                $menu->items()->create($item);
            }
            $count++;
        }
        return $count;
    }

    private function importActiveTheme(array $themeData, string $mode = 'merge'): int
    {
        $theme = CmsTheme::where('slug', $themeData['slug'])->first();
        if (!$theme) {
            return 0;
        }
        CmsTheme::query()->update(['active' => false]);
        $theme->update([
            'active' => true,
            'customizations' => $themeData['customizations'] ?? $theme->customizations,
        ]);
        return 1;
    }

    private function importActivePlugins(array $slugs, string $mode = 'merge'): int
    {
        $count = 0;
        foreach ($slugs as $slug) {
            $count += CmsPlugin::where('slug', $slug)->update(['enabled' => true]);
        }
        return $count;
    }

    private function importDesignTokens(array $tokens, string $mode): int
    {
        if ($mode === 'replace') {
            DesignToken::query()->delete();
        }
        $count = 0;
        foreach ($tokens as $t) {
            DesignToken::updateOrCreate(
                ['slug' => $t['slug']],
                ['name' => $t['name'], 'category' => $t['category'], 'value' => $t['value'], 'order' => $t['order'] ?? 0],
            );
            $count++;
        }
        return $count;
    }

    private function importEmailTemplates(array $templates, string $mode): int
    {
        $count = 0;
        foreach ($templates as $t) {
            EmailTemplate::updateOrCreate(
                ['slug' => $t['slug']],
                [
                    'name' => $t['name'] ?? $t['slug'], 'subject' => $t['subject'] ?? '',
                    'body_html' => $t['body_html'] ?? '', 'body_text' => $t['body_text'] ?? '',
                    'category' => $t['category'] ?? 'notification', 'enabled' => $t['enabled'] ?? true,
                ],
            );
            $count++;
        }
        return $count;
    }

    private function importWidgetAreas(array $areas, string $mode): int
    {
        if ($mode === 'replace') {
            WidgetArea::query()->each(function (WidgetArea $wa): void { $wa->widgets()->delete(); $wa->delete(); });
        }
        $count = 0;
        foreach ($areas as $ad) {
            $area = WidgetArea::updateOrCreate(
                ['slug' => $ad['slug']],
                ['name' => $ad['name'], 'description' => $ad['description'] ?? null],
            );
            $area->widgets()->delete();
            foreach ($ad['widgets'] ?? [] as $w) {
                $area->widgets()->create($w);
            }
            $count++;
        }
        return $count;
    }

    private function isSensitiveKey(string $key): bool
    {
        foreach (self::SENSITIVE_PATTERNS as $pattern) {
            if (preg_match($pattern, $key)) {
                return true;
            }
        }
        return false;
    }
}
