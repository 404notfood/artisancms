<?php

declare(strict_types=1);

namespace AiAssistant\Http\Controllers;

use AiAssistant\Services\UsageTracker;
use App\Models\CmsPlugin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AiSettingsController
{
    public function __construct(
        protected UsageTracker $usageTracker,
    ) {}

    /**
     * GET /admin/ai/settings
     * Show the AI assistant settings page with usage stats.
     */
    public function index(): Response
    {
        $plugin = CmsPlugin::where('slug', 'ai-assistant')->first();
        $settings = $plugin?->settings ?? [];

        // Mask the API key for display
        $displaySettings = $settings;
        if (!empty($displaySettings['api_key'])) {
            try {
                $decrypted = decrypt($displaySettings['api_key']);
                $displaySettings['api_key_masked'] = mb_substr($decrypted, 0, 8) . '...' . mb_substr($decrypted, -4);
            } catch (\Exception $e) {
                $displaySettings['api_key_masked'] = '****';
            }
            unset($displaySettings['api_key']);
        }

        $usageStats = $this->usageTracker->getUsageStats('month');

        return Inertia::render('Admin/AiAssistant/Settings', [
            'settings' => $displaySettings,
            'usageStats' => $usageStats,
            'availableDrivers' => [
                'openai' => [
                    'label' => 'OpenAI',
                    'models' => config('ai-assistant.drivers.openai.supported_models', []),
                ],
                'anthropic' => [
                    'label' => 'Anthropic',
                    'models' => config('ai-assistant.drivers.anthropic.supported_models', []),
                ],
            ],
        ]);
    }

    /**
     * PUT /admin/ai/settings
     * Update the AI assistant plugin settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ai_driver' => ['sometimes', 'string', 'in:openai,anthropic'],
            'api_key' => ['sometimes', 'nullable', 'string', 'min:10'],
            'model' => ['sometimes', 'string', 'max:100'],
            'default_locale' => ['sometimes', 'string', 'size:2'],
            'temperature' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'monthly_token_limit' => ['sometimes', 'integer', 'min:1000'],
            'per_user_daily_token_limit' => ['sometimes', 'integer', 'min:100'],
            'enabled_features' => ['sometimes', 'array'],
            'enabled_features.*' => ['string', 'in:generate,improve,seo,alt_text,translate,summarize'],
        ]);

        $plugin = CmsPlugin::where('slug', 'ai-assistant')->firstOrFail();
        $settings = $plugin->settings ?? [];

        // Encrypt the API key if provided
        if (isset($validated['api_key']) && $validated['api_key'] !== null) {
            $validated['api_key'] = encrypt($validated['api_key']);
        } else {
            // Keep existing key if not provided
            unset($validated['api_key']);
        }

        // Merge with existing settings
        $settings = array_merge($settings, $validated);
        $plugin->settings = $settings;
        $plugin->save();

        // Clear the settings cache
        Cache::forget('ai-assistant.settings');

        return response()->json([
            'message' => __('ai-assistant::messages.settings_updated'),
        ]);
    }
}
