<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AvatarService
{
    /**
     * Upload and set an avatar for a user.
     */
    public function upload(User $user, UploadedFile $file): string
    {
        $this->deleteExisting($user);

        $extension = $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars', $user->id . '.' . $extension, 'public');

        $user->update(['avatar' => $path]);

        return $path;
    }

    /**
     * Remove the avatar for a user.
     */
    public function remove(User $user): void
    {
        $this->deleteExisting($user);

        $user->update(['avatar' => null]);
    }

    /**
     * Delete the existing avatar file from storage.
     */
    private function deleteExisting(User $user): void
    {
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }
    }
}
