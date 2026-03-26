<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\BrandingController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EmailTemplateController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\PluginController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SiteController;
use App\Http\Controllers\Admin\TaxonomyController;
use App\Http\Controllers\Admin\TemplateController;
use App\Http\Controllers\Admin\ThemeController;
use App\Http\Controllers\Admin\AiAssistantController;
use App\Http\Controllers\Admin\CommentController;
use App\Http\Controllers\Admin\ContentEntryController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\ContentTypeController;
use App\Http\Controllers\Admin\CustomFieldController;
use App\Http\Controllers\Admin\GlobalSectionController;
use App\Http\Controllers\Admin\ImportExportController;
use App\Http\Controllers\Admin\NewsletterController;
use App\Http\Controllers\Admin\PopupController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RedirectController;
use App\Http\Controllers\Admin\WebhookController;
use App\Http\Controllers\Admin\BlockPatternController;
use App\Http\Controllers\Admin\PluginSettingsController;
use App\Http\Controllers\Admin\DesignTokenController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SystemController;
use App\Http\Controllers\Admin\UpdateController;
use App\Http\Controllers\Admin\WidgetController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
| All routes are prefixed with /admin and require authentication.
*/

// Dashboard
Route::get('/', DashboardController::class)->name('admin.dashboard');

// Account (Mon compte)
Route::get('account', [AccountController::class, 'edit'])->name('admin.account.edit');
Route::put('account', [AccountController::class, 'update'])->name('admin.account.update');
Route::put('account/password', [AccountController::class, 'updatePassword'])->name('admin.account.password');
Route::post('account/avatar', [AccountController::class, 'uploadAvatar'])->name('admin.account.avatar.upload');
Route::delete('account/avatar', [AccountController::class, 'removeAvatar'])->name('admin.account.avatar.remove');
Route::delete('account', [AccountController::class, 'destroy'])->name('admin.account.destroy');

// Pages
Route::resource('pages', PageController::class)->names('admin.pages');
Route::post('pages/{page}/restore', [PageController::class, 'restore'])->name('admin.pages.restore')->withTrashed();
Route::post('pages/{page}/publish', [PageController::class, 'publish'])->name('admin.pages.publish');
Route::post('pages/{page}/unpublish', [PageController::class, 'unpublish'])->name('admin.pages.unpublish');
Route::get('pages/{page}/builder', [PageController::class, 'builder'])->name('admin.pages.builder');
Route::put('pages/{page}/builder', [PageController::class, 'updateBuilder'])->name('admin.pages.builder.update');
Route::post('pages/{page}/submit-review', [PageController::class, 'submitForReview'])->name('admin.pages.submit-review');
Route::post('pages/{page}/approve', [PageController::class, 'approve'])->name('admin.pages.approve');
Route::post('pages/{page}/reject', [PageController::class, 'reject'])->name('admin.pages.reject');
Route::get('pages/{page}/revisions', [PageController::class, 'revisions'])->name('admin.pages.revisions');
Route::get('pages/{page}/revisions/{revision}/compare/{compare}', [PageController::class, 'compareRevisions'])->name('admin.pages.revisions.compare');
Route::post('pages/{page}/revisions/{revision}/restore', [PageController::class, 'restoreRevision'])->name('admin.pages.revisions.restore');
Route::post('pages/{page}/trash', [PageController::class, 'trash'])->name('admin.pages.trash');
Route::delete('pages/{page}/force-delete', [PageController::class, 'forceDelete'])->name('admin.pages.force-delete');
Route::post('pages/{page}/duplicate', [PageController::class, 'duplicate'])->name('admin.pages.duplicate');
Route::post('pages/empty-trash', [PageController::class, 'emptyTrash'])->name('admin.pages.empty-trash');
Route::post('pages/bulk', [PageController::class, 'bulk'])->name('admin.pages.bulk');
Route::post('pages/{page}/checkout', [PageController::class, 'checkout'])->name('admin.pages.checkout');
Route::post('pages/{page}/checkin', [PageController::class, 'checkin'])->name('admin.pages.checkin');

