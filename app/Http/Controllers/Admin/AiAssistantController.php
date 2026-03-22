<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AiAssistantSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AiAssistantController extends Controller
{
    /**
     * Show AI assistant settings.
     * GET /admin/ai-assistant/settings
     */
    public function settings(): Response
    {
        $provider       = Setting::get('ai.provider', 'openai');
        $hasOpenaiKey   = !empty(Setting::get('ai.openai_api_key'));
        $hasAnthropicKey = !empty(Setting::get('ai.anthropic_api_key'));

        return Inertia::render('Admin/AiAssistant/Settings', [
            'provider'          => $provider,
            'is_configured'     => $hasOpenaiKey || $hasAnthropicKey,
            'has_openai_key'    => $hasOpenaiKey,
            'has_anthropic_key' => $hasAnthropicKey,
        ]);
    }

    /**
     * Save AI assistant settings.
     * POST /admin/ai-assistant/settings
     */
    public function saveSettings(AiAssistantSettingsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Setting::set('ai.provider', $validated['provider']);

        if (!empty($validated['openai_api_key'])) {
            Setting::set('ai.openai_api_key', encrypt($validated['openai_api_key']));
        }

        if (!empty($validated['anthropic_api_key'])) {
            Setting::set('ai.anthropic_api_key', encrypt($validated['anthropic_api_key']));
        }

        return back()->with('success', __('cms.ai_assistant.settings_saved'));
    }
}
