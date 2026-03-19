<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Models\ContentRestriction;
use MemberSpace\Models\MembershipPlan;

class ContentRestrictionController extends Controller
{
    public function index(): Response
    {
        $restrictions = ContentRestriction::with('restrictable')
            ->orderByDesc('created_at')
            ->paginate(20);

        $plans = MembershipPlan::active()->ordered()->get(['id', 'name']);

        return Inertia::render('Admin/MemberSpace/Restrictions/Index', [
            'restrictions' => $restrictions,
            'plans' => $plans,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'restrictable_type' => 'required|string|in:App\\Models\\Page,App\\Models\\Post',
            'restrictable_id' => 'required|integer',
            'restriction_type' => 'required|in:role,plan,logged_in',
            'allowed_roles' => 'nullable|array',
            'allowed_plans' => 'nullable|array',
            'redirect_url' => 'nullable|url|max:255',
            'restricted_message' => 'nullable|string|max:500',
            'show_excerpt' => 'boolean',
            'active' => 'boolean',
        ]);

        ContentRestriction::create($validated);

        return redirect()
            ->route('admin.member-space.restrictions.index')
            ->with('success', 'Restriction ajoutee.');
    }

    public function update(Request $request, ContentRestriction $restriction): RedirectResponse
    {
        $validated = $request->validate([
            'restriction_type' => 'required|in:role,plan,logged_in',
            'allowed_roles' => 'nullable|array',
            'allowed_plans' => 'nullable|array',
            'redirect_url' => 'nullable|url|max:255',
            'restricted_message' => 'nullable|string|max:500',
            'show_excerpt' => 'boolean',
            'active' => 'boolean',
        ]);

        $restriction->update($validated);

        return redirect()->back()->with('success', 'Restriction mise a jour.');
    }

    public function destroy(ContentRestriction $restriction): RedirectResponse
    {
        $restriction->delete();

        return redirect()
            ->route('admin.member-space.restrictions.index')
            ->with('success', 'Restriction supprimee.');
    }
}
