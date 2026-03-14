# Blueprint 26 - Systeme de templates email

## Vue d'ensemble
Le systeme de templates email est une fonctionnalite **core** d'ArtisanCMS qui permet de gerer visuellement tous les emails transactionnels envoyes par le CMS. Plutot qu'un simple editeur WYSIWYG, il propose un **editeur structure base sur les composants** (header, body, button, footer) avec preview en temps reel, variables dynamiques et envoi de test.

**Objectifs :**
- Centraliser tous les emails du CMS dans une interface admin unique
- Permettre la personnalisation visuelle sans toucher au code
- Supporter les variables dynamiques (`{{ user.name }}`, `{{ site.name }}`, etc.)
- Fournir un layout HTML responsive compatible avec les principaux clients mail (Gmail, Outlook, Apple Mail, Yahoo)
- Permettre aux plugins d'enregistrer leurs propres templates et variables
- Preview en temps reel et envoi de test avant mise en production

---

## 1. Table : email_templates

```php
Schema::create('email_templates', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();               // 'welcome', 'password-reset', 'form-submission'
    $table->string('name');                          // Nom affiche dans l'admin
    $table->string('subject');                       // Sujet, peut contenir des variables {{ }}
    $table->text('body_html');                       // HTML complet avec variables {{ }}
    $table->text('body_text')->nullable();           // Version texte brut (fallback)
    $table->json('variables');                       // Liste des variables disponibles avec descriptions
    $table->string('category');                      // auth, notification, marketing, form
    $table->boolean('is_system')->default(false);    // true = cree par le core, non supprimable
    $table->boolean('enabled')->default(true);       // Activer/desactiver l'envoi
    $table->json('default_body_html')->nullable();   // Backup du HTML original pour le reset
    $table->json('default_subject')->nullable();     // Backup du sujet original pour le reset
    $table->timestamps();

    $table->index('category');
    $table->index('enabled');
});
```

### Structure de la colonne `variables`

```json
[
    {
        "key": "user.name",
        "label": "Nom de l'utilisateur",
        "example": "Jean Dupont"
    },
    {
        "key": "site.name",
        "label": "Nom du site",
        "example": "Mon Site"
    },
    {
        "key": "reset_url",
        "label": "Lien de reinitialisation",
        "example": "https://monsite.com/reset-password?token=abc123"
    }
]
```

---

## 2. Templates par defaut

| Slug | Categorie | Variables | Description |
|------|-----------|-----------|-------------|
| `welcome` | auth | `user.name`, `site.name`, `login_url` | Email de bienvenue apres inscription |
| `password-reset` | auth | `user.name`, `reset_url`, `expiry` | Reinitialisation du mot de passe |
| `email-verification` | auth | `user.name`, `verify_url` | Verification de l'adresse email |
| `form-submission` | form | `form.name`, `fields.*`, `site.name` | Notification admin de soumission de formulaire |
| `form-confirmation` | form | `user.name`, `form.name`, `fields.*` | Confirmation envoyee a l'utilisateur apres soumission |
| `new-user-admin` | notification | `user.name`, `user.email`, `admin_url` | Notification admin d'un nouveau compte |
| `backup-completed` | notification | `backup.size`, `backup.date`, `site.name` | Notification de sauvegarde terminee |
| `backup-failed` | notification | `error_message`, `backup.date`, `site.name` | Notification d'echec de sauvegarde |

---

