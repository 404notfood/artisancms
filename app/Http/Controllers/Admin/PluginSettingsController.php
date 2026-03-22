<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PluginService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PluginSettingsController extends Controller
{
    public function __construct(
        private readonly PluginService $pluginService,
    ) {}

    /**
     * Display plugin settings page.
     */
    public function show(string $slug): Response
    {
        $plugin = $this->pluginService->getBySlug($slug);
        $settings = $this->pluginService->getSettings($slug);
        $schema = $this->pluginService->getSettingsSchema($slug);

        return Inertia::render('Admin/Plugins/Settings', [
            'plugin' => $plugin,
            'settings' => $settings,
            'schema' => $schema,
        ]);
    }

    /**
     * Save plugin settings.
     */
    public function update(Request $request, string $slug): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        $this->pluginService->saveSettings($slug, $validated['settings']);

        return redirect()
            ->route('admin.plugins.settings', $slug)
            ->with('success', __('cms.plugins.settings_saved'));
    }
}
