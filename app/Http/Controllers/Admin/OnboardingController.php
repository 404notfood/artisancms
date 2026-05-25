<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsTheme;
use App\Models\Media;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Post;
use App\Services\HealthCheckService;
use App\Services\SettingService;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        private readonly SettingService $settingService,
        private readonly HealthCheckService $healthCheckService,
    ) {}

    public function __invoke(): Response
    {
        $steps = [
            [
                'id' => 'configure_settings',
                'title' => 'Configurer le site',
                'description' => 'Nom, URL, fuseau horaire et reglages globaux.',
                'href' => $this->adminPath('settings'),
                'completed' => filled($this->settingService->get('general.site_name')),
            ],
            [
                'id' => 'choose_theme',
                'title' => 'Choisir un theme',
                'description' => 'Activez un theme et verifiez son rendu public.',
                'href' => $this->adminPath('themes'),
                'completed' => CmsTheme::where('active', true)->exists(),
            ],
            [
                'id' => 'create_page',
                'title' => 'Creer une page',
                'description' => 'Publiez au moins une page pour construire la structure du site.',
                'href' => $this->adminPath('pages'),
                'completed' => Page::where('status', 'published')->exists(),
            ],
            [
                'id' => 'create_post',
                'title' => 'Creer un article',
                'description' => 'Ajoutez un premier contenu editorial.',
                'href' => $this->adminPath('posts'),
                'completed' => Post::exists(),
            ],
            [
                'id' => 'upload_media',
                'title' => 'Ajouter des medias',
                'description' => 'Images, fichiers et assets reutilisables.',
                'href' => $this->adminPath('media'),
                'completed' => Media::exists(),
            ],
            [
                'id' => 'create_menu',
                'title' => 'Configurer les menus',
                'description' => 'Construisez la navigation principale.',
                'href' => $this->adminPath('menus'),
                'completed' => Menu::exists(),
            ],
            [
                'id' => 'setup_seo',
                'title' => 'Verifier le SEO',
                'description' => 'Controlez sitemap, robots et metas globales.',
                'href' => $this->adminPath('seo'),
                'completed' => (bool) $this->settingService->get('seo.sitemap_enabled', true),
            ],
        ];

        $completed = collect($steps)->where('completed', true)->count();
        $health = $this->healthCheckService->runAll();

        return Inertia::render('Admin/Onboarding/Index', [
            'steps' => $steps,
            'completionPercentage' => (int) round(($completed / max(count($steps), 1)) * 100),
            'health' => $health,
            'quickLinks' => [
                ['label' => 'Tableau de bord', 'href' => $this->adminPath('')],
                ['label' => 'Builder pages', 'href' => $this->adminPath('pages')],
                ['label' => 'Import / Export', 'href' => $this->adminPath('import-export')],
                ['label' => 'Performance', 'href' => $this->adminPath('system/performance')],
                ['label' => 'Sauvegardes', 'href' => $this->adminPath('backups')],
            ],
        ]);
    }

    private function adminPath(string $path): string
    {
        $prefix = trim((string) $this->settingService->get('security.admin_prefix', 'admin'), '/');
        $path = trim($path, '/');

        return '/' . $prefix . ($path !== '' ? '/' . $path : '');
    }
}
