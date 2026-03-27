<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Display a paginated, filterable list of activity log entries.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['action', 'user_id', 'date_from', 'date_to']);

        $query = ActivityLog::query()
            ->with(['user:id,name,email', 'subject'])
            ->orderByDesc('created_at');

        if (!empty($filters['action'])) {
            $query->byAction($filters['action']);
        }

        if (!empty($filters['user_id'])) {
            $query->byUser((int) $filters['user_id']);
        }

        if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
            $query->between($filters['date_from'], $filters['date_to']);
        } elseif (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        } elseif (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $logs = $query->paginate(50)->withQueryString();

        // Append the computed action_label attribute to each item.
        $logs->getCollection()->each(function (ActivityLog $log): void {
            $log->append('action_label');
        });

        $actions = ActivityLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        $users = User::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/ActivityLog/Index', [
            'logs'    => $logs,
            'filters' => $filters,
            'actions' => $actions,
            'users'   => $users,
        ]);
    }
}
