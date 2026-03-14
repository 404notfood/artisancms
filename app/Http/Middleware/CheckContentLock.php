<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Page;
use App\Models\Post;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckContentLock
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        // Determine the model from the route parameters
        $model = $request->route('page') ?? $request->route('post');

        if ($model === null || !($model instanceof Page || $model instanceof Post)) {
            return $next($request);
        }

        // Only check on edit/update actions
        if (!in_array($request->method(), ['GET', 'PUT', 'PATCH'], true)) {
            return $next($request);
        }

        // Check if content is locked by another user
        if ($model->isCheckedOut() && !$model->isCheckedOutBy($user)) {
            $lockedBy = $model->checkedOutBy;
            $lockedByName = $lockedBy?->name ?? __('cms.content_lock.unknown_user');

            return response()->json([
                'error' => __('cms.content_lock.locked'),
                'locked_by' => $lockedByName,
                'locked_at' => $model->checked_out_at?->toISOString(),
            ], 409);
        }

        // Refresh lock for current user or take expired lock
        $model->update([
            'checked_out_by' => $user->id,
            'checked_out_at' => now(),
        ]);

        return $next($request);
    }
}
