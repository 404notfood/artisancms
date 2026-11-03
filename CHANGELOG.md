## 1.3.0 — 2026-11-03

### Galeries photo

- Sept presentations harmonisees avec le theme : mosaique, carrousel a miniatures, reportage, rangees justifiees, grille, composition et pellicule.
- Couleurs, typographie et arrondis du theme repris automatiquement ; habillages clair et sombre disponibles pour le carrousel.
- Diaporama plein ecran avec miniatures, zoom, navigation clavier et gestes tactiles.
- Ajout de plusieurs photos en une fois, selection conservee pendant la recherche et la pagination, protection contre les doublons.
- Mediatheque paginee au-dela de 40 photos, avec recuperation des legendes, textes alternatifs et dimensions.
- Reorganisation des photos et modification des informations depuis une liste compacte.
- Corrections des proportions, espacements, legendes et affichages mobiles des galeries existantes.

## 1.2.0 — 2026-11-03

### Ajouts

- Registre persistant des releases CMS, themes et plugins, avec liens de telechargement et empreintes SHA-256.
- Installation du coeur depuis l'administration ou `php artisan cms:update`, avec maintenance, sauvegarde des fichiers et de la base et restauration automatique en cas d'echec.
- Mise a jour automatique du coeur selon les preferences enregistrees.
- Publication GitHub en ZIP, avec dependances PHP, frontend compile et notification authentifiee au registre.

### Corrections

- Verification obligatoire des empreintes et de l'identite des packages, protection contre les archives malveillantes et verrouillage des operations concurrentes.
- Conservation des medias, themes, plugins, secrets et personnalisations du site lors de la mise a jour du coeur.
- Prise en compte des preferences de mises a jour des extensions enregistrees en base.

## 1.1.0 — 2026-11-03

### Ajouts

- Page Builder accessible depuis la modification des articles, avec sauvegarde du contenu et revisions automatiques.
- Navigation du builder adaptee aux articles et au prefixe d'administration configure.

### Corrections

- Le bouton Publier du builder enregistre le contenu avant la publication.
- L'indicateur de modifications non sauvegardees se reinitialise apres une sauvegarde reussie.

## 1.0.0 — 2026-03-27

### Initial Release

- Page Builder drag & drop avec dnd-kit (sections, grilles, 20+ types de blocs)
- Gestion des pages et articles avec workflow de publication (brouillon, en revue, publié)
- Systeme de revisions automatique
- Gestion des medias (upload, crop, responsive srcset, WebP)
- Systeme de menus avec drag & drop
- Systeme de plugins extensible (hooks & filters)
- Systeme de themes avec CSS variables
- Taxonomies (categories, tags, taxonomies custom)
- Custom Post Types et Custom Fields (25+ types de champs)
- SEO core (meta tags, Open Graph, Twitter Cards, JSON-LD, sitemap XML)
- Commentaires avec anti-spam integre
- Redirections 301/302 automatiques
- Systeme de widgets avec visibilite conditionnelle
- Analytics integre server-side (RGPD-compliant)
- Multi-site avec domaines custom
- Branding / White-labeling
- Templates de sites (Restaurant, Agence, Portfolio, Blog, E-commerce)
- Email templates editables
- Webhooks signes HMAC SHA-256
- Import/Export de contenu
- Systeme de mises a jour (registry + fallback GitHub Releases)
- Wizard d'installation multi-etapes
- Dashboard admin complet avec widgets
- Roles et permissions granulaires (40+ permissions)
- Design Tokens / Style Book
- Block Patterns (synced/unsynced)
- Global Sections (header/footer builder)
- Mode sans echec et recuperation d'erreurs
