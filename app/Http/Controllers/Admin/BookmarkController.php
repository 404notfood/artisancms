<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminBookmark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookmarkController extends Controller
{
    /**
     * List bookmarks for the authenticated user.
     */
    public function index(): JsonResponse
    {
        $bookmarks = AdminBookmark::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get(['id', 'label', 'url', 'icon']);

        return response()->json($bookmarks);
    }

    /**
     * Store a new bookmark for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'url' => ['required', 'string', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:50'],
        ]);

        $bookmark = AdminBookmark::create([
            'user_id' => Auth::id(),
            ...$validated,
        ]);

        return response()->json($bookmark, 201);
    }

    /**
     * Delete a bookmark (only if owned by the authenticated user).
     */
    public function destroy(AdminBookmark $bookmark): JsonResponse
    {
        if ($bookmark->user_id !== Auth::id()) {
            abort(403, __('cms.bookmarks.forbidden'));
        }

        $bookmark->delete();

        return response()->json(['message' => __('cms.bookmarks.deleted')]);
    }
}
