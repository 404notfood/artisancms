# ArtisanCMS

CMS moderne, performant et extensible. Alternative open-source a WordPress, Joomla, Drupal et PrestaShop.

Construit avec **Laravel 12 + React 19 + Inertia 2** pour une experience no-code complete.

---

## Fonctionnalites principales

### Gestion de contenu
- **Pages & Articles** avec editeur visuel drag & drop
- **Custom Post Types** - Creez des types de contenu personnalises sans code (Portfolio, Equipe, Evenements...)
- **Taxonomies** - Categories et tags hierarchiques
- **Custom Fields** - Champs personnalises par groupe
- **Revisions** avec historique, comparaison et restauration
- **Workflow editorial** - Brouillon, En revue, Approuve, Publie
- **Publication programmee** - Planifiez la publication automatique
- **Corbeille** avec restauration et suppression definitive
- **Duplication** de pages et articles en un clic
- **Verrouillage de contenu** pour eviter les conflits d'edition
- **Liens de preview** partageables pour les brouillons (48h)

### Page Builder (36 blocs)
- **Layout** : Section, Grille, Espacement, Separateur
- **Contenu** : Titre, Texte, Bouton, Hero, Accordeon, Onglets, Compteur, Boite icone, Tableau, Alerte, Compte a rebours, Bloc de code, Citation, Liste, Equipe, Barre de progression, Chronologie
- **Media** : Image, Video, Galerie/Carousel, Carte (OpenStreetMap/Google Maps), Grille de logos, Integration (YouTube, Vimeo, oEmbed)
- **Marketing** : Temoignages, Tableau de prix, Appel a l'action (CTA)
- **Donnees** : Fiche produit, Grille produits, Panier, Formulaire commande, Produits vedettes, Formulaire (Form Builder)
- Responsive editing (Desktop / Tablet / Mobile)
- Undo / Redo
- Auto-save

### E-commerce complet
- Produits avec variantes et categories
- Panier, Checkout, Commandes
- Paiements : Stripe, Paiement a la livraison (extensible)
- Livraison : Zones et methodes (forfait, poids, prix, gratuit)
- Taxes : Regles par pays/region, taxes composees
- Coupons de reduction
- Avis clients avec moderation
- Gestion de stock avec mouvements et alertes
- Liste de souhaits (Wishlist)
- Comptes clients avec adresses
- Factures PDF
- Emails transactionnels (confirmation, expedition, statut)
- Rapports de ventes avec KPIs et graphiques

### Plugins officiels
| Plugin | Description |
|--------|-------------|
| **AI Assistant** | Generation de contenu, SEO, alt-text via OpenAI / Anthropic |
| **Backup & Restore** | Sauvegardes auto/manuelles, restauration, retention |
| **Form Builder** | Formulaires visuels, anti-spam, soumissions, export CSV |
| **SEO** | Sitemap XML, robots.txt, meta tags |
| **E-commerce** | Boutique complete (voir ci-dessus) |
| **Contact Form** | Formulaire de contact simple |

### Themes & Personnalisation
- Systeme de themes avec layouts multiples
- Variables CSS pour couleurs et typographies
- White-labeling / Branding complet (logo, couleurs, favicon)
- Header / Footer builder (Global Sections)
- Mega menus
- Widgets et sidebars

### Marketing & Engagement
- **Popups no-code** - Modals, bannieres, slide-in avec declencheurs (chargement, intention de sortie, scroll, delai)
- **Newsletter** - Collecte d'emails, export CSV, desabonnement
- **Partage social** - Facebook, Twitter, LinkedIn, WhatsApp, Email
- **Cookie Consent / RGPD** - Bandeau de consentement configurable

### Administration
- **Dashboard enrichi** - Stats, analytics, commentaires, medias recents, pages populaires
- **Gestion des utilisateurs** - Roles et permissions granulaires (ACL)
- **Centre de notifications** - Notifications in-app en temps reel
- **Analytics integre** - Vues de pages, visiteurs, top pages (server-side, RGPD)
- **Journal d'activite** - Audit trail complet
- **Import / Export** - JSON natif + import WordPress (WXR XML)
- **Redirections** - 301/302 avec gestion centralisee

### Multi-site
- Architecture shared database avec `site_id`
- Domaines/sous-domaines personnalises
- Branding et contenu independants par site

### Technique
- **Recherche full-text** via Laravel Scout (MySQL / Meilisearch)
- **RSS Feed** - `/feed` et `/feed/category/{slug}`
- **Webhooks** - Notifications evenementielles signees HMAC SHA-256
- **Email Templates** - Templates editables avec variables dynamiques
- **Cache intelligent** - Invalidation via Observers, Redis en production
- **Internationalisation** - Interface FR/EN, extensible

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | Laravel 12 (PHP 8.2+) |
| Frontend | React 19 + TypeScript |
| Bridge | Inertia.js 2 |
| UI | shadcn/ui + Tailwind CSS v4 |
| Drag & Drop | dnd-kit |
| Base de donnees | MySQL / MariaDB |
| Build | Vite |
| Tests | PHPUnit + Vitest |
| Recherche | Laravel Scout |
| Cache | File (dev) / Redis (prod) |

