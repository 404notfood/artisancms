<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            ['group' => 'general', 'key' => 'site_name', 'value' => 'ArtisanCMS', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_description', 'value' => '', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_url', 'value' => config('app.url'), 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'locale', 'value' => 'fr', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'timezone', 'value' => 'Europe/Paris', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'date_format', 'value' => 'd/m/Y', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'time_format', 'value' => 'H:i', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'site_logo', 'value' => null, 'type' => 'image', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_favicon', 'value' => null, 'type' => 'image', 'is_public' => true],

            // SEO
            ['group' => 'seo', 'key' => 'meta_title_suffix', 'value' => ' | ArtisanCMS', 'type' => 'string', 'is_public' => false],
            ['group' => 'seo', 'key' => 'meta_description', 'value' => '', 'type' => 'string', 'is_public' => false],
            ['group' => 'seo', 'key' => 'robots_index', 'value' => true, 'type' => 'boolean', 'is_public' => false],
            ['group' => 'seo', 'key' => 'sitemap_enabled', 'value' => true, 'type' => 'boolean', 'is_public' => false],

            // Mail
            ['group' => 'mail', 'key' => 'from_name', 'value' => 'ArtisanCMS', 'type' => 'string', 'is_public' => false],
            ['group' => 'mail', 'key' => 'from_email', 'value' => 'noreply@example.com', 'type' => 'string', 'is_public' => false],

            // Content
            ['group' => 'content', 'key' => 'posts_per_page', 'value' => 10, 'type' => 'number', 'is_public' => false],
            ['group' => 'content', 'key' => 'allow_comments', 'value' => true, 'type' => 'boolean', 'is_public' => false],
            ['group' => 'content', 'key' => 'homepage_type', 'value' => 'page', 'type' => 'string', 'is_public' => false],
            ['group' => 'content', 'key' => 'homepage_id', 'value' => null, 'type' => 'number', 'is_public' => false],

            // Media
            ['group' => 'media', 'key' => 'max_upload_size', 'value' => 10240, 'type' => 'number', 'is_public' => false],
            ['group' => 'media', 'key' => 'allowed_types', 'value' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'], 'type' => 'json', 'is_public' => false],
            ['group' => 'media', 'key' => 'image_sizes', 'value' => ['thumbnail' => [150, 150], 'medium' => [300, 300], 'large' => [1024, 1024]], 'type' => 'json', 'is_public' => false],

            // Maintenance
            ['group' => 'maintenance', 'key' => 'enabled', 'value' => false, 'type' => 'boolean', 'is_public' => true],
            ['group' => 'maintenance', 'key' => 'message', 'value' => 'Site en maintenance. Nous revenons bientôt.', 'type' => 'string', 'is_public' => true],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                $setting,
            );
        }
    }
}
