<?php

declare(strict_types=1);

namespace MemberSpace\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use MemberSpace\Services\ContentRestrictionService;
use MemberSpace\Services\MemberSettingsService;
use Symfony\Component\HttpFoundation\Response;

class CheckContentRestriction
{
    public function __construct(
        private readonly ContentRestrictionService $restrictionService,
        private readonly MemberSettingsService $settingsService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->settingsService->isModuleEnabled('content_restriction')) {
            return $next($request);
        }

        $route = $request->route();
        $page = $route?->parameter('page');
        $post = $route?->parameter('post');

        $content = $page ?? $post;

        if ($content && is_object($content) && $this->restrictionService->isRestricted($content)) {
            if (!$this->restrictionService->canAccess($content, $request->user())) {
                $restriction = $this->restrictionService->getRestriction($content);

                if ($restriction?->redirect_url) {
                    return redirect($restriction->redirect_url);
                }

                abort(403, $restriction?->restricted_message ?? 'Contenu reserve aux membres.');
            }
        }

        return $next($request);
    }
}
