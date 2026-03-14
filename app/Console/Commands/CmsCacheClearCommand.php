<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Page;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CmsCacheClearCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'cms:cache:clear {--group= : Groupe specifique (settings, themes, plugins, blocks, menus, pages)}';

    /**
     * @var string
     */
    protected $description = 'Vider le cache CMS';

    /**
     * @var list<string>
     */
    protected array $validGroups = ['settings', 'themes', 'plugins', 'blocks', 'menus', 'pages'];

    public function handle(): int
    {
        $group = $this->option('group');

        if ($group !== null) {
            if (!in_array($group, $this->validGroups, true)) {
                $this->error("Groupe inconnu : {$group}");
                $this->line('Groupes valides : ' . implode(', ', $this->validGroups));

                return self::FAILURE;
            }

            $this->clearGroup($group);
            $this->info("Cache CMS '{$group}' vide.");

            return self::SUCCESS;
        }

        // Clear all groups
        foreach ($this->validGroups as $g) {
            $this->clearGroup($g);
        }

        $this->info('Tout le cache CMS a ete vide.');

        return self::SUCCESS;
    }

    protected function clearGroup(string $group): void
    {
        match ($group) {
            'settings' => $this->clearSettingsCache(),
            'themes' => $this->clearThemesCache(),
            'plugins' => $this->clearPluginsCache(),
            'blocks' => $this->clearBlocksCache(),
            'menus' => $this->clearMenusCache(),
            'pages' => $this->clearPagesCache(),
        };

        $this->line("  - {$group} : vide");
    }

    protected function clearSettingsCache(): void
    {
        Cache::forget('cms.settings.all');
    }

    protected function clearThemesCache(): void
    {
        Cache::forget('cms.themes.discovered');
        Cache::forget('cms.theme.active_slug');
        Cache::forget('cms.theme.css_variables');
    }

    protected function clearPluginsCache(): void
    {
        Cache::forget('cms.plugins.enabled');
    }

    protected function clearBlocksCache(): void
    {
        Cache::forget('cms.blocks.registry');
    }

    protected function clearMenusCache(): void
    {
        foreach (['header', 'footer', 'sidebar'] as $location) {
            Cache::forget("cms.menus.{$location}");
        }
    }

    protected function clearPagesCache(): void
    {
        $slugs = Page::pluck('slug');

        foreach ($slugs as $slug) {
            Cache::forget("cms.pages.{$slug}");
        }
    }
}
