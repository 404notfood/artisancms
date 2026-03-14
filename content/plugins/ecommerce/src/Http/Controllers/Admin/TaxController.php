<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Ecommerce\Models\TaxRule;
use Ecommerce\Services\TaxService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaxController extends Controller
{
    public function __construct(
        private readonly TaxService $taxService,
    ) {}

    /**
     * Display the list of tax rules.
     */
    public function index(): Response
    {
        $rules = $this->taxService->getRules();

        return Inertia::render('Admin/Ecommerce/Tax/Index', [
            'rules' => $rules,
        ]);
    }

    /**
     * Create a new tax rule.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'country_code' => 'nullable|string|size:2',
            'region' => 'nullable|string|max:100',
            'rate' => 'required|numeric|min:0|max:100',
            'priority' => 'integer|min:0',
            'compound' => 'boolean',
            'active' => 'boolean',
        ]);

        $validated['priority'] = $validated['priority'] ?? 0;
        $validated['compound'] = $validated['compound'] ?? false;
        $validated['active'] = $validated['active'] ?? true;

        $this->taxService->createRule($validated);

        return redirect()
            ->route('admin.shop.tax.index')
            ->with('success', 'Regle de taxe creee avec succes.');
    }

    /**
     * Update an existing tax rule.
     */
    public function update(Request $request, TaxRule $taxRule): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'country_code' => 'nullable|string|size:2',
            'region' => 'nullable|string|max:100',
            'rate' => 'required|numeric|min:0|max:100',
            'priority' => 'integer|min:0',
            'compound' => 'boolean',
            'active' => 'boolean',
        ]);

        $this->taxService->updateRule($taxRule, $validated);

        return redirect()
            ->route('admin.shop.tax.index')
            ->with('success', 'Regle de taxe mise a jour avec succes.');
    }

    /**
     * Delete a tax rule.
     */
    public function destroy(TaxRule $taxRule): RedirectResponse
    {
        $this->taxService->deleteRule($taxRule);

        return redirect()
            ->route('admin.shop.tax.index')
            ->with('success', 'Regle de taxe supprimee avec succes.');
    }
}