// Posts
Route::resource('posts', PostController::class)->names('admin.posts');
Route::post('posts/{post}/restore', [PostController::class, 'restore'])->name('admin.posts.restore')->withTrashed();
Route::post('posts/{post}/publish', [PostController::class, 'publish'])->name('admin.posts.publish');
Route::post('posts/{post}/unpublish', [PostController::class, 'unpublish'])->name('admin.posts.unpublish');
Route::post('posts/{post}/submit-review', [PostController::class, 'submitForReview'])->name('admin.posts.submit-review');
Route::post('posts/{post}/approve', [PostController::class, 'approve'])->name('admin.posts.approve');
Route::post('posts/{post}/reject', [PostController::class, 'reject'])->name('admin.posts.reject');
Route::post('posts/{post}/trash', [PostController::class, 'trash'])->name('admin.posts.trash');
Route::delete('posts/{post}/force-delete', [PostController::class, 'forceDelete'])->name('admin.posts.force-delete');
Route::post('posts/{post}/duplicate', [PostController::class, 'duplicate'])->name('admin.posts.duplicate');
Route::post('posts/empty-trash', [PostController::class, 'emptyTrash'])->name('admin.posts.empty-trash');
Route::post('posts/bulk', [PostController::class, 'bulk'])->name('admin.posts.bulk');
Route::post('posts/{post}/checkout', [PostController::class, 'checkout'])->name('admin.posts.checkout');
Route::post('posts/{post}/checkin', [PostController::class, 'checkin'])->name('admin.posts.checkin');
Route::get('posts/{post}/revisions', [PostController::class, 'revisions'])->name('admin.posts.revisions');
Route::get('posts/{post}/revisions/{revision}/compare/{compare}', [PostController::class, 'compareRevisions'])->name('admin.posts.revisions.compare');
Route::post('posts/{post}/revisions/{revision}/restore', [PostController::class, 'restoreRevision'])->name('admin.posts.revisions.restore');

// Users
Route::resource('users', UserController::class)->names('admin.users');
Route::post('users/{user}/avatar', [UserController::class, 'uploadAvatar'])->name('admin.users.avatar.upload');
Route::delete('users/{user}/avatar', [UserController::class, 'removeAvatar'])->name('admin.users.avatar.remove');

// Media
Route::get('media', [MediaController::class, 'index'])->name('admin.media.index');
Route::post('media', [MediaController::class, 'store'])->name('admin.media.store');
Route::get('media/folders', [MediaController::class, 'folders'])->name('admin.media.folders');
Route::get('media/orphans', [MediaController::class, 'orphans'])->name('admin.media.orphans');
Route::get('media/stock-search', [MediaController::class, 'stockSearch'])->name('admin.media.stock-search');
Route::post('media/stock-download', [MediaController::class, 'stockDownload'])->name('admin.media.stock-download');
Route::get('media/{media}', [MediaController::class, 'show'])->name('admin.media.show');
Route::put('media/{media}', [MediaController::class, 'update'])->name('admin.media.update');
Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('admin.media.destroy');
Route::post('media/{media}/crop', [MediaController::class, 'crop'])->name('admin.media.crop');
Route::post('media/{media}/replace', [MediaController::class, 'replace'])->name('admin.media.replace');

// Menus
Route::resource('menus', MenuController::class)->names('admin.menus')->except(['show']);
Route::post('menus/{menu}/items', [MenuController::class, 'storeItem'])->name('admin.menus.items.store');
Route::put('menus/{menu}/items/sync', [MenuController::class, 'syncItems'])->name('admin.menus.sync-items');
Route::put('menus/{menu}/items/reorder', [MenuController::class, 'reorderItems'])->name('admin.menus.items.reorder');
Route::put('menus/{menu}/items/{item}', [MenuController::class, 'updateItem'])->name('admin.menus.items.update');
Route::delete('menus/{menu}/items/{item}', [MenuController::class, 'destroyItem'])->name('admin.menus.items.destroy');

// Settings
Route::get('settings', [SettingController::class, 'index'])->name('admin.settings.index');
Route::put('settings', [SettingController::class, 'update'])->name('admin.settings.update');

// Taxonomies
Route::get('taxonomies', [TaxonomyController::class, 'index'])->name('admin.taxonomies.index');
Route::post('taxonomies', [TaxonomyController::class, 'store'])->name('admin.taxonomies.store');
Route::put('taxonomies/{taxonomy}', [TaxonomyController::class, 'update'])->name('admin.taxonomies.update');
Route::delete('taxonomies/{taxonomy}', [TaxonomyController::class, 'destroy'])->name('admin.taxonomies.destroy');

