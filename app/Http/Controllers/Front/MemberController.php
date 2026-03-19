<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Concerns\HasFrontData;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    use HasFrontData;

    public function index(Request $request): Response
    {
        $query = User::with('role')
            ->visibleTo(Auth::user());

        if ($search = $request->input('search')) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $members = $query->orderBy('name')->paginate(12)->withQueryString();

        return Inertia::render('Front/Members/Index', [
            ...$this->frontData(),
            'members' => $members,
            'search' => $search ?? '',
        ]);
    }

    public function show(User $user): Response|RedirectResponse
    {
        $viewer = Auth::user();

        // Check visibility
        if ($user->profile_visibility === 'private' && $viewer?->id !== $user->id && ! $viewer?->isAdmin()) {
            abort(404);
        }

        if ($user->profile_visibility === 'members_only' && $viewer === null) {
            return redirect()->guest(route('login'));
        }

        $user->load('role');

        $posts = Post::where('created_by', $user->id)
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->limit(10)
            ->get(['id', 'title', 'slug', 'excerpt', 'featured_image', 'published_at']);

        return Inertia::render('Front/Members/Show', [
            ...$this->frontData(),
            'member' => $user,
            'posts' => $posts,
        ]);
    }
}
