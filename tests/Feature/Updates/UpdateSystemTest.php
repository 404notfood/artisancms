<?php

declare(strict_types=1);

namespace Tests\Feature\Updates;

use App\Models\Backup;
use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use App\Models\UpdateLog;
use App\Services\BackupService;
use App\Services\CoreUpdateService;
use App\Services\CorePackageInstaller;
use App\Services\ReleaseRegistry;
use App\Services\UpdateArchive;
use App\Services\UpdateLock;
use App\Services\UpdateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;
use Tests\Traits\CmsTestHelpers;
use ZipArchive;

class UpdateSystemTest extends TestCase
{
    use CmsTestHelpers, RefreshDatabase;

    private string $temporary;
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->temporary = sys_get_temp_dir() . '/cms-update-test-' . bin2hex(random_bytes(12));
        $this->root = $this->temporary . '/site';
        File::ensureDirectoryExists($this->root);
        File::ensureDirectoryExists($this->temporary . '/storage/framework');
        app()->useStoragePath($this->temporary . '/storage');
        File::put(storage_path('.installed'), '{}');
        config([
            'cms.version' => '1.0.0',
            'cms.registry.api_key' => 'test-registry-key',
            'cms.registry.storage_path' => $this->temporary . '/registry',
            'cms.updates.base_path' => $this->root,
            'cms.updates.temp_dir' => $this->temporary . '/downloads',
            'cms.paths.plugins' => $this->root . '/content/plugins',
            'cms.paths.themes' => $this->root . '/content/themes',
        ]);
        Http::preventStrayRequests();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        if (isset($this->temporary) && str_starts_with($this->temporary, sys_get_temp_dir() . '/cms-update-test-')) {
            File::deleteDirectory($this->temporary);
        }
    }

    public function test_registry_requires_authentication_and_complete_release_metadata(): void
    {
        $this->postJson('/api/internal/releases', $this->release())->assertUnauthorized();
        $this->withToken('test-registry-key')->postJson('/api/internal/releases', [
            'type' => 'theme', 'version' => '2.0.0', 'tag' => 'v2.0.0', 'download_url' => 'https://releases.example/theme.zip',
        ])->assertUnprocessable()->assertJsonValidationErrors(['slug', 'checksum_sha256']);
    }

    public function test_registered_versions_persist_and_use_semantic_order(): void
    {
        foreach (['1.10.0', '1.2.0'] as $version) {
            $this->withToken('test-registry-key')->postJson('/api/internal/releases', $this->release($version))->assertOk();
        }
        $this->getJson('/api/v1/version')->assertOk()
            ->assertJsonPath('version', '1.10.0')->assertJsonPath('checksum_sha256', str_repeat('a', 64));
        $this->assertSame('1.10.0', (new ReleaseRegistry())->latest('cms')['version']);
        $this->postJson('/api/v1/check-updates', ['cms_version' => '1.0.0'])->assertOk()
            ->assertJsonPath('cms.update_available', true)->assertJsonPath('cms.latest', '1.10.0');
    }

    public function test_registry_does_not_invent_downloadable_updates(): void
    {
        $this->postJson('/api/v1/check-updates', ['cms_version' => '1.0.0', 'themes' => ['default' => '1.0.0']])
            ->assertOk()->assertJsonPath('cms.update_available', false)
            ->assertJsonPath('themes.default.update_available', false);
    }

    public function test_extension_release_provides_checksum_and_download(): void
    {
        $release = [...$this->release('2.0.0'), 'type' => 'theme', 'slug' => 'my-theme'];
        $this->withToken('test-registry-key')->postJson('/api/internal/releases', $release)->assertOk();
        $this->postJson('/api/v1/check-updates', ['themes' => ['my-theme' => '1.0.0']])->assertOk()
            ->assertJsonPath('themes.my-theme.update_available', true)
            ->assertJsonPath('themes.my-theme.checksum_sha256', $release['checksum_sha256']);
        $this->get('/api/v1/themes/my-theme/download')->assertRedirect($release['download_url']);
        $this->getJson('/api/v1/catalog')->assertOk()->assertJsonFragment(['slug' => 'my-theme', 'version' => '2.0.0']);
        $this->getJson('/api/v1/themes/unknown/download')->assertNotFound();
    }

    public function test_registry_rejects_slug_path_traversal(): void
    {
        $this->postJson('/api/v1/check-updates', ['plugins' => ['../private' => '1.0.0']])->assertUnprocessable();
        $this->withToken('test-registry-key')->postJson('/api/internal/releases', [
            ...$this->release(), 'type' => 'plugin', 'slug' => '../evil',
        ])->assertUnprocessable();
    }

    public function test_archive_rejects_paths_and_symbolic_links_before_extracting(): void
    {
        foreach (['../escape.php', 'folder/../../escape.php', 'folder\\escape.php', '/absolute.php', 'C:/absolute.php', 'folder/CON.txt', 'folder/name.'] as $index => $name) {
            $archive = $this->zip([$name => 'bad']);
            try {
                app(UpdateArchive::class)->extract($archive, $this->temporary . '/unpacked-' . $index);
                $this->fail('Unsafe archive accepted');
            } catch (\RuntimeException $e) {
                $this->assertStringContainsString('Archive refusée', $e->getMessage());
            }
        }
        $archive = $this->zip(['link' => '/etc/passwd']);
        $zip = new ZipArchive();
        $zip->open($archive);
        $zip->setExternalAttributesName('link', ZipArchive::OPSYS_UNIX, 0120777 << 16);
        $zip->close();
        $this->expectExceptionMessage('Archive refusée');
        app(UpdateArchive::class)->extract($archive, $this->temporary . '/symlink');
    }

    public function test_checksum_failure_does_not_change_core_or_enter_maintenance(): void
    {
        $this->write($this->root . '/app/original.php', 'original');
        Http::fake(['https://releases.example/core.zip' => Http::response('corrupted')]);
        $backup = $this->mock(BackupService::class);
        $backup->shouldNotReceive('create');
        try {
            app(CoreUpdateService::class)->install($this->info(str_repeat('a', 64)));
            $this->fail('Invalid checksum accepted');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('SHA-256', $e->getMessage());
        }
        $this->assertSame('original', File::get($this->root . '/app/original.php'));
        $this->assertFalse(app()->isDownForMaintenance());
        $this->assertSame('failed', UpdateLog::latest('id')->first()->status);
    }

    public function test_core_update_preserves_site_files_and_can_restore_previous_code(): void
    {
        $this->write($this->root . '/app/old.php', 'old');
        $this->write($this->root . '/bootstrap/cache/services.php', 'old cache');
        foreach (['.env', 'storage/app/public/photo.jpg', 'content/themes/custom/file.php', 'content/plugins/custom/file.php', 'public/uploads/image.jpg'] as $path) {
            $this->write($this->root . '/' . $path, 'keep');
        }
        $info = $this->fakeCoreRelease();
        Process::fake();
        $this->fakeDatabaseBackup();
        $log = app(CoreUpdateService::class)->install($info);
        $this->assertSame('completed', $log->status);
        $this->assertSame('1.1.0', trim(File::get($this->root . '/VERSION')));
        $this->assertFileDoesNotExist($this->root . '/bootstrap/cache/services.php');
        $this->assertFileDoesNotExist($this->root . '/app/old.php');
        $this->assertSame('keep', File::get($this->root . '/.env'));
        $this->assertSame('keep', File::get($this->root . '/content/plugins/custom/file.php'));
        $this->assertSame('keep', File::get($this->root . '/storage/app/public/photo.jpg'));
        $this->assertSame('keep', File::get($this->root . '/content/themes/custom/file.php'));
        $this->assertSame('keep', File::get($this->root . '/public/uploads/image.jpg'));
        $this->assertFalse(app()->isDownForMaintenance());
        $this->assertTrue(app(CoreUpdateService::class)->rollback($log));
        $this->assertSame('old', File::get($this->root . '/app/old.php'));
        $this->assertFileDoesNotExist($this->root . '/app/new.php');
        $this->assertSame('rolled_back', $log->fresh()->status);
    }

    public function test_failed_migration_restores_files_and_database_backup(): void
    {
        $this->write($this->root . '/app/old.php', 'old');
        $info = $this->fakeCoreRelease();
        Process::fake(fn ($process) => in_array('migrate', (array) $process->command, true)
            ? Process::result(errorOutput: 'migration failed', exitCode: 1)
            : Process::result());
        $backup = $this->fakeDatabaseBackup();
        $backup->shouldReceive('restore')->once();
        try {
            app(CoreUpdateService::class)->install($info);
            $this->fail('Migration failure ignored');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('migration failed', $e->getMessage());
        }
        $this->assertSame('old', File::get($this->root . '/app/old.php'));
        $this->assertFileDoesNotExist($this->root . '/app/new.php');
        $this->assertFalse(app()->isDownForMaintenance());
        $this->assertSame('failed', UpdateLog::latest('id')->first()->status);
    }

    public function test_update_lock_survives_cache_clear_and_rejects_concurrent_install(): void
    {
        $this->expectExceptionMessage('déjà en cours');
        app(UpdateLock::class)->run(function () {
            \Illuminate\Support\Facades\Cache::flush();
            app(UpdateLock::class)->run(fn () => null);
        });
    }

    public function test_database_backup_failure_aborts_before_replacing_code(): void
    {
        $this->write($this->root . '/app/old.php', 'old');
        $info = $this->fakeCoreRelease();
        Process::fake();
        $this->mock(BackupService::class)->shouldReceive('create')->andThrow(new \RuntimeException('backup unavailable'));
        try {
            app(CoreUpdateService::class)->install($info);
            $this->fail('Backup failure ignored');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('backup unavailable', $e->getMessage());
        }
        $this->assertSame('old', File::get($this->root . '/app/old.php'));
        $this->assertFalse(app()->isDownForMaintenance());
    }

    public function test_verified_archive_with_wrong_version_is_rejected_before_install(): void
    {
        $this->write($this->root . '/app/old.php', 'old');
        $info = [...$this->fakeCoreRelease(), 'latest' => '1.2.0'];
        $this->mock(BackupService::class)->shouldNotReceive('create');
        try {
            app(CoreUpdateService::class)->install($info);
            $this->fail('Wrong version accepted');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('version annoncée', $e->getMessage());
        }
        $this->assertSame('old', File::get($this->root . '/app/old.php'));
        $this->assertFalse(app()->isDownForMaintenance());
    }

    public function test_incomplete_recovery_keeps_maintenance_enabled(): void
    {
        $info = $this->fakeCoreRelease();
        Process::fake(fn ($process) => in_array('migrate', (array) $process->command, true)
            ? Process::result(exitCode: 1) : Process::result());
        $this->fakeDatabaseBackup();
        $this->partialMock(CorePackageInstaller::class)->shouldReceive('restore')->andThrow(new \RuntimeException('disk unavailable'));
        try {
            app(CoreUpdateService::class)->install($info);
            $this->fail('Restore failure ignored');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Restauration incomplète', $e->getMessage());
        }
        $this->assertTrue(app()->isDownForMaintenance());
        $this->assertSame('failed', UpdateLog::latest('id')->first()->status);
    }

    public function test_manual_code_rollback_refuses_to_overwrite_database_changes(): void
    {
        $log = UpdateLog::create([
            'type' => 'cms', 'from_version' => '1.0.0', 'to_version' => '1.1.0', 'status' => 'completed',
            'backup_path' => ['schema_changed' => true],
        ]);
        $this->expectExceptionMessage('restauration complète');
        app(CoreUpdateService::class)->rollback($log);
    }

    public function test_subscriber_cannot_trigger_core_install(): void
    {
        $this->actingAs($this->createSubscriber())->postJson('/admin/updates/core')->assertForbidden();
    }

    public function test_admin_can_request_core_install(): void
    {
        $this->actingAs($this->createAdmin());
        $this->mock(UpdateService::class)->shouldReceive('updateCore')->once()->andReturn(new UpdateLog(['status' => 'completed']));
        $this->postJson('/admin/updates/core')->assertOk()->assertJsonPath('success', true);
    }

    public function test_theme_update_uses_published_checksum_and_preserves_customization(): void
    {
        $slug = 'sample';
        $theme = CmsTheme::create(['slug' => $slug, 'name' => 'Sample', 'version' => '1.0.0', 'active' => true, 'customizations' => ['color' => 'red']]);
        $directory = config('cms.paths.themes') . '/' . $slug;
        $this->write($directory . '/artisan-theme.json', json_encode(['slug' => $slug, 'version' => '1.0.0']));
        $this->write($directory . '/old.css', 'old');
        $archive = $this->zip(['sample/artisan-theme.json' => json_encode(['slug' => $slug, 'version' => '1.1.0']), 'sample/new.css' => 'new']);
        $payload = File::get($archive);
        Http::fake([
            '*check-updates' => Http::response(['themes' => [$slug => [
                'latest' => '1.1.0', 'update_available' => true, 'download_url' => 'https://releases.example/theme.zip', 'checksum_sha256' => hash('sha256', $payload),
            ]]]),
            'https://releases.example/theme.zip' => Http::response($payload),
        ]);
        $log = app(UpdateService::class)->updateTheme($slug);
        $this->assertSame('completed', $log->status);
        $this->assertSame('1.1.0', $theme->fresh()->version);
        $this->assertSame(['color' => 'red'], $theme->fresh()->customizations);
        $this->assertFileDoesNotExist($directory . '/old.css');
        $this->assertFileExists($directory . '/new.css');
        $this->assertTrue(app(UpdateService::class)->rollback($log));
        $this->assertSame('1.0.0', $theme->fresh()->version);
        $this->assertFileExists($directory . '/old.css');
        $this->assertFileDoesNotExist($directory . '/new.css');
    }

    public function test_plugin_update_installs_verified_release(): void
    {
        $plugin = CmsPlugin::create(['slug' => 'sample', 'name' => 'Sample', 'version' => '1.0.0', 'enabled' => true]);
        $directory = config('cms.paths.plugins') . '/sample';
        $this->write($directory . '/artisan-plugin.json', '{"slug":"sample","version":"1.0.0"}');
        $archive = $this->zip(['artisan-plugin.json' => '{"slug":"sample","version":"1.1.0"}']);
        $payload = File::get($archive);
        Http::fake([
            '*check-updates' => Http::response(['plugins' => ['sample' => [
                'latest' => '1.1.0', 'update_available' => true, 'download_url' => 'https://releases.example/plugin.zip', 'checksum_sha256' => hash('sha256', $payload),
            ]]]),
            'https://releases.example/plugin.zip' => Http::response($payload),
        ]);
        Artisan::shouldReceive('call')->with('config:cache')->once()->andReturn(0);
        $log = app(UpdateService::class)->updatePlugin('sample');
        $this->assertSame('completed', $log->status);
        $this->assertSame('1.1.0', $plugin->fresh()->version);
    }

    private function release(string $version = '1.1.0'): array
    {
        return ['type' => 'cms', 'version' => $version, 'tag' => 'v' . $version, 'download_url' => 'https://releases.example/core.zip', 'checksum_sha256' => str_repeat('a', 64)];
    }

    private function info(string $hash): array
    {
        return ['latest' => '1.1.0', 'available' => true, 'download_url' => 'https://releases.example/core.zip', 'checksum' => $hash];
    }

    private function fakeCoreRelease(): array
    {
        $files = [
            'artisan' => '<?php', 'VERSION' => '1.1.0', 'composer.json' => '{"name":"artisancms/artisancms"}', 'composer.lock' => '{}',
            'vendor/autoload.php' => '<?php', 'vendor/composer/platform_check.php' => '<?php',
            'bootstrap/app.php' => '<?php', 'bootstrap/providers.php' => '<?php', 'config/cms.php' => "<?php return ['version' => '1.1.0'];",
            'public/build/manifest.json' => '{}', 'public/index.php' => '<?php', 'app/new.php' => 'new', 'routes/web.php' => '<?php',
            'resources/example.txt' => 'new', 'database/migrations/new.php' => '<?php',
            '.env' => 'must not be copied', 'storage/app/public/photo.jpg' => 'must not be copied',
        ];
        $archive = $this->zip($files);
        $payload = File::get($archive);
        Http::fake(['https://releases.example/core.zip' => Http::response($payload)]);

        return $this->info(hash('sha256', $payload));
    }

    private function fakeDatabaseBackup(): \Mockery\MockInterface
    {
        $backup = Backup::create(['filename' => 'test.tar', 'path' => 'backups/test.tar', 'type' => 'database', 'status' => 'completed', 'disk' => 'local']);
        $mock = $this->mock(BackupService::class);
        $mock->shouldReceive('create')->with('database')->once()->andReturn($backup);

        return $mock;
    }

    private function zip(array $files): string
    {
        $path = $this->temporary . '/' . bin2hex(random_bytes(8)) . '.zip';
        $zip = new ZipArchive();
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach ($files as $name => $content) {
            $zip->addFromString($name, $content);
        }
        $zip->close();

        return $path;
    }

    private function write(string $path, string $contents): void
    {
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $contents);
    }
}