## 3. Modele EmailTemplate

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'subject',
        'body_html',
        'body_text',
        'variables',
        'category',
        'is_system',
        'enabled',
        'default_body_html',
        'default_subject',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_system' => 'boolean',
        'enabled' => 'boolean',
    ];

    /**
     * Scopes
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Recuperer un template par son slug (avec cache).
     */
    public static function findBySlug(string $slug): ?self
    {
        return cache()->remember(
            "email_template:{$slug}",
            now()->addHours(24),
            fn () => static::where('slug', $slug)->first()
        );
    }

    /**
     * Invalider le cache lors de la mise a jour.
     */
    protected static function booted(): void
    {
        static::saved(function (self $template) {
            cache()->forget("email_template:{$template->slug}");
            cache()->forget('email_templates:all');
        });

        static::deleted(function (self $template) {
            cache()->forget("email_template:{$template->slug}");
            cache()->forget('email_templates:all');
        });
    }

    /**
     * Liste des categories disponibles.
     */
    public static function categories(): array
    {
        return [
            'auth' => __('cms.email.category.auth'),
            'notification' => __('cms.email.category.notification'),
            'marketing' => __('cms.email.category.marketing'),
            'form' => __('cms.email.category.form'),
        ];
    }

    /**
     * Obtenir les noms des variables (cles uniquement).
     */
    public function getVariableKeysAttribute(): array
    {
        return collect($this->variables)->pluck('key')->all();
    }
}
```

---

## 4. EmailTemplateService

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Str;
use Illuminate\Mail\Message;
use App\CMS\Facades\CMS;

class EmailTemplateService
{
    /**
     * Compiler un template avec les variables fournies.
     *
     * @param string $slug    Slug du template
     * @param array  $variables Variables a injecter (dot notation supportee)
     * @return array{subject: string, html: string, text: string|null}
     *
     * @throws \InvalidArgumentException Si le template n'existe pas ou est desactive
     */
    public function render(string $slug, array $variables = []): array
    {
        $template = EmailTemplate::findBySlug($slug);

        if (! $template) {
            throw new \InvalidArgumentException(
                __('cms.email.template_not_found', ['slug' => $slug])
            );
        }

        if (! $template->enabled) {
            throw new \InvalidArgumentException(
                __('cms.email.template_disabled', ['slug' => $slug])
            );
        }

        // Permettre aux plugins d'ajouter des variables
        $variables = CMS::filter('email.template_variables', $variables, $slug);

        // Ajouter les variables globales du site
        $variables = $this->mergeGlobalVariables($variables);

        // Compiler le sujet
        $subject = $this->compileString($template->subject, $variables);

        // Compiler le body HTML en l'enveloppant dans le layout de base
        $bodyHtml = $this->compileString($template->body_html, $variables);
        $html = $this->wrapInLayout($bodyHtml, $subject);

        // Compiler le body text (ou generer depuis le HTML)
        $text = $template->body_text
            ? $this->compileString($template->body_text, $variables)
            : $this->htmlToPlainText($html);

        return [
            'subject' => $subject,
            'html' => $html,
            'text' => $text,
        ];
    }

    /**
     * Compiler une chaine avec des variables {{ }}.
     *
     * Supporte la dot notation : {{ user.name }} cherche $variables['user']['name']
     * ou $variables['user.name'].
     */
    protected function compileString(string $template, array $variables): string
    {
        return preg_replace_callback('/\{\{\s*(.+?)\s*\}\}/', function ($matches) use ($variables) {
            $key = trim($matches[1]);
            return $this->resolveVariable($key, $variables) ?? $matches[0];
        }, $template);
    }

    /**
     * Resoudre une variable en dot notation.
     */
    protected function resolveVariable(string $key, array $variables): ?string
    {
        // Essayer d'abord la cle directe
        if (isset($variables[$key])) {
            return $this->formatValue($variables[$key]);
        }

        // Essayer en dot notation
        $value = data_get($variables, $key);

        if ($value !== null) {
            return $this->formatValue($value);
        }

        return null;
    }

    /**
     * Formater une valeur pour l'affichage dans un email.
     */
    protected function formatValue(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? __('cms.common.yes') : __('cms.common.no');
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('d/m/Y H:i');
        }

        if (is_array($value)) {
            return $this->formatArrayForEmail($value);
        }

        return e((string) $value);
    }

    /**
     * Formater un tableau (ex: champs de formulaire) pour l'affichage email.
     */
    protected function formatArrayForEmail(array $data): string
    {
        $lines = [];

        foreach ($data as $key => $value) {
            $label = is_string($key) ? Str::headline($key) : '';
            $val = is_array($value) ? implode(', ', $value) : (string) $value;

            if ($label) {
                $lines[] = "<strong>" . e($label) . " :</strong> " . e($val);
            } else {
                $lines[] = e($val);
            }
        }

        return implode('<br>', $lines);
    }

    /**
     * Fusionner les variables globales du site.
     */
    protected function mergeGlobalVariables(array $variables): array
    {
        $siteSettings = cache()->remember('email_global_variables', now()->addHours(1), function () {
            return [
                'site' => [
                    'name' => setting('general.site_name', config('app.name')),
                    'url' => config('app.url'),
                    'logo_url' => setting('general.logo_url', ''),
                ],
                'current_year' => date('Y'),
            ];
        });

        return array_merge($siteSettings, $variables);
    }

    /**
     * Envelopper le contenu HTML dans le layout de base.
     */
    protected function wrapInLayout(string $bodyHtml, string $subject = ''): string
    {
        $layout = $this->getBaseLayout();

        return str_replace(
            ['{{CONTENT}}', '{{SUBJECT}}'],
            [$bodyHtml, e($subject)],
            $layout
        );
    }

    /**
     * Obtenir les variables disponibles pour un template.
     *
     * @param string $slug Slug du template
     * @return array Liste des variables avec cle, label et exemple
     */
    public function getAvailableVariables(string $slug): array
    {
        $template = EmailTemplate::findBySlug($slug);

        if (! $template) {
            return [];
        }

        $variables = $template->variables ?? [];

        // Ajouter les variables globales toujours disponibles
        $globalVariables = [
            ['key' => 'site.name', 'label' => __('cms.email.var.site_name'), 'example' => 'Mon Site'],
            ['key' => 'site.url', 'label' => __('cms.email.var.site_url'), 'example' => 'https://monsite.com'],
            ['key' => 'site.logo_url', 'label' => __('cms.email.var.site_logo'), 'example' => 'https://monsite.com/logo.png'],
            ['key' => 'current_year', 'label' => __('cms.email.var.current_year'), 'example' => date('Y')],
        ];

        // Permettre aux plugins d'ajouter des variables
        $pluginVariables = CMS::filter('email.available_variables', [], $slug);

        return array_merge($globalVariables, $variables, $pluginVariables);
    }

    /**
     * Envoyer un email de test.
     *
     * @param string $slug  Slug du template
     * @param string $email Adresse email de destination
     * @return bool
     */
    public function sendTest(string $slug, string $email): bool
    {
        $template = EmailTemplate::findBySlug($slug);

        if (! $template) {
            throw new \InvalidArgumentException(
                __('cms.email.template_not_found', ['slug' => $slug])
            );
        }

        // Generer des donnees de test a partir des exemples
        $testVariables = $this->buildTestVariables($template);

        $rendered = $this->render($slug, $testVariables);

        Mail::html($rendered['html'], function (Message $message) use ($email, $rendered) {
            $message->to($email)
                ->subject('[TEST] ' . $rendered['subject']);
        });

        return true;
    }

    /**
     * Construire des variables de test a partir des exemples du template.
     */
    protected function buildTestVariables(EmailTemplate $template): array
    {
        $variables = [];

        foreach ($template->variables as $variable) {
            $key = $variable['key'];
            $example = $variable['example'] ?? $key;

            data_set($variables, $key, $example);
        }

        return $variables;
    }

    /**
     * Reinitialiser un template a sa version par defaut.
     *
     * @param string $slug Slug du template
     * @return bool
     *
     * @throws \InvalidArgumentException Si le template n'est pas un template systeme
     */
    public function resetToDefault(string $slug): bool
    {
        $template = EmailTemplate::findBySlug($slug);

        if (! $template) {
            throw new \InvalidArgumentException(
                __('cms.email.template_not_found', ['slug' => $slug])
            );
        }

        if (! $template->is_system) {
            throw new \InvalidArgumentException(
                __('cms.email.cannot_reset_custom')
            );
        }

        if ($template->default_body_html === null) {
            throw new \InvalidArgumentException(
                __('cms.email.no_default_available')
            );
        }

        $template->update([
            'body_html' => $template->default_body_html,
            'subject' => $template->default_subject ?? $template->subject,
        ]);

        return true;
    }

    /**
     * Envoyer un email en utilisant un template CMS.
     *
     * @param string       $slug       Slug du template
     * @param string|array $to         Adresse(s) email
     * @param array        $variables  Variables a injecter
     * @param array        $options    Options supplementaires (cc, bcc, replyTo, attachments)
     * @return bool
     */
    public function send(string $slug, string|array $to, array $variables = [], array $options = []): bool
    {
        CMS::hook('email.before_send', $slug, $to, $variables);

        try {
            $rendered = $this->render($slug, $variables);

            Mail::html($rendered['html'], function (Message $message) use ($to, $rendered, $options) {
                $message->to($to)
                    ->subject($rendered['subject']);

                if (! empty($options['cc'])) {
                    $message->cc($options['cc']);
                }

                if (! empty($options['bcc'])) {
                    $message->bcc($options['bcc']);
                }

                if (! empty($options['replyTo'])) {
                    $message->replyTo($options['replyTo']);
                }

                if (! empty($options['attachments'])) {
                    foreach ($options['attachments'] as $attachment) {
                        $message->attach($attachment['path'], [
                            'as' => $attachment['name'] ?? null,
                            'mime' => $attachment['mime'] ?? null,
                        ]);
                    }
                }
            });

            CMS::hook('email.after_send', $slug, $to, $variables, true);

            return true;
        } catch (\Throwable $e) {
            CMS::hook('email.send_failed', $slug, $to, $variables, $e);

            report($e);
            return false;
        }
    }

    /**
     * Convertir du HTML en texte brut.
     */
    protected function htmlToPlainText(string $html): string
    {
        // Convertir les liens en texte lisible
        $text = preg_replace('/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/', '$2 ($1)', $html);

        // Convertir les balises structurelles en sauts de ligne
        $text = preg_replace('/<(br|hr|\/p|\/div|\/tr|\/h[1-6])[^>]*>/', "\n", $text);
        $text = preg_replace('/<\/td>/', "\t", $text);

        // Supprimer toutes les autres balises HTML
        $text = strip_tags($text);

        // Decoder les entites HTML
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');

        // Nettoyer les espaces excessifs
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        return trim($text);
    }

    /**
     * Obtenir le layout HTML de base pour les emails.
     */
    public function getBaseLayout(): string
    {
        // Permettre de surcharger le layout via le filesystem
        $customLayoutPath = resource_path('views/emails/layout.html');

        if (file_exists($customLayoutPath)) {
            return file_get_contents($customLayoutPath);
        }

        return $this->getDefaultBaseLayout();
    }

    /**
     * Layout HTML de base par defaut.
     * Compatible Gmail, Outlook, Apple Mail, Yahoo Mail.
     */
    protected function getDefaultBaseLayout(): string
    {
        $siteName = e(setting('general.site_name', config('app.name')));
        $siteUrl = e(config('app.url'));
        $logoUrl = e(setting('general.logo_url', ''));
        $primaryColor = e(setting('mail.primary_color', '#2563eb'));
        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>{{SUBJECT}}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f7; }

        /* Responsive */
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
            .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
            .email-container .content-cell { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <!-- Preheader (texte invisible pour les clients mail) -->
    <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
        {{SUBJECT}}
    </div>

    <!-- Email wrapper -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f7;">
        <tr>
            <td align="center" style="padding: 40px 10px;">

                <!-- Email container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%;">

                    <!-- HEADER -->
                    <tr>
                        <td align="center" style="padding: 30px 0 20px 0;">
                            <a href="{$siteUrl}" target="_blank" style="text-decoration: none;">
                                {$logoUrl}
                                <span style="font-size: 24px; font-weight: 700; color: {$primaryColor}; text-decoration: none;">{$siteName}</span>
                            </a>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td class="content-cell" style="padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
                                        {{CONTENT}}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td align="center" style="padding: 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                            <p style="margin: 0 0 8px 0;">
                                &copy; {$year} {$siteName}. Tous droits reserves.
                            </p>
                            <p style="margin: 0 0 8px 0;">
                                <a href="{$siteUrl}" style="color: #6b7280; text-decoration: underline;">{$siteName}</a>
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #d1d5db;">
                                Cet email a ete envoye automatiquement. Merci de ne pas y repondre directement.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}
```

