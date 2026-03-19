<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use MemberSpace\Models\MemberActivity;
use MemberSpace\Models\MemberProfile;

class ProfileService
{
    public function getOrCreateProfile(User $user): MemberProfile
    {
        return MemberProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $user->name,
                'profile_visibility' => 'public',
                'show_in_directory' => true,
            ]
        );
    }

    public function updateProfile(MemberProfile $profile, array $data): MemberProfile
    {
        $profile->update($data);
        $profile->profile_completion = $this->calculateCompletion($profile);
        $profile->save();

        $this->logActivity($profile->user_id, 'profile_updated', 'Profil mis a jour');

        return $profile->fresh();
    }

    public function uploadAvatar(MemberProfile $profile, UploadedFile $file): string
    {
        if ($profile->avatar) {
            Storage::disk('public')->delete($profile->avatar);
        }

        $path = $file->store('members/avatars', 'public');
        $profile->update(['avatar' => $path]);

        $this->logActivity($profile->user_id, 'avatar_updated', 'Photo de profil mise a jour');

        return $path;
    }

    public function uploadCoverPhoto(MemberProfile $profile, UploadedFile $file): string
    {
        if ($profile->cover_photo) {
            Storage::disk('public')->delete($profile->cover_photo);
        }

        $path = $file->store('members/covers', 'public');
        $profile->update(['cover_photo' => $path]);

        $this->logActivity($profile->user_id, 'cover_updated', 'Photo de couverture mise a jour');

        return $path;
    }

    public function deleteAvatar(MemberProfile $profile): void
    {
        if ($profile->avatar) {
            Storage::disk('public')->delete($profile->avatar);
            $profile->update(['avatar' => null]);
        }
    }

    public function deleteCoverPhoto(MemberProfile $profile): void
    {
        if ($profile->cover_photo) {
            Storage::disk('public')->delete($profile->cover_photo);
            $profile->update(['cover_photo' => null]);
        }
    }

    public function calculateCompletion(MemberProfile $profile): int
    {
        $fields = [
            'display_name', 'first_name', 'last_name', 'bio', 'avatar',
            'phone', 'website', 'location', 'company', 'job_title',
        ];

        $filled = 0;
        foreach ($fields as $field) {
            if (!empty($profile->{$field})) {
                $filled++;
            }
        }

        return (int) round(($filled / count($fields)) * 100);
    }

    public function touchLastActive(int $userId): void
    {
        MemberProfile::where('user_id', $userId)
            ->update(['last_active_at' => now()]);
    }

    public function logActivity(
        int $userId,
        string $type,
        string $description,
        ?array $metadata = null,
    ): void {
        MemberActivity::create([
            'user_id' => $userId,
            'type' => $type,
            'description' => $description,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function getRecentActivity(int $userId, int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return MemberActivity::forUser($userId)->recent($limit)->get();
    }
}
