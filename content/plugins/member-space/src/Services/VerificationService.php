<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use MemberSpace\Models\MemberVerification;

class VerificationService
{
    public function __construct(
        private readonly ProfileService $profileService,
    ) {}

    public function submit(User $user, ?UploadedFile $document = null, ?string $notes = null): MemberVerification
    {
        $data = [
            'status' => 'pending',
            'notes' => $notes,
            'submitted_at' => now(),
            'reviewed_by' => null,
            'reviewed_at' => null,
            'admin_notes' => null,
        ];

        if ($document) {
            $data['document_path'] = $document->store('members/verifications', 'private');
        }

        $verification = MemberVerification::updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        $this->profileService->logActivity(
            $user->id,
            'verification_submitted',
            'Demande de verification soumise'
        );

        return $verification;
    }

    public function approve(MemberVerification $verification, User $admin, ?string $notes = null): void
    {
        $verification->update([
            'status' => 'approved',
            'admin_notes' => $notes,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $this->profileService->logActivity(
            $verification->user_id,
            'verification_approved',
            'Verification approuvee'
        );
    }

    public function reject(MemberVerification $verification, User $admin, ?string $notes = null): void
    {
        $verification->update([
            'status' => 'rejected',
            'admin_notes' => $notes,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $this->profileService->logActivity(
            $verification->user_id,
            'verification_rejected',
            'Verification refusee'
        );
    }

    public function getPending(): LengthAwarePaginator
    {
        return MemberVerification::with(['user', 'reviewer'])
            ->pending()
            ->orderBy('submitted_at')
            ->paginate(20);
    }

    public function getAll(array $filters = []): LengthAwarePaginator
    {
        $query = MemberVerification::with(['user', 'reviewer']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('submitted_at')->paginate(20);
    }

    public function getForUser(User $user): ?MemberVerification
    {
        return MemberVerification::where('user_id', $user->id)->first();
    }
}
