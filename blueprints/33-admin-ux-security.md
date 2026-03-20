# Blueprint 33 — Admin UX & Security URLs

## Vue d'ensemble

Ce blueprint couvre 5 ameliorations interconnectees du panneau d'administration :

1. **Dashboard Themes** : Correction des couleurs hardcodees pour que les 6 presets fonctionnent partout
2. **Page Account** : Redesign premium avec header gradient, avatar overlay, navigation par tabs
3. **URL Login/Register** : Chemins d'authentification personnalisables via les settings
4. **URL Admin unique** : Prefix d'administration personnalisable (securite type PrestaShop)
5. **Sidebar collapsed** : Design professionnel du mode reduit (tooltips, animations, dashboard epingle)

## Dependances

```
[1] Dashboard Themes ─────┐
                          ├──> [5] Sidebar collapsed ──> [2] Account Redesign
[3] URL Login/Register ───┘                                      │
                                                                  v
                                                        [4] URL Admin unique
```

---

## 1. Dashboard Themes — Fix couleurs hardcodees

### Probleme
Les presets de theme dashboard existent (6 presets dans `dashboard-themes.ts`) et le pipeline est fonctionnel (HandleInertiaRequests → AdminLayout → CSS vars), mais 22+ occurrences de `indigo-600/500` subsistent dans les pages admin au lieu d'utiliser `var(--admin-primary)`.

### Solution

**Fichier utilitaire** : `resources/js/lib/admin-theme.ts`
- Constantes reutilisables pour les classes CSS admin thematisees
- `ADMIN_INPUT_FOCUS` : focus ring avec `var(--admin-primary)`
- `ADMIN_BTN_STYLE` : style inline pour boutons primaires

**Settings/Index.tsx** — Remplacement systematique :
- Toggles switch : `bg-indigo-600` → `style={{ backgroundColor: 'var(--admin-primary)' }}`
- Tabs actifs : `bg-indigo-100 text-indigo-700` → `color-mix(in srgb, var(--admin-primary) 15%, transparent)`
- Bouton save : `bg-indigo-600` → style inline
- DashboardThemeSelector : `border-indigo-500` → `style={{ borderColor: theme.colors.primary }}`
- Badge check : `bg-indigo-500` → `style={{ backgroundColor: theme.colors.primary }}`

### Impact
- Quand l'admin change de theme (ex: Emeraude), TOUTES les couleurs de l'interface changent immediatement
- Aucune couleur indigo residuelle

---

## 2. Page Account — Redesign premium

### Probleme
La page `/admin/account` actuelle est un empilement de sections blanches avec des bordures grises et des couleurs indigo hardcodees. Aucun header visuel, pas de tabs, design non-professionnel.

### Architecture

```
resources/js/Pages/Admin/Account/
├── Edit.tsx           (~120 lignes) — Layout principal + header gradient + tabs
├── ProfileTab.tsx     (~130 lignes) — Nom, email, bio, visibilite, liens sociaux
├── SecurityTab.tsx    (~100 lignes) — Changement mot de passe
└── DangerTab.tsx      (~80 lignes)  — Suppression du compte
```

### Design

```
┌──────────────────────────────────────────────────┐
│  ██████████████ GRADIENT PRIMARY ██████████████   │
│  Mon compte                                      │
│  Gerez votre profil, securite et preferences     │
│                                                  │
│              ┌──────┐                            │
│              │AVATAR│ (chevauchement -mt-12)      │
└──────────────┴──────┴────────────────────────────┘
               John Doe
             john@doe.com

  [ Profil ]   [ Securite ]   [ Danger ]
  ─────────────────────────────────────

  ┌─ Contenu du tab actif ──────────────┐
  │                                     │
  │  Formulaire avec inputs thematises  │
  │                                     │
  └─────────────────────────────────────┘
```

Composants cles :
- Header gradient utilisant `var(--admin-primary)` avec pattern decoratif dots
- Avatar avec overlay `Camera` au hover (groupe hover opacity)
- Tabs avec bordure active `borderColor: var(--admin-primary)`
- Inputs avec `focus:ring-[var(--admin-primary)]/30`
- Boutons avec `style={{ backgroundColor: 'var(--admin-primary)' }}`

---

## 3. URL Login/Register personnalisable

### Probleme
Les URLs `/login` et `/register` sont hardcodees dans `routes/auth.php` (Breeze). Pas de moyen de les changer.

### Solution

**Config** : `config/cms.php` — Nouveau bloc `auth`
```php
'auth' => [
    'login_path' => env('CMS_LOGIN_PATH', 'login'),
    'register_path' => env('CMS_REGISTER_PATH', 'register'),
],
```

**Routes** : `routes/auth.php` — Lecture dynamique avec fallback
```php
try {
    $loginPath = \App\Models\Setting::get('security.login_path')
        ?? config('cms.auth.login_path', 'login');
    $registerPath = \App\Models\Setting::get('security.register_path')
        ?? config('cms.auth.register_path', 'register');
} catch (\Throwable) {
    $loginPath = config('cms.auth.login_path', 'login');
    $registerPath = config('cms.auth.register_path', 'register');
}
```

**Redirections 301** : Si le chemin a change, l'ancien chemin redirige vers le nouveau.

**UI** : Nouvel onglet "Securite" dans les parametres admin avec :
- Champ "Chemin de connexion" (defaut: login)
- Champ "Chemin d'inscription" (defaut: register)
- Avertissement visuel sur l'impact du changement

