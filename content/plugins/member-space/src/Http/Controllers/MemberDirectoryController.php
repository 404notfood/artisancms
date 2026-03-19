<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Http\Controllers\Concerns\HasMemberSettings;
use MemberSpace\Http\Controllers\Concerns\HasThemeAndMenus;
use MemberSpace\Services\MemberDirectoryService;

class MemberDirectoryController extends Controller
{
    use HasMemberSettings, HasThemeAndMenus;

    public function __construct(
        private readonly MemberDirectoryService $directoryService,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'location', 'company', 'sort', 'per_page']);

        return Inertia::render('Front/Members/Directory', array_merge($this->themeAndMenus(), [
            'members' => $this->directoryService->search($filters, $request->user()),
            'filters' => $filters,
            'stats' => $this->directoryService->getStats(),
            'settings' => $this->getSettings(),
        ]));
    }
}
