<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SettingRequest;
use App\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(
        private readonly SettingService $settingService,
    ) {}

    /**
     * Display all settings grouped by category.
     */
    public function index(): Response
    {
        $groups = ['general', 'seo', 'mail', 'content', 'media', 'maintenance', 'dashboard'];

        $settings = [];
        foreach ($groups as $group) {
            $settings[$group] = $this->settingService->getGroup($group);
        }

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'groups' => $groups,
        ]);
    }

    /**
     * Batch update settings.
     */
    public function update(SettingRequest $request): RedirectResponse
    {
        $settings = $request->validated('settings');

        foreach ($settings as $setting) {
            $this->settingService->set($setting['key'], $setting['value'] ?? null);
        }

        return redirect()
            ->back()
            ->with('success', __('cms.settings.updated'));
    }
}
