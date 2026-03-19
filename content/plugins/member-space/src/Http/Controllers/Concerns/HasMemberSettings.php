<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Concerns;

use App\Models\CmsPlugin;

trait HasMemberSettings
{
    protected function getSettings(): array
    {
        static $cached = null;

        if ($cached !== null) {
            return $cached;
        }

        $defaults = [
            'modules' => [
                'member_directory' => true,
                'content_restriction' => true,
                'custom_fields' => true,
                'social_login' => false,
                'two_factor' => false,
                'membership_plans' => false,
                'user_verification' => false,
            ],
            'profile' => [
                'default_visibility' => 'public',
                'require_avatar' => false,
                'max_bio_length' => 500,
                'enable_cover_photo' => true,
            ],
            'directory' => [
                'per_page' => 12,
                'default_sort' => 'newest',
                'show_search' => true,
                'layout' => 'grid',
            ],
            'registration' => [
                'enable_custom_registration' => true,
                'require_email_verification' => true,
                'auto_create_profile' => true,
                'default_role' => 'subscriber',
            ],
            'social_login' => [
                'google_client_id' => '',
                'google_client_secret' => '',
                'facebook_client_id' => '',
                'facebook_client_secret' => '',
                'github_client_id' => '',
                'github_client_secret' => '',
            ],
            'stripe' => [
                'publishable_key' => '',
                'secret_key' => '',
                'webhook_secret' => '',
            ],
        ];

        $plugin = CmsPlugin::where('slug', 'member-space')->first();

        if (!$plugin || empty($plugin->settings)) {
            return $cached = $defaults;
        }

        $resolved = [];
        foreach ($plugin->settings as $key => $value) {
            $resolved[$key] = is_array($value) && isset($value['default']) ? $value['default'] : $value;
        }

        return $cached = array_replace_recursive($defaults, $resolved);
    }

    protected function isModuleEnabled(string $module): bool
    {
        $settings = $this->getSettings();

        return (bool) ($settings['modules'][$module] ?? false);
    }
}
