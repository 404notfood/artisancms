<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Lister les notifications de l'utilisateur connecte.
     */
    public function index(Request $request): JsonResponse|Response
    {
        if (!$request->expectsJson()) {
            $query = Notification::where('user_id', $request->user()->id)->latest();
            $activeType = $request->query('type');
            $activeStatus = $request->query('status');

            if (is_string($activeType) && $activeType !== '') {
                $query->where('type', $activeType);
            }

            if ($activeStatus === 'unread') {
                $query->whereNull('read_at');
            } elseif ($activeStatus === 'read') {
                $query->whereNotNull('read_at');
            }

            return Inertia::render('Admin/Notifications/Index', [
                'notifications' => $query->paginate(30)->withQueryString(),
                'stats' => [
                    'total' => Notification::where('user_id', $request->user()->id)->count(),
                    'unread' => Notification::where('user_id', $request->user()->id)->whereNull('read_at')->count(),
                    'types' => Notification::where('user_id', $request->user()->id)
                        ->selectRaw('type, COUNT(*) as count')
                        ->groupBy('type')
                        ->orderBy('type')
                        ->get(),
                ],
                'filters' => [
                    'type' => $activeType,
                    'status' => $activeStatus,
                ],
            ]);
        }

        $notifications = $this->notificationService->paginateForUser($request->user());

        return response()->json($notifications);
    }

    /**
     * Marquer une notification comme lue.
     */
    public function markRead(Notification $notification): JsonResponse
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403);
        }

        $this->notificationService->markAsRead($notification);

        return response()->json(['success' => true]);
    }

    /**
     * Marquer toutes les notifications comme lues.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $this->notificationService->markAllAsRead($request->user());

        return response()->json(['success' => true]);
    }

    public function destroy(Notification $notification): JsonResponse
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403);
        }

        $notification->delete();

        return response()->json(['success' => true]);
    }

    public function clearRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNotNull('read_at')
            ->delete();

        return response()->json(['success' => true]);
    }
}
