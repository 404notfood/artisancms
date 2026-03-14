# Blueprint 11 - Spécification API

## Vue d'ensemble
Ce document définit tous les endpoints REST d'ArtisanCMS. Les routes Inertia (rendant des pages React) ne sont pas listées ici — uniquement les endpoints JSON utilisés par le page builder, les composants AJAX, et l'API publique.

---

## Format standard des réponses

### Succès
```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": {
    "field_name": ["Message de validation"]
  }
}
```

### Pagination (standard Laravel)
```json
{
  "data": [ ... ],
  "current_page": 1,
  "last_page": 5,
  "per_page": 20,
  "total": 95,
  "from": 1,
  "to": 20,
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." }
}
```

### Codes HTTP utilisés

| Code | Usage |
|------|-------|
| 200 | Succès (GET, PUT, PATCH) |
| 201 | Créé (POST) |
| 204 | Supprimé (DELETE) |
| 302 | Redirection (Inertia POST/PUT) |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé (permission insuffisante) |
| 404 | Ressource non trouvée |
| 422 | Erreur de validation |
| 429 | Rate limit dépassé |
| 500 | Erreur serveur |

---

## 1. API Page Builder

**Préfixe** : `/api/builder`
**Middleware** : `web`, `auth`, `throttle:builder-api`
**Authentification** : Cookie session (Inertia)

### PUT `/api/builder/pages/{page}/content`
Sauvegarder le contenu (arbre de blocs) d'une page.

**Request :**
```json
{
  "content": {
    "version": "1.0",
    "blocks": [
      {
        "id": "uuid-string",
        "type": "section",
        "props": { "fullWidth": true },
        "styles": {
          "desktop": { "padding": "80px 0" },
          "tablet": {},
          "mobile": {}
        },
        "visibility": { "desktop": true, "tablet": true, "mobile": true },
        "children": []
      }
    ],
    "settings": {
      "bodyClass": "",
      "customCss": "",
      "customJs": ""
    }
  }
}
```

**Validation :**
```php
'content' => ['required', 'array'],
'content.version' => ['required', 'string'],
'content.blocks' => ['required', 'array'],
'content.blocks.*.id' => ['required', 'string'],
'content.blocks.*.type' => ['required', 'string', 'exists:blocks,slug'],
'content.settings' => ['nullable', 'array'],
```

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "page_id": 1,
    "revision_id": 42,
    "saved_at": "2026-03-10T14:30:00Z"
  }
}
```

---

### POST `/api/builder/pages/{page}/autosave`
Auto-sauvegarde (crée un brouillon, pas une révision formelle).

**Request :** Identique à PUT content.

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "autosaved_at": "2026-03-10T14:30:00Z"
  }
}
```

---

### POST `/api/builder/pages/{page}/preview`
Génère un rendu HTML temporaire sans sauvegarder.

**Request :**
```json
{
  "content": { ... },
  "template": "default"
}
```

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "preview_url": "/preview/tmp-abc123",
    "expires_at": "2026-03-10T15:00:00Z"
  }
}
```

---

### POST `/api/builder/media/upload`
Upload d'un média inline depuis le page builder.

**Request :** `multipart/form-data`
- `file` : Fichier (image/video)
- `folder` : (optionnel) Dossier virtuel

**Response 201 :**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "url": "/storage/media/2026/03/abc123.jpg",
    "filename": "abc123.jpg",
    "original_filename": "hero-banner.jpg",
    "mime_type": "image/jpeg",
    "size": 245760,
    "thumbnails": {
      "sm": "/storage/media/2026/03/abc123_sm.jpg",
      "md": "/storage/media/2026/03/abc123_md.jpg",
      "lg": "/storage/media/2026/03/abc123_lg.jpg"
    },
    "metadata": { "width": 1920, "height": 1080 }
  }
}
```

---

### GET `/api/builder/templates`
Lister les templates de pages disponibles.

**Response 200 :**
```json
{
  "success": true,
  "data": [
    {
      "slug": "homepage",
      "name": "Page d'accueil",
      "preview": "/storage/templates/homepage.png",
      "category": "standard"
    },
    {
      "slug": "about",
      "name": "À propos",
      "preview": "/storage/templates/about.png",
      "category": "standard"
    }
  ]
}
```

