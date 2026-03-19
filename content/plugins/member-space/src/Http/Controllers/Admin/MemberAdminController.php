<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Models\MemberActivity;
use MemberSpace\Models\MemberProfile;

class MemberAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query()
            ->with(['role', 'memberProfile'])
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->input('role'), function ($q, $role) {
                $q->whereHas('role', fn ($r) => $r->where('slug', $role));
            })
            ->orderByDesc('created_at');

        return Inertia::render('Admin/MemberSpace/Members/Index', [
            'members' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['role', 'memberProfile']);

        $recentActivity = MemberActivity::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $stats = [
            'profile_completion' => $user->memberProfile?->profile_completion ?? 0,
            'member_since' => $user->created_at?->format('d/m/Y'),
            'last_active' => $user->memberProfile?->last_active_at?->diffForHumans() ?? 'Jamais',
            'total_activities' => MemberActivity::where('user_id', $user->id)->count(),
        ];

        return Inertia::render('Admin/MemberSpace/Members/Show', [
            'member' => $user,
            'profile' => $user->memberProfile,
            'recentActivity' => $recentActivity,
            'stats' => $stats,
        ]);
    }
}
