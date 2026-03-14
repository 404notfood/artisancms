# Blueprint 01 - Schéma de base de données

## Vue d'ensemble
Toutes les tables CMS sont préfixées implicitement par le système Laravel. Les migrations sont dans `database/migrations/`.

---

## Table : users (modifiée depuis le starter kit)

```sql
-- Ajouts au users existant du starter kit
ALTER TABLE users ADD COLUMN role_id BIGINT UNSIGNED NULL AFTER email;
ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN bio TEXT NULL;
ALTER TABLE users ADD COLUMN preferences JSON NULL;
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
```

## Table : roles

```php
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name');           // Admin, Editor, Author, Subscriber
    $table->string('slug')->unique(); // admin, editor, author, subscriber
    $table->json('permissions');       // ["pages.create", "pages.edit", "posts.*"]
    $table->boolean('is_system')->default(false); // true = non supprimable
    $table->timestamps();
});
```

### Permissions par défaut
```json
{
  "admin": ["*"],
  "editor": ["pages.*", "posts.*", "media.*", "menus.*", "taxonomies.*"],
  "author": ["pages.create", "pages.edit_own", "posts.create", "posts.edit_own", "media.upload"],
  "subscriber": ["profile.edit"]
}
```

## Table : pages

```php
Schema::create('pages', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->json('content')->nullable();          // Arbre JSON de blocs (page builder)
    $table->enum('status', ['draft', 'published', 'scheduled', 'trash'])->default('draft');
    $table->string('template')->default('default'); // Réfère au layout du thème
    $table->string('meta_title')->nullable();
    $table->string('meta_description')->nullable();
    $table->string('meta_keywords')->nullable();
    $table->string('og_image')->nullable();
    $table->foreignId('parent_id')->nullable()->constrained('pages')->nullOnDelete();
    $table->integer('order')->default(0);
    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['status', 'published_at']);
    $table->index('parent_id');
    $table->index('slug');
});
```

## Table : posts

```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->json('content')->nullable();           // Arbre JSON de blocs
    $table->text('excerpt')->nullable();
    $table->enum('status', ['draft', 'published', 'scheduled', 'trash'])->default('draft');
    $table->string('featured_image')->nullable();
    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->timestamp('published_at')->nullable();
    $table->boolean('allow_comments')->default(true);
    $table->timestamps();
    $table->softDeletes();

    $table->index(['status', 'published_at']);
    $table->index('slug');
});
```

## Table : media

```php
Schema::create('media', function (Blueprint $table) {
    $table->id();
    $table->string('filename');
    $table->string('original_filename');
    $table->string('path');                        // Chemin relatif dans storage
    $table->string('disk')->default('public');
    $table->string('mime_type');
    $table->unsignedBigInteger('size');            // Taille en bytes
    $table->string('alt_text')->nullable();
    $table->string('title')->nullable();
    $table->string('caption')->nullable();
    $table->json('metadata')->nullable();          // {width, height, duration, etc.}
    $table->json('thumbnails')->nullable();        // {sm: "path", md: "path", lg: "path"}
    $table->string('folder')->default('/');        // Organisation en dossiers virtuels
    $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
    $table->timestamps();

    $table->index('mime_type');
    $table->index('folder');
});
```

## Table : menus

```php
Schema::create('menus', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->string('location')->nullable();       // header, footer, sidebar (défini par thème)
    $table->timestamps();
});
```

## Table : menu_items

```php
Schema::create('menu_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
    $table->foreignId('parent_id')->nullable()->constrained('menu_items')->cascadeOnDelete();
    $table->string('label');
    $table->enum('type', ['page', 'post', 'url', 'custom', 'taxonomy']);
    $table->string('url')->nullable();            // Pour type url/custom
    $table->unsignedBigInteger('linkable_id')->nullable();   // Pour page/post/taxonomy
    $table->string('linkable_type')->nullable();
    $table->string('target')->default('_self');   // _self, _blank
    $table->string('css_class')->nullable();
    $table->string('icon')->nullable();
    $table->integer('order')->default(0);
    $table->timestamps();

    $table->index(['menu_id', 'order']);
});
```

## Table : taxonomies

```php
Schema::create('taxonomies', function (Blueprint $table) {
    $table->id();
    $table->string('name');                       // Catégories, Tags, etc.
    $table->string('slug')->unique();
    $table->string('type');                       // category, tag, custom
    $table->string('description')->nullable();
    $table->boolean('hierarchical')->default(false); // true pour catégories
    $table->json('applies_to')->nullable();       // ["posts", "pages"] - à quels types s'applique
    $table->timestamps();
});
```

## Table : taxonomy_terms

```php
Schema::create('taxonomy_terms', function (Blueprint $table) {
    $table->id();
    $table->foreignId('taxonomy_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('slug');
    $table->text('description')->nullable();
    $table->foreignId('parent_id')->nullable()->constrained('taxonomy_terms')->nullOnDelete();
    $table->integer('order')->default(0);
    $table->timestamps();

    $table->unique(['taxonomy_id', 'slug']);
    $table->index('parent_id');
});
```

## Table : termables (polymorphique)

```php
Schema::create('termables', function (Blueprint $table) {
    $table->foreignId('term_id')->constrained('taxonomy_terms')->cascadeOnDelete();
    $table->morphs('termable');                   // termable_id + termable_type
    $table->integer('order')->default(0);

    $table->primary(['term_id', 'termable_id', 'termable_type']);
});
```

## Table : settings