---

### POST `/api/builder/templates`
Sauvegarder la page actuelle comme template.

**Request :**
```json
{
  "name": "Mon template",
  "slug": "mon-template",
  "content": { ... },
  "preview_image": "base64..."
}
```

**Response 201 :**
```json
{
  "success": true,
  "data": { "slug": "mon-template" }
}
```

---

## 2. API Media

**Préfixe** : `/api/media`
**Middleware** : `web`, `auth`

### GET `/api/media`
Lister les médias (utilisé par le sélecteur de média dans le builder et l'admin).

**Query params :**
| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | int | 1 | Page de pagination |
| `per_page` | int | 30 | Items par page |
| `search` | string | - | Recherche par nom/alt |
| `mime_type` | string | - | Filtrer par type (image, video, application) |
| `folder` | string | / | Dossier virtuel |
| `sort` | string | created_at | Tri (created_at, size, filename) |
| `order` | string | desc | Ordre (asc, desc) |

**Response 200 :** Pagination standard avec items Media.

---

### POST `/api/media`
Upload de média (depuis la media library admin).

**Request :** `multipart/form-data`
- `files[]` : Fichiers multiples
- `folder` : Dossier cible
- `alt_text` : Texte alternatif

**Response 201 :**
```json
{
  "success": true,
  "data": {
    "uploaded": 3,
    "files": [ ... ]
  }
}
```

---

### PUT `/api/media/{media}`
Modifier les métadonnées d'un média.

**Request :**
```json
{
  "alt_text": "Description mise à jour",
  "title": "Nouveau titre",
  "folder": "/images/hero"
}
```

---

### DELETE `/api/media/{media}`
Supprimer un média.

**Response 204 :** Pas de body.

---

## 3. API Admin CRUD

Les controllers admin utilisent Inertia (redirection après POST/PUT/DELETE). Mais certains endpoints AJAX sont nécessaires.

### POST `/api/admin/pages/{page}/duplicate`
Dupliquer une page.

**Response 201 :**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "title": "Ma page (copie)",
    "slug": "ma-page-copie",
    "edit_url": "/admin/pages/15/edit"
  }
}
```

---

### POST `/api/admin/pages/reorder`
Réordonner les pages (drag & drop dans la liste).

**Request :**
```json
{
  "items": [
    { "id": 1, "order": 0, "parent_id": null },
    { "id": 3, "order": 1, "parent_id": null },
    { "id": 2, "order": 0, "parent_id": 1 }
  ]
}
```

---

### POST `/api/admin/pages/{page}/publish`
Publier une page (changer le statut).

**Request :**
```json
{
  "status": "published",
  "published_at": "2026-03-10T14:00:00Z"
}
```

---

### GET `/api/admin/pages/{page}/revisions`
Lister les révisions d'une page.

**Response 200 :**
```json
{
  "data": [
    {
      "id": 42,
      "reason": "auto",
      "created_by": { "id": 1, "name": "Admin" },
      "created_at": "2026-03-10T14:30:00Z",
      "preview_url": "/admin/pages/1/revisions/42/preview"
    }
  ]
}
```

---

### POST `/api/admin/pages/{page}/revisions/{revision}/restore`
Restaurer une révision.

**Response 200 :**
```json
{
  "success": true,
  "message": "Révision restaurée avec succès",
  "data": { "new_revision_id": 43 }
}
```

---

## 4. API Menus (AJAX)

### PUT `/api/admin/menus/{menu}/items`
Sauvegarder l'arbre des items de menu (après drag & drop).

**Request :**
```json
{
  "items": [
    {
      "id": 1,
      "label": "Accueil",
      "type": "page",
      "linkable_id": 1,
      "order": 0,
      "parent_id": null,
      "children": [
        {
          "id": 3,
          "label": "Sous-page",
          "type": "page",
          "linkable_id": 5,
          "order": 0,
          "parent_id": 1
        }
      ]
    },
    {
      "id": 2,
      "label": "Blog",
      "type": "url",
      "url": "/blog",
      "order": 1,
      "parent_id": null,
      "children": []
    }
  ]
}
```

---

## 5. API Settings (AJAX)

### GET `/api/admin/settings/{group}`
Récupérer les settings d'un groupe.

**Response 200 :**
```json
{
  "data": {
    "site_name": "Mon Site",
    "site_description": "Description du site",
    "site_url": "https://monsite.com",
    "timezone": "Europe/Paris"
  }
}
```

---

### PUT `/api/admin/settings/{group}`
Mettre à jour un groupe de settings.

**Request :**
```json
{
  "site_name": "Nouveau nom",
  "site_description": "Nouvelle description"
}
```

---

## 6. API Installation

**Préfixe** : `/install`
**Middleware** : `web`, `throttle:install` (pas d'auth)

### POST `/install/database/test`
Tester la connexion à la base de données (AJAX).

**Request :**
```json
{
  "host": "127.0.0.1",
  "port": 3306,
  "database": "artisan_cms",
  "username": "root",
  "password": ""
}
```

**Response 200 (succès) :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "server_version": "10.4.32-MariaDB",
    "database_exists": true
  }
}
```

