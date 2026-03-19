<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use MemberSpace\Models\MemberProfile;

class MemberDirectoryService
{
    public function __construct(
        private readonly MemberSettingsService $settingsService,
    ) {}

    public function search(array $filters = [], ?User $viewer = null): LengthAwarePaginator
    {
        $settings = $this->settingsService->get('directory');
        $perPage = (int) ($filters['per_page'] ?? $settings['per_page'] ?? 12);
        $sort = $filters['sort'] ?? $settings['default_sort'] ?? 'newest';

        $query = MemberProfile::query()
            ->with('user:id,name,email')
            ->visible($viewer)
            ->inDirectory();

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (!empty($filters['location'])) {
            $query->where('location', 'like', "%{$filters['location']}%");
        }

        if (!empty($filters['company'])) {
            $query->where('company', 'like', "%{$filters['company']}%");
        }

        match ($sort) {
            'oldest' => $query->orderBy('created_at', 'asc'),
            'name' => $query->orderBy('display_name', 'asc'),
            'recently_active' => $query->orderByDesc('last_active_at'),
            default => $query->orderByDesc('created_at'),
        };

        return $query->paginate($perPage)->withQueryString();
    }

    public function getStats(): array
    {
        return [
            'total_members' => MemberProfile::inDirectory()->count(),
            'recently_active' => MemberProfile::inDirectory()
                ->where('last_active_at', '>=', now()->subDays(7))
                ->count(),
        ];
    }
}