// Taxonomy Terms
Route::post('taxonomies/{taxonomy}/terms', [TaxonomyController::class, 'addTerm'])->name('admin.taxonomies.terms.store');
Route::put('taxonomy-terms/{taxonomyTerm}', [TaxonomyController::class, 'updateTerm'])->name('admin.taxonomies.terms.update');
Route::delete('taxonomy-terms/{taxonomyTerm}', [TaxonomyController::class, 'destroyTerm'])->name('admin.taxonomies.terms.destroy');

// Themes
Route::get('themes', [ThemeController::class, 'index'])->name('admin.themes.index');
Route::post('themes/upload', [ThemeController::class, 'upload'])->name('admin.themes.upload');
Route::post('themes/{slug}/activate', [ThemeController::class, 'activate'])->name('admin.themes.activate');
Route::delete('themes/{slug}', [ThemeController::class, 'destroy'])->name('admin.themes.destroy');
Route::get('themes/{slug}/customize', [ThemeController::class, 'customizePage'])->name('admin.themes.customize.page');
Route::put('themes/{slug}/customize', [ThemeController::class, 'customize'])->name('admin.themes.customize');

// Plugins
Route::get('plugins', [PluginController::class, 'index'])->name('admin.plugins.index');
Route::post('plugins/{slug}/enable', [PluginController::class, 'enable'])->name('admin.plugins.enable');
Route::post('plugins/{slug}/disable', [PluginController::class, 'disable'])->name('admin.plugins.disable');
Route::get('plugins/{slug}/settings', [PluginSettingsController::class, 'show'])->name('admin.plugins.settings');
Route::put('plugins/{slug}/settings', [PluginSettingsController::class, 'update'])->name('admin.plugins.settings.update');
Route::post('plugins/upload', [PluginController::class, 'upload'])->name('admin.plugins.upload');
Route::delete('plugins/{slug}', [PluginController::class, 'destroy'])->name('admin.plugins.destroy');

// Email Templates
Route::get('email-templates', [EmailTemplateController::class, 'index'])->name('admin.email-templates.index');
Route::get('email-templates/{emailTemplate}/edit', [EmailTemplateController::class, 'edit'])->name('admin.email-templates.edit');
Route::put('email-templates/{emailTemplate}', [EmailTemplateController::class, 'update'])->name('admin.email-templates.update');
Route::post('email-templates/{emailTemplate}/test', [EmailTemplateController::class, 'sendTest'])->name('admin.email-templates.test');
Route::post('email-templates/{emailTemplate}/reset', [EmailTemplateController::class, 'reset'])->name('admin.email-templates.reset');

// Webhooks
Route::resource('webhooks', WebhookController::class)->names('admin.webhooks')->except(['show']);
Route::post('webhooks/{webhook}/test', [WebhookController::class, 'test'])->name('admin.webhooks.test');
Route::get('webhooks/{webhook}/deliveries', [WebhookController::class, 'deliveries'])->name('admin.webhooks.deliveries');

// Analytics
Route::get('analytics', [AnalyticsController::class, 'index'])->name('admin.analytics');

// Branding (White-labeling)
Route::get('branding', [BrandingController::class, 'index'])->name('admin.branding.index');
Route::put('branding', [BrandingController::class, 'update'])->name('admin.branding.update');
Route::get('branding/export', [BrandingController::class, 'export'])->name('admin.branding.export');
Route::post('branding/import', [BrandingController::class, 'import'])->name('admin.branding.import');
Route::post('branding/reset', [BrandingController::class, 'reset'])->name('admin.branding.reset');

// Site Templates
Route::get('templates', [TemplateController::class, 'index'])->name('admin.templates.index');
Route::post('templates/export', [TemplateController::class, 'export'])->name('admin.templates.export');
Route::get('templates/{slug}/preview', [TemplateController::class, 'preview'])->name('admin.templates.preview');
Route::get('templates/{slug}/pages', [TemplateController::class, 'pages'])->name('admin.templates.pages');
Route::post('templates/{slug}/install', [TemplateController::class, 'install'])->name('admin.templates.install');
Route::post('templates/upload', [TemplateController::class, 'upload'])->name('admin.templates.upload');
Route::delete('templates/{slug}', [TemplateController::class, 'destroy'])->name('admin.templates.destroy');

