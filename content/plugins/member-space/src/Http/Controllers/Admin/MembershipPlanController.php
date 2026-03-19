<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Models\MembershipPlan;

class MembershipPlanController extends Controller
{
    public function index(): Response
    {
        $plans = MembershipPlan::withCount(['memberships as active_members_count' => function ($q) {
            $q->whereIn('status', ['active', 'trial']);
        }])
            ->ordered()
            ->get();

        return Inertia::render('Admin/MemberSpace/Plans/Index', [
            'plans' => $plans,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/MemberSpace/Plans/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());
        $validated['slug'] = Str::slug($validated['name']);

        MembershipPlan::create($validated);

        return redirect()
            ->route('admin.member-space.plans.index')
            ->with('success', 'Plan cree avec succes.');
    }

    public function edit(MembershipPlan $plan): Response
    {
        return Inertia::render('Admin/MemberSpace/Plans/Edit', [
            'plan' => $plan,
        ]);
    }

    public function update(Request $request, MembershipPlan $plan): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $plan->update($validated);

        return redirect()
            ->route('admin.member-space.plans.index')
            ->with('success', 'Plan mis a jour.');
    }

    public function destroy(MembershipPlan $plan): RedirectResponse
    {
        $plan->delete();

        return redirect()
            ->route('admin.member-space.plans.index')
            ->with('success', 'Plan supprime.');
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'billing_period' => 'required|in:monthly,yearly,lifetime,one_time',
            'duration_days' => 'nullable|integer|min:1',
            'trial_days' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
            'features.*' => 'string|max:255',
            'is_popular' => 'boolean',
            'active' => 'boolean',
            'stripe_price_id' => 'nullable|string|max:255',
            'badge_label' => 'nullable|string|max:50',
            'badge_color' => 'nullable|string|max:20',
            'member_limit' => 'nullable|integer|min:1',
        ];
    }
}
