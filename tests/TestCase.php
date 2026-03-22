<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Create the .installed sentinel file so EnsureInstalled middleware
        // doesn't redirect all requests to /install during tests.
        $path = storage_path('.installed');
        if (!file_exists($path)) {
            file_put_contents($path, json_encode([
                'version' => '1.0.0',
                'installed_at' => now()->toISOString(),
            ]));
        }
    }

    protected function tearDown(): void
    {
        // Clean up the sentinel file after tests.
        $path = storage_path('.installed');
        if (file_exists($path)) {
            unlink($path);
        }

        parent::tearDown();
    }
}
