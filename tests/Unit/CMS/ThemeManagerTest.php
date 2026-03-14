<?php

declare(strict_types=1);

namespace Tests\Unit\CMS;

use App\CMS\Themes\ThemeManager;
use App\Models\CmsTheme;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemeManagerTest extends TestCase
{
    use RefreshDatabase;

    private ThemeManager $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager = new ThemeManager();
    }

    public function test_discover_finds_themes_with_manifests(): void
    {
        $manifests = $this->manager->discover();

        $this->assertIsArray($manifests);
        // The default theme should exist
        $this->assertArrayHasKey('default', $manifests);
    }

    public function test_activate_theme(): void
    {
        CmsTheme::create([
            'slug' => 'test-theme',
            'name' => 'Test Theme',
            'version' => '1.0.0',
            'active' => false,
            'settings' => [],
            'customizations' => [],
        ]);

        $result = $this->manager->activate('test-theme');

        $this->assertTrue($result);
        $this->assertTrue(CmsTheme::where('slug', 'test-theme')->first()->active);
    }

    public function test_activate_deactivates_previous_theme(): void
    {
        CmsTheme::create([
            'slug' => 'theme-a',
            'name' => 'Theme A',
            'version' => '1.0.0',
            'active' => true,
            'settings' => [],
            'customizations' => [],
        ]);
        CmsTheme::create([
            'slug' => 'theme-b',
            'name' => 'Theme B',
            'version' => '1.0.0',
            'active' => false,
            'settings' => [],
            'customizations' => [],
        ]);

        $this->manager->activate('theme-b');

        $this->assertFalse(CmsTheme::where('slug', 'theme-a')->first()->active);
        $this->assertTrue(CmsTheme::where('slug', 'theme-b')->first()->active);
    }

    public function test_activate_nonexistent_theme_returns_false(): void
    {
        $this->assertFalse($this->manager->activate('nonexistent-theme'));
    }

    public function test_get_active_returns_active_theme(): void
    {
        CmsTheme::create([
            'slug' => 'active-theme',
            'name' => 'Active',
            'version' => '1.0.0',
            'active' => true,
            'settings' => [],
            'customizations' => [],
        ]);

        $active = $this->manager->getActive();

        $this->assertNotNull($active);
        $this->assertEquals('active-theme', $active->slug);
    }

    public function test_get_active_returns_null_when_none_active(): void
    {
        $this->assertNull($this->manager->getActive());
    }

    public function test_get_all_returns_collection(): void
    {
        CmsTheme::create([
            'slug' => 'theme-x',
            'name' => 'Theme X',
            'version' => '1.0.0',
            'active' => false,
            'settings' => [],
            'customizations' => [],
        ]);

        $all = $this->manager->getAll();

        $this->assertGreaterThanOrEqual(1, $all->count());
    }

    public function test_get_theme_config_returns_manifest(): void
    {
        $config = $this->manager->getThemeConfig('default');

        $this->assertIsArray($config);
        $this->assertNotEmpty($config);
    }

    public function test_get_theme_config_returns_empty_for_unknown(): void
    {
        $config = $this->manager->getThemeConfig('unknown-theme');

        $this->assertEquals([], $config);
    }

    public function test_load_themes_registers_in_db(): void
    {
        $this->manager->loadThemes();

        $this->assertDatabaseHas('cms_themes', ['slug' => 'default']);
    }
}
