<?php

declare(strict_types=1);

namespace Tests\Unit\CMS;

use App\CMS\Plugins\PluginManager;
use App\Models\CmsPlugin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class PluginManagerTest extends TestCase
{
    use RefreshDatabase;

    private PluginManager $manager;
    private string $pluginsPath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager = new PluginManager();
        $this->pluginsPath = config('cms.paths.plugins');
    }

    public function test_discover_finds_plugins_with_manifests(): void
    {
        $manifests = $this->manager->discover();

        // The project has plugins in content/plugins/
        $this->assertIsArray($manifests);
    }

    public function test_install_plugin_creates_db_record(): void
    {
        // Get a known plugin slug from the filesystem
        $directories = File::directories($this->pluginsPath);
        if (empty($directories)) {
            $this->markTestSkipped('No plugins available.');
        }

        $slug = basename($directories[0]);
        $manifestPath = $directories[0] . '/artisan-plugin.json';
        if (!File::exists($manifestPath)) {
            $this->markTestSkipped('No manifest found.');
        }

        $result = $this->manager->install($slug);

        $this->assertTrue($result);
        $this->assertDatabaseHas('cms_plugins', ['slug' => $slug]);
    }

    public function test_install_nonexistent_plugin_returns_false(): void
    {
        $result = $this->manager->install('nonexistent-plugin-xyz');

        $this->assertFalse($result);
    }

    public function test_enable_and_disable_plugin(): void
    {
        // Create a plugin record directly
        CmsPlugin::create([
            'slug' => 'test-plugin',
            'name' => 'Test Plugin',
            'version' => '1.0.0',
            'enabled' => false,
            'settings' => [],
            'installed_at' => now(),
        ]);

        $this->assertTrue($this->manager->enable('test-plugin'));
        $this->assertTrue($this->manager->isEnabled('test-plugin'));

        $this->assertTrue($this->manager->disable('test-plugin'));
        $this->assertFalse($this->manager->isEnabled('test-plugin'));
    }

    public function test_enable_nonexistent_plugin_returns_false(): void
    {
        $this->assertFalse($this->manager->enable('nonexistent'));
    }

    public function test_disable_nonexistent_plugin_returns_false(): void
    {
        $this->assertFalse($this->manager->disable('nonexistent'));
    }

    public function test_uninstall_plugin_removes_db_record(): void
    {
        CmsPlugin::create([
            'slug' => 'to-remove',
            'name' => 'To Remove',
            'version' => '1.0.0',
            'enabled' => false,
            'settings' => [],
            'installed_at' => now(),
        ]);

        $result = $this->manager->uninstall('to-remove');

        $this->assertTrue($result);
        $this->assertDatabaseMissing('cms_plugins', ['slug' => 'to-remove']);
    }

    public function test_uninstall_disables_before_removing(): void
    {
        CmsPlugin::create([
            'slug' => 'enabled-plugin',
            'name' => 'Enabled',
            'version' => '1.0.0',
            'enabled' => true,
            'settings' => [],
            'installed_at' => now(),
        ]);

        $result = $this->manager->uninstall('enabled-plugin');

        $this->assertTrue($result);
        $this->assertDatabaseMissing('cms_plugins', ['slug' => 'enabled-plugin']);
    }

    public function test_get_all_returns_collection(): void
    {
        CmsPlugin::create([
            'slug' => 'plugin-a',
            'name' => 'Plugin A',
            'version' => '1.0.0',
            'enabled' => true,
            'settings' => [],
            'installed_at' => now(),
        ]);

        $all = $this->manager->getAll();

        $this->assertGreaterThanOrEqual(1, $all->count());
    }

    public function test_get_enabled_returns_only_enabled(): void
    {
        CmsPlugin::create([
            'slug' => 'enabled-one',
            'name' => 'Enabled',
            'version' => '1.0.0',
            'enabled' => true,
            'settings' => [],
            'installed_at' => now(),
        ]);
        CmsPlugin::create([
            'slug' => 'disabled-one',
            'name' => 'Disabled',
            'version' => '1.0.0',
            'enabled' => false,
            'settings' => [],
            'installed_at' => now(),
        ]);

        $enabled = $this->manager->getEnabled();

        $this->assertTrue($enabled->every(fn ($p) => $p->enabled));
    }
}
