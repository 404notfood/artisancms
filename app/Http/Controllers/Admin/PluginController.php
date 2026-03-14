<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\CMS\Plugins\PluginManager;
use App\Models\CmsPlugin;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PluginController extends Controller
{
    public function __construct(private readonly PluginManager $pluginManager) {}

    public function index(): Response
    {
        // Discover filesystem plugins and ensure they are all registered in DB
        $discovered = $this->pluginManager->discover();
        foreach ($discovered as $slug => $manifest) {
            $this->pluginManager->install($slug);
        }

        $dbPlugins = CmsPlugin::all()->keyBy('slug');

        $plugins = collect($discovered)->map(function (array $plugin, string $slug) use ($dbPlugins) {
            $db = $dbPlugins->get($slug);

            return [
                'slug' => $slug,
                'name' => $plugin['name'] ?? $slug,
                'version' => $plugin['version'] ?? '1.0.0',
                'description' => $plugin['description'] ?? '',
                'author' => is_array($plugin['author'] ?? null)
                    ? ($plugin['author']['name'] ?? '')
                    : ($plugin['author'] ?? ''),
                'enabled' => $db?->enabled ?? false,
                'settings' => $plugin['settings'] ?? [],
            ];
        })->values();

        return Inertia::render('Admin/Plugins/Index', [
            'plugins' => $plugins,
        ]);
    }

    public function enable(string $slug): RedirectResponse
    {
        $this->pluginManager->enable($slug);

        $plugin = CmsPlugin::where('slug', $slug)->first();
        $name = $plugin?->name ?? $slug;

        return redirect()->back()->with('success', "Le plugin « {$name} » a été activé avec succès.");
    }

    public function disable(string $slug): RedirectResponse
    {
        $this->pluginManager->disable($slug);

        $plugin = CmsPlugin::where('slug', $slug)->first();
        $name = $plugin?->name ?? $slug;

        return redirect()->back()->with('success', "Le plugin « {$name} » a été désactivé avec succès.");
    }
}