```php
Schema::create('settings', function (Blueprint $table) {
    $table->id();
    $table->string('group')->default('general');  // general, seo, mail, social, etc.
    $table->string('key');
    $table->json('value')->nullable();
    $table->string('type')->default('string');    // string, boolean, number, json, image
    $table->boolean('is_public')->default(false); // Accessible côté front ?
    $table->timestamps();

    $table->unique(['group', 'key']);
    $table->index('group');
});
```

## Table : cms_plugins

```php
Schema::create('cms_plugins', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('name');
    $table->string('version');
    $table->text('description')->nullable();
    $table->string('author')->nullable();
    $table->boolean('enabled')->default(false);
    $table->json('settings')->nullable();
    $table->integer('order')->default(0);         // Ordre de chargement
    $table->timestamp('installed_at')->nullable();
    $table->timestamp('activated_at')->nullable();
    $table->timestamps();
});
```

## Table : cms_themes

```php
Schema::create('cms_themes', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('name');
    $table->string('version');
    $table->text('description')->nullable();
    $table->string('author')->nullable();
    $table->boolean('active')->default(false);
    $table->json('settings')->nullable();         // Overrides couleurs, fonts, etc.
    $table->json('customizations')->nullable();   // CSS custom, etc.
    $table->timestamps();
});
```

## Table : blocks (registre des blocs)

```php
Schema::create('blocks', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();             // heading, text, image, grid, etc.
    $table->string('name');
    $table->string('category');                   // layout, content, navigation, data, media
    $table->string('icon')->nullable();           // Nom d'icône Lucide
    $table->json('schema');                       // Définition des props (JSON Schema)
    $table->json('default_props')->nullable();    // Valeurs par défaut
    $table->boolean('is_core')->default(false);   // true = bloc système
    $table->string('source')->default('core');    // core, theme:{slug}, plugin:{slug}
    $table->timestamps();
});
```

## Table : revisions

```php
Schema::create('revisions', function (Blueprint $table) {
    $table->id();
    $table->morphs('revisionable');               // revisionable_id + revisionable_type
    $table->json('data');                         // Snapshot complet du contenu
    $table->string('reason')->nullable();         // "auto", "manual", "published", "restored"
    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->timestamps();

    $table->index(['revisionable_type', 'revisionable_id', 'created_at']);
});
```

### Système de révisions — Détails

**Quand une révision est créée :**
- `auto` : à chaque sauvegarde de contenu (page/post) qui modifie le champ `content`
- `manual` : quand l'utilisateur clique "Sauvegarder comme révision" dans le builder
- `published` : quand le statut passe à "published"
- `restored` : quand une ancienne révision est restaurée (l'état actuel est sauvegardé avant)

**Contenu de `data` (JSON) :**
```json
{
  "title": "Titre au moment de la révision",
  "slug": "slug-au-moment",
  "content": { "version": "1.0", "blocks": [...], "settings": {} },
  "status": "draft",
  "template": "default",
  "meta_title": "...",
  "meta_description": "..."
}
```

**Politique de nettoyage :**
- Conserver les 30 dernières révisions par page/post
- Les révisions `reason=published` ne sont jamais supprimées (toujours restaurables)
- Nettoyage via commande : `php artisan cms:revisions:cleanup --keep=30`

**Restauration :**
1. L'état actuel est sauvegardé comme nouvelle révision (`reason=restored`)
2. Le contenu de la révision ciblée est copié dans la page/post
3. Le statut reste inchangé (ne republish pas automatiquement)

---

## Workflow de publication

Les pages et posts supportent un workflow de publication :

```
draft ──────► published ──────► trash
  │               │                │
  │               ▼                │
  │          scheduled             │
  │          (publish_at           │
  │           dans le futur)       │
  │               │                │
  └───────────────┘                │
  (retour en brouillon)           │
                                   │
  ◄────────────────────────────────┘
  (restaurer depuis la corbeille)
```

**Transitions autorisées :**
| De | Vers | Condition |
|----|------|-----------|
| draft | published | Permission `publish` + `published_at` = now |
| draft | scheduled | Permission `publish` + `published_at` dans le futur |
| scheduled | published | Automatique quand `published_at` est atteint (via scheduler) |
| published | draft | Permission `edit` |
| published | trash | Permission `delete` |
| draft | trash | Permission `delete` |
| trash | draft | Permission `edit` (restauration) |

**Programmation de publication :**
```php
// app/Console/Kernel.php (ou dans routes/console.php)
Schedule::command('cms:publish-scheduled')->everyMinute();

// app/Console/Commands/PublishScheduled.php
// Cherche les pages/posts avec status=scheduled et published_at <= now()
// Met à jour le statut en 'published'
```

**Preview de brouillon :**
- URL temporaire : `/preview/{token}` (token unique, expire après 1h)
- Accessible sans authentification (pour partager avec un client)
- Le token est stocké en cache (pas en DB)

---

## Relations Eloquent (résumé)

```
User hasOne Role (via role_id)
User hasMany Pages (created_by)
User hasMany Posts (created_by)
User hasMany Media (uploaded_by)

Page belongsTo User (created_by)
Page belongsTo Page (parent_id) -- self-referential
Page hasMany Page (children)
Page morphMany Revisions
Page morphToMany TaxonomyTerms (via termables)

Post belongsTo User (created_by)
Post morphMany Revisions
Post morphToMany TaxonomyTerms (via termables)

Menu hasMany MenuItems
MenuItem belongsTo Menu
MenuItem belongsTo MenuItem (parent_id) -- self-referential

Taxonomy hasMany TaxonomyTerms
TaxonomyTerm belongsTo Taxonomy
TaxonomyTerm belongsTo TaxonomyTerm (parent_id)
TaxonomyTerm morphedByMany Pages, Posts (via termables)
```
