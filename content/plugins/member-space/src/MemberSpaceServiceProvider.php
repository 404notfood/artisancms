<?php

declare(strict_types=1);

namespace MemberSpace;

use App\CMS\Blocks\BlockRegistry;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use MemberSpace\Models\ContentRestriction;
use MemberSpace\Models\MemberCustomField;
use MemberSpace\Models\MemberProfile;
use MemberSpace\Models\MembershipPlan;
use MemberSpace\Models\MemberVerification;
use MemberSpace\Models\UserMembership;
use MemberSpace\Observers\MemberVerificationObserver;
use MemberSpace\Observers\UserMembershipObserver;
use MemberSpace\Policies\ContentRestrictionPolicy;
use MemberSpace\Policies\MemberCustomFieldPolicy;
use MemberSpace\Policies\MemberProfilePolicy;
use MemberSpace\Policies\MembershipPlanPolicy;
use MemberSpace\Services\ContentRestrictionService;
use MemberSpace\Services\CustomFieldService;
use MemberSpace\Services\MemberDirectoryService;
use MemberSpace\Services\MemberSettingsService;
use MemberSpace\Services\MembershipService;
use MemberSpace\Services\ProfileService;
use MemberSpace\Services\SocialLoginService;
use MemberSpace\Services\TwoFactorService;
use MemberSpace\Services\VerificationService;
use MemberSpace\Http\Middleware\CheckModuleEnabled;
use Illuminate\Support\ServiceProvider;

class MemberSpaceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Services with no constructor dependencies
        $this->app->singleton(MemberSettingsService::class);
        $this->app->singleton(ProfileService::class);
        $this->app->singleton(CustomFieldService::class);
        $this->app->singleton(SocialLoginService::class);
        $this->app->singleton(TwoFactorService::class);
        $this->app->singleton(ContentRestrictionService::class);

        // Services with constructor dependencies (auto-resolved by the container)
        $this->app->singleton(MemberDirectoryService::class);
        $this->app->singleton(MembershipService::class);
        $this->app->singleton(VerificationService::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'member-space');

        // Register dynamic relation on User model
        User::resolveRelationUsing('memberProfile', function (User $user) {
            return $user->hasOne(MemberProfile::class);
        });

        User::resolveRelationUsing('socialAccounts', function (User $user) {
            return $user->hasMany(\MemberSpace\Models\SocialAccount::class);
        });

        User::resolveRelationUsing('memberships', function (User $user) {
            return $user->hasMany(UserMembership::class);
        });

        User::resolveRelationUsing('activeMembership', function (User $user) {
            return $user->hasOne(UserMembership::class)->active()->latest();
        });

        // Register observers
        UserMembership::observe(UserMembershipObserver::class);
        MemberVerification::observe(MemberVerificationObserver::class);

        // Register policies
        Gate::policy(MemberProfile::class, MemberProfilePolicy::class);
        Gate::policy(MembershipPlan::class, MembershipPlanPolicy::class);
        Gate::policy(MemberCustomField::class, MemberCustomFieldPolicy::class);
        Gate::policy(ContentRestriction::class, ContentRestrictionPolicy::class);

        // Register middleware alias
        $router = $this->app->make(\Illuminate\Routing\Router::class);
        $router->aliasMiddleware('member.module', CheckModuleEnabled::class);

        // Configure Socialite providers dynamically
        $this->configureSocialite();

        // Register blocks
        $this->registerBlocks();
    }

    private function configureSocialite(): void
    {
        $this->app->booted(function () {
            try {
                $settings = app(MemberSettingsService::class);

                if (!$settings->isModuleEnabled('social_login')) {
                    return;
                }

                $socialSettings = $settings->get('social_login');
                $providers = ['google', 'facebook', 'github'];

                foreach ($providers as $provider) {
                    $clientId = $socialSettings["{$provider}_client_id"] ?? '';
                    $clientSecret = $socialSettings["{$provider}_client_secret"] ?? '';

                    if ($clientId && $clientSecret) {
                        config([
                            "services.{$provider}" => [
                                'client_id' => $clientId,
                                'client_secret' => $clientSecret,
                                'redirect' => url("/members/auth/social/{$provider}/callback"),
                            ],
                        ]);
                    }
                }
            } catch (\Throwable) {
                // Silently fail if DB not ready
            }
        });
    }

    private function registerBlocks(): void
    {
        $registry = $this->app->make(BlockRegistry::class);

        $blocks = [
            [
                'slug' => 'member-profile-card',
                'name' => 'Carte de profil membre',
                'category' => 'members',
                'icon' => 'user-circle',
                'schema' => [
                    'properties' => [
                        'userId' => ['type' => 'number', 'default' => null],
                        'showAvatar' => ['type' => 'boolean', 'default' => true],
                        'showBio' => ['type' => 'boolean', 'default' => true],
                        'showSocial' => ['type' => 'boolean', 'default' => true],
                        'style' => ['type' => 'string', 'default' => 'card', 'enum' => ['card', 'inline', 'minimal']],
                    ],
                ],
                'default_props' => [
                    'userId' => null,
                    'showAvatar' => true,
                    'showBio' => true,
                    'showSocial' => true,
                    'style' => 'card',
                ],
                'is_core' => false,
                'source' => 'member-space',
            ],
            [
                'slug' => 'member-directory',
                'name' => 'Annuaire des membres',
                'category' => 'members',
                'icon' => 'users',
                'schema' => [
                    'properties' => [
                        'perPage' => ['type' => 'number', 'default' => 12],
                        'layout' => ['type' => 'string', 'default' => 'grid', 'enum' => ['grid', 'list']],
                        'showSearch' => ['type' => 'boolean', 'default' => true],
                        'columns' => ['type' => 'number', 'default' => 3, 'minimum' => 2, 'maximum' => 4],
                    ],
                ],
                'default_props' => [
                    'perPage' => 12,
                    'layout' => 'grid',
                    'showSearch' => true,
                    'columns' => 3,
                ],
                'is_core' => false,
                'source' => 'member-space',
            ],
            [
                'slug' => 'membership-plans',
                'name' => 'Plans d\'abonnement',
                'category' => 'members',
                'icon' => 'crown',
                'schema' => [
                    'properties' => [
                        'columns' => ['type' => 'number', 'default' => 3, 'minimum' => 2, 'maximum' => 4],
                        'showFeatures' => ['type' => 'boolean', 'default' => true],
                        'highlightPopular' => ['type' => 'boolean', 'default' => true],
                        'style' => ['type' => 'string', 'default' => 'cards', 'enum' => ['cards', 'table']],
                    ],
                ],
                'default_props' => [
                    'columns' => 3,
                    'showFeatures' => true,
                    'highlightPopular' => true,
                    'style' => 'cards',
                ],
                'is_core' => false,
                'source' => 'member-space',
            ],
            [
                'slug' => 'login-form',
                'name' => 'Formulaire de connexion',
                'category' => 'members',
                'icon' => 'log-in',
                'schema' => [
                    'properties' => [
                        'showSocialLogin' => ['type' => 'boolean', 'default' => true],
                        'showRegisterLink' => ['type' => 'boolean', 'default' => true],
                        'redirectUrl' => ['type' => 'string', 'default' => '/members/account'],
                    ],
                ],
                'default_props' => [
                    'showSocialLogin' => true,
                    'showRegisterLink' => true,
                    'redirectUrl' => '/members/account',
                ],
                'is_core' => false,
                'source' => 'member-space',
            ],
            [
                'slug' => 'register-form',
                'name' => 'Formulaire d\'inscription',
                'category' => 'members',
                'icon' => 'user-plus',
                'schema' => [
                    'properties' => [
                        'showSocialLogin' => ['type' => 'boolean', 'default' => true],
                        'showLoginLink' => ['type' => 'boolean', 'default' => true],
                        'showCustomFields' => ['type' => 'boolean', 'default' => true],
                    ],
                ],
                'default_props' => [
                    'showSocialLogin' => true,
                    'showLoginLink' => true,
                    'showCustomFields' => true,
                ],
                'is_core' => false,
                'source' => 'member-space',
            ],
            [
                'slug' => 'restricted-content',
                'name' => 'Contenu restreint',
                'category' => 'members',
                'icon' => 'lock',
                'schema' => [
                    'properties' => [
                        'restrictionType' => ['type' => 'string', 'default' => 'logged_in', 'enum' => ['logged_in', 'role', 'plan']],
                        'message' => ['type' => 'string', 'default' => 'Ce contenu est reserve aux membres.'],
                        'showLoginButton' => ['type' => 'boolean', 'default' => true],
                    ],
                ],
                'default_props' => [
                    'restrictionType' => 'logged_in',
                    'message' => 'Ce contenu est reserve aux membres.',
                    'showLoginButton' => true,
                ],
                'is_core' => false,
                'source' => 'member-space',
            ],
        ];

        foreach ($blocks as $block) {
            $registry->register($block);
        }
    }
}
