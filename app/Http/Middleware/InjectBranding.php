<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\BrandingService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class InjectBranding
{
    public function __construct(
        private readonly BrandingService $branding,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $brandingData = $this->branding->all();

        Inertia::share('branding', [
            'name' => $brandingData['brand_name'],
            'logo' => $brandingData['brand_logo'],
            'logo_dark' => $brandingData['brand_logo_dark'],
            'favicon' => $brandingData['brand_favicon'],
            'color_primary' => $brandingData['brand_color_primary'],
            'color_accent' => $brandingData['brand_color_accent'],
            'show_credit' => $brandingData['brand_show_credit'],
            'footer_text' => $brandingData['brand_footer_text'],
            'css' => $this->branding->getCssVariables(),
        ]);

        return $next($request);
    }
}
