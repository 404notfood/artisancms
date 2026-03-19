<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Models\MemberVerification;
use MemberSpace\Services\VerificationService;

class VerificationController extends Controller
{
    public function __construct(
        private readonly VerificationService $verificationService,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['status']);

        return Inertia::render('Admin/MemberSpace/Verifications/Index', [
            'verifications' => $this->verificationService->getAll($filters),
            'filters' => $filters,
            'pendingCount' => MemberVerification::pending()->count(),
        ]);
    }

    public function approve(Request $request, MemberVerification $verification): RedirectResponse
    {
        $this->verificationService->approve(
            $verification,
            auth()->user(),
            $request->input('admin_notes')
        );

        return redirect()->back()->with('success', 'Verification approuvee.');
    }

    public function reject(Request $request, MemberVerification $verification): RedirectResponse
    {
        $request->validate([
            'admin_notes' => 'required|string|max:1000',
        ]);

        $this->verificationService->reject(
            $verification,
            auth()->user(),
            $request->input('admin_notes')
        );

        return redirect()->back()->with('success', 'Verification refusee.');
    }
}