---

## Installation

### Prerequis

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+ / MariaDB 10.6+

### Installation rapide

```bash
# Cloner le projet
git clone https://github.com/votre-repo/artisan-cms.git
cd artisan-cms

# Installer les dependances
composer install
npm install

# Configurer l'environnement
cp .env.example .env
php artisan key:generate

# Lancer l'installation
php artisan cms:install --quick
# ou via le wizard web : http://localhost/install

# Demarrer
php artisan serve
npm run dev
```

### Installation via Docker

```bash
docker-compose up -d
# Acceder a http://localhost/install
```

---

## Commandes utiles

```bash
# Developpement
php artisan serve               # Serveur Laravel
npm run dev                     # Vite dev server
npm run build                   # Build production

# CMS
php artisan cms:install         # Installation interactive
php artisan cms:install --quick # Installation rapide
php artisan cms:seed            # Donnees de demonstration
php artisan cms:cache:clear     # Vider le cache CMS
php artisan cms:publish-scheduled  # Publier les contenus planifies

# Media
php artisan cms:media:optimize  # Optimiser les images existantes

# Analytics
php artisan cms:analytics:aggregate  # Agreger les vues quotidiennes
php artisan cms:analytics:cleanup    # Purger les anciennes donnees

# Plugins
php artisan cms:plugin:create   # Creer un nouveau plugin
php artisan cms:theme:create    # Creer un nouveau theme

# Tests
php artisan test                # Tests PHPUnit
npm test                        # Tests Vitest
```

---

## Architecture

```
artisan-cms/
├── app/
│   ├── CMS/                    # Core CMS (Plugins, Themes, Hooks, Blocks)
│   ├── Console/Commands/       # Commandes Artisan
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/          # Controllers admin (22)
│   │   │   ├── Api/            # API Builder & Media
│   │   │   └── Front/          # Blog, Search, RSS, Error
│   │   └── Middleware/         # 11 middlewares
│   ├── Models/                 # 31 modeles Eloquent
│   ├── Observers/              # Cache invalidation
│   ├── Policies/               # 10 policies d'autorisation
│   └── Services/               # 25 services metier
├── content/
│   ├── plugins/                # 6 plugins officiels
│   ├── templates/              # 5 templates de site
│   └── themes/                 # Themes installes
├── database/
│   ├── factories/              # 10 factories
│   ├── migrations/             # 33+ migrations
│   └── seeders/                # Roles, Blocks, Settings
├── resources/js/
│   ├── Components/
│   │   ├── builder/blocks/     # 36 blocs (renderers + settings)
│   │   └── ui/                 # shadcn/ui components
│   ├── Layouts/                # Admin, Front, Auth, Guest
│   ├── Pages/
│   │   ├── Admin/              # ~70 pages admin
│   │   ├── Front/              # ~20 pages front
│   │   ├── Builder/            # Editeur visuel
│   │   └── Install/            # Wizard d'installation
│   ├── hooks/                  # useTranslation, usePermission, useAutoSave
│   ├── stores/                 # Zustand builder store
│   └── types/                  # TypeScript definitions
├── routes/
│   ├── admin.php               # ~120 routes admin
│   ├── web.php                 # ~23 routes front
│   ├── api.php                 # API endpoints
│   └── install.php             # Installation wizard
├── blueprints/                 # 27 fichiers de specs techniques
└── docker/                     # Configuration Docker
```

---

## Systeme de plugins

Les plugins etendent ArtisanCMS via des Service Providers Laravel :

```php
// content/plugins/mon-plugin/src/MonPluginServiceProvider.php
class MonPluginServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Enregistrer des routes, blocs, hooks, migrations...
        CMS::hook('page.created', function ($page) {
            // Reagir a la creation d'une page
        });

        CMS::filter('page.title', function ($title) {
            return strtoupper($title);
        });
    }
}
```

Chaque plugin dispose d'un manifeste `artisan-plugin.json` et suit le cycle : install -> activate -> deactivate -> uninstall.

---

## Securite

- Policies Laravel pour chaque entite
- Gate globale avec permissions par role (wildcard `pages.*`)
- ContentSanitizer anti-XSS
- Validation MIME stricte pour les uploads
- Rate limiting (login, API, upload, installation)
- Security Headers (CSP, X-Frame-Options, etc.)
- HMAC SHA-256 pour les webhooks
- Cles API chiffrees en base
- Journal d'activite complet

---

## Licence

MIT

---

## Contribuer

Les contributions sont les bienvenues. Consultez les fichiers `blueprints/` pour la documentation technique detaillee.

1. Fork le projet
2. Creez votre branche (`git checkout -b feature/ma-feature`)
3. Committez vos changements (`git commit -m 'Ajout de ma feature'`)
4. Pushez (`git push origin feature/ma-feature`)
5. Ouvrez une Pull Request
"# articms" 