**Compatibilite** : Les noms de routes (`'login'`, `'register'`) sont preserves pour que les redirections automatiques de Laravel fonctionnent.

---

## 4. URL Admin unique (PrestaShop-style)

### Probleme
Le prefix `/admin` est hardcode dans :
- `routes/web.php` (ligne 30)
- `admin-navigation.ts` (38 occurrences)
- `command-palette/commands.ts` (35+ occurrences)
- 116 fichiers TSX contiennent `/admin`

### Concept PrestaShop
PrestaShop genere un hash aleatoire a l'installation (ex: `/admin-a7b3c9`) pour empecher les attaques par brute force sur une URL connue.

### Solution

**Backend** :
```php
// config/cms.php
'admin' => [
    'prefix' => env('CMS_ADMIN_PREFIX', 'admin'),
    'middleware' => ['web', 'auth'],
],

// routes/web.php — Lecture dynamique
$adminPrefix = config('cms.admin.prefix', 'admin');
try {
    $dbPrefix = \App\Models\Setting::get('security.admin_prefix');
    if ($dbPrefix) $adminPrefix = $dbPrefix;
} catch (\Throwable) {}

Route::prefix($adminPrefix)->middleware(...)->group(...);
```

**Inertia shared** : `cms.adminPrefix` partage dans HandleInertiaRequests.

**Frontend helper** : `resources/js/lib/admin-url.ts`
```ts
export function useAdminUrl() {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    return (path: string = '') => {
        const clean = path.startsWith('/') ? path.slice(1) : path;
        return clean ? `/${prefix}/${clean}` : `/${prefix}`;
    };
}
```

**Navigation dynamique** : `admin-navigation.ts` refactore en `buildNavDefs(prefix)`.

**Catch-all dynamique** : Regex construite avec `preg_quote($adminPrefix)`.

**Migration progressive** : Les 116 fichiers TSX sont migres vers `useAdminUrl()` par lots.

---

## 5. Sidebar collapsed — Design professionnel

### Probleme
Le mode reduit de la sidebar est fonctionnel mais amateur :
- Separateurs grossiers (`h-px w-6 bg-white/10`)
- Bouton "Reduire" avec texte et chevrons basiques
- Tooltip sans fleche directionnelle
- Pas de badge visible en collapsed
- Dashboard noye dans le groupe "Contenu"
- Zone utilisateur : avatar + logout separes sans elegance

### Solution

**Dashboard epingle** :
```
┌─────────┐
│    🏠   │  ← Dashboard epingle, hors des groupes
├─────────┤
│  · · ·  │  ← Micro-separateur elegant
│    📄   │
│    📰   │  Contenu
│    🖼   │
├─────────┤
│  · · ·  │
│    📋   │  Structure
│    🔲   │
├─────────┤
│    ⚙   │  Systeme
├─────────┤
│   [◀]   │  ← Bouton discret dans un rond
├─────────┤
│   (AV)  │  ← Avatar avec tooltip nom+email
└─────────┘
```

**Tooltip avec fleche** :
```
     ┌──────────────┐
  ◄──│  Pages       │
     └──────────────┘
```
- Fond : `var(--admin-sidebar-bg)`
- Bordure : `rgba(255,255,255,0.08)`
- Fleche : petit carre CSS `rotate-45` avec meme fond/bordure
- Animation : `opacity + translate-x` en 200ms

**Badge dot** : En collapsed, petit point `h-2 w-2` pulsant (`animate-pulse`) sur l'icone.

**Animation hover** : `group-hover:scale-110` sur les icones (collapsed uniquement).

**Bouton collapse** : Icone dans un rond `h-7 w-7 bg-white/5`, hover `bg-white/10`.

**Zone user collapsed** : Avatar cliquable → `/admin/account`, tooltip au hover avec nom + email + fleche CSS.

---

## Fichiers impactes (resume)

### Nouveaux fichiers (7)
- `resources/js/lib/admin-theme.ts`
- `resources/js/lib/admin-url.ts`
- `resources/js/Pages/Admin/Account/ProfileTab.tsx`
- `resources/js/Pages/Admin/Account/SecurityTab.tsx`
- `resources/js/Pages/Admin/Account/DangerTab.tsx`

### Fichiers modifies (10+)
- `config/cms.php`
- `routes/web.php`
- `routes/auth.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Http/Controllers/Admin/SettingController.php`
- `resources/js/types/cms.ts`
- `resources/js/Pages/Admin/Settings/Index.tsx`
- `resources/js/Pages/Admin/Account/Edit.tsx`
- `resources/js/Layouts/AdminLayout.tsx`
- `resources/js/Layouts/admin/admin-navigation.ts`
- `resources/js/Layouts/admin/SidebarNavItem.tsx`
- `resources/js/Components/admin/command-palette/commands.ts`
- 116 fichiers TSX (migration progressive pour URL admin)

---

## Securite

- Les redirections 301 previennent les liens morts
- Le prefix admin personnalise empeche les scanners automatises
- Le middleware `EnsureAdmin` est ajoute au groupe de routes admin
- Les valeurs DB sont lues avec try/catch pour eviter les crashes au boot
- Les chemins sont valides avant sauvegarde (alphanumerique + tirets uniquement)
- Un avertissement clair est affiche avant tout changement d'URL
