<?php

declare(strict_types=1);

namespace AiAssistant\Http\Controllers;

use AiAssistant\Http\Requests\GenerateAltTextRequest;
use AiAssistant\Http\Requests\GenerateSeoRequest;
use AiAssistant\Http\Requests\GenerateTextRequest;
use AiAssistant\Http\Requests\ImproveTextRequest;
use AiAssistant\Models\AiUsageLog;
use AiAssistant\Services\AiService;
use AiAssistant\Services\UsageTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController
{
    public function __construct(
        protected AiService $aiService,
        protected UsageTracker $usageTracker,
    ) {}

    /**
     * POST /api/ai/generate
     * Generer du contenu a partir d'un prompt.
     */
    public function generate(GenerateTextRequest $request): JsonResponse
    {
        $result = $this->aiService->generateText(
            prompt: $request->validated('prompt'),
            context: $request->validated('context', []),
            maxTokens: $request->validated('max_tokens', 1024),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/improve
     * Ameliorer un texte existant selon une instruction.
     */
    public function improve(ImproveTextRequest $request): JsonResponse
    {
        $result = $this->aiService->improveText(
            text: $request->validated('text'),
            instruction: $request->validated('instruction'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/seo
     * Generer meta title + description + mots-cles.
     */
    public function seo(GenerateSeoRequest $request): JsonResponse
    {
        $result = $this->aiService->generateSeoMeta(
            pageContent: $request->validated('page_content'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/alt-text
     * Generer un alt text pour une image via l'API vision.
     */
    public function altText(GenerateAltTextRequest $request): JsonResponse
    {
        $result = $this->aiService->generateAltText(
            imageUrl: $request->validated('image_url'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/translate
     * Traduire un texte vers une langue cible.
     */
    public function translate(Request $request): JsonResponse
    {
        $request->validate([
            'text' => ['required', 'string', 'max:10000'],
            'target_locale' => ['required', 'string', 'size:2'],
        ]);

        $result = $this->aiService->translateContent(
            text: $request->input('text'),
            targetLocale: $request->input('target_locale'),
        );

        return response()->json($result);
    }

    /**
     * POST /api/ai/summarize
     * Resumer un texte long.
     */
    public function summarize(Request $request): JsonResponse
    {
        $request->validate([
            'text' => ['required', 'string', 'max:10000'],
            'max_length' => ['sometimes', 'integer', 'min:50', 'max:1000'],
        ]);

        $result = $this->aiService->summarize(
            text: $request->input('text'),
            maxLength: (int) $request->input('max_length', 200),
        );

        return response()->json($result);
    }

    /**
     * GET /api/ai/usage
     * Retourne l'utilisation actuelle de l'utilisateur connecte.
     */
    public function usage(): JsonResponse
    {
        $userId = auth()->id();
        $settings = $this->aiService->getSettings();
        $monthlyLimit = (int) ($settings['monthly_token_limit'] ?? 500000);
        $dailyLimit = (int) ($settings['per_user_daily_token_limit'] ?? 50000);

        return response()->json([
            'tokens_used_month' => AiUsageLog::monthlyTokensForUser($userId),
            'tokens_limit_month' => $monthlyLimit,
            'tokens_remaining_month' => $this->usageTracker->remainingMonthlyTokens($userId, $monthlyLimit),
            'tokens_used_today' => (int) AiUsageLog::where('user_id', $userId)
                ->where('created_at', '>=', now()->startOfDay())
                ->sum('total_tokens'),
            'tokens_limit_today' => $dailyLimit,
        ]);
    }

    /**
     * GET /api/ai/estimate
     * Estimation du cout avant generation.
     */
    public function estimate(Request $request): JsonResponse
    {
        $request->validate([
            'text' => ['required', 'string'],
        ]);

        $settings = $this->aiService->getSettings();
        $model = $settings['model'] ?? 'gpt-4o-mini';

        return response()->json(
            $this->usageTracker->estimateCost($request->input('text'), $model)
        );
    }
}
