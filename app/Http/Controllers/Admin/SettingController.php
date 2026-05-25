<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SettingRequest;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
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
        $this->settingService->ensureDefaultSettings();

        $groups = ['general', 'seo', 'mail', 'content', 'media', 'maintenance', 'dashboard', 'security', 'analytics'];

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

    /**
     * Send a quick SMTP test message to the current user.
     */
    public function testMail(Request $request): JsonResponse
    {
        $email = $request->user()?->email;

        if (!$email) {
            return response()->json(['success' => false, 'message' => 'Aucun email utilisateur disponible.'], 422);
        }

        Config::set('mail.default', (string) $this->settingService->get('mail.mailer', config('mail.default', 'smtp')));
        Config::set('mail.from.address', (string) $this->settingService->get('mail.from_email', config('mail.from.address')));
        Config::set('mail.from.name', (string) $this->settingService->get('mail.from_name', config('mail.from.name')));
        Config::set('mail.mailers.smtp.host', (string) $this->settingService->get('mail.host', config('mail.mailers.smtp.host')));
        Config::set('mail.mailers.smtp.port', (int) $this->settingService->get('mail.port', config('mail.mailers.smtp.port')));
        Config::set('mail.mailers.smtp.username', $this->settingService->get('mail.username', config('mail.mailers.smtp.username')));
        Config::set('mail.mailers.smtp.password', $this->settingService->get('mail.password', config('mail.mailers.smtp.password')));
        Config::set('mail.mailers.smtp.encryption', $this->settingService->get('mail.encryption', config('mail.mailers.smtp.encryption')));

        try {
            Mail::raw('Email de test envoye depuis ArtisanCMS.', function ($message) use ($email): void {
                $message->to($email)->subject('Test email ArtisanCMS');
            });
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'message' => "Email de test envoye a {$email}."]);
    }

    /**
     * Clear application caches from the settings screen.
     */
    public function clearCache(): JsonResponse
    {
        Cache::flush();
        Artisan::call('view:clear');
        Artisan::call('route:clear');
        Artisan::call('config:clear');

        return response()->json(['success' => true, 'message' => 'Cache vide.']);
    }
}
