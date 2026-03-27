<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    private const BTN = 'display:inline-block;padding:12px 24px;background-color:#3869d4;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;';
    private const QUOTE = 'border-left:4px solid #e2e8f0;padding:8px 16px;margin:16px 0;color:#64748b;font-style:italic;';

    public function run(): void
    {
        foreach ($this->templates() as $template) {
            EmailTemplate::updateOrCreate(
                ['slug' => $template['slug']],
                $template,
            );
        }
    }

    /** @return list<array<string, mixed>> */
    private function templates(): array
    {
        return [
            $this->tpl('welcome', 'Bienvenue sur le site', 'system',
                'Bienvenue sur {{ site_name }}, {{ user_name }} !',
                [['user_name', 'Nom de l\'utilisateur', 'Jean Dupont'], ['site_name', 'Nom du site', 'ArtisanCMS'], ['login_url', 'URL de connexion', 'https://example.com/login']],
                '<h2>Bienvenue, {{ user_name }} !</h2>'
                . '<p>Votre compte a été créé avec succès sur <strong>{{ site_name }}</strong>.</p>'
                . '<p>Vous pouvez dès maintenant vous connecter et commencer à utiliser le site.</p>'
                . '<p><a href="{{ login_url }}" style="' . self::BTN . '">Se connecter</a></p>'
                . '<p>Si vous n\'avez pas créé ce compte, vous pouvez ignorer cet email.</p>',
                "Bienvenue, {{ user_name }} !\n\nVotre compte a été créé avec succès sur {{ site_name }}.\n\nSe connecter : {{ login_url }}\n\nSi vous n'avez pas créé ce compte, vous pouvez ignorer cet email.",
            ),
            $this->tpl('password-reset', 'Réinitialisation de mot de passe', 'auth',
                'Réinitialisation de votre mot de passe',
                [['user_name', 'Nom de l\'utilisateur', 'Jean Dupont'], ['reset_url', 'URL de réinitialisation', 'https://example.com/reset/token'], ['expiry_minutes', 'Durée de validité (minutes)', '60']],
                '<h2>Réinitialisation de mot de passe</h2>'
                . '<p>Bonjour {{ user_name }},</p>'
                . '<p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :</p>'
                . '<p><a href="{{ reset_url }}" style="' . self::BTN . '">Réinitialiser le mot de passe</a></p>'
                . '<p>Ce lien expire dans <strong>{{ expiry_minutes }} minutes</strong>.</p>'
                . '<p>Si vous n\'avez pas fait cette demande, aucune action n\'est requise.</p>',
                "Bonjour {{ user_name }},\n\nVous avez demandé la réinitialisation de votre mot de passe :\n\n{{ reset_url }}\n\nCe lien expire dans {{ expiry_minutes }} minutes.\n\nSi vous n'avez pas fait cette demande, aucune action n'est requise.",
            ),
            $this->tpl('email-verification', 'Vérification d\'adresse email', 'auth',
                'Vérifiez votre adresse email',
                [['user_name', 'Nom de l\'utilisateur', 'Jean Dupont'], ['verification_url', 'URL de vérification', 'https://example.com/verify/token']],
                '<h2>Vérification de votre email</h2>'
                . '<p>Bonjour {{ user_name }},</p>'
                . '<p>Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>'
                . '<p><a href="{{ verification_url }}" style="' . self::BTN . '">Vérifier mon email</a></p>'
                . '<p>Si vous n\'avez pas créé de compte, vous pouvez ignorer cet email.</p>',
                "Bonjour {{ user_name }},\n\nVeuillez vérifier votre adresse email :\n\n{{ verification_url }}\n\nSi vous n'avez pas créé de compte, vous pouvez ignorer cet email.",
            ),
            $this->tpl('form-submission', 'Nouvelle soumission de formulaire', 'forms',
                'Nouvelle soumission : {{ form_name }}',
                [['form_name', 'Nom du formulaire', 'Formulaire de contact'], ['submission_data', 'Données soumises (HTML)', '<p><strong>Nom :</strong> Jean Dupont</p>'], ['submission_url', 'URL de la soumission', 'https://example.com/admin/forms/1/submissions/5']],
                '<h2>Nouvelle soumission : {{ form_name }}</h2>'
                . '<p>Une nouvelle réponse a été soumise via le formulaire <strong>{{ form_name }}</strong> :</p>'
                . '{{ submission_data }}'
                . '<p><a href="{{ submission_url }}" style="' . self::BTN . '">Voir la soumission</a></p>',
                "Nouvelle soumission : {{ form_name }}\n\nUne nouvelle réponse a été soumise via le formulaire {{ form_name }}.\n\nVoir la soumission : {{ submission_url }}",
            ),
            $this->tpl('comment-approved', 'Commentaire approuvé', 'content',
                'Votre commentaire a été approuvé',
                [['user_name', 'Nom de l\'utilisateur', 'Jean Dupont'], ['comment_excerpt', 'Extrait du commentaire', 'Super article, merci pour le partage...'], ['post_title', 'Titre de l\'article', 'Mon premier article'], ['post_url', 'URL de l\'article', 'https://example.com/blog/mon-premier-article']],
                '<h2>Votre commentaire a été approuvé</h2>'
                . '<p>Bonjour {{ user_name }},</p>'
                . '<p>Votre commentaire sur l\'article <strong>{{ post_title }}</strong> a été approuvé :</p>'
                . '<blockquote style="' . self::QUOTE . '">{{ comment_excerpt }}</blockquote>'
                . '<p><a href="{{ post_url }}" style="' . self::BTN . '">Voir l\'article</a></p>',
                "Bonjour {{ user_name }},\n\nVotre commentaire sur l'article « {{ post_title }} » a été approuvé :\n\n« {{ comment_excerpt }} »\n\nVoir l'article : {{ post_url }}",
            ),
            $this->tpl('new-comment', 'Nouveau commentaire à modérer', 'admin',
                'Nouveau commentaire sur « {{ post_title }} »',
                [['author_name', 'Nom de l\'auteur', 'Marie Martin'], ['comment_excerpt', 'Extrait du commentaire', 'Je trouve cet article très intéressant...'], ['post_title', 'Titre de l\'article', 'Mon premier article'], ['moderation_url', 'URL de modération', 'https://example.com/admin/comments']],
                '<h2>Nouveau commentaire à modérer</h2>'
                . '<p><strong>{{ author_name }}</strong> a laissé un commentaire sur l\'article <strong>{{ post_title }}</strong> :</p>'
                . '<blockquote style="' . self::QUOTE . '">{{ comment_excerpt }}</blockquote>'
                . '<p><a href="{{ moderation_url }}" style="' . self::BTN . '">Modérer le commentaire</a></p>',
                "{{ author_name }} a laissé un commentaire sur l'article « {{ post_title }} » :\n\n« {{ comment_excerpt }} »\n\nModérer le commentaire : {{ moderation_url }}",
            ),
            $this->tpl('update-available', 'Mise à jour disponible', 'admin',
                'Mise à jour disponible : {{ update_type }} v{{ new_version }}',
                [['update_type', 'Type de mise à jour', 'CMS'], ['current_version', 'Version actuelle', '1.0.0'], ['new_version', 'Nouvelle version', '1.1.0'], ['update_url', 'URL de mise à jour', 'https://example.com/admin/updates']],
                '<h2>Mise à jour disponible</h2>'
                . '<p>Une nouvelle version de <strong>{{ update_type }}</strong> est disponible.</p>'
                . '<p>Version actuelle : <strong>v{{ current_version }}</strong><br>Nouvelle version : <strong>v{{ new_version }}</strong></p>'
                . '<p>Nous vous recommandons d\'effectuer cette mise à jour dès que possible.</p>'
                . '<p><a href="{{ update_url }}" style="' . self::BTN . '">Mettre à jour</a></p>',
                "Mise à jour disponible\n\nUne nouvelle version de {{ update_type }} est disponible.\n\nVersion actuelle : v{{ current_version }}\nNouvelle version : v{{ new_version }}\n\nMettre à jour : {{ update_url }}",
            ),
            $this->tpl('backup-completed', 'Sauvegarde terminée', 'admin',
                'Sauvegarde terminée avec succès',
                [['backup_date', 'Date de la sauvegarde', '27/03/2026 14:30'], ['backup_size', 'Taille de la sauvegarde', '45 Mo'], ['site_name', 'Nom du site', 'ArtisanCMS']],
                '<h2>Sauvegarde terminée</h2>'
                . '<p>La sauvegarde de <strong>{{ site_name }}</strong> a été effectuée avec succès.</p>'
                . '<p>Date : <strong>{{ backup_date }}</strong><br>Taille : <strong>{{ backup_size }}</strong></p>'
                . '<p>Aucune action n\'est requise de votre part.</p>',
                "Sauvegarde terminée\n\nLa sauvegarde de {{ site_name }} a été effectuée avec succès.\n\nDate : {{ backup_date }}\nTaille : {{ backup_size }}\n\nAucune action n'est requise de votre part.",
            ),
        ];
    }

    /**
     * Build a template definition array.
     *
     * @param list<array{0: string, 1: string, 2: string}> $variables [key, label, example]
     * @return array<string, mixed>
     */
    private function tpl(
        string $slug,
        string $name,
        string $category,
        string $subject,
        array $variables,
        string $bodyHtml,
        string $bodyText,
    ): array {
        return [
            'slug' => $slug,
            'name' => $name,
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'body_text' => $bodyText,
            'default_subject' => $subject,
            'default_body_html' => $bodyHtml,
            'category' => $category,
            'variables' => array_map(
                fn (array $v) => ['key' => $v[0], 'label' => $v[1], 'example' => $v[2]],
                $variables,
            ),
            'is_system' => true,
            'enabled' => true,
        ];
    }
}
