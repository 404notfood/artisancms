<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DesignTokenRequest;
use App\Models\DesignToken;
use App\Services\DesignTokenService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DesignTokenController extends Controller
{
    public function __construct(
        private readonly DesignTokenService $designTokenService,
    ) {}

    /**
     * Display the StyleBook / design tokens page.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/StyleBook/Index', [
            'tokens' => $this->designTokenService->getAllGrouped(),
            'categories' => [
                ['key' => 'color', 'label' => __('cms.design_tokens.categories.color')],
                ['key' => 'typography', 'label' => __('cms.design_tokens.categories.typography')],
                ['key' => 'button', 'label' => __('cms.design_tokens.categories.button')],
                ['key' => 'spacing', 'label' => __('cms.design_tokens.categories.spacing')],
                ['key' => 'shadow', 'label' => __('cms.design_tokens.categories.shadow')],
                ['key' => 'border', 'label' => __('cms.design_tokens.categories.border')],
            ],
        ]);
    }

    /**
     * Create a new design token.
     */
    public function store(DesignTokenRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->designTokenService->create($validated);

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', __('cms.design_tokens.created'));
    }

    /**
     * Update an existing design token.
     */
    public function update(DesignTokenRequest $request, DesignToken $designToken): RedirectResponse
    {
        $validated = $request->validated();

        $this->designTokenService->update($designToken, $validated);

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', __('cms.design_tokens.updated'));
    }

    /**
     * Delete a design token.
     */
    public function destroy(DesignToken $designToken): RedirectResponse
    {
        $this->designTokenService->delete($designToken);

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', __('cms.design_tokens.deleted'));
    }

    /**
     * Seed default tokens.
     */
    public function seedDefaults(): RedirectResponse
    {
        $this->designTokenService->seedDefaults();

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', __('cms.design_tokens.seeded'));
    }

    /**
     * Get CSS variables as JSON (for API / front injection).
     */
    public function css(): \Illuminate\Http\Response
    {
        $css = $this->designTokenService->generateCssVariables();

        return response($css, 200, [
            'Content-Type' => 'text/css',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
