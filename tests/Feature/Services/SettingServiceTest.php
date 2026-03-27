<?php

declare(strict_types=1);

namespace Tests\Feature\Services;

use App\Models\Setting;
use App\Services\SettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;
use Tests\Traits\CmsTestHelpers;

class SettingServiceTest extends TestCase
{
    use CmsTestHelpers, RefreshDatabase;

    private SettingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SettingService();
        $this->actingAs($this->createAdmin());
    }

    // ------------------------------------------------------------------
    // GET
    // ------------------------------------------------------------------

    public function test_can_get_setting(): void
    {
        Setting::factory()->groupKey('general', 'site_name')->create([
            'value' => 'My CMS Site',
        ]);

        $value = $this->service->get('general.site_name');

        $this->assertEquals('My CMS Site', $value);
    }

    public function test_get_without_dot_defaults_to_general_group(): void
    {
        Setting::factory()->groupKey('general', 'locale')->create([
            'value' => 'fr',
        ]);

        $value = $this->service->get('locale');

        $this->assertEquals('fr', $value);
    }

    public function test_returns_default_for_missing_setting(): void
    {
        $value = $this->service->get('nonexistent.key', 'fallback');

        $this->assertEquals('fallback', $value);
    }

    public function test_returns_null_for_missing_setting_without_default(): void
    {
        $value = $this->service->get('missing.key');

        $this->assertNull($value);
    }

    // ------------------------------------------------------------------
    // SET
    // ------------------------------------------------------------------

    public function test_can_set_setting(): void
    {
        $setting = $this->service->set('site.tagline', 'A great CMS');

        $this->assertInstanceOf(Setting::class, $setting);
        $this->assertDatabaseHas('settings', [
            'group' => 'site',
            'key' => 'tagline',
        ]);
        $this->assertEquals('A great CMS', $this->service->get('site.tagline'));
    }

    public function test_set_without_dot_uses_general_group(): void
    {
        $this->service->set('timezone', 'Europe/Paris');

        $this->assertDatabaseHas('settings', [
            'group' => 'general',
            'key' => 'timezone',
        ]);
        $this->assertEquals('Europe/Paris', $this->service->get('timezone'));
    }

    public function test_set_updates_existing_setting(): void
    {
        $this->service->set('site.name', 'Initial Name');
        $this->service->set('site.name', 'Updated Name');

        $this->assertEquals('Updated Name', $this->service->get('site.name'));
        $this->assertEquals(
            1,
            Setting::where('group', 'site')->where('key', 'name')->count()
        );
    }

    public function test_set_preserves_type_when_provided(): void
    {
        $setting = $this->service->set('general.debug', true, 'boolean');

        $this->assertEquals('boolean', $setting->type);
    }

    // ------------------------------------------------------------------
    // SET MANY
    // ------------------------------------------------------------------

    public function test_set_many_creates_multiple_settings(): void
    {
        $this->service->setMany([
            'site.name' => 'ArtisanCMS',
            'site.url' => 'https://artisancms.dev',
            'mail.from' => 'noreply@artisancms.dev',
        ]);

        $this->assertEquals('ArtisanCMS', $this->service->get('site.name'));
        $this->assertEquals('https://artisancms.dev', $this->service->get('site.url'));
        $this->assertEquals('noreply@artisancms.dev', $this->service->get('mail.from'));
    }

    // ------------------------------------------------------------------
    // GET GROUP
    // ------------------------------------------------------------------

    public function test_get_group_returns_all_settings_in_group(): void
    {
        Setting::factory()->groupKey('seo', 'meta_title_suffix')->create(['value' => '| CMS']);
        Setting::factory()->groupKey('seo', 'robots_txt')->create(['value' => 'allow all']);
        Setting::factory()->groupKey('general', 'locale')->create(['value' => 'en']);

        $seoSettings = $this->service->getGroup('seo');

        $this->assertCount(2, $seoSettings);
        $keys = $seoSettings->pluck('key')->all();
        $this->assertContains('meta_title_suffix', $keys);
        $this->assertContains('robots_txt', $keys);
    }

    // ------------------------------------------------------------------
    // CACHE
    // ------------------------------------------------------------------

    public function test_caches_settings(): void
    {
        Setting::factory()->groupKey('general', 'cached_key')->create([
            'value' => 'cached_value',
        ]);

        // First call loads from DB and caches
        $this->service->get('cached_key');

        // Verify the cache key exists
        $this->assertTrue(Cache::has('cms.settings'));
    }

    public function test_clears_cache_on_set(): void
    {
        Setting::factory()->groupKey('general', 'test_key')->create([
            'value' => 'original',
        ]);

        // Populate the cache
        $this->service->get('test_key');
        $this->assertTrue(Cache::has('cms.settings'));

        // Setting a value should clear the cache
        $this->service->set('general.test_key', 'changed');
        $this->assertFalse(Cache::has('cms.settings'));
    }

    public function test_clears_cache_on_set_many(): void
    {
        // Populate cache
        $this->service->get('any_key');
        $this->assertTrue(Cache::has('cms.settings'));

        $this->service->setMany(['general.a' => '1', 'general.b' => '2']);

        $this->assertFalse(Cache::has('cms.settings'));
    }

    public function test_clear_cache_explicitly(): void
    {
        // Populate cache
        $this->service->get('populate');
        $this->assertTrue(Cache::has('cms.settings'));

        $this->service->clearCache();

        $this->assertFalse(Cache::has('cms.settings'));
    }

    public function test_get_returns_fresh_value_after_cache_clear(): void
    {
        $this->service->set('general.dynamic', 'value_one');
        $this->assertEquals('value_one', $this->service->get('dynamic'));

        // Directly update in DB (bypassing service) to simulate external change
        Setting::where('group', 'general')->where('key', 'dynamic')
            ->update(['value' => json_encode('value_two')]);

        // Cache still returns old value
        $this->assertEquals('value_one', $this->service->get('dynamic'));

        // After clearing cache, fresh value is returned
        $this->service->clearCache();
        $this->assertEquals('value_two', $this->service->get('dynamic'));
    }
}
