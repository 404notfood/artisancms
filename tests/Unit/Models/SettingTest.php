<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_returns_value(): void
    {
        Setting::create([
            'group' => 'general',
            'key' => 'site_name',
            'value' => 'My CMS',
            'type' => 'string',
        ]);

        $result = Setting::get('site_name');

        $this->assertEquals('My CMS', $result);
    }

    public function test_get_returns_default_when_not_found(): void
    {
        $result = Setting::get('nonexistent_key', 'default_value');

        $this->assertEquals('default_value', $result);
    }

    public function test_get_returns_null_default_when_not_found(): void
    {
        $result = Setting::get('nonexistent_key');

        $this->assertNull($result);
    }

    public function test_get_with_group_key_format(): void
    {
        Setting::create([
            'group' => 'site',
            'key' => 'name',
            'value' => 'ArtisanCMS',
            'type' => 'string',
        ]);

        $result = Setting::get('site.name');

        $this->assertEquals('ArtisanCMS', $result);
    }

    public function test_get_with_group_key_format_returns_default_when_not_found(): void
    {
        $result = Setting::get('site.nonexistent', 'fallback');

        $this->assertEquals('fallback', $result);
    }

    public function test_set_creates_new_setting(): void
    {
        Setting::set('site.name', 'New Site');

        $this->assertDatabaseHas('settings', [
            'group' => 'site',
            'key' => 'name',
        ]);

        $this->assertEquals('New Site', Setting::get('site.name'));
    }

    public function test_set_updates_existing_setting(): void
    {
        Setting::create([
            'group' => 'site',
            'key' => 'name',
            'value' => 'Old Name',
            'type' => 'string',
        ]);

        Setting::set('site.name', 'Updated Name');

        $this->assertEquals('Updated Name', Setting::get('site.name'));

        // Ensure only one row with this group/key exists
        $count = Setting::where('group', 'site')->where('key', 'name')->count();
        $this->assertEquals(1, $count);
    }

    public function test_set_without_group_uses_general(): void
    {
        Setting::set('timezone', 'Europe/Paris');

        $this->assertDatabaseHas('settings', [
            'group' => 'general',
            'key' => 'timezone',
        ]);

        $this->assertEquals('Europe/Paris', Setting::get('timezone'));
    }

    public function test_set_creates_setting_with_correct_group(): void
    {
        Setting::set('seo.meta_title_suffix', ' | My Site');

        $this->assertDatabaseHas('settings', [
            'group' => 'seo',
            'key' => 'meta_title_suffix',
        ]);
    }
}
