<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class NotificationService
{
    /**
     * Envoyer une notification a un utilisateur.
     */
    public function notify(User $user, string $type, string $title, string $message, ?array $data = null): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Notifier tous les administrateurs.
     */
    public function notifyAdmins(string $type, string $title, string $message, ?array $data = null): void
    {
        $admins = User::whereHas('role', function ($query) {
            $query->where('slug', 'admin');
        })->get();

        foreach ($admins as $admin) {
            $this->notify($admin, $type, $title, $message, $data);
        }
    }

    /**
     * Recuperer les notifications recentes d'un utilisateur.
     *
     * @return Collection<int, Notification>
     */
    public function getForUser(User $user, int $limit = 20): Collection
    {
        return Notification::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Recuperer les notifications paginées d'un utilisateur.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function paginateForUser(User $user, int $perPage = 20): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return Notification::where('user_id', $user->id)
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Compter les notifications non lues.
     */
    public function getUnreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->count();
    }

    /**
     * Marquer une notification comme lue.
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Marquer toutes les notifications d'un utilisateur comme lues.
     */
    public function markAllAsRead(User $user): void
    {
        Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }
}
