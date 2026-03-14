<?php

declare(strict_types=1);

namespace Tests\Unit\CMS;

use App\CMS\HookManager;
use PHPUnit\Framework\TestCase;

class HookManagerTest extends TestCase
{
    private HookManager $hookManager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hookManager = new HookManager();
    }

    public function test_register_and_fire_action_hook(): void
    {
        $called = false;
        $receivedArgs = [];

        $this->hookManager->hook('page.created', function (string $title) use (&$called, &$receivedArgs): void {
            $called = true;
            $receivedArgs[] = $title;
        });

        $this->hookManager->fire('page.created', 'Test Page');

        $this->assertTrue($called);
        $this->assertEquals(['Test Page'], $receivedArgs);
    }

    public function test_fire_multiple_hooks_on_same_event(): void
    {
        $results = [];

        $this->hookManager->hook('page.saved', function () use (&$results): void {
            $results[] = 'hook1';
        });

        $this->hookManager->hook('page.saved', function () use (&$results): void {
            $results[] = 'hook2';
        });

        $this->hookManager->fire('page.saved');

        $this->assertEquals(['hook1', 'hook2'], $results);
    }

    public function test_hook_priority_ordering(): void
    {
        $results = [];

        $this->hookManager->hook('page.saved', function () use (&$results): void {
            $results[] = 'low_priority';
        }, 20);

        $this->hookManager->hook('page.saved', function () use (&$results): void {
            $results[] = 'high_priority';
        }, 5);

        $this->hookManager->hook('page.saved', function () use (&$results): void {
            $results[] = 'default_priority';
        }, 10);

        $this->hookManager->fire('page.saved');

        $this->assertEquals(['high_priority', 'default_priority', 'low_priority'], $results);
    }

    public function test_fire_nonexistent_hook_does_nothing(): void
    {
        // Should not throw any exception
        $this->hookManager->fire('nonexistent.hook');

        $this->assertFalse($this->hookManager->hasHook('nonexistent.hook'));
    }

    public function test_register_and_apply_filter(): void
    {
        $this->hookManager->filter('page.title', function (string $title): string {
            return strtoupper($title);
        });

        $result = $this->hookManager->applyFilter('page.title', 'hello world');

        $this->assertEquals('HELLO WORLD', $result);
    }

    public function test_filter_chaining(): void
    {
        $this->hookManager->filter('page.title', function (string $title): string {
            return $title . ' - Suffix';
        });

        $this->hookManager->filter('page.title', function (string $title): string {
            return 'Prefix - ' . $title;
        });

        $result = $this->hookManager->applyFilter('page.title', 'Title');

        $this->assertEquals('Prefix - Title - Suffix', $result);
    }

    public function test_filter_chaining_with_priority(): void
    {
        $this->hookManager->filter('content', function (string $value): string {
            return $value . ' [second]';
        }, 20);

        $this->hookManager->filter('content', function (string $value): string {
            return $value . ' [first]';
        }, 10);

        $result = $this->hookManager->applyFilter('content', 'start');

        $this->assertEquals('start [first] [second]', $result);
    }

    public function test_apply_filter_returns_value_unchanged_when_no_filters_registered(): void
    {
        $result = $this->hookManager->applyFilter('nonexistent.filter', 'original');

        $this->assertEquals('original', $result);
    }

    public function test_filter_receives_extra_arguments(): void
    {
        $this->hookManager->filter('page.content', function (string $content, string $context): string {
            return $content . " ({$context})";
        });

        $result = $this->hookManager->applyFilter('page.content', 'Hello', 'admin');

        $this->assertEquals('Hello (admin)', $result);
    }

    public function test_remove_hook(): void
    {
        $called = false;

        $this->hookManager->hook('page.created', function () use (&$called): void {
            $called = true;
        });

        $this->assertTrue($this->hookManager->hasHook('page.created'));

        $this->hookManager->removeHook('page.created');

        $this->assertFalse($this->hookManager->hasHook('page.created'));

        $this->hookManager->fire('page.created');
        $this->assertFalse($called);
    }

    public function test_remove_filter(): void
    {
        $this->hookManager->filter('page.title', function (string $title): string {
            return strtoupper($title);
        });

        $this->assertTrue($this->hookManager->hasFilter('page.title'));

        $this->hookManager->removeFilter('page.title');

        $this->assertFalse($this->hookManager->hasFilter('page.title'));

        $result = $this->hookManager->applyFilter('page.title', 'hello');
        $this->assertEquals('hello', $result);
    }

    public function test_has_hook_returns_true_when_registered(): void
    {
        $this->hookManager->hook('test.hook', function (): void {});

        $this->assertTrue($this->hookManager->hasHook('test.hook'));
    }

    public function test_has_hook_returns_false_when_not_registered(): void
    {
        $this->assertFalse($this->hookManager->hasHook('nonexistent'));
    }

    public function test_has_filter_returns_true_when_registered(): void
    {
        $this->hookManager->filter('test.filter', function ($v) { return $v; });

        $this->assertTrue($this->hookManager->hasFilter('test.filter'));
    }

    public function test_has_filter_returns_false_when_not_registered(): void
    {
        $this->assertFalse($this->hookManager->hasFilter('nonexistent'));
    }

    public function test_hook_receives_multiple_arguments(): void
    {
        $receivedArgs = [];

        $this->hookManager->hook('page.updated', function (string $title, int $id) use (&$receivedArgs): void {
            $receivedArgs = ['title' => $title, 'id' => $id];
        });

        $this->hookManager->fire('page.updated', 'Test Page', 42);

        $this->assertEquals(['title' => 'Test Page', 'id' => 42], $receivedArgs);
    }
}
