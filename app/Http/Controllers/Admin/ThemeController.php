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

class ThemeController extends Controller
{
    public function __construct(private readonly ThemeManager $themeManager) {}

    public function index(): Response
    {
        // Ensure themes are loaded from filesystem
        $this->themeManager->loadThemes();

        $dbThemes = CmsTheme::orderBy('name')->get();

        $themes = $dbThemes->map(function (CmsTheme $theme) {
            $config = $this->themeManager->getThemeConfig($theme->slug);

            return [
                'slug' => $theme->slug,
                'name' => $theme->name,
                'version' => $theme->version,
                'description' => $theme->description ?? '',
                'author' => $theme->author ?? '',
                'active' => $theme->active,
                'customization' => $config['customization'] ?? [],
                'active_customizations' => $theme->customizations ?? [],
            ];
        })->values();

        return Inertia::render('Admin/Themes/Index', [
            'themes' => $themes,
        ]);
    }

    public function activate(string $slug): RedirectResponse
    {
        $this->themeManager->activate($slug);

        return redirect()->back()->with('success', __('cms.themes.activated'));
    }

    public function customize(Request $request, string $slug): RedirectResponse
    {
        $theme = CmsTheme::where('slug', $slug)->firstOrFail();
        $theme->update(['customizations' => $request->input('customizations', [])]);

        return redirect()->back()->with('success', __('cms.themes.customized'));
    }
}
