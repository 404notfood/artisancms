<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\CMS\Themes\ThemeManager;
use App\Models\CmsTheme;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ThemeController extends Controller
{
    public function __construct(private readonly ThemeManager $themeManager) {}

    public function index(): Response
    {
        // Ensure themes are loaded from filesystem
        $this->themeManager->loadThemes();

        $dbThemes = CmsTheme::orderBy('name')->get();
        $themesPath = config('cms.paths.themes');

        $themes = $dbThemes->map(function (CmsTheme $theme) use ($themesPath) {
            $previewPath = $themesPath . '/' . $theme->slug . '/assets/images/preview.png';
            $previewUrl  = null;

            if (file_exists($previewPath)) {
                $previewUrl = asset('content/themes/' . $theme->slug . '/assets/images/preview.png');
            }

            return [
                'slug'        => $theme->slug,
                'name'        => $theme->name,
                'version'     => $theme->version,
                'description' => $theme->description ?? '',
                'author'      => $theme->author ?? '',
                'active'      => $theme->active,
                'preview_url' => $previewUrl,
            ];
        })->values();

        return Inertia::render('Admin/Themes/Index', [
            'themes' => $themes,
        ]);
    }

    public function upload(Request $request): RedirectResponse
    {
        $request->validate([
            'theme_zip' => ['required', 'file', 'mimes:zip', 'max:51200'],
        ]);

        try {
            $slug = $this->themeManager->installFromZip($request->file('theme_zip'));

            return redirect()
                ->route('admin.themes.index')
                ->with('success', __('cms.themes.installed'));
        } catch (RuntimeException $e) {
            return redirect()
                ->route('admin.themes.index')
                ->with('error', $e->getMessage());
        }
    }

    public function destroy(string $slug): RedirectResponse
    {
        try {
            $this->themeManager->uninstall($slug);

            return redirect()
                ->route('admin.themes.index')
                ->with('success', __('cms.themes.deleted'));
        } catch (RuntimeException $e) {
            return redirect()
                ->route('admin.themes.index')
                ->with('error', $e->getMessage());
        }
    }

    public function activate(string $slug): RedirectResponse
    {
        $this->themeManager->activate($slug);

        return redirect()->back()->with('success', __('cms.themes.activated'));
    }

    public function customizePage(string $slug): Response
    {
        $theme = CmsTheme::where('slug', $slug)->firstOrFail();
        $config = $this->themeManager->getThemeConfig($slug);
        $schema = $config['customization'] ?? [];
        $saved = is_array($theme->customizations) ? $theme->customizations : [];

        // Merge defaults from manifest with saved overrides (flat dot-notation)
        $values = $this->mergeWithDefaults($schema, $saved);

        return Inertia::render('Admin/Themes/Customize', [
            'theme' => [
                'slug' => $theme->slug,
                'name' => $theme->name,
            ],
            'schema' => $schema,
            'values' => $values,
        ]);
    }

    public function customize(Request $request, string $slug): RedirectResponse
    {
        $theme = CmsTheme::where('slug', $slug)->firstOrFail();

        $customizations = $request->input('customizations', []);
        if (is_string($customizations)) {
            $customizations = json_decode($customizations, true) ?? [];
        }

        $theme->update(['customizations' => $customizations]);

        return redirect()
            ->route('admin.themes.customize.page', $slug)
            ->with('success', __('cms.themes.customized'));
    }

    /**
     * Merge manifest defaults with saved overrides into a flat dot-notation map.
     *
     * @param array<string, array<string, array{default: mixed}>> $schema
     * @param array<string, mixed> $saved
     * @return array<string, mixed>
     */
    private function mergeWithDefaults(array $schema, array $saved): array
    {
        $values = [];

        foreach ($schema as $section => $fields) {
            foreach ($fields as $key => $definition) {
                $dotKey = "{$section}.{$key}";
                $default = $definition['default'] ?? '';

                // Check flat dot-notation first, then nested format for backward compat
                if (array_key_exists($dotKey, $saved)) {
                    $values[$dotKey] = $saved[$dotKey];
                } elseif (isset($saved[$section][$key])) {
                    $values[$dotKey] = $saved[$section][$key];
                } else {
                    $values[$dotKey] = $default;
                }
            }
        }

        return $values;
    }
}
