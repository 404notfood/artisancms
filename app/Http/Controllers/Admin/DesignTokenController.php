<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DesignToken;
use App\Services\DesignTokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                ['key' => 'color', 'label' => 'Couleurs'],
                ['key' => 'typography', 'label' => 'Typographie'],
                ['key' => 'button', 'label' => 'Boutons'],
                ['key' => 'spacing', 'label' => 'Espacements'],
                ['key' => 'shadow', 'label' => 'Ombres'],
                ['key' => 'border', 'label' => 'Bordures'],
            ],
        ]);
    }

    /**
     * Create a new design token.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:cms_design_tokens,slug',
            'category' => 'required|in:color,typography,button,spacing,shadow,border',
            'value' => 'required|array',
            'order' => 'nullable|integer|min:0',
        ]);

        $this->designTokenService->create($validated);

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', 'Design token cree avec succes.');
    }

    /**
     * Update an existing design token.
     */
    public function update(Request $request, DesignToken $designToken): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:cms_design_tokens,slug,' . $designToken->id,
            'category' => 'required|in:color,typography,button,spacing,shadow,border',
            'value' => 'required|array',
            'order' => 'nullable|integer|min:0',
        ]);

        $this->designTokenService->update($designToken, $validated);

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', 'Design token mis a jour.');
    }

    /**
     * Delete a design token.
     */
    public function destroy(DesignToken $designToken): RedirectResponse
    {
        $this->designTokenService->delete($designToken);

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', 'Design token supprime.');
    }

    /**
     * Seed default tokens.
     */
    public function seedDefaults(): RedirectResponse
    {
        $this->designTokenService->seedDefaults();

        return redirect()
            ->route('admin.design-tokens.index')
            ->with('success', 'Tokens par defaut generes.');
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