// AI Assistant
Route::get('ai-assistant/settings', [AiAssistantController::class, 'settings'])->name('admin.ai-assistant.settings');
Route::post('ai-assistant/settings', [AiAssistantController::class, 'saveSettings'])->name('admin.ai-assistant.settings.save');

// Comments
Route::get('comments', [CommentController::class, 'index'])->name('admin.comments.index');
Route::post('comments/{comment}/approve', [CommentController::class, 'approve'])->name('admin.comments.approve');
Route::post('comments/{comment}/reject', [CommentController::class, 'reject'])->name('admin.comments.reject');
Route::post('comments/{comment}/spam', [CommentController::class, 'spam'])->name('admin.comments.spam');
Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('admin.comments.destroy');

// Custom Fields
Route::resource('custom-fields', CustomFieldController::class)->names('admin.custom-fields')->except(['show']);
Route::get('api/custom-fields/values', [CustomFieldController::class, 'apiValues'])->name('admin.custom-fields.values');

// Redirects
Route::resource('redirects', RedirectController::class)->except(['create', 'edit', 'show'])->names('admin.redirects');

// Sites (Multi-site)
Route::resource('sites', SiteController::class)->names('admin.sites')->except(['show']);
Route::post('sites/{site}/switch', [SiteController::class, 'switch'])->name('admin.sites.switch');

// Widgets (Sidebars)
Route::get('widgets', [WidgetController::class, 'index'])->name('admin.widgets.index');
Route::post('widget-areas', [WidgetController::class, 'storeArea'])->name('admin.widget-areas.store');
Route::put('widget-areas/{widgetArea}', [WidgetController::class, 'updateArea'])->name('admin.widget-areas.update');
Route::delete('widget-areas/{widgetArea}', [WidgetController::class, 'destroyArea'])->name('admin.widget-areas.destroy');
Route::post('widget-areas/{widgetArea}/widgets', [WidgetController::class, 'storeWidget'])->name('admin.widgets.store');
Route::put('widgets/{widget}', [WidgetController::class, 'updateWidget'])->name('admin.widgets.update');
Route::delete('widgets/{widget}', [WidgetController::class, 'destroyWidget'])->name('admin.widgets.destroy');
Route::put('widget-areas/{widgetArea}/reorder', [WidgetController::class, 'reorderWidgets'])->name('admin.widgets.reorder');

// Content Types (Custom Post Types)
Route::resource('content-types', ContentTypeController::class)->names('admin.content-types');

// Content Entries for each type
Route::get('content/{contentType}/entries', [ContentEntryController::class, 'index'])->name('admin.content-entries.index');
Route::get('content/{contentType}/entries/create', [ContentEntryController::class, 'create'])->name('admin.content-entries.create');
Route::post('content/{contentType}/entries', [ContentEntryController::class, 'store'])->name('admin.content-entries.store');
Route::get('content/{contentType}/entries/{contentEntry}/edit', [ContentEntryController::class, 'edit'])->name('admin.content-entries.edit');
Route::put('content/{contentType}/entries/{contentEntry}', [ContentEntryController::class, 'update'])->name('admin.content-entries.update');
Route::delete('content/{contentType}/entries/{contentEntry}', [ContentEntryController::class, 'destroy'])->name('admin.content-entries.destroy');

// Global Sections (Header/Footer Builder)
Route::resource('global-sections', GlobalSectionController::class)->names('admin.global-sections')->except(['show']);
Route::post('global-sections/{globalSection}/activate', [GlobalSectionController::class, 'activate'])->name('admin.global-sections.activate');

// Notifications
Route::get('notifications', [NotificationController::class, 'index'])->name('admin.notifications.index');
Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('admin.notifications.read');
Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('admin.notifications.read-all');

// Preview Links
Route::post('pages/{page}/preview', [PageController::class, 'generatePreview'])->name('admin.pages.preview');
Route::post('posts/{post}/preview', [PostController::class, 'generatePreview'])->name('admin.posts.preview');

