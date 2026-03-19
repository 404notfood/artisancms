<?php

declare(strict_types=1);

namespace MemberSpace\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use MemberSpace\Services\MemberSettingsService;
use Symfony\Component\HttpFoundation\Response;

class CheckModuleEnabled
{
    public function __construct(
        private readonly MemberSettingsService $settingsService,
    ) {}

    public function handle(Request $request, Closure $next, string $module): Response
    {
        if (!$this->settingsService->isModuleEnabled($module)) {
            abort(404);
        }

        return $next($request);
    }
}
