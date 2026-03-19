<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Concerns;

use MemberSpace\Services\MemberSettingsService;

/**
 * Provides settings access to member-space controllers by delegating
 * to MemberSettingsService (single source of truth for defaults + cache).
 */
trait HasMemberSettings
{
    protected function getSettings(): array
    {
        return app(MemberSettingsService::class)->all();
    }

    protected function isModuleEnabled(string $module): bool
    {
        return app(MemberSettingsService::class)->isModuleEnabled($module);
    }
}
