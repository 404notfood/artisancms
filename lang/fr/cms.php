<?php

return [
    // General
    'app_name' => 'ArtisanCMS',
    'dashboard' => 'Tableau de bord',
    'save' => 'Enregistrer',
    'cancel' => 'Annuler',
    'delete' => 'Supprimer',
    'edit' => 'Modifier',
    'create' => 'Créer',
    'search' => 'Rechercher',
    'filter' => 'Filtrer',
    'actions' => 'Actions',
    'confirm' => 'Confirmer',
    'back' => 'Retour',
    'yes' => 'Oui',
    'no' => 'Non',
    'loading' => 'Chargement...',
    'no_results' => 'Aucun résultat',

    // Auth
    'login' => 'Connexion',
    'logout' => 'Déconnexion',
    'register' => 'Inscription',
    'email' => 'Email',
    'password' => 'Mot de passe',
    'remember_me' => 'Se souvenir de moi',
    'forgot_password' => 'Mot de passe oublié ?',

    // Navigation
    'nav' => [
        'dashboard' => 'Tableau de bord',
        'pages' => 'Pages',
        'posts' => 'Articles',
        'media' => 'Médias',
        'menus' => 'Menus',
        'taxonomies' => 'Taxonomies',
        'categories' => 'Catégories',
        'tags' => 'Étiquettes',
        'plugins' => 'Plugins',
        'themes' => 'Thèmes',
        'settings' => 'Paramètres',
        'users' => 'Utilisateurs',
        'activity' => 'Journal d\'activité',
    ],

    // Pages
    'pages' => [
        'title' => 'Pages',
        'create' => 'Nouvelle page',
        'edit' => 'Modifier la page',
        'delete_confirm' => 'Êtes-vous sûr de vouloir supprimer cette page ?',
        'published' => 'Publiée',
        'draft' => 'Brouillon',
        'scheduled' => 'Planifiée',
        'trash' => 'Corbeille',
        'open_builder' => 'Ouvrir le Page Builder',
    ],

    // Posts
    'posts' => [
        'title' => 'Articles',
        'create' => 'Nouvel article',
        'edit' => 'Modifier l\'article',
        'delete_confirm' => 'Êtes-vous sûr de vouloir supprimer cet article ?',
        'published' => 'Publié',
        'draft' => 'Brouillon',
        'scheduled' => 'Planifié',
        'featured_image' => 'Image à la une',
        'excerpt' => 'Extrait',
        'allow_comments' => 'Autoriser les commentaires',
    ],

    // Media
    'media' => [
        'title' => 'Médiathèque',
        'upload' => 'Téléverser',
        'drop_files' => 'Glissez-déposez vos fichiers ici',
        'max_size' => 'Taille max : :size',
        'delete_confirm' => 'Supprimer ce fichier ?',
        'no_media' => 'Aucun média',
        'alt_text' => 'Texte alternatif',
        'caption' => 'Légende',
    ],

    // Menus
    'menus' => [
        'title' => 'Menus',
        'create' => 'Nouveau menu',
        'created' => 'Menu créé.',
        'updated' => 'Menu mis à jour.',
        'deleted' => 'Menu supprimé.',
        'add_item' => 'Ajouter un élément',
        'location' => 'Emplacement',
        'item_label' => 'Libellé',
        'item_url' => 'URL',
        'item_added' => 'Élément ajouté.',
        'item_updated' => 'Élément mis à jour.',
        'item_deleted' => 'Élément supprimé.',
        'items_synced' => 'Éléments du menu synchronisés.',
        'items_reordered' => 'Ordre mis à jour.',
    ],

    // Plugins
    'plugins' => [
        'title' => 'Plugins',
        'activate' => 'Activer',
        'deactivate' => 'Désactiver',
        'install' => 'Installer',
        'uninstall' => 'Désinstaller',
        'activated' => 'Plugin activé.',
        'deactivated' => 'Plugin désactivé.',
        'settings_saved' => 'Paramètres du plugin sauvegardés.',
    ],

    // Themes
    'themes' => [
        'title'                  => 'Thèmes',
        'activate'               => 'Activer',
        'active'                 => 'Actif',
        'customize'              => 'Personnaliser',
        'activated'              => 'Thème activé avec succès.',
        'customized'             => 'Thème personnalisé avec succès.',
        'installed'              => 'Thème installé avec succès.',
        'deleted'                => 'Thème supprimé.',
        'zip_open_failed'        => 'Impossible d\'ouvrir le fichier ZIP.',
        'manifest_missing'       => 'Le fichier artisan-theme.json est absent du ZIP.',
        'manifest_invalid_field' => 'Champ obligatoire manquant dans le manifeste : :field',
        'manifest_parse_error'   => 'Erreur lors de la lecture du manifeste',
        'cannot_delete_active'   => 'Impossible de supprimer le thème actuellement actif.',
    ],

    // Installation
    'install' => [
        'title' => 'Installation d\'ArtisanCMS',
        'welcome' => 'Bienvenue dans l\'installation d\'ArtisanCMS',
        'step_stack' => 'Choix du stack',
        'step_language' => 'Langue',
        'step_requirements' => 'Prérequis',
        'step_database' => 'Base de données',
        'step_site' => 'Informations du site',
        'step_admin' => 'Compte administrateur',
        'step_install' => 'Installation',
        'next' => 'Suivant',
        'previous' => 'Précédent',
        'installing' => 'Installation en cours...',
        'success' => 'Installation réussie !',
        'go_to_admin' => 'Accéder à l\'administration',
    ],

    // Widgets
    'widgets' => [
        'types' => [
            'recent_posts' => 'Articles récents',
            'categories' => 'Catégories',
            'search' => 'Recherche',
            'text' => 'Texte',
            'custom_html' => 'HTML personnalisé',
            'archives' => 'Archives',
            'tag_cloud' => 'Nuage de tags',
        ],
        'search_placeholder' => 'Rechercher...',
        'area_created' => 'Zone de widgets créée.',
        'area_updated' => 'Zone de widgets mise à jour.',
        'area_deleted' => 'Zone de widgets supprimée.',
        'widget_added' => 'Widget ajouté.',
        'widget_updated' => 'Widget mis à jour.',
        'widget_deleted' => 'Widget supprimé.',
        'widgets_reordered' => 'Widgets réordonnés.',
        'created' => 'Widget créé.',
        'updated' => 'Widget mis à jour.',
        'deleted' => 'Widget supprimé.',
        'reordered' => 'Widgets réordonnés.',
    ],

    // Settings updated
    'settings' => [
        'title' => 'Paramètres',
        'general' => 'Général',
        'seo' => 'SEO',
        'mail' => 'Email',
        'content' => 'Contenu',
        'media' => 'Médias',
        'maintenance' => 'Maintenance',
        'saved' => 'Paramètres enregistrés.',
        'updated' => 'Paramètres enregistrés.',
        'site_name' => 'Nom du site',
        'site_description' => 'Description du site',
        'site_url' => 'URL du site',
        'timezone' => 'Fuseau horaire',
        'locale' => 'Langue',
    ],

    // Status
    'status' => [
        'draft' => 'Brouillon',
        'published' => 'Publié',
        'scheduled' => 'Planifié',
        'trash' => 'Corbeille',
    ],

    // Errors
    'errors' => [
        'unauthorized' => 'Action non autorisée.',
        'not_found' => 'Ressource introuvable.',
        'validation' => 'Les données soumises sont invalides.',
    ],

    // Roles
    'roles' => [
        'created' => 'Rôle créé.',
        'updated' => 'Rôle mis à jour.',
        'deleted' => 'Rôle supprimé.',
        'system_cannot_delete' => 'Impossible de supprimer un rôle système.',
    ],

    // Comments
    'comments' => [
        'approved' => 'Commentaire approuvé.',
        'rejected' => 'Commentaire rejeté.',
        'spam' => 'Commentaire marqué comme spam.',
        'deleted' => 'Commentaire supprimé.',
    ],

    // Branding
    'branding' => [
        'updated' => 'Branding mis à jour.',
        'reset' => 'Branding réinitialisé.',
        'imported' => 'Configuration de branding importée.',
        'invalid_json' => 'Le fichier JSON est invalide.',
        'export_error' => 'Erreur lors de l\'export du branding.',
    ],

    // Design Tokens
    'design_tokens' => [
        'created' => 'Design token créé.',
        'updated' => 'Design token mis à jour.',
        'deleted' => 'Design token supprimé.',
        'seeded' => 'Tokens par défaut générés.',
        'categories' => [
            'color' => 'Couleurs',
            'typography' => 'Typographie',
            'button' => 'Boutons',
            'spacing' => 'Espacements',
            'shadow' => 'Ombres',
            'border' => 'Bordures',
        ],
    ],

    // Webhooks
    'webhooks' => [
        'created' => 'Webhook créé.',
        'updated' => 'Webhook mis à jour.',
        'deleted' => 'Webhook supprimé.',
        'tested' => 'Webhook testé avec succès.',
    ],

    // Custom Fields
    'custom_fields' => [
        'created' => 'Champ personnalisé créé.',
        'updated' => 'Champ personnalisé mis à jour.',
        'deleted' => 'Champ personnalisé supprimé.',
    ],

    // Popups
    'popups' => [
        'created' => 'Popup créée.',
        'updated' => 'Popup mise à jour.',
        'deleted' => 'Popup supprimée.',
    ],

    // Global Sections
    'global_sections' => [
        'created' => 'Section globale créée.',
        'updated' => 'Section globale mise à jour.',
        'deleted' => 'Section globale supprimée.',
        'activated' => 'Section globale activée.',
    ],

    // Newsletter
    'newsletter' => [
        'deleted' => 'Abonné supprimé.',
        'exported' => 'Liste des abonnés exportée.',
    ],

    // Content Types
    'content_types' => [
        'created' => 'Type de contenu créé.',
        'updated' => 'Type de contenu mis à jour.',
        'deleted' => 'Type de contenu supprimé.',
    ],

    // Content Entries
    'content_entries' => [
        'created' => 'Entrée de contenu créée.',
        'updated' => 'Entrée de contenu mise à jour.',
        'deleted' => 'Entrée de contenu supprimée.',
    ],

    // Redirects
    'redirects' => [
        'created' => 'Redirection créée.',
        'updated' => 'Redirection mise à jour.',
        'deleted' => 'Redirection supprimée.',
    ],

    // Sites (Multi-site)
    'sites' => [
        'created' => 'Site créé.',
        'updated' => 'Site mis à jour.',
        'deleted' => 'Site supprimé.',
        'switched' => 'Site changé avec succès.',
    ],

    // Updates
    'updates' => [
        'safe_mode_enabled' => 'Mode sans échec activé.',
        'safe_mode_disabled' => 'Mode sans échec désactivé.',
        'recovery_token_generated' => 'Token de récupération généré.',
    ],

    // Notifications
    'notifications' => [
        'marked_read' => 'Notification marquée comme lue.',
        'all_marked_read' => 'Toutes les notifications marquées comme lues.',
    ],

    // Import / Export
    'import_export' => [
        'exported' => 'Données exportées avec succès.',
        'imported' => 'Données importées avec succès.',
    ],

    // Bulk actions
    // AI Assistant
    'ai_assistant' => [
        'settings_saved' => 'Configuration IA enregistrée.',
    ],

    // System
    'system' => [
        'session_terminated' => 'Session terminée.',
        'all_sessions_terminated' => 'Toutes les autres sessions ont été déconnectées.',
    ],

    // Account
    'account' => [
        'updated' => 'Profil mis à jour.',
        'password_updated' => 'Mot de passe mis à jour.',
        'avatar_updated' => 'Avatar mis à jour.',
        'avatar_removed' => 'Avatar supprimé.',
    ],

    // Block patterns
    'block_patterns' => [
        'created' => 'Pattern créé.',
        'updated' => 'Pattern mis à jour.',
        'deleted' => 'Pattern supprimé.',
    ],

    'bulk_action_success' => ':count éléments traités avec succès.',
];
