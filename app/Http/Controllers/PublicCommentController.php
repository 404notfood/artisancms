<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\PublicCommentRequest;
use App\Models\Post;
use App\Services\CommentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class PublicCommentController extends Controller
{
    public function __construct(
        private readonly CommentService $commentService,
    ) {}

    /**
     * Store a new comment on a post.
     */
    public function store(PublicCommentRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Honeypot spam check: if honeypot field is filled, silently redirect
        if (!empty($validated['honeypot'])) {
            return redirect()->back()->with('success', __('cms.comments.submitted'));
        }

        // Verify the post allows comments
        $post = Post::findOrFail($validated['post_id']);
        if (!$post->allow_comments) {
            return redirect()->back()->with('error', __('cms.comments.disabled'));
        }

        $data = [
            'post_id' => $validated['post_id'],
            'parent_id' => $validated['parent_id'] ?? null,
            'author_name' => $validated['author_name'],
            'author_email' => $validated['author_email'],
            'content' => strip_tags($validated['content']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        // If user is logged in, attach user_id and use their info
        if (Auth::check()) {
            $user = Auth::user();
            $data['user_id'] = $user->id;
            $data['author_name'] = $user->name;
            $data['author_email'] = $user->email;
        }

        $this->commentService->store($data);

        return redirect()->back()->with('success', __('cms.comments.submitted'));
    }
}