**Response 422 (échec) :**
```json
{
  "success": false,
  "message": "Impossible de se connecter à la base de données",
  "errors": {
    "connection": ["SQLSTATE[HY000] [2002] Connection refused"]
  }
}
```

---

## 7. API Publique (Front)

**Préfixe** : `/api/v1`
**Middleware** : `throttle:public-api`
**Auth** : Optionnelle (API key pour certains endpoints)

> Note : En V1 avec Inertia, le front est rendu côté serveur. L'API publique est prévue pour la V2 (Next.js) et les intégrations tierces.

### GET `/api/v1/pages`
Liste des pages publiées.

### GET `/api/v1/pages/{slug}`
Contenu d'une page par slug.

### GET `/api/v1/posts`
Liste des articles publiés (avec pagination).

### GET `/api/v1/posts/{slug}`
Contenu d'un article par slug.

### GET `/api/v1/menus/{slug}`
Items d'un menu par slug.

### GET `/api/v1/settings/public`
Settings publiques du site (nom, description, etc.).

---

## 8. Routes Inertia (référence)

Ces routes rendent des pages React via Inertia. Elles ne retournent pas du JSON mais des réponses Inertia.

### Routes admin
```
GET  /admin                        → Admin/Dashboard
GET  /admin/pages                  → Admin/Pages/Index
GET  /admin/pages/create           → Admin/Pages/Create
GET  /admin/pages/{page}/edit      → Admin/Pages/Edit
GET  /admin/builder/{page}         → Builder/Edit
GET  /admin/posts                  → Admin/Posts/Index
GET  /admin/posts/create           → Admin/Posts/Create
GET  /admin/posts/{post}/edit      → Admin/Posts/Edit
GET  /admin/media                  → Admin/Media/Index
GET  /admin/menus                  → Admin/Menus/Index
GET  /admin/menus/{menu}/edit      → Admin/Menus/Edit
GET  /admin/settings/{group?}      → Admin/Settings/Index
GET  /admin/users                  → Admin/Users/Index
GET  /admin/themes                 → Admin/Themes/Index
GET  /admin/plugins                → Admin/Plugins/Index
```

### Routes front
```
GET  /                             → Front/Page (homepage)
GET  /blog                         → Front/Blog/Index
GET  /blog/{slug}                  → Front/Blog/Show
GET  /{slug}                       → Front/Page (catch-all dynamique)
```

### Routes auth (starter kit)
```
GET  /login                        → Auth/Login
GET  /register                     → Auth/Register
POST /login                        → AuthenticatedSessionController
POST /register                     → RegisteredUserController
POST /logout                       → Déconnexion
```

### Routes installation
```
GET  /install                      → Install/Stack
POST /install/stack                → Valider stack
GET  /install/language             → Install/Language
POST /install/language             → Valider langue
GET  /install/requirements         → Install/Requirements
GET  /install/database             → Install/Database
POST /install/database/test        → Tester DB (AJAX)
POST /install/database             → Valider DB
GET  /install/site                 → Install/Site
POST /install/site                 → Valider site
GET  /install/admin                → Install/Admin
POST /install/execute              → Lancer installation
```