---

## 5. CmsMailChannel - Integration Laravel Notifications

```php
<?php

declare(strict_types=1);

namespace App\CMS\Mail;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Channels\MailChannel;
use Illuminate\Support\Facades\Log;
use App\Models\EmailTemplate;
use App\Services\EmailTemplateService;

/**
 * Canal mail personnalise qui intercepte les notifications Laravel
 * pour utiliser les templates CMS quand un template correspondant existe.
 *
 * Enregistrement dans AppServiceProvider :
 *   $this->app->bind(MailChannel::class, CmsMailChannel::class);
 */
class CmsMailChannel extends MailChannel
{
    protected EmailTemplateService $templateService;

    public function __construct(
        \Illuminate\Mail\Mailer $mailer,
        \Illuminate\Support\HtmlString|\Illuminate\Contracts\View\Factory $markdown = null,
    ) {
        parent::__construct($mailer, $markdown);
        $this->templateService = app(EmailTemplateService::class);
    }

    /**
     * Envoyer la notification.
     *
     * Si une notification implemente l'interface CmsTemplateNotification,
     * on utilise le template CMS correspondant. Sinon, on delegue au
     * MailChannel standard de Laravel.
     */
    public function send($notifiable, Notification $notification): void
    {
        // Verifier si la notification utilise un template CMS
        if (! $notification instanceof CmsTemplateNotification) {
            parent::send($notifiable, $notification);
            return;
        }

        $slug = $notification->getTemplateSlug();
        $template = EmailTemplate::findBySlug($slug);

        // Si le template n'existe pas ou est desactive, fallback sur Laravel
        if (! $template || ! $template->enabled) {
            Log::info("CmsMailChannel: template '{$slug}' non trouve ou desactive, fallback Laravel.");
            parent::send($notifiable, $notification);
            return;
        }

        // Recuperer les variables depuis la notification
        $variables = $notification->getTemplateVariables($notifiable);

        // Recuperer l'adresse email du destinataire
        $email = $notifiable->routeNotificationFor('mail', $notification);

        if (! $email) {
            return;
        }

        $to = is_string($email) ? $email : (is_array($email) ? $email : $email->address ?? null);

        if (! $to) {
            return;
        }

        // Recuperer les options supplementaires
        $options = $notification->getMailOptions($notifiable);

        // Envoyer via le service de templates
        $this->templateService->send($slug, $to, $variables, $options);
    }
}
```

### Interface CmsTemplateNotification

```php
<?php

declare(strict_types=1);

namespace App\CMS\Mail;

/**
 * Interface a implementer par les notifications qui utilisent un template CMS.
 */
interface CmsTemplateNotification
{
    /**
     * Slug du template CMS a utiliser.
     */
    public function getTemplateSlug(): string;

    /**
     * Variables a injecter dans le template.
     *
     * @param mixed $notifiable L'entite qui recoit la notification
     * @return array<string, mixed>
     */
    public function getTemplateVariables(mixed $notifiable): array;

    /**
     * Options supplementaires pour l'envoi (cc, bcc, replyTo, attachments).
     *
     * @param mixed $notifiable
     * @return array
     */
    public function getMailOptions(mixed $notifiable): array;
}
```

### Exemple de notification utilisant un template CMS

```php
<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use App\CMS\Mail\CmsTemplateNotification;

class WelcomeNotification extends Notification implements CmsTemplateNotification
{
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function getTemplateSlug(): string
    {
        return 'welcome';
    }

    public function getTemplateVariables(mixed $notifiable): array
    {
        return [
            'user' => [
                'name' => $notifiable->name,
                'email' => $notifiable->email,
            ],
            'login_url' => route('login'),
        ];
    }

    public function getMailOptions(mixed $notifiable): array
    {
        return []; // Pas d'options supplementaires
    }
}
```

### Enregistrement du canal dans le ServiceProvider

```php
<?php

// Dans App\Providers\AppServiceProvider ou un provider dedie

use Illuminate\Notifications\Channels\MailChannel;
use App\CMS\Mail\CmsMailChannel;

public function register(): void
{
    // Remplacer le MailChannel par defaut par le CmsMailChannel
    $this->app->bind(MailChannel::class, CmsMailChannel::class);
}
```

