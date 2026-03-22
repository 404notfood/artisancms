<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * @param array<string, mixed> $filters
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = User::with('role')->withCount(['posts', 'pages']);

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (isset($filters['role_id']) && $filters['role_id'] !== '') {
            $query->where('role_id', (int) $filters['role_id']);
        }

        $query->orderBy('name', 'asc');

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(int $id): User
    {
        return User::with('role')->withCount(['posts', 'pages'])->findOrFail($id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $data['role_id'],
            'bio' => $data['bio'] ?? null,
            'profile_visibility' => $data['profile_visibility'] ?? 'public',
            'social_links' => $data['social_links'] ?? null,
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(User $user, array $data): User
    {
        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'role_id' => $data['role_id'],
            'bio' => $data['bio'] ?? null,
            'profile_visibility' => $data['profile_visibility'] ?? $user->profile_visibility,
            'social_links' => $data['social_links'] ?? $user->social_links,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        return $user->fresh(['role']) ?? $user;
    }

    public function delete(User $user): bool
    {
        return (bool) $user->delete();
    }
}
