<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\EmailTemplate;
use App\Models\User;

class EmailTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('email_templates.read');
    }

    public function view(User $user, EmailTemplate $template): bool
    {
        return $user->hasPermission('email_templates.read');
    }

    public function update(User $user, EmailTemplate $template): bool
    {
        return $user->hasPermission('email_templates.update');
    }
}