---

## 6. Controller admin

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\EmailTemplateService;
use App\Http\Requests\Admin\UpdateEmailTemplateRequest;
use App\Http\Requests\Admin\SendTestEmailRequest;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class EmailTemplateController extends Controller
{
    public function __construct(
        private readonly EmailTemplateService $templateService,
    ) {}

    /**
     * Liste des templates par categorie.
     * GET /admin/settings/email-templates
     */
    public function index(): Response
    {
        $templates = EmailTemplate::query()
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return Inertia::render('Admin/Settings/EmailTemplates/Index', [
            'templatesByCategory' => $templates,
            'categories' => EmailTemplate::categories(),
        ]);
    }

    /**
     * Edition d'un template.
     * GET /admin/settings/email-templates/{emailTemplate}
     */
    public function edit(EmailTemplate $emailTemplate): Response
    {
        $availableVariables = $this->templateService->getAvailableVariables($emailTemplate->slug);

        return Inertia::render('Admin/Settings/EmailTemplates/Edit', [
            'template' => $emailTemplate,
            'availableVariables' => $availableVariables,
            'categories' => EmailTemplate::categories(),
        ]);
    }

    /**
     * Mise a jour d'un template.
     * PUT /admin/settings/email-templates/{emailTemplate}
     */
    public function update(UpdateEmailTemplateRequest $request, EmailTemplate $emailTemplate): RedirectResponse
    {
        $emailTemplate->update($request->validated());

        return redirect()
            ->route('admin.settings.email-templates.edit', $emailTemplate)
            ->with('success', __('cms.email.template_updated'));
    }

    /**
     * Preview du template compile.
     * POST /admin/settings/email-templates/{emailTemplate}/preview
     */
    public function preview(EmailTemplate $emailTemplate): JsonResponse
    {
        $testVariables = [];

        foreach ($emailTemplate->variables as $variable) {
            data_set($testVariables, $variable['key'], $variable['example'] ?? $variable['key']);
        }

        try {
            $rendered = $this->templateService->render($emailTemplate->slug, $testVariables);

            return response()->json([
                'subject' => $rendered['subject'],
                'html' => $rendered['html'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Envoyer un email de test.
     * POST /admin/settings/email-templates/{emailTemplate}/send-test
     */
    public function sendTest(SendTestEmailRequest $request, EmailTemplate $emailTemplate): JsonResponse
    {
        try {
            $this->templateService->sendTest(
                $emailTemplate->slug,
                $request->validated('email')
            );

            return response()->json([
                'message' => __('cms.email.test_sent', ['email' => $request->validated('email')]),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reinitialiser un template a sa version par defaut.
     * POST /admin/settings/email-templates/{emailTemplate}/reset
     */
    public function reset(EmailTemplate $emailTemplate): RedirectResponse
    {
        try {
            $this->templateService->resetToDefault($emailTemplate->slug);

            return redirect()
                ->route('admin.settings.email-templates.edit', $emailTemplate)
                ->with('success', __('cms.email.template_reset'));
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Activer/desactiver un template.
     * PATCH /admin/settings/email-templates/{emailTemplate}/toggle
     */
    public function toggle(EmailTemplate $emailTemplate): RedirectResponse
    {
        $emailTemplate->update(['enabled' => ! $emailTemplate->enabled]);

        $message = $emailTemplate->enabled
            ? __('cms.email.template_enabled')
            : __('cms.email.template_disabled_msg');

        return redirect()->back()->with('success', $message);
    }
}
```

### Form Requests

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('settings.manage');
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'subject' => ['sometimes', 'required', 'string', 'max:500'],
            'body_html' => ['sometimes', 'required', 'string', 'max:65535'],
            'body_text' => ['nullable', 'string', 'max:65535'],
            'enabled' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => __('cms.email.validation.subject_required'),
            'body_html.required' => __('cms.email.validation.body_required'),
        ];
    }
}
```

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SendTestEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('settings.manage');
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}
```

---

## 7. Routes

```php
<?php

// routes/admin.php (a ajouter dans le groupe admin)

use App\Http\Controllers\Admin\EmailTemplateController;

Route::prefix('settings/email-templates')
    ->name('admin.settings.email-templates.')
    ->middleware(['auth', 'can:settings.manage'])
    ->group(function () {
        Route::get('/', [EmailTemplateController::class, 'index'])->name('index');
        Route::get('/{emailTemplate}', [EmailTemplateController::class, 'edit'])->name('edit');
        Route::put('/{emailTemplate}', [EmailTemplateController::class, 'update'])->name('update');
        Route::post('/{emailTemplate}/preview', [EmailTemplateController::class, 'preview'])->name('preview');
        Route::post('/{emailTemplate}/send-test', [EmailTemplateController::class, 'sendTest'])->name('send-test');
        Route::post('/{emailTemplate}/reset', [EmailTemplateController::class, 'reset'])->name('reset');
        Route::patch('/{emailTemplate}/toggle', [EmailTemplateController::class, 'toggle'])->name('toggle');
    });
```

---

## 8. Seeder des templates par defaut

```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmailTemplate;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = $this->getDefaultTemplates();

        foreach ($templates as $data) {
            EmailTemplate::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, [
                    'is_system' => true,
                    'default_body_html' => $data['body_html'],
                    'default_subject' => $data['subject'],
                ])
            );
        }
    }

    protected function getDefaultTemplates(): array
    {
        return [
            // ─────────────────────────────────────────────
            // AUTH
            // ─────────────────────────────────────────────
            [
                'slug' => 'welcome',
                'name' => 'Bienvenue',
                'category' => 'auth',
                'subject' => 'Bienvenue sur {{ site.name }} !',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
    Bienvenue, {{ user.name }} !
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    Votre compte a bien ete cree sur <strong>{{ site.name }}</strong>. Vous pouvez desormais vous connecter et acceder a toutes les fonctionnalites.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
    <tr>
        <td style="border-radius: 6px; background-color: #2563eb;">
            <a href="{{ login_url }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                Se connecter
            </a>
        </td>
    </tr>
</table>
<p style="margin: 0; color: #6b7280; font-size: 13px;">
    Si vous n'avez pas cree de compte, vous pouvez ignorer cet email.
</p>
HTML,
                'body_text' => "Bienvenue, {{ user.name }} !\n\nVotre compte a bien ete cree sur {{ site.name }}.\n\nConnectez-vous ici : {{ login_url }}\n\nSi vous n'avez pas cree de compte, vous pouvez ignorer cet email.",
                'variables' => [
                    ['key' => 'user.name', 'label' => "Nom de l'utilisateur", 'example' => 'Jean Dupont'],
                    ['key' => 'site.name', 'label' => 'Nom du site', 'example' => 'Mon Site'],
                    ['key' => 'login_url', 'label' => 'URL de connexion', 'example' => 'https://monsite.com/login'],
                ],
                'enabled' => true,
            ],
            [
                'slug' => 'password-reset',
                'name' => 'Reinitialisation du mot de passe',
                'category' => 'auth',
                'subject' => 'Reinitialisation de votre mot de passe - {{ site.name }}',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
    Reinitialisation du mot de passe
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    Bonjour {{ user.name }},
</p>
<p style="margin: 0 0 16px 0; color: #374151;">
    Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
    <tr>
        <td style="border-radius: 6px; background-color: #2563eb;">
            <a href="{{ reset_url }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                Reinitialiser mon mot de passe
            </a>
        </td>
    </tr>
</table>
<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
    Ce lien expirera dans {{ expiry }} minutes.
</p>
<p style="margin: 0; color: #6b7280; font-size: 13px;">
    Si vous n'avez pas demande cette reinitialisation, aucune action n'est requise.
</p>
HTML,
                'body_text' => "Reinitialisation du mot de passe\n\nBonjour {{ user.name }},\n\nVous avez demande la reinitialisation de votre mot de passe.\n\nCliquez sur ce lien : {{ reset_url }}\n\nCe lien expirera dans {{ expiry }} minutes.\n\nSi vous n'avez pas demande cette reinitialisation, aucune action n'est requise.",
                'variables' => [
                    ['key' => 'user.name', 'label' => "Nom de l'utilisateur", 'example' => 'Jean Dupont'],
                    ['key' => 'reset_url', 'label' => 'URL de reinitialisation', 'example' => 'https://monsite.com/reset-password?token=abc123def456'],
                    ['key' => 'expiry', 'label' => "Duree de validite (minutes)", 'example' => '60'],
                ],
                'enabled' => true,
            ],
            [
                'slug' => 'email-verification',
                'name' => "Verification de l'adresse email",
                'category' => 'auth',
                'subject' => 'Verifiez votre adresse email - {{ site.name }}',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
    Verification de votre email
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    Bonjour {{ user.name }},
</p>
<p style="margin: 0 0 16px 0; color: #374151;">
    Veuillez cliquer sur le bouton ci-dessous pour verifier votre adresse email :
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
    <tr>
        <td style="border-radius: 6px; background-color: #2563eb;">
            <a href="{{ verify_url }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                Verifier mon email
            </a>
        </td>
    </tr>
</table>
<p style="margin: 0; color: #6b7280; font-size: 13px;">
    Si vous n'avez pas cree de compte, aucune action n'est requise.
</p>
HTML,
                'body_text' => "Verification de votre email\n\nBonjour {{ user.name }},\n\nVerifiez votre adresse email en cliquant sur ce lien : {{ verify_url }}\n\nSi vous n'avez pas cree de compte, aucune action n'est requise.",
                'variables' => [
                    ['key' => 'user.name', 'label' => "Nom de l'utilisateur", 'example' => 'Jean Dupont'],
                    ['key' => 'verify_url', 'label' => 'URL de verification', 'example' => 'https://monsite.com/email/verify/1/abc123'],
                ],
                'enabled' => true,
            ],

            // ─────────────────────────────────────────────
            // FORM
            // ─────────────────────────────────────────────
            [
                'slug' => 'form-submission',
                'name' => 'Soumission de formulaire (admin)',
                'category' => 'form',
                'subject' => 'Nouvelle soumission : {{ form.name }} - {{ site.name }}',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
    Nouvelle soumission de formulaire
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    Le formulaire <strong>{{ form.name }}</strong> a recu une nouvelle soumission :
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
    <tr>
        <td style="padding: 16px; background-color: #f9fafb;">
            {{ fields }}
        </td>
    </tr>
</table>
<p style="margin: 0; color: #6b7280; font-size: 13px;">
    Soumis le {{ submitted_at }} sur {{ site.name }}.
</p>
HTML,
                'body_text' => "Nouvelle soumission de formulaire\n\nFormulaire : {{ form.name }}\n\nDonnees soumises :\n{{ fields }}\n\nSoumis le {{ submitted_at }} sur {{ site.name }}.",
                'variables' => [
                    ['key' => 'form.name', 'label' => 'Nom du formulaire', 'example' => 'Formulaire de contact'],
                    ['key' => 'fields', 'label' => 'Champs du formulaire', 'example' => 'Nom: Jean Dupont, Email: jean@mail.com, Message: Bonjour'],
                    ['key' => 'submitted_at', 'label' => 'Date de soumission', 'example' => '10/03/2026 14:30'],
                ],
                'enabled' => true,
            ],
            [
                'slug' => 'form-confirmation',
                'name' => 'Confirmation de soumission (utilisateur)',
                'category' => 'form',
                'subject' => 'Confirmation - {{ form.name }}',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
    Merci pour votre message !
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    Bonjour {{ user.name }},
</p>
<p style="margin: 0 0 16px 0; color: #374151;">
    Nous avons bien recu votre soumission via le formulaire <strong>{{ form.name }}</strong>. Nous reviendrons vers vous dans les plus brefs delais.
</p>
<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
    Recapitulatif de votre soumission :
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
    <tr>
        <td style="padding: 16px; background-color: #f9fafb;">
            {{ fields }}
        </td>
    </tr>
</table>
<p style="margin: 0; color: #374151;">
    Cordialement,<br>
    L'equipe {{ site.name }}
</p>
HTML,
                'body_text' => "Merci pour votre message !\n\nBonjour {{ user.name }},\n\nNous avons bien recu votre soumission via le formulaire {{ form.name }}.\n\nRecapitulatif :\n{{ fields }}\n\nCordialement,\nL'equipe {{ site.name }}",
                'variables' => [
                    ['key' => 'user.name', 'label' => "Nom de l'utilisateur", 'example' => 'Jean Dupont'],
                    ['key' => 'form.name', 'label' => 'Nom du formulaire', 'example' => 'Formulaire de contact'],
                    ['key' => 'fields', 'label' => 'Champs du formulaire', 'example' => 'Nom: Jean Dupont, Email: jean@mail.com'],
                ],
                'enabled' => true,
            ],

            // ─────────────────────────────────────────────
            // NOTIFICATION
            // ─────────────────────────────────────────────
            [
                'slug' => 'new-user-admin',
                'name' => 'Nouveau compte (notification admin)',
                'category' => 'notification',
                'subject' => 'Nouvel utilisateur inscrit - {{ site.name }}',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
    Nouvel utilisateur inscrit
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    Un nouvel utilisateur s'est inscrit sur <strong>{{ site.name }}</strong> :
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 6px;">
    <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 120px;">Nom</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">{{ user.name }}</td>
    </tr>
    <tr>
        <td style="padding: 12px 16px; font-weight: 600; color: #374151;">Email</td>
        <td style="padding: 12px 16px; color: #374151;">{{ user.email }}</td>
    </tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
    <tr>
        <td style="border-radius: 6px; background-color: #2563eb;">
            <a href="{{ admin_url }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                Voir dans l'admin
            </a>
        </td>
    </tr>
</table>
HTML,
                'body_text' => "Nouvel utilisateur inscrit\n\nUn nouvel utilisateur s'est inscrit sur {{ site.name }} :\n\nNom : {{ user.name }}\nEmail : {{ user.email }}\n\nVoir dans l'admin : {{ admin_url }}",
                'variables' => [
                    ['key' => 'user.name', 'label' => "Nom de l'utilisateur", 'example' => 'Jean Dupont'],
                    ['key' => 'user.email', 'label' => "Email de l'utilisateur", 'example' => 'jean@dupont.com'],
                    ['key' => 'admin_url', 'label' => "URL admin de l'utilisateur", 'example' => 'https://monsite.com/admin/users/42'],
                ],
                'enabled' => true,
            ],
            [
                'slug' => 'backup-completed',
                'name' => 'Sauvegarde terminee',
                'category' => 'notification',
                'subject' => 'Sauvegarde terminee - {{ site.name }}',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
    Sauvegarde terminee avec succes
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    La sauvegarde de <strong>{{ site.name }}</strong> a ete effectuee avec succes.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 6px;">
    <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 120px;">Date</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">{{ backup.date }}</td>
    </tr>
    <tr>
        <td style="padding: 12px 16px; font-weight: 600; color: #374151;">Taille</td>
        <td style="padding: 12px 16px; color: #374151;">{{ backup.size }}</td>
    </tr>
</table>
<p style="margin: 0; color: #16a34a; font-weight: 600;">
    &#10003; Aucune action requise.
</p>
HTML,
                'body_text' => "Sauvegarde terminee avec succes\n\nLa sauvegarde de {{ site.name }} a ete effectuee avec succes.\n\nDate : {{ backup.date }}\nTaille : {{ backup.size }}",
                'variables' => [
                    ['key' => 'backup.date', 'label' => 'Date de la sauvegarde', 'example' => '10/03/2026 02:00'],
                    ['key' => 'backup.size', 'label' => 'Taille de la sauvegarde', 'example' => '245 Mo'],
                ],
                'enabled' => true,
            ],
            [
                'slug' => 'backup-failed',
                'name' => "Echec de sauvegarde",
                'category' => 'notification',
                'subject' => 'ECHEC sauvegarde - {{ site.name }}',
                'body_html' => <<<'HTML'
<h1 style="font-size: 22px; font-weight: 700; color: #dc2626; margin: 0 0 16px 0;">
    Echec de la sauvegarde
</h1>
<p style="margin: 0 0 16px 0; color: #374151;">
    La sauvegarde automatique de <strong>{{ site.name }}</strong> a echoue.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0; border: 1px solid #fecaca; border-radius: 6px; background-color: #fef2f2;">
    <tr>
        <td style="padding: 16px; color: #991b1b;">
            <strong>Erreur :</strong> {{ error_message }}
        </td>
    </tr>
</table>
<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
    Date de la tentative : {{ backup.date }}
</p>
<p style="margin: 0; color: #374151;">
    Veuillez verifier la configuration de sauvegarde dans l'administration.
</p>
HTML,
                'body_text' => "ECHEC de la sauvegarde\n\nLa sauvegarde automatique de {{ site.name }} a echoue.\n\nErreur : {{ error_message }}\nDate de la tentative : {{ backup.date }}\n\nVeuillez verifier la configuration de sauvegarde dans l'administration.",
                'variables' => [
                    ['key' => 'error_message', 'label' => "Message d'erreur", 'example' => 'Espace disque insuffisant'],
                    ['key' => 'backup.date', 'label' => 'Date de la tentative', 'example' => '10/03/2026 02:00'],
                ],
                'enabled' => true,
            ],
        ];
    }
}
```

---

## 9. Interface admin React (Inertia)

### Page de liste des templates

```tsx
// resources/js/pages/Admin/Settings/EmailTemplates/Index.tsx

import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Mail, Pencil, Shield, Bell, FileText } from 'lucide-react';

interface Variable {
    key: string;
    label: string;
    example: string;
}

interface EmailTemplate {
    id: number;
    slug: string;
    name: string;
    subject: string;
    category: string;
    enabled: boolean;
    is_system: boolean;
    variables: Variable[];
    updated_at: string;
}

interface Props {
    templatesByCategory: Record<string, EmailTemplate[]>;
    categories: Record<string, string>;
}

const categoryIcons: Record<string, React.ReactNode> = {
    auth: <Shield className="h-5 w-5" />,
    notification: <Bell className="h-5 w-5" />,
    marketing: <Mail className="h-5 w-5" />,
    form: <FileText className="h-5 w-5" />,
};

export default function EmailTemplatesIndex({ templatesByCategory, categories }: Props) {
    const handleToggle = (template: EmailTemplate) => {
        router.patch(
            route('admin.settings.email-templates.toggle', template.id),
            {},
            { preserveScroll: true }
        );
    };

    return (
        <AdminLayout>
            <Head title="Templates email" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Templates email</h1>
                    <p className="text-muted-foreground">
                        Gerez les templates des emails transactionnels envoyes par le CMS.
                    </p>
                </div>

                {Object.entries(categories).map(([categorySlug, categoryName]) => {
                    const templates = templatesByCategory[categorySlug] ?? [];

                    if (templates.length === 0) return null;

                    return (
                        <Card key={categorySlug}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {categoryIcons[categorySlug]}
                                    {categoryName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {template.name}
                                                    </span>
                                                    <Badge variant="outline">
                                                        {template.slug}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {template.subject}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Switch
                                                    checked={template.enabled}
                                                    onCheckedChange={() => handleToggle(template)}
                                                />
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link
                                                        href={route(
                                                            'admin.settings.email-templates.edit',
                                                            template.id
                                                        )}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </AdminLayout>
    );
}
```

### Page d'edition d'un template

```tsx
// resources/js/pages/Admin/Settings/EmailTemplates/Edit.tsx

import { Head, router, useForm } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft, Eye, Send, RotateCcw, Copy, Code, FileText } from 'lucide-react';

interface Variable {
    key: string;
    label: string;
    example: string;
}

interface EmailTemplate {
    id: number;
    slug: string;
    name: string;
    subject: string;
    body_html: string;
    body_text: string | null;
    category: string;
    enabled: boolean;
    is_system: boolean;
    variables: Variable[];
}

interface Props {
    template: EmailTemplate;
    availableVariables: Variable[];
    categories: Record<string, string>;
}

export default function EmailTemplateEdit({ template, availableVariables, categories }: Props) {
    const { toast } = useToast();
    const previewIframeRef = useRef<HTMLIFrameElement>(null);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [testEmail, setTestEmail] = useState<string>('');
    const [sendingTest, setSendingTest] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: template.name,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text ?? '',
    });

    // Charger le preview initial
    const loadPreview = useCallback(async () => {
        try {
            const response = await fetch(
                route('admin.settings.email-templates.preview', template.id),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                                ?.content ?? '',
                    },
                }
            );
            const result = await response.json();
            if (result.html) {
                setPreviewHtml(result.html);
            }
        } catch {
            toast({
                title: 'Erreur',
                description: 'Impossible de charger le preview.',
                variant: 'destructive',
            });
        }
    }, [template.id, toast]);

    useEffect(() => {
        loadPreview();
    }, [loadPreview]);

    // Mettre a jour l'iframe quand le preview change
    useEffect(() => {
        if (previewIframeRef.current && previewHtml) {
            const doc = previewIframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(previewHtml);
                doc.close();
            }
        }
    }, [previewHtml]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.settings.email-templates.update', template.id), {
            onSuccess: () => {
                toast({ title: 'Template mis a jour avec succes.' });
                loadPreview();
            },
        });
    };

    const handleSendTest = async () => {
        if (!testEmail) return;

        setSendingTest(true);
        try {
            const response = await fetch(
                route('admin.settings.email-templates.send-test', template.id),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                                ?.content ?? '',
                    },
                    body: JSON.stringify({ email: testEmail }),
                }
            );
            const result = await response.json();

            if (response.ok) {
                toast({ title: result.message });
            } else {
                toast({
                    title: 'Erreur',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        } finally {
            setSendingTest(false);
        }
    };

    const handleReset = () => {
        if (!confirm('Reinitialiser ce template a sa version par defaut ? Les modifications seront perdues.')) {
            return;
        }

        router.post(route('admin.settings.email-templates.reset', template.id), {}, {
            onSuccess: () => {
                toast({ title: 'Template reinitialise.' });
            },
        });
    };

    const insertVariable = (key: string) => {
        const variable = `{{ ${key} }}`;
        navigator.clipboard.writeText(variable);
        toast({ title: `${variable} copie dans le presse-papier.` });
    };

    return (
        <AdminLayout>
            <Head title={`Modifier - ${template.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <a href={route('admin.settings.email-templates.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </a>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {template.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{template.slug}</Badge>
                                <Badge>{categories[template.category]}</Badge>
                            </div>
                        </div>
                    </div>
                    {template.is_system && (
                        <Button variant="outline" onClick={handleReset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reinitialiser
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Editeur (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contenu du template</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Sujet de l'email</Label>
                                        <Input
                                            id="subject"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="Sujet avec {{ variables }}"
                                        />
                                        {errors.subject && (
                                            <p className="text-sm text-destructive">
                                                {errors.subject}
                                            </p>
                                        )}
                                    </div>

                                    <Tabs defaultValue="html">
                                        <TabsList>
                                            <TabsTrigger value="html">
                                                <Code className="mr-2 h-4 w-4" />
                                                HTML
                                            </TabsTrigger>
                                            <TabsTrigger value="text">
                                                <FileText className="mr-2 h-4 w-4" />
                                                Texte brut
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="html" className="space-y-2">
                                            <Label htmlFor="body_html">Corps HTML</Label>
                                            <Textarea
                                                id="body_html"
                                                value={data.body_html}
                                                onChange={(e) =>
                                                    setData('body_html', e.target.value)
                                                }
                                                className="min-h-[400px] font-mono text-sm"
                                                placeholder="<h1>Bonjour {{ user.name }}</h1>"
                                            />
                                            {errors.body_html && (
                                                <p className="text-sm text-destructive">
                                                    {errors.body_html}
                                                </p>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="text" className="space-y-2">
                                            <Label htmlFor="body_text">
                                                Corps texte brut (optionnel)
                                            </Label>
                                            <Textarea
                                                id="body_text"
                                                value={data.body_text}
                                                onChange={(e) =>
                                                    setData('body_text', e.target.value)
                                                }
                                                className="min-h-[400px] font-mono text-sm"
                                                placeholder="Bonjour {{ user.name }}"
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing}>
                                    Enregistrer
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={loadPreview}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Actualiser le preview
                                </Button>
                            </div>
                        </form>

                        {/* Preview iframe */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="h-5 w-5" />
                                    Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden bg-gray-100">
                                    <iframe
                                        ref={previewIframeRef}
                                        title="Email preview"
                                        className="w-full bg-white"
                                        style={{ minHeight: '500px', border: 'none' }}
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar (1/3) */}
                    <div className="space-y-6">
                        {/* Variables disponibles */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Variables disponibles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {availableVariables.map((variable) => (
                                        <button
                                            key={variable.key}
                                            type="button"
                                            onClick={() => insertVariable(variable.key)}
                                            className="flex w-full items-start gap-2 rounded-md border p-2 text-left text-sm hover:bg-accent transition-colors"
                                        >
                                            <Copy className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                            <div>
                                                <code className="text-xs font-semibold">
                                                    {'{{ ' + variable.key + ' }}'}
                                                </code>
                                                <p className="text-xs text-muted-foreground">
                                                    {variable.label}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Envoi de test */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Envoyer un test
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="test-email">Adresse email</Label>
                                    <Input
                                        id="test-email"
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="test@example.com"
                                    />
                                </div>
                                <Button
                                    onClick={handleSendTest}
                                    disabled={sendingTest || !testEmail}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {sendingTest ? 'Envoi...' : 'Envoyer le test'}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Les variables seront remplacees par des valeurs d'exemple.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
```

---

## 10. Hooks systeme

Le systeme de templates email s'integre avec le systeme de hooks d'ArtisanCMS pour permettre aux plugins d'etendre les fonctionnalites.

### Hooks disponibles

| Hook | Type | Description | Parametres |
|------|------|-------------|------------|
| `email.before_send` | action | Avant l'envoi d'un email | `(string $slug, string\|array $to, array $variables)` |
| `email.after_send` | action | Apres l'envoi reussi | `(string $slug, string\|array $to, array $variables, bool $success)` |
| `email.send_failed` | action | Apres un echec d'envoi | `(string $slug, string\|array $to, array $variables, \Throwable $exception)` |
| `email.template_variables` | filter | Ajouter/modifier des variables avant compilation | `(array $variables, string $slug) => array` |
| `email.available_variables` | filter | Ajouter des variables a la liste affichee dans l'admin | `(array $variables, string $slug) => array` |

### Exemples d'utilisation dans un plugin

```php
<?php

// Dans un ServiceProvider de plugin

use App\CMS\Facades\CMS;

public function boot(): void
{
    // Ajouter des variables globales a tous les templates
    CMS::filter('email.template_variables', function (array $variables, string $slug) {
        $variables['shop'] = [
            'name' => setting('shop.name', 'Ma Boutique'),
            'url' => setting('shop.url', config('app.url') . '/shop'),
            'support_email' => setting('shop.support_email', ''),
        ];
        return $variables;
    });

    // Ajouter des variables specifiques a un template
    CMS::filter('email.available_variables', function (array $variables, string $slug) {
        if (str_starts_with($slug, 'order-')) {
            $variables[] = [
                'key' => 'order.number',
                'label' => 'Numero de commande',
                'example' => 'CMD-20260310-001',
            ];
            $variables[] = [
                'key' => 'order.total',
                'label' => 'Total de la commande',
                'example' => '149,99 EUR',
            ];
        }
        return $variables;
    });

    // Logger tous les emails envoyes
    CMS::hook('email.after_send', function (string $slug, string|array $to, array $variables, bool $success) {
        activity()
            ->withProperties([
                'template' => $slug,
                'to' => $to,
                'success' => $success,
            ])
            ->log('email_sent');
    });

    // Ajouter un lien de desinscription marketing
    CMS::hook('email.before_send', function (string $slug, string|array &$to, array &$variables) {
        if (str_starts_with($slug, 'marketing-')) {
            $email = is_array($to) ? $to[0] : $to;
            $variables['unsubscribe_url'] = route('unsubscribe', [
                'email' => $email,
                'token' => hash_hmac('sha256', $email, config('app.key')),
            ]);
        }
    });
}
```

### Enregistrer un template depuis un plugin

```php
<?php

// Dans la methode install() du plugin ou dans un seeder

use App\Models\EmailTemplate;

EmailTemplate::updateOrCreate(
    ['slug' => 'order-confirmation'],
    [
        'name' => 'Confirmation de commande',
        'category' => 'marketing',
        'subject' => 'Commande #{{ order.number }} confirmee - {{ site.name }}',
        'body_html' => '<h1>Merci pour votre commande !</h1><p>Commande #{{ order.number }}</p>',
        'body_text' => "Merci pour votre commande !\n\nCommande #{{ order.number }}",
        'variables' => [
            ['key' => 'order.number', 'label' => 'Numero de commande', 'example' => 'CMD-001'],
            ['key' => 'order.total', 'label' => 'Total', 'example' => '149,99 EUR'],
            ['key' => 'order.items', 'label' => 'Articles', 'example' => '2x T-shirt, 1x Jean'],
        ],
        'is_system' => false,
        'enabled' => true,
    ]
);
```

---

## 11. Migration

```php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('subject', 500);
            $table->text('body_html');
            $table->text('body_text')->nullable();
            $table->json('variables');
            $table->string('category');
            $table->boolean('is_system')->default(false);
            $table->boolean('enabled')->default(true);
            $table->json('default_body_html')->nullable();
            $table->json('default_subject')->nullable();
            $table->timestamps();

            $table->index('category');
            $table->index('enabled');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
```

---

## 12. Utilisation depuis le code applicatif

### Envoi direct via le service

```php
<?php

use App\Services\EmailTemplateService;

// Injection dans un controller ou service
public function __construct(
    private readonly EmailTemplateService $emailService,
) {}

// Envoi simple
$this->emailService->send('welcome', $user->email, [
    'user' => ['name' => $user->name],
    'login_url' => route('login'),
]);

// Envoi avec options
$this->emailService->send('form-submission', 'admin@site.com', [
    'form' => ['name' => $form->name],
    'fields' => $submission->data,
    'submitted_at' => $submission->created_at->format('d/m/Y H:i'),
], [
    'replyTo' => $submission->data['email'] ?? null,
]);

// Envoi avec pieces jointes
$this->emailService->send('backup-completed', 'admin@site.com', [
    'backup' => [
        'date' => now()->format('d/m/Y H:i'),
        'size' => '245 Mo',
    ],
], [
    'attachments' => [
        ['path' => storage_path('backups/report.pdf'), 'name' => 'rapport.pdf'],
    ],
]);
```

### Envoi via le systeme de notifications Laravel

```php
<?php

use App\Notifications\WelcomeNotification;

// Le CmsMailChannel intercepte automatiquement et utilise le template CMS
$user->notify(new WelcomeNotification());
```

### Preview programmatique (utile pour les tests)

```php
<?php

use App\Services\EmailTemplateService;

$service = app(EmailTemplateService::class);

// Obtenir le HTML compile sans l'envoyer
$rendered = $service->render('password-reset', [
    'user' => ['name' => 'Test User'],
    'reset_url' => 'https://example.com/reset',
    'expiry' => '60',
]);

// $rendered['subject'] => "Reinitialisation de votre mot de passe - Mon Site"
// $rendered['html']    => HTML complet avec layout
// $rendered['text']    => Version texte brut
```

---

## 13. Considerations techniques

### Securite
- Les variables sont echappees via `e()` (htmlspecialchars) pour prevenir les injections XSS dans le HTML
- Le preview dans l'admin utilise un iframe sandboxe (`sandbox="allow-same-origin"`)
- L'envoi de test est limite aux utilisateurs avec la permission `settings.manage`
- Le corps HTML est stocke tel quel, mais jamais execute comme du code Blade cote serveur

### Performance
- Les templates sont mis en cache individuellement (`email_template:{slug}`) pendant 24h
- Le cache est invalide automatiquement lors de chaque modification (via les events Eloquent `saved`/`deleted`)
- Les variables globales du site sont mises en cache separement pendant 1h
- La compilation des variables utilise `data_get()` natif de Laravel (performant sur les tableaux imbriques)

### Compatibilite email
- Le layout HTML utilise des tables pour la structure (compatibilite Outlook/Gmail)
- CSS inline uniquement (pas de `<style>` dans le `<body>`, sauf un reset dans le `<head>`)
- Prefixes Microsoft (`xmlns:v`, `xmlns:o`) pour Outlook
- Meta `x-apple-disable-message-reformatting` pour Apple Mail
- Preheader invisible pour les clients mail modernes
- Media queries pour le responsive (supportees par iOS Mail, Gmail app, Apple Mail)
- Largeur maximale de 600px (standard email)
- Polices systeme (pas de web fonts, non supportees partout)

### Extensibilite
- Les plugins peuvent enregistrer leurs propres templates via `EmailTemplate::updateOrCreate()`
- Les plugins peuvent ajouter des variables globales ou specifiques via les filtres `email.template_variables` et `email.available_variables`
- Le layout de base peut etre surcharge en placant un fichier `resources/views/emails/layout.html`
- Les hooks `email.before_send` et `email.after_send` permettent l'audit, le logging et l'enrichissement des variables
