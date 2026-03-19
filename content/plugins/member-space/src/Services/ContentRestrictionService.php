<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use MemberSpace\Models\ContentRestriction;
use MemberSpace\Models\UserMembership;

class ContentRestrictionService
{
    public function isRestricted(Model $content): bool
    {
        return ContentRestriction::query()
            ->where('restrictable_type', get_class($content))
            ->where('restrictable_id', $content->getKey())
            ->active()
            ->exists();
    }

    public function canAccess(Model $content, ?User $user): bool
    {
        $restriction = ContentRestriction::query()
            ->where('restrictable_type', get_class($content))
            ->where('restrictable_id', $content->getKey())
            ->active()
            ->first();

        if (!$restriction) {
            return true;
        }

        if (!$user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return match ($restriction->restriction_type) {
            'logged_in' => true,
            'role' => $this->checkRoleAccess($user, $restriction),
            'plan' => $this->checkPlanAccess($user, $restriction),
            default => false,
        };
    }

    public function getRestriction(Model $content): ?ContentRestriction
    {
        return ContentRestriction::query()
            ->where('restrictable_type', get_class($content))
            ->where('restrictable_id', $content->getKey())
            ->active()
            ->first();
    }

    public function setRestriction(Model $content, array $data): ContentRestriction
    {
        return ContentRestriction::updateOrCreate(
            [
                'restrictable_type' => get_class($content),
                'restrictable_id' => $content->getKey(),
            ],
            $data
        );
    }

    public function removeRestriction(Model $content): void
    {
        ContentRestriction::query()
            ->where('restrictable_type', get_class($content))
            ->where('restrictable_id', $content->getKey())
            ->delete();
    }

    private function checkRoleAccess(User $user, ContentRestriction $restriction): bool
    {
        $allowedRoles = $restriction->allowed_roles ?? [];

        return in_array($user->role?->slug, $allowedRoles, true);
    }

    private function checkPlanAccess(User $user, ContentRestriction $restriction): bool
    {
        $allowedPlans = $restriction->allowed_plans ?? [];

        if (empty($allowedPlans)) {
            return false;
        }

        return UserMembership::where('user_id', $user->id)
            ->whereIn('plan_id', $allowedPlans)
            ->active()
            ->exists();
    }
}
