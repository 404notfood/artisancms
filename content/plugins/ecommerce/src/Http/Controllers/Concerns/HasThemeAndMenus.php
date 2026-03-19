<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Concerns;

use App\Http\Controllers\Concerns\HasFrontData;

/**
 * Delegates to the core HasFrontData trait.
 * Kept as an alias to avoid breaking existing controllers.
 */
trait HasThemeAndMenus
{
    use HasFrontData;

    protected function themeAndMenus(): array
    {
        return $this->frontData();
    }
}
