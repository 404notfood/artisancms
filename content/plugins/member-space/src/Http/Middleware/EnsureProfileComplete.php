<?php

declare(strict_types=1);

namespace MemberSpace\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use MemberSpace\Models\MemberProfile;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $profile = MemberProfile::where('user_id', $user->id)->first();

        if (!$profile || $profile->profile_completion < 50) {
            if (!$request->is('members/account/edit-profile*')) {
                return redirect('/members/account/edit-profile')
                    ->with('warning', 'Veuillez completer votre profil avant de continuer.');
            }
        }

        return $next($request);
    }
}