// Import/Export
Route::get('import-export', [ImportExportController::class, 'index'])->name('admin.import-export');
Route::post('export', [ImportExportController::class, 'export'])->name('admin.export');
Route::post('import', [ImportExportController::class, 'import'])->name('admin.import');

// Newsletter
Route::get('newsletter', [NewsletterController::class, 'index'])->name('admin.newsletter');
Route::get('newsletter/export', [NewsletterController::class, 'export'])->name('admin.newsletter.export');
Route::delete('newsletter/{subscriber}', [NewsletterController::class, 'destroy'])->name('admin.newsletter.destroy');

// Popups
Route::resource('popups', PopupController::class)->names('admin.popups')->except(['show']);

// Design Tokens (Style Book)
Route::get('design-tokens', [DesignTokenController::class, 'index'])->name('admin.design-tokens.index');
Route::post('design-tokens', [DesignTokenController::class, 'store'])->name('admin.design-tokens.store');
Route::put('design-tokens/{designToken}', [DesignTokenController::class, 'update'])->name('admin.design-tokens.update');
Route::delete('design-tokens/{designToken}', [DesignTokenController::class, 'destroy'])->name('admin.design-tokens.destroy');
Route::post('design-tokens/seed-defaults', [DesignTokenController::class, 'seedDefaults'])->name('admin.design-tokens.seed');
Route::get('design-tokens/css', [DesignTokenController::class, 'css'])->name('admin.design-tokens.css');

// System (Sessions, Health Check)
Route::get('system/sessions', [SystemController::class, 'sessions'])->name('admin.system.sessions');
Route::delete('system/sessions/{session}', [SystemController::class, 'destroySession'])->name('admin.system.sessions.destroy');
Route::post('system/sessions/logout-all', [SystemController::class, 'logoutAllSessions'])->name('admin.system.sessions.logout-all');
Route::get('system/health', [SystemController::class, 'healthCheck'])->name('admin.system.health');

// Updates & Error Recovery
Route::get('updates', [UpdateController::class, 'index'])->name('admin.updates.index');
Route::get('updates/check', [UpdateController::class, 'check'])->name('admin.updates.check');
Route::post('updates/plugin/{slug}', [UpdateController::class, 'updatePlugin'])->name('admin.updates.plugin');
Route::post('updates/theme/{slug}', [UpdateController::class, 'updateTheme'])->name('admin.updates.theme');
Route::post('updates/all', [UpdateController::class, 'updateAll'])->name('admin.updates.all');
Route::post('updates/{updateLog}/rollback', [UpdateController::class, 'rollback'])->name('admin.updates.rollback');
Route::get('updates/settings', [UpdateController::class, 'settings'])->name('admin.updates.settings');
Route::post('updates/settings', [UpdateController::class, 'updateSettings'])->name('admin.updates.settings.save');
Route::post('updates/safe-mode', [UpdateController::class, 'toggleSafeMode'])->name('admin.updates.safe-mode');
Route::post('updates/recovery-token', [UpdateController::class, 'generateRecoveryToken'])->name('admin.updates.recovery-token');

// Roles (Settings)
Route::get('settings/roles', [RoleController::class, 'index'])->name('admin.roles.index');
Route::get('settings/roles/create', [RoleController::class, 'create'])->name('admin.roles.create');
Route::post('settings/roles', [RoleController::class, 'store'])->name('admin.roles.store');
Route::get('settings/roles/{role}/edit', [RoleController::class, 'edit'])->name('admin.roles.edit');
Route::put('settings/roles/{role}', [RoleController::class, 'update'])->name('admin.roles.update');
Route::delete('settings/roles/{role}', [RoleController::class, 'destroy'])->name('admin.roles.destroy');

// Block Patterns (JSON API for builder)
Route::get('block-patterns', [BlockPatternController::class, 'index'])->name('admin.block-patterns.index');
Route::post('block-patterns', [BlockPatternController::class, 'store'])->name('admin.block-patterns.store');
Route::put('block-patterns/{blockPattern}', [BlockPatternController::class, 'update'])->name('admin.block-patterns.update');
Route::delete('block-patterns/{blockPattern}', [BlockPatternController::class, 'destroy'])->name('admin.block-patterns.destroy');
