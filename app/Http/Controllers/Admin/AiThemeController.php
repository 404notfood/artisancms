<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\CMS\Themes\ThemeManager;
use App\Http\Controllers\Controller;
use App\Services\AiThemeGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AiThemeController extends Controller
{
    public function __construct(
        private readonly AiThemeGeneratorService $generator,
        private readonly ThemeManager $themeManager,
    ) {}

    /**
     * Show the AI Theme Generator page.
     */
    public function index(): Response
    {
        $activeTheme = $this->themeManager->getActive();

        return Inertia::render('Admin/AiTheme/Index', [
            'activeTheme' => $activeTheme ? [
                'slug' => $activeTheme->slug,
                'name' => $activeTheme->name,
            ] : null,
            'industries' => self::industries(),
            'styles' => self::styles(),
        ]);
    }

    /**
     * Generate a theme from AI prompt.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'min:10', 'max:1000'],
            'industry' => ['nullable', 'string', 'max:50'],
            'style' => ['nullable', 'string', 'max:50'],
            'primary_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        try {
            $result = $this->generator->generate(
                prompt: $validated['prompt'],
                options: array_filter([
                    'industry' => $validated['industry'] ?? null,
                    'style' => $validated['style'] ?? null,
                    'primary_color' => $validated['primary_color'] ?? null,
                    'secondary_color' => $validated['secondary_color'] ?? null,
                ]),
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Apply a generated theme to the active theme.
     */
    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'theme_slug' => ['required', 'string', 'max:100'],
            'generated_data' => ['required', 'array'],
            'generated_data.colors' => ['required', 'array'],
            'generated_data.fonts' => ['required', 'array'],
        ]);

        try {
            $this->generator->applyToTheme(
                themeSlug: $validated['theme_slug'],
                generatedData: $validated['generated_data'],
            );

            return response()->json([
                'success' => true,
                'message' => __('cms.ai_theme.applied'),
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Available industry presets.
     *
     * @return list<array{value: string, label: string}>
     */
    private static function industries(): array
    {
        return [
            ['value' => 'restaurant', 'label' => 'Restaurant / Food'],
            ['value' => 'agency', 'label' => 'Agence / Studio'],
            ['value' => 'portfolio', 'label' => 'Portfolio / Freelance'],
            ['value' => 'ecommerce', 'label' => 'E-commerce / Boutique'],
            ['value' => 'blog', 'label' => 'Blog / Magazine'],
            ['value' => 'saas', 'label' => 'SaaS / Startup'],
            ['value' => 'medical', 'label' => 'Medical / Sante'],
            ['value' => 'education', 'label' => 'Education / Formation'],
            ['value' => 'realestate', 'label' => 'Immobilier'],
            ['value' => 'nonprofit', 'label' => 'Association / ONG'],
        ];
    }

    /**
     * Available style presets.
     *
     * @return list<array{value: string, label: string}>
     */
    private static function styles(): array
    {
        return [
            ['value' => 'modern', 'label' => 'Moderne & Epure'],
            ['value' => 'classic', 'label' => 'Classique & Elegant'],
            ['value' => 'minimal', 'label' => 'Minimaliste'],
            ['value' => 'bold', 'label' => 'Audacieux & Colore'],
            ['value' => 'corporate', 'label' => 'Corporate / Pro'],
            ['value' => 'creative', 'label' => 'Creatif & Artistique'],
        ];
    }
}
