# Blueprint 09 - Système d'installation (type WordPress)

## Vue d'ensemble

ArtisanCMS est un CMS **multi-stack** : à l'installation, l'utilisateur choisit son stack technique avant toute configuration. L'installation se décline en **deux méthodes** complémentaires :

1. **Wizard Web** (`/install`) — Interface graphique multi-étapes accessible depuis le navigateur. Inspiré du célèbre installeur WordPress, il guide l'utilisateur étape par étape : choix du stack, vérification des prérequis, configuration de la base de données, création du compte admin, réglages du site.

2. **Commande CLI** — Alternative en ligne de commande pour les développeurs :
   - **Laravel** : `php artisan cms:install`
   - **Next.js** : `npx artisan-cms install` (Phase 7 - futur)

Les deux méthodes aboutissent au même résultat : un CMS complètement fonctionnel, prêt à l'emploi.

### Stacks disponibles

| Stack | Backend | Frontend | Auth | ORM | Status |
|---|---|---|---|---|---|
| **Laravel + React** | Laravel 12 (PHP 8.2+) | React 19 + Inertia 2 | Laravel Auth (starter kit) | Eloquent | ✅ V1 (disponible) |
| **Next.js** | Next.js App Router | React 19 | better-auth | Prisma | 🔮 V2 (Phase 6-7) |

Le choix du stack conditionne :
- Les **prérequis vérifiés** (PHP vs Node.js)
- La **méthode d'installation** (Artisan vs npx)
- La **configuration de la DB** (Eloquent vs Prisma)
- Les **fichiers installés** (Laravel app vs Next.js app)
- Les **packages React partagés** restent identiques (`@artisan/page-builder`, `@artisan/blocks`, `@artisan/ui`, `@artisan/theme-engine`)

### Pourquoi un installeur ?

| Sans installeur | Avec installeur |
|---|---|
| Modifier `.env` manuellement | Formulaire web convivial |
| `php artisan migrate` en CLI | Un clic pour créer les tables |
| `php artisan db:seed` séparément | Compte admin créé dans le wizard |
| Aucun feedback visuel | Checklist des prérequis en temps réel |
| Risque d'oubli d'étapes | Processus guidé et complet |
| Pas de choix de stack | Sélection visuelle Laravel ou Next.js |

---

## Architecture du système d'installation

### Flux global

```
Utilisateur arrive sur le site
       │
       ▼
  ┌─────────────┐     OUI     ┌──────────────────┐
  │ CMS installé?├────────────►│  Login / Site     │
  └──────┬──────┘              └──────────────────┘
         │ NON
         ▼
  ┌──────────────┐
  │  /install    │  (Wizard web)
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────────────────────┐
  │  Étape 1 : Choix du stack (Laravel / Next.js)│
  │  Étape 2 : Langue                            │
  │  Étape 3 : Vérification prérequis            │
  │  Étape 4 : Base de données                   │
  │  Étape 5 : Informations du site              │
  │  Étape 6 : Compte administrateur             │
  │  Étape 7 : Installation & résultat           │
  └──────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │ Fichier .installed créé  │
  │ Redirection vers /admin  │
  └──────────────────────────┘
```

> **Note V1** : En V1, le stack Next.js est affiché mais grisé avec le badge "Bientôt disponible". Seul Laravel + React est sélectionnable. Le choix du stack est quand même présenté pour montrer la vision multi-stack du CMS.

### Détection "installé ou non"

Le CMS utilise un **fichier sentinelle** `storage/.installed` pour savoir si l'installation a déjà été faite. Ce fichier contient la date d'installation et la version du CMS.

**Middleware `EnsureInstalled`** :
- Si `storage/.installed` **n'existe pas** → redirige vers `/install`
- Si `storage/.installed` **existe** → bloque l'accès à `/install` (retourne 404)
- Ce middleware est appliqué globalement via le kernel HTTP

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstalled
{
    public function handle(Request $request, Closure $next): Response
    {
        $isInstalled = file_exists(storage_path('.installed'));
        $isInstallRoute = $request->is('install*');

        // CMS pas installé → autoriser seulement /install
        if (! $isInstalled && ! $isInstallRoute) {
            return redirect('/install');
        }

        // CMS installé → bloquer /install
        if ($isInstalled && $isInstallRoute) {
            abort(404);
        }

        return $next($request);
    }
}
```

---

## Wizard Web — Détail de chaque étape (7 étapes)

### Étape 1 : Choix du stack technique

**But** : Permettre à l'utilisateur de choisir le stack backend/frontend pour son installation ArtisanCMS. C'est la toute première décision, avant même la langue, car elle conditionne les prérequis à vérifier et le déroulé de l'installation.

**Interface** :
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                   🎨 ArtisanCMS                             │
│                                                              │
│          Choisissez votre stack technique                     │
│                                                              │
│   ┌────────────────────────────┐  ┌────────────────────────┐│
│   │                            │  │                        ││
│   │    ⚡ Laravel + React      │  │    ▲ Next.js           ││
│   │                            │  │                        ││
│   │  • Laravel 12 (PHP 8.2+)  │  │  • Next.js App Router  ││
│   │  • React 19 + Inertia 2   │  │  • React 19            ││
│   │  • shadcn/ui + Tailwind   │  │  • better-auth         ││
│   │  • MySQL / MariaDB        │  │  • Prisma + MySQL      ││
│   │  • Auth intégrée          │  │  • shadcn/ui + Tailwind││
│   │                            │  │                        ││
│   │  ✅ Recommandé             │  │  🔮 Bientôt disponible ││
│   │     Stable & complet      │  │     En développement   ││
│   │                            │  │                        ││
│   │  [ Sélectionner ]         │  │  [ Indisponible ]      ││
│   │                            │  │  (grisé)              ││
│   └────────────────────────────┘  └────────────────────────┘│
│                                                              │
│   💡 Les deux stacks partagent les mêmes composants React :  │
│      page builder, blocs, thèmes, UI                         │
│                                                              │
│                              [ Continuer → ]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Données envoyées** :
```json
{
  "stack": "laravel"
}
```

**Valeurs possibles** :
- `"laravel"` — Laravel 12 + React 19 + Inertia 2 (V1, disponible)
- `"nextjs"` — Next.js App Router + React 19 + better-auth (V2, désactivé en V1)

**Traitement backend** :
- Stocker le stack en session (`install.stack`)
- Le stack détermine :
  - Les prérequis affichés à l'étape 3 (PHP vs Node.js)
  - L'ORM utilisé (Eloquent vs Prisma)
  - Le système d'auth (Laravel Auth vs better-auth)
  - Les fichiers installés et la structure du projet
- En V1, si `stack === 'nextjs'` → erreur "Ce stack n'est pas encore disponible"

**Prérequis conditionnels selon le stack** :

| Prérequis | Laravel | Next.js |
|---|---|---|
| PHP >= 8.2 | ✅ Obligatoire | ❌ Non requis |
| Composer | ✅ Obligatoire | ❌ Non requis |
| Extensions PHP (PDO, mbstring, etc.) | ✅ Obligatoire | ❌ Non requis |
| Node.js >= 20 | ℹ️ Recommandé | ✅ Obligatoire |
| npm >= 9 | ℹ️ Recommandé | ✅ Obligatoire |
| MySQL / MariaDB | ✅ Obligatoire | ✅ Obligatoire |
| Dossiers writable | ✅ Obligatoire | ✅ Obligatoire |

**Enregistrement du stack dans `storage/.installed`** :
```json
{
  "version": "1.0.0",
  "stack": "laravel",
  "installed_at": "2026-03-10T14:30:00+01:00",
  "php_version": "8.3.12"
}
```

Cela permet au CMS de savoir quel stack est en cours d'utilisation après l'installation, utile pour les mises à jour et le comportement conditionnel.

---

### Étape 2 : Sélection de la langue

**But** : Permettre à l'utilisateur de choisir la langue de l'interface CMS.

**Interface** :
```
┌─────────────────────────────────────────────┐
│              🎨 ArtisanCMS                  │
│                                              │
│         Bienvenue ! / Welcome!               │
│                                              │
│   Choisissez votre langue :                  │
│                                              │
│   ┌───────────────────────────────┐          │
│   │  🇫🇷 Français              ▼  │          │
│   └───────────────────────────────┘          │
│                                              │
│   Langues disponibles :                      │
│   • Français (fr)                            │
│   • English (en)                             │
│   • Español (es)                             │
│   • Deutsch (de)                             │
│                                              │
│                        [ Continuer → ]       │
└─────────────────────────────────────────────┘
```

**Données envoyées** :
```json
{
  "locale": "fr"
}
```

**Traitement backend** :
- Stocker la locale en session pour les étapes suivantes
- La locale sera enregistrée en setting `general.locale` à l'étape finale

---

### Étape 3 : Vérification des prérequis

**But** : Vérifier que le serveur remplit toutes les conditions pour faire tourner ArtisanCMS.

**Prérequis vérifiés** :

| Prérequis | Requis | Vérification PHP |
|---|---|---|
| PHP >= 8.2 | Obligatoire | `PHP_VERSION_ID >= 80200` |
| Extension PDO | Obligatoire | `extension_loaded('pdo')` |
| Extension PDO MySQL | Obligatoire | `extension_loaded('pdo_mysql')` |
| Extension OpenSSL | Obligatoire | `extension_loaded('openssl')` |
| Extension Mbstring | Obligatoire | `extension_loaded('mbstring')` |
| Extension Tokenizer | Obligatoire | `extension_loaded('tokenizer')` |
| Extension XML | Obligatoire | `extension_loaded('xml')` |
| Extension Ctype | Obligatoire | `extension_loaded('ctype')` |
| Extension JSON | Obligatoire | `extension_loaded('json')` |
| Extension BCMath | Obligatoire | `extension_loaded('bcmath')` |
| Extension Fileinfo | Obligatoire | `extension_loaded('fileinfo')` |
| Extension GD ou Imagick | Obligatoire | `extension_loaded('gd') \|\| extension_loaded('imagick')` |
| Extension cURL | Obligatoire | `extension_loaded('curl')` |
| Node.js >= 20 | Recommandé | `exec('node -v')` |
| npm >= 9 | Recommandé | `exec('npm -v')` |
| Dossier `storage/` writable | Obligatoire | `is_writable(storage_path())` |
| Dossier `bootstrap/cache/` writable | Obligatoire | `is_writable(base_path('bootstrap/cache'))` |
| Dossier `.env` writable | Obligatoire | `is_writable(base_path('.env'))` |
| Dossier `content/` writable | Obligatoire | `is_writable(base_path('content'))` |

**Interface** :
```
┌─────────────────────────────────────────────┐
│  ← Retour    Étape 3/7 : Prérequis          │
│                                              │
│  Vérification de votre environnement :       │
│                                              │
│  ✅ PHP 8.3.12                               │
│  ✅ Extension PDO                            │
│  ✅ Extension PDO MySQL                      │
│  ✅ Extension OpenSSL                        │
│  ✅ Extension Mbstring                       │
│  ✅ Extension GD                             │
│  ✅ Extension cURL                           │
│  ✅ Dossier storage/ accessible en écriture  │
│  ✅ Dossier bootstrap/cache/ accessible      │
│  ✅ Fichier .env accessible en écriture      │
│  ✅ Dossier content/ accessible en écriture  │
│  ─────────────────────────────────           │
│  ℹ️ Node.js v20.11.0 (recommandé)            │
│  ℹ️ npm 10.2.4 (recommandé)                  │
│                                              │
│  ✅ Tous les prérequis sont satisfaits       │
│                                              │
│  [ ← Retour ]           [ Continuer → ]     │
└─────────────────────────────────────────────┘
```

**Logique** :
- Si un prérequis **obligatoire** échoue → le bouton "Continuer" est **désactivé** et le prérequis en échec est affiché en rouge avec une explication
- Les prérequis **recommandés** affichent un avertissement jaune mais ne bloquent pas
- Possibilité de relancer la vérification (bouton "Revérifier")

**Service de vérification** :

```php
<?php

declare(strict_types=1);

namespace App\Services;

class RequirementsChecker
{
    /**
     * Vérifier les prérequis en fonction du stack choisi.
     *
     * @param string $stack 'laravel' ou 'nextjs'
     * @return array{
     *   passed: bool,
     *   requirements: array<string, array{
     *     label: string,
     *     required: bool,
     *     passed: bool,
     *     current: string,
     *     message: string
     *   }>
     * }
     */
    public function check(string $stack = 'laravel'): array
    {
        $requirements = [];
        $isLaravel = $stack === 'laravel';

        // PHP Version — obligatoire pour Laravel, non requis pour Next.js
        $requirements['php_version'] = [
            'label' => 'PHP >= 8.2',
            'required' => $isLaravel,
            'passed' => PHP_VERSION_ID >= 80200,
            'current' => PHP_VERSION,
            'message' => 'PHP 8.2 ou supérieur est requis.',
        ];

        // Extensions PHP obligatoires
        $requiredExtensions = [
            'pdo' => 'PDO',
            'pdo_mysql' => 'PDO MySQL',
            'openssl' => 'OpenSSL',
            'mbstring' => 'Mbstring',
            'tokenizer' => 'Tokenizer',
            'xml' => 'XML',
            'ctype' => 'Ctype',
            'json' => 'JSON',
            'bcmath' => 'BCMath',
            'fileinfo' => 'Fileinfo',
            'curl' => 'cURL',
        ];

        foreach ($requiredExtensions as $ext => $label) {
            $requirements["ext_{$ext}"] = [
                'label' => "Extension {$label}",
                'required' => $isLaravel,
                'passed' => extension_loaded($ext),
                'current' => extension_loaded($ext) ? 'Installée' : 'Manquante',
                'message' => "L'extension PHP {$label} est requise.",
            ];
        }

        // GD ou Imagick (au moins un des deux) — obligatoire pour Laravel
        $hasGd = extension_loaded('gd');
        $hasImagick = extension_loaded('imagick');
        $requirements['ext_image'] = [
            'label' => 'Extension GD ou Imagick',
            'required' => $isLaravel,
            'passed' => $hasGd || $hasImagick,
            'current' => $hasGd ? 'GD' : ($hasImagick ? 'Imagick' : 'Manquante'),
            'message' => 'GD ou Imagick est requis pour le traitement des images.',
        ];

        // Permissions d'écriture
        $writablePaths = [
            'storage' => storage_path(),
            'bootstrap_cache' => base_path('bootstrap/cache'),
            'env_file' => base_path('.env'),
            'content' => base_path('content'),
        ];

        foreach ($writablePaths as $key => $path) {
            $label = match($key) {
                'storage' => 'Dossier storage/',
                'bootstrap_cache' => 'Dossier bootstrap/cache/',
                'env_file' => 'Fichier .env',
                'content' => 'Dossier content/',
            };

            $requirements["writable_{$key}"] = [
                'label' => "{$label} accessible en écriture",
                'required' => true,
                'passed' => is_writable($path),
                'current' => is_writable($path) ? 'OK' : 'Non accessible',
                'message' => "{$label} doit être accessible en écriture.",
            ];
        }

        // Node.js — recommandé pour Laravel, obligatoire pour Next.js
        $nodeVersion = $this->getCommandVersion('node -v');
        $requirements['node'] = [
            'label' => 'Node.js >= 20',
            'required' => ! $isLaravel, // Obligatoire pour Next.js
            'passed' => $nodeVersion !== null && version_compare($nodeVersion, '20.0.0', '>='),
            'current' => $nodeVersion ?? 'Non installé',
            'message' => $isLaravel
                ? 'Node.js 20+ est recommandé pour le build des assets.'
                : 'Node.js 20+ est requis pour Next.js.',
        ];

        // npm — recommandé pour Laravel, obligatoire pour Next.js
        $npmVersion = $this->getCommandVersion('npm -v');
        $requirements['npm'] = [
            'label' => 'npm >= 9',
            'required' => ! $isLaravel,
            'passed' => $npmVersion !== null && version_compare($npmVersion, '9.0.0', '>='),
            'current' => $npmVersion ?? 'Non installé',
            'message' => $isLaravel
                ? 'npm 9+ est recommandé pour la gestion des dépendances.'
                : 'npm 9+ est requis pour Next.js.',
        ];

        // Vérification globale
        $allRequiredPassed = collect($requirements)
            ->where('required', true)
            ->every(fn ($r) => $r['passed']);

        return [
            'passed' => $allRequiredPassed,
            'requirements' => $requirements,
        ];
    }

    private function getCommandVersion(string $command): ?string
    {
        try {
            $output = [];
            $returnCode = 0;
            exec("{$command} 2>&1", $output, $returnCode);

            if ($returnCode === 0 && ! empty($output[0])) {
                // Nettoyer le "v" devant la version (ex: "v20.11.0" → "20.11.0")
                return ltrim(trim($output[0]), 'v');
            }
        } catch (\Throwable) {
            // Silencieux
        }

        return null;
    }
}
```

---

### Étape 4 : Configuration de la base de données

**But** : Configurer la connexion à MySQL/MariaDB, tester la connexion, et écrire la config dans `.env`.

**Interface** :
```
┌─────────────────────────────────────────────┐
│  ← Retour    Étape 4/7 : Base de données     │
│                                              │
│  Configurez votre connexion MySQL :          │
│                                              │
│  Serveur :                                   │
│  ┌───────────────────────────────┐           │
│  │ 127.0.0.1                    │           │
│  └───────────────────────────────┘           │
│                                              │
│  Port :                                      │
│  ┌───────────────────────────────┐           │
│  │ 3306                         │           │
│  └───────────────────────────────┘           │
│                                              │
│  Nom de la base de données :                 │
│  ┌───────────────────────────────┐           │
│  │ artisan_cms                  │           │
│  └───────────────────────────────┘           │
│  ☑ Créer la base si elle n'existe pas        │
│                                              │
│  Nom d'utilisateur :                         │
│  ┌───────────────────────────────┐           │
│  │ root                         │           │
│  └───────────────────────────────┘           │
│                                              │
│  Mot de passe :                              │
│  ┌───────────────────────────────┐           │
│  │ ••••••••                     │           │
│  └───────────────────────────────┘           │
│                                              │
│  Préfixe des tables (optionnel) :            │
│  ┌───────────────────────────────┐           │
│  │                              │           │
│  └───────────────────────────────┘           │
│                                              │
│  [ Tester la connexion ]                     │
│                                              │
│  ✅ Connexion réussie !                      │
│     MySQL 8.0.30 - Base "artisan_cms" prête  │
│                                              │
│  [ ← Retour ]           [ Continuer → ]     │
└─────────────────────────────────────────────┘
```

**Données envoyées** :
```json
{
  "db_host": "127.0.0.1",
  "db_port": 3306,
  "db_database": "artisan_cms",
  "db_username": "root",
  "db_password": "",
  "db_prefix": "",
  "create_database": true
}
```

**Traitement backend** :

```php
<?php

declare(strict_types=1);

namespace App\Services;

use PDO;
use PDOException;

class DatabaseConfigurator
{
    /**
     * Tester la connexion à la base de données.
     *
     * @return array{success: bool, message: string, version: string|null}
     */
    public function testConnection(array $config): array
    {
        try {
            // Connexion sans sélectionner de base (pour pouvoir la créer)
            $dsn = "mysql:host={$config['db_host']};port={$config['db_port']}";
            $pdo = new PDO($dsn, $config['db_username'], $config['db_password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);

            // Récupérer la version
            $version = $pdo->query('SELECT VERSION()')->fetchColumn();

            // Vérifier/créer la base de données
            $dbName = $config['db_database'];
            $dbExists = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '{$dbName}'")->fetchColumn();

            if (! $dbExists) {
                if ($config['create_database'] ?? false) {
                    $pdo->exec("CREATE DATABASE `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    return [
                        'success' => true,
                        'message' => "Connexion réussie ! Base \"{$dbName}\" créée.",
                        'version' => $version,
                    ];
                }

                return [
                    'success' => false,
                    'message' => "La base de données \"{$dbName}\" n'existe pas. Cochez l'option pour la créer automatiquement.",
                    'version' => $version,
                ];
            }

            return [
                'success' => true,
                'message' => "Connexion réussie ! Base \"{$dbName}\" trouvée.",
                'version' => $version,
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => $this->humanizeError($e),
                'version' => null,
            ];
        }
    }

    /**
     * Écrire la config dans le fichier .env
     */
    public function writeEnvConfig(array $config): void
    {
        $envPath = base_path('.env');
        $envContent = file_get_contents($envPath);

        $replacements = [
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => $config['db_host'],
            'DB_PORT' => (string) $config['db_port'],
            'DB_DATABASE' => $config['db_database'],
            'DB_USERNAME' => $config['db_username'],
            'DB_PASSWORD' => $config['db_password'],
        ];

        foreach ($replacements as $key => $value) {
            // Si la clé existe, la remplacer
            if (preg_match("/^{$key}=.*/m", $envContent)) {
                $envContent = preg_replace(
                    "/^{$key}=.*/m",
                    "{$key}={$value}",
                    $envContent
                );
            } else {
                // Sinon, l'ajouter
                $envContent .= "\n{$key}={$value}";
            }
        }

        // Ajouter le préfixe de table si spécifié
        if (! empty($config['db_prefix'])) {
            if (preg_match("/^DB_PREFIX=.*/m", $envContent)) {
                $envContent = preg_replace("/^DB_PREFIX=.*/m", "DB_PREFIX={$config['db_prefix']}", $envContent);
            } else {
                $envContent .= "\nDB_PREFIX={$config['db_prefix']}";
            }
        }

        file_put_contents($envPath, $envContent);
    }

    private function humanizeError(PDOException $e): string
    {
        $code = $e->getCode();

        return match (true) {
            str_contains($e->getMessage(), 'Access denied') =>
                "Accès refusé : vérifiez le nom d'utilisateur et le mot de passe.",
            str_contains($e->getMessage(), 'Unknown database') =>
                "La base de données spécifiée n'existe pas.",
            str_contains($e->getMessage(), 'Connection refused') =>
                "Connexion refusée : vérifiez que MySQL est démarré et que l'hôte/port sont corrects.",
            str_contains($e->getMessage(), 'Name or service not known') =>
                "Hôte introuvable : vérifiez l'adresse du serveur.",
            default => "Erreur de connexion : {$e->getMessage()}",
        };
    }
}
```

---

### Étape 5 : Informations du site

**But** : Configurer les informations de base du site (nom, description, URL, fuseau horaire).

**Interface** :
```
┌─────────────────────────────────────────────┐
│  ← Retour    Étape 5/7 : Votre site         │
│                                              │
│  Nom du site :                               │
│  ┌───────────────────────────────┐           │
│  │ Mon site ArtisanCMS          │           │
│  └───────────────────────────────┘           │
│                                              │
│  Description (tagline) :                     │
│  ┌───────────────────────────────┐           │
│  │ Un site construit avec ...   │           │
│  └───────────────────────────────┘           │
│                                              │
│  URL du site :                               │
│  ┌───────────────────────────────┐           │
│  │ http://artisan-cms.test      │           │
│  └───────────────────────────────┘           │
│  (auto-détectée depuis l'URL actuelle)       │
│                                              │
│  Fuseau horaire :                            │
│  ┌───────────────────────────────┐           │
│  │  Europe/Paris              ▼  │           │
│  └───────────────────────────────┘           │
│                                              │
│  [ ← Retour ]           [ Continuer → ]     │
└─────────────────────────────────────────────┘
```

**Données envoyées** :
```json
{
  "site_name": "Mon site ArtisanCMS",
  "site_description": "Un site construit avec ArtisanCMS",
  "site_url": "http://artisan-cms.test",
  "timezone": "Europe/Paris"
}
```

**Traitement** :
- Stocké en session, sera écrit en settings à l'étape finale
- L'URL du site est auto-détectée à partir de `request()->getSchemeAndHttpHost()`

---

### Étape 6 : Compte administrateur

**But** : Créer le premier compte administrateur.

**Interface** :
```
┌─────────────────────────────────────────────┐
│  ← Retour    Étape 6/7 : Administrateur      │
│                                              │
│  Créez votre compte administrateur :         │
│                                              │
│  Nom complet :                               │
│  ┌───────────────────────────────┐           │
│  │ Admin                        │           │
│  └───────────────────────────────┘           │
│                                              │
│  Adresse e-mail :                            │
│  ┌───────────────────────────────┐           │
│  │ admin@artisancms.dev         │           │
│  └───────────────────────────────┘           │
│                                              │
│  Mot de passe :                              │
│  ┌───────────────────────────────┐           │
│  │ ••••••••••••                 │           │
│  └───────────────────────────────┘           │
│  Force : ████████░░░░ Moyen                  │
│  💡 Min. 8 caractères, 1 majuscule, 1 chiffre│
│                                              │
│  Confirmer le mot de passe :                 │
│  ┌───────────────────────────────┐           │
│  │ ••••••••••••                 │           │
│  └───────────────────────────────┘           │
│                                              │
│  [ ← Retour ]           [ Installer → ]     │
└─────────────────────────────────────────────┘
```

**Données envoyées** :
```json
{
  "admin_name": "Admin",
  "admin_email": "admin@artisancms.dev",
  "admin_password": "SecurePass123",
  "admin_password_confirmation": "SecurePass123"
}
```

**Validation** :
```php
$rules = [
    'admin_name' => ['required', 'string', 'min:2', 'max:255'],
    'admin_email' => ['required', 'email', 'max:255'],
    'admin_password' => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
];
```

---

### Étape 7 : Installation & résultat

**But** : Exécuter l'installation complète et afficher le résultat.

**Interface pendant l'installation** :
```
┌─────────────────────────────────────────────┐
│         Étape 7/7 : Installation             │
│                                              │
│  Installation en cours...                    │
│                                              │
│  ✅ Fichier .env configuré                   │
│  ✅ Tables de la base de données créées      │
│  ✅ Rôles créés (admin, editor, author, ...) │
│  ✅ Compte administrateur créé               │
│  ⏳ Configuration des paramètres du site...  │
│  ○ Installation du thème par défaut          │
│  ○ Enregistrement des blocs core             │
│  ○ Création de la page d'accueil             │
│  ○ Finalisation                              │
│                                              │
│  ████████████░░░░░░░░░░░░░░ 45%             │
│                                              │
└─────────────────────────────────────────────┘
```

**Interface après installation réussie** :
```
┌─────────────────────────────────────────────┐
│         🎉 Installation terminée !           │
│                                              │
│  ArtisanCMS a été installé avec succès.      │
│                                              │
│  📋 Récapitulatif :                          │
│  ─────────────────────────                   │
│  Site : Mon site ArtisanCMS                  │
│  URL : http://artisan-cms.test               │
│  Admin : admin@artisancms.dev                │
│  Base de données : artisan_cms               │
│  Thème : Default Theme                       │
│  Version : 1.0.0                             │
│                                              │
│  ⚠️ Notez bien votre mot de passe admin !    │
│  Il ne sera plus affiché après cette page.   │
│                                              │
│  [ Accéder au tableau de bord → ]            │
│                                              │
└─────────────────────────────────────────────┘
```

---

## Service d'installation (InstallerService.php)

C'est le service principal qui orchestre toutes les opérations d'installation. Il est utilisé à la fois par le wizard web et par la commande CLI.

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Block;
use App\Models\CmsTheme;
use App\Models\Page;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

class InstallerService
{
    /**
     * Liste des étapes d'installation avec leur poids (pour la barre de progression).
     */
    public const STEPS = [
        'env'        => ['label' => 'Configuration .env', 'weight' => 5],
        'migrations' => ['label' => 'Création des tables', 'weight' => 20],
        'roles'      => ['label' => 'Création des rôles', 'weight' => 5],
        'admin'      => ['label' => 'Compte administrateur', 'weight' => 5],
        'settings'   => ['label' => 'Paramètres du site', 'weight' => 10],
        'theme'      => ['label' => 'Thème par défaut', 'weight' => 15],
        'blocks'     => ['label' => 'Blocs core', 'weight' => 15],
        'homepage'   => ['label' => 'Page d\'accueil', 'weight' => 10],
        'directories'=> ['label' => 'Création des dossiers', 'weight' => 5],
        'finalize'   => ['label' => 'Finalisation', 'weight' => 10],
    ];

    private array $log = [];
    private ?\Closure $progressCallback = null;

    /**
     * Définir un callback de progression (utile pour le temps réel via SSE ou websockets).
     */
    public function onProgress(\Closure $callback): self
    {
        $this->progressCallback = $callback;
        return $this;
    }

    /**
     * Exécuter l'installation complète.
     *
     * @param array $config Configuration complète (DB, site, admin)
     * @return array{success: bool, log: array, errors: array}
     */
    public function install(array $config): array
    {
        $errors = [];

        try {
            // 1. Configurer .env
            $this->step('env', function () use ($config) {
                app(DatabaseConfigurator::class)->writeEnvConfig($config);

                // Mettre à jour APP_NAME et APP_URL
                $this->updateEnv('APP_NAME', $config['site_name'] ?? 'ArtisanCMS');
                $this->updateEnv('APP_URL', $config['site_url'] ?? 'http://localhost');
                $this->updateEnv('APP_TIMEZONE', $config['timezone'] ?? 'UTC');
                $this->updateEnv('APP_LOCALE', $config['locale'] ?? 'fr');

                // Recharger la config depuis .env
                Artisan::call('config:clear');
            });

            // 2. Exécuter les migrations
            $this->step('migrations', function () {
                Artisan::call('migrate', ['--force' => true]);
                $this->log[] = 'Migrations exécutées : ' . trim(Artisan::output());
            });

            // 3. Créer les rôles
            $this->step('roles', function () {
                $this->seedRoles();
            });

            // 4. Créer le compte admin
            $this->step('admin', function () use ($config) {
                $this->createAdmin($config);
            });

            // 5. Paramètres du site
            $this->step('settings', function () use ($config) {
                $this->seedSettings($config);
            });

            // 6. Installer le thème par défaut
            $this->step('theme', function () {
                $this->installDefaultTheme();
            });

            // 7. Enregistrer les blocs core
            $this->step('blocks', function () {
                $this->seedCoreBlocks();
            });

            // 8. Créer la page d'accueil
            $this->step('homepage', function () {
                $this->createHomepage();
            });

            // 9. Créer les dossiers content/
            $this->step('directories', function () {
                $this->createDirectories();
            });

            // 10. Finalisation
            $this->step('finalize', function () {
                // Créer le fichier sentinelle
                file_put_contents(storage_path('.installed'), json_encode([
                    'version' => config('cms.version', '1.0.0'),
                    'installed_at' => now()->toIso8601String(),
                    'php_version' => PHP_VERSION,
                ]));

                // Clear tous les caches
                Artisan::call('config:clear');
                Artisan::call('cache:clear');
                Artisan::call('route:clear');
                Artisan::call('view:clear');

                // Générer la clé d'application si pas déjà fait
                if (empty(config('app.key')) || config('app.key') === 'base64:') {
                    Artisan::call('key:generate', ['--force' => true]);
                }

                // Créer le lien symbolique storage
                Artisan::call('storage:link');
            });

        } catch (\Throwable $e) {
            $errors[] = $e->getMessage();
            $this->log[] = "ERREUR : {$e->getMessage()}";
        }

        return [
            'success' => empty($errors),
            'log' => $this->log,
            'errors' => $errors,
        ];
    }

    // ──────────────────────────────────────────
    // Méthodes privées pour chaque étape
    // ──────────────────────────────────────────

    private function step(string $name, \Closure $action): void
    {
        $stepConfig = self::STEPS[$name];
        $this->log[] = "▶ {$stepConfig['label']}...";

        if ($this->progressCallback) {
            ($this->progressCallback)($name, 'running', $stepConfig['label']);
        }

        $action();

        $this->log[] = "✅ {$stepConfig['label']} terminé.";

        if ($this->progressCallback) {
            ($this->progressCallback)($name, 'completed', $stepConfig['label']);
        }
    }

    private function seedRoles(): void
    {
        $roles = [
            [
                'name' => 'Administrateur',
                'slug' => 'admin',
                'permissions' => ['*'],
                'is_system' => true,
            ],
            [
                'name' => 'Éditeur',
                'slug' => 'editor',
                'permissions' => ['pages.*', 'posts.*', 'media.*', 'menus.*', 'taxonomies.*'],
                'is_system' => true,
            ],
            [
                'name' => 'Auteur',
                'slug' => 'author',
                'permissions' => ['pages.create', 'pages.edit_own', 'posts.create', 'posts.edit_own', 'media.upload'],
                'is_system' => true,
            ],
            [
                'name' => 'Abonné',
                'slug' => 'subscriber',
                'permissions' => ['profile.edit'],
                'is_system' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }

    private function createAdmin(array $config): void
    {
        $adminRole = Role::where('slug', 'admin')->first();

        User::updateOrCreate(
            ['email' => $config['admin_email']],
            [
                'name' => $config['admin_name'],
                'email' => $config['admin_email'],
                'password' => Hash::make($config['admin_password']),
                'role_id' => $adminRole->id,
                'email_verified_at' => now(),
            ]
        );
    }

    private function seedSettings(array $config): void
    {
        $settings = [
            // Général
            ['group' => 'general', 'key' => 'site_name', 'value' => $config['site_name'] ?? 'ArtisanCMS', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_description', 'value' => $config['site_description'] ?? '', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_url', 'value' => $config['site_url'] ?? 'http://localhost', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'locale', 'value' => $config['locale'] ?? 'fr', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'timezone', 'value' => $config['timezone'] ?? 'Europe/Paris', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'date_format', 'value' => 'd/m/Y', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'time_format', 'value' => 'H:i', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'site_logo', 'value' => null, 'type' => 'image', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_favicon', 'value' => null, 'type' => 'image', 'is_public' => true],

            // SEO
            ['group' => 'seo', 'key' => 'meta_title_suffix', 'value' => ' | ' . ($config['site_name'] ?? 'ArtisanCMS'), 'type' => 'string', 'is_public' => false],
            ['group' => 'seo', 'key' => 'meta_description', 'value' => $config['site_description'] ?? '', 'type' => 'string', 'is_public' => false],
            ['group' => 'seo', 'key' => 'robots_index', 'value' => true, 'type' => 'boolean', 'is_public' => false],
            ['group' => 'seo', 'key' => 'sitemap_enabled', 'value' => true, 'type' => 'boolean', 'is_public' => false],

            // Mail
            ['group' => 'mail', 'key' => 'from_name', 'value' => $config['site_name'] ?? 'ArtisanCMS', 'type' => 'string', 'is_public' => false],
            ['group' => 'mail', 'key' => 'from_email', 'value' => $config['admin_email'] ?? 'noreply@example.com', 'type' => 'string', 'is_public' => false],

            // Contenu
            ['group' => 'content', 'key' => 'posts_per_page', 'value' => 10, 'type' => 'number', 'is_public' => false],
            ['group' => 'content', 'key' => 'allow_comments', 'value' => true, 'type' => 'boolean', 'is_public' => false],
            ['group' => 'content', 'key' => 'homepage_type', 'value' => 'page', 'type' => 'string', 'is_public' => false],
            ['group' => 'content', 'key' => 'homepage_id', 'value' => null, 'type' => 'number', 'is_public' => false],

            // Media
            ['group' => 'media', 'key' => 'max_upload_size', 'value' => 10, 'type' => 'number', 'is_public' => false],
            ['group' => 'media', 'key' => 'allowed_types', 'value' => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'webm'], 'type' => 'json', 'is_public' => false],
            ['group' => 'media', 'key' => 'image_sizes', 'value' => ['sm' => 300, 'md' => 768, 'lg' => 1200], 'type' => 'json', 'is_public' => false],

            // Maintenance
            ['group' => 'maintenance', 'key' => 'enabled', 'value' => false, 'type' => 'boolean', 'is_public' => true],
            ['group' => 'maintenance', 'key' => 'message', 'value' => 'Site en maintenance. Revenez bientôt !', 'type' => 'string', 'is_public' => true],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                [
                    'value' => is_array($setting['value']) || is_bool($setting['value'])
                        ? json_encode($setting['value'])
                        : (string) $setting['value'],
                    'type' => $setting['type'],
                    'is_public' => $setting['is_public'],
                ]
            );
        }
    }

    private function installDefaultTheme(): void
    {
        // S'assurer que le dossier du thème existe
        $themePath = base_path('content/themes/default');
        if (! is_dir($themePath)) {
            mkdir($themePath, 0755, true);
            mkdir("{$themePath}/layouts", 0755, true);
            mkdir("{$themePath}/blocks", 0755, true);
            mkdir("{$themePath}/assets", 0755, true);
        }

        // Créer le manifeste du thème
        $manifest = [
            'name' => 'Default Theme',
            'slug' => 'default',
            'version' => '1.0.0',
            'description' => 'Thème par défaut d\'ArtisanCMS. Moderne, responsive et personnalisable.',
            'author' => ['name' => 'ArtisanCMS', 'url' => 'https://artisancms.dev'],
            'layouts' => ['default', 'full-width', 'sidebar-left', 'sidebar-right', 'landing'],
            'colors' => [
                'primary' => '#3b82f6',
                'secondary' => '#64748b',
                'accent' => '#f59e0b',
                'background' => '#ffffff',
                'foreground' => '#0f172a',
                'muted' => '#f1f5f9',
            ],
            'fonts' => [
                'heading' => 'Inter',
                'body' => 'Inter',
            ],
            'settings' => [
                'header_sticky' => true,
                'footer_columns' => 4,
                'sidebar_position' => 'right',
                'content_width' => '1200px',
            ],
        ];

        file_put_contents(
            "{$themePath}/artisan-theme.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        // Enregistrer en base
        CmsTheme::updateOrCreate(
            ['slug' => 'default'],
            [
                'name' => 'Default Theme',
                'version' => '1.0.0',
                'description' => 'Thème par défaut d\'ArtisanCMS.',
                'author' => 'ArtisanCMS',
                'active' => true,
                'settings' => $manifest['colors'] + $manifest['fonts'],
            ]
        );
    }

    private function seedCoreBlocks(): void
    {
        $blocks = [
            // Layout
            ['slug' => 'section', 'name' => 'Section', 'category' => 'layout', 'icon' => 'LayoutTemplate', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'grid', 'name' => 'Grille', 'category' => 'layout', 'icon' => 'Grid3X3', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'column', 'name' => 'Colonne', 'category' => 'layout', 'icon' => 'Columns2', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'container', 'name' => 'Conteneur', 'category' => 'layout', 'icon' => 'Box', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'spacer', 'name' => 'Espacement', 'category' => 'layout', 'icon' => 'MoveVertical', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'divider', 'name' => 'Séparateur', 'category' => 'layout', 'icon' => 'Minus', 'is_core' => true, 'source' => 'core'],

            // Content
            ['slug' => 'heading', 'name' => 'Titre', 'category' => 'content', 'icon' => 'Heading', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'text', 'name' => 'Texte', 'category' => 'content', 'icon' => 'Type', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'image', 'name' => 'Image', 'category' => 'content', 'icon' => 'Image', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'video', 'name' => 'Vidéo', 'category' => 'content', 'icon' => 'Play', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'button', 'name' => 'Bouton', 'category' => 'content', 'icon' => 'MousePointerClick', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'icon', 'name' => 'Icône', 'category' => 'content', 'icon' => 'Smile', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'html', 'name' => 'HTML', 'category' => 'content', 'icon' => 'Code', 'is_core' => true, 'source' => 'core'],

            // Navigation
            ['slug' => 'tabs', 'name' => 'Onglets', 'category' => 'navigation', 'icon' => 'PanelTop', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'accordion', 'name' => 'Accordéon', 'category' => 'navigation', 'icon' => 'ChevronDown', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'breadcrumb', 'name' => 'Fil d\'Ariane', 'category' => 'navigation', 'icon' => 'ChevronRight', 'is_core' => true, 'source' => 'core'],

            // Data
            ['slug' => 'post-list', 'name' => 'Liste d\'articles', 'category' => 'data', 'icon' => 'List', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'post-grid', 'name' => 'Grille d\'articles', 'category' => 'data', 'icon' => 'LayoutGrid', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'form', 'name' => 'Formulaire', 'category' => 'data', 'icon' => 'FileText', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'map', 'name' => 'Carte', 'category' => 'data', 'icon' => 'MapPin', 'is_core' => true, 'source' => 'core'],

            // Media
            ['slug' => 'gallery', 'name' => 'Galerie', 'category' => 'media', 'icon' => 'Images', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'slider', 'name' => 'Slider', 'category' => 'media', 'icon' => 'GalleryHorizontal', 'is_core' => true, 'source' => 'core'],
        ];

        foreach ($blocks as $block) {
            Block::updateOrCreate(
                ['slug' => $block['slug']],
                array_merge($block, [
                    'schema' => json_encode(['type' => 'object', 'properties' => []]),
                    'default_props' => json_encode([]),
                ])
            );
        }
    }

    private function createHomepage(): void
    {
        $admin = User::whereHas('role', fn ($q) => $q->where('slug', 'admin'))->first();

        if (! $admin) {
            return;
        }

        // Créer une page d'accueil avec un contenu de bienvenue basique
        $homepage = Page::updateOrCreate(
            ['slug' => 'accueil'],
            [
                'title' => 'Bienvenue',
                'slug' => 'accueil',
                'content' => [
                    'blocks' => [
                        [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'type' => 'section',
                            'props' => [
                                'background' => 'transparent',
                                'padding' => '80px 0',
                                'maxWidth' => '1200px',
                            ],
                            'children' => [
                                [
                                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                                    'type' => 'heading',
                                    'props' => [
                                        'text' => 'Bienvenue sur votre site',
                                        'level' => 1,
                                        'align' => 'center',
                                    ],
                                    'children' => [],
                                ],
                                [
                                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                                    'type' => 'text',
                                    'props' => [
                                        'html' => '<p style="text-align: center;">Votre site ArtisanCMS est prêt. Rendez-vous dans le <strong>tableau de bord</strong> pour commencer à créer votre contenu.</p>',
                                    ],
                                    'children' => [],
                                ],
                            ],
                        ],
                    ],
                ],
                'status' => 'published',
                'template' => 'default',
                'meta_title' => 'Accueil',
                'meta_description' => 'Page d\'accueil du site.',
                'created_by' => $admin->id,
                'published_at' => now(),
            ]
        );

        // Définir comme page d'accueil
        Setting::updateOrCreate(
            ['group' => 'content', 'key' => 'homepage_id'],
            ['value' => (string) $homepage->id, 'type' => 'number', 'is_public' => false]
        );
    }

    private function createDirectories(): void
    {
        $directories = [
            base_path('content'),
            base_path('content/themes'),
            base_path('content/themes/default'),
            base_path('content/themes/default/layouts'),
            base_path('content/themes/default/blocks'),
            base_path('content/themes/default/assets'),
            base_path('content/plugins'),
            storage_path('app/public/media'),
            storage_path('app/public/media/thumbnails'),
        ];

        foreach ($directories as $dir) {
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }

    private function updateEnv(string $key, string $value): void
    {
        $envPath = base_path('.env');
        $envContent = file_get_contents($envPath);

        // Échapper les valeurs qui contiennent des espaces
        $escapedValue = str_contains($value, ' ') ? "\"{$value}\"" : $value;

        if (preg_match("/^{$key}=.*/m", $envContent)) {
            $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$escapedValue}", $envContent);
        } else {
            $envContent .= "\n{$key}={$escapedValue}";
        }

        file_put_contents($envPath, $envContent);
    }
}
```

---

## Controller d'installation (InstallController.php)

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DatabaseConfigurator;
use App\Services\InstallerService;
use App\Services\RequirementsChecker;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class InstallController extends Controller
{
    public function __construct(
        private RequirementsChecker $requirementsChecker,
        private DatabaseConfigurator $databaseConfigurator,
        private InstallerService $installer,
    ) {}

    /**
     * Étape 1 : Choix du stack
     */
    public function showStack(): Response
    {
        return Inertia::render('Install/Stack', [
            'stacks' => [
                [
                    'id' => 'laravel',
                    'name' => 'Laravel + React',
                    'icon' => 'laravel',
                    'description' => 'Stack complète et stable pour la production.',
                    'features' => [
                        'Laravel 12 (PHP 8.2+)',
                        'React 19 + Inertia 2',
                        'shadcn/ui + Tailwind CSS v4',
                        'MySQL / MariaDB',
                        'Auth intégrée (starter kit)',
                    ],
                    'available' => true,
                    'recommended' => true,
                    'badge' => 'Recommandé',
                ],
                [
                    'id' => 'nextjs',
                    'name' => 'Next.js',
                    'icon' => 'nextjs',
                    'description' => 'Stack moderne basée sur Next.js App Router.',
                    'features' => [
                        'Next.js App Router',
                        'React 19',
                        'better-auth',
                        'Prisma + MySQL',
                        'shadcn/ui + Tailwind CSS v4',
                    ],
                    'available' => false,
                    'recommended' => false,
                    'badge' => 'Bientôt disponible',
                ],
            ],
            'currentStack' => session('install.stack', 'laravel'),
        ]);
    }

    public function storeStack(Request $request)
    {
        $validated = $request->validate([
            'stack' => ['required', 'string', 'in:laravel,nextjs'],
        ]);

        if ($validated['stack'] === 'nextjs') {
            return back()->withErrors(['stack' => 'Le stack Next.js n\'est pas encore disponible. Il sera ajouté dans une prochaine version.']);
        }

        session(['install.stack' => $validated['stack']]);

        return redirect()->route('install.language');
    }

    /**
     * Étape 2 : Langue
     */
    public function showLanguage(): Response
    {
        return Inertia::render('Install/Language', [
            'locales' => [
                'fr' => 'Français',
                'en' => 'English',
                'es' => 'Español',
                'de' => 'Deutsch',
            ],
            'currentLocale' => session('install.locale', 'fr'),
            'step' => 2,
        ]);
    }

    public function storeLanguage(Request $request)
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:fr,en,es,de'],
        ]);

        session(['install.locale' => $validated['locale']]);
        app()->setLocale($validated['locale']);

        return redirect()->route('install.requirements');
    }

    /**
     * Étape 3 : Prérequis
     */
    public function showRequirements(): Response
    {
        $stack = session('install.stack', 'laravel');
        $results = $this->requirementsChecker->check($stack);

        return Inertia::render('Install/Requirements', [
            'requirements' => $results['requirements'],
            'allPassed' => $results['passed'],
            'stack' => $stack,
            'step' => 3,
        ]);
    }

    /**
     * Étape 4 : Base de données
     */
    public function showDatabase(): Response
    {
        return Inertia::render('Install/Database', [
            'defaults' => [
                'db_host' => session('install.db_host', '127.0.0.1'),
                'db_port' => session('install.db_port', 3306),
                'db_database' => session('install.db_database', 'artisan_cms'),
                'db_username' => session('install.db_username', 'root'),
                'db_password' => session('install.db_password', ''),
                'db_prefix' => session('install.db_prefix', ''),
                'create_database' => true,
            ],
            'step' => 4,
        ]);
    }

    public function testDatabase(Request $request)
    {
        $validated = $request->validate([
            'db_host' => ['required', 'string'],
            'db_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'db_database' => ['required', 'string', 'max:64'],
            'db_username' => ['required', 'string'],
            'db_password' => ['nullable', 'string'],
            'create_database' => ['boolean'],
        ]);

        $result = $this->databaseConfigurator->testConnection($validated);

        return response()->json($result);
    }

    public function storeDatabase(Request $request)
    {
        $validated = $request->validate([
            'db_host' => ['required', 'string'],
            'db_port' => ['required', 'integer'],
            'db_database' => ['required', 'string'],
            'db_username' => ['required', 'string'],
            'db_password' => ['nullable', 'string'],
            'db_prefix' => ['nullable', 'string', 'max:10'],
            'create_database' => ['boolean'],
        ]);

        // Tester d'abord la connexion
        $test = $this->databaseConfigurator->testConnection($validated);
        if (! $test['success']) {
            return back()->withErrors(['database' => $test['message']]);
        }

        // Stocker en session
        session([
            'install.db_host' => $validated['db_host'],
            'install.db_port' => $validated['db_port'],
            'install.db_database' => $validated['db_database'],
            'install.db_username' => $validated['db_username'],
            'install.db_password' => $validated['db_password'] ?? '',
            'install.db_prefix' => $validated['db_prefix'] ?? '',
        ]);

        return redirect()->route('install.site');
    }

    /**
     * Étape 5 : Informations du site
     */
    public function showSite(): Response
    {
        return Inertia::render('Install/Site', [
            'defaults' => [
                'site_name' => session('install.site_name', ''),
                'site_description' => session('install.site_description', ''),
                'site_url' => session('install.site_url', request()->getSchemeAndHttpHost()),
                'timezone' => session('install.timezone', 'Europe/Paris'),
            ],
            'timezones' => \DateTimeZone::listIdentifiers(),
            'step' => 5,
        ]);
    }

    public function storeSite(Request $request)
    {
        $validated = $request->validate([
            'site_name' => ['required', 'string', 'min:1', 'max:255'],
            'site_description' => ['nullable', 'string', 'max:500'],
            'site_url' => ['required', 'url', 'max:255'],
            'timezone' => ['required', 'string', 'timezone'],
        ]);

        session([
            'install.site_name' => $validated['site_name'],
            'install.site_description' => $validated['site_description'] ?? '',
            'install.site_url' => $validated['site_url'],
            'install.timezone' => $validated['timezone'],
        ]);

        return redirect()->route('install.admin');
    }

    /**
     * Étape 6 : Compte admin
     */
    public function showAdmin(): Response
    {
        return Inertia::render('Install/Admin', [
            'defaults' => [
                'admin_name' => session('install.admin_name', ''),
                'admin_email' => session('install.admin_email', ''),
            ],
            'step' => 6,
        ]);
    }

    /**
     * Étape 7 : Lancer l'installation
     */
    public function executeInstall(Request $request)
    {
        $validated = $request->validate([
            'admin_name' => ['required', 'string', 'min:2', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
        ]);

        // Stocker les infos admin en session
        session([
            'install.admin_name' => $validated['admin_name'],
            'install.admin_email' => $validated['admin_email'],
        ]);

        // Assembler toute la config depuis la session
        $config = [
            'stack' => session('install.stack', 'laravel'),
            'locale' => session('install.locale', 'fr'),
            'db_host' => session('install.db_host', '127.0.0.1'),
            'db_port' => session('install.db_port', 3306),
            'db_database' => session('install.db_database', 'artisan_cms'),
            'db_username' => session('install.db_username', 'root'),
            'db_password' => session('install.db_password', ''),
            'db_prefix' => session('install.db_prefix', ''),
            'site_name' => session('install.site_name', 'ArtisanCMS'),
            'site_description' => session('install.site_description', ''),
            'site_url' => session('install.site_url', request()->getSchemeAndHttpHost()),
            'timezone' => session('install.timezone', 'Europe/Paris'),
            'admin_name' => $validated['admin_name'],
            'admin_email' => $validated['admin_email'],
            'admin_password' => $validated['admin_password'],
        ];

        // Lancer l'installation
        $result = $this->installer->install($config);

        if ($result['success']) {
            // Nettoyer la session d'installation
            session()->forget(array_map(fn ($k) => "install.{$k}", [
                'locale', 'db_host', 'db_port', 'db_database', 'db_username',
                'db_password', 'db_prefix', 'site_name', 'site_description',
                'site_url', 'timezone', 'admin_name', 'admin_email',
            ]));

            return Inertia::render('Install/Complete', [
                'site_name' => $config['site_name'],
                'site_url' => $config['site_url'],
                'admin_email' => $config['admin_email'],
                'log' => $result['log'],
            ]);
        }

        return Inertia::render('Install/Error', [
            'errors' => $result['errors'],
            'log' => $result['log'],
        ]);
    }
}
```

---

## Routes d'installation

```php
// routes/web.php (ou routes/install.php chargé conditionnellement)

use App\Http\Controllers\InstallController;

Route::prefix('install')->name('install.')->group(function () {
    // Étape 1 : Choix du stack
    Route::get('/', [InstallController::class, 'showStack'])->name('stack');
    Route::post('/stack', [InstallController::class, 'storeStack'])->name('stack.store');

    // Étape 2 : Langue
    Route::get('/language', [InstallController::class, 'showLanguage'])->name('language');
    Route::post('/language', [InstallController::class, 'storeLanguage'])->name('language.store');

    // Étape 3 : Prérequis
    Route::get('/requirements', [InstallController::class, 'showRequirements'])->name('requirements');

    // Étape 4 : Base de données
    Route::get('/database', [InstallController::class, 'showDatabase'])->name('database');
    Route::post('/database/test', [InstallController::class, 'testDatabase'])->name('database.test');
    Route::post('/database', [InstallController::class, 'storeDatabase'])->name('database.store');

    // Étape 5 : Informations du site
    Route::get('/site', [InstallController::class, 'showSite'])->name('site');
    Route::post('/site', [InstallController::class, 'storeSite'])->name('site.store');

    // Étape 6 : Compte admin
    Route::get('/admin', [InstallController::class, 'showAdmin'])->name('admin');

    // Étape 7 : Exécution
    Route::post('/execute', [InstallController::class, 'executeInstall'])->name('execute');
});
```

---

## Commande CLI `php artisan cms:install`

Alternative en ligne de commande pour les développeurs.

```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\InstallerService;
use App\Services\RequirementsChecker;
use Illuminate\Console\Command;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\info;
use function Laravel\Prompts\note;
use function Laravel\Prompts\password;
use function Laravel\Prompts\select;
use function Laravel\Prompts\spin;
use function Laravel\Prompts\table;
use function Laravel\Prompts\text;
use function Laravel\Prompts\warning;

class CMSInstall extends Command
{
    protected $signature = 'cms:install
                            {--force : Réinstaller même si déjà installé}
                            {--quick : Installation rapide avec valeurs par défaut}';

    protected $description = 'Installer ArtisanCMS (wizard interactif ou mode rapide)';

    public function handle(InstallerService $installer, RequirementsChecker $checker): int
    {
        $this->displayBanner();

        // Vérifier si déjà installé
        if (file_exists(storage_path('.installed')) && ! $this->option('force')) {
            warning('ArtisanCMS est déjà installé.');
            if (! confirm('Voulez-vous réinstaller ? Cela écrasera la configuration actuelle.')) {
                return self::SUCCESS;
            }
        }

        // 1. Vérifier les prérequis
        info('Vérification des prérequis...');
        $results = $checker->check();

        $tableData = [];
        foreach ($results['requirements'] as $req) {
            $status = $req['passed'] ? '✅' : ($req['required'] ? '❌' : '⚠️');
            $tableData[] = [$status, $req['label'], $req['current']];
        }
        table(['', 'Prérequis', 'État'], $tableData);

        if (! $results['passed']) {
            $this->error('Certains prérequis obligatoires ne sont pas satisfaits. Corrigez-les avant de continuer.');
            return self::FAILURE;
        }

        info('Tous les prérequis sont satisfaits !');
        $this->newLine();

        // 2. Collecter la configuration
        if ($this->option('quick')) {
            $config = $this->getQuickConfig();
        } else {
            $config = $this->getInteractiveConfig();
        }

        // 3. Confirmation
        $this->newLine();
        note('Récapitulatif de l\'installation :');
        table(
            ['Paramètre', 'Valeur'],
            [
                ['Site', $config['site_name']],
                ['URL', $config['site_url']],
                ['Base de données', "{$config['db_username']}@{$config['db_host']}:{$config['db_port']}/{$config['db_database']}"],
                ['Email admin', $config['admin_email']],
                ['Langue', $config['locale']],
                ['Fuseau horaire', $config['timezone']],
            ]
        );

        if (! confirm('Lancer l\'installation ?', default: true)) {
            warning('Installation annulée.');
            return self::SUCCESS;
        }

        // 4. Exécuter l'installation
        $this->newLine();
        $result = spin(
            callback: fn () => $installer->install($config),
            message: 'Installation en cours...'
        );

        // 5. Afficher le résultat
        $this->newLine();
        if ($result['success']) {
            foreach ($result['log'] as $line) {
                $this->line("  {$line}");
            }

            $this->newLine();
            info('🎉 ArtisanCMS a été installé avec succès !');
            $this->newLine();
            note("URL du site : {$config['site_url']}");
            note("Administration : {$config['site_url']}/admin");
            note("Email : {$config['admin_email']}");
            $this->newLine();
            warning('Notez bien votre mot de passe admin ! Il ne sera plus affiché.');

            return self::SUCCESS;
        }

        $this->error('L\'installation a échoué :');
        foreach ($result['errors'] as $error) {
            $this->line("  ❌ {$error}");
        }

        return self::FAILURE;
    }

    private function getQuickConfig(): array
    {
        return [
            'locale' => 'fr',
            'db_host' => env('DB_HOST', '127.0.0.1'),
            'db_port' => (int) env('DB_PORT', 3306),
            'db_database' => env('DB_DATABASE', 'artisan_cms'),
            'db_username' => env('DB_USERNAME', 'root'),
            'db_password' => env('DB_PASSWORD', ''),
            'db_prefix' => '',
            'site_name' => env('APP_NAME', 'ArtisanCMS'),
            'site_description' => '',
            'site_url' => env('APP_URL', 'http://localhost'),
            'timezone' => env('APP_TIMEZONE', 'Europe/Paris'),
            'admin_name' => 'Admin',
            'admin_email' => 'admin@artisancms.dev',
            'admin_password' => 'password',
            'create_database' => true,
        ];
    }

    private function getInteractiveConfig(): array
    {
        // Langue
        $locale = select(
            label: 'Langue du CMS',
            options: ['fr' => 'Français', 'en' => 'English', 'es' => 'Español', 'de' => 'Deutsch'],
            default: 'fr'
        );

        $this->newLine();
        info('Configuration de la base de données');

        $dbHost = text('Serveur MySQL', default: '127.0.0.1', required: true);
        $dbPort = (int) text('Port', default: '3306', required: true);
        $dbName = text('Nom de la base de données', default: 'artisan_cms', required: true);
        $dbUser = text('Utilisateur', default: 'root', required: true);
        $dbPass = password('Mot de passe (vide si aucun)');
        $createDb = confirm('Créer la base de données si elle n\'existe pas ?', default: true);

        $this->newLine();
        info('Informations du site');

        $siteName = text('Nom du site', default: 'Mon site', required: true);
        $siteDesc = text('Description (tagline)', default: '');
        $siteUrl = text('URL du site', default: env('APP_URL', 'http://localhost'), required: true);
        $timezone = text('Fuseau horaire', default: 'Europe/Paris', required: true);

        $this->newLine();
        info('Compte administrateur');

        $adminName = text('Nom complet', default: 'Admin', required: true);
        $adminEmail = text('Email', default: 'admin@artisancms.dev', required: true);
        $adminPassword = password('Mot de passe (min. 8 caractères)');

        return [
            'locale' => $locale,
            'db_host' => $dbHost,
            'db_port' => $dbPort,
            'db_database' => $dbName,
            'db_username' => $dbUser,
            'db_password' => $dbPass,
            'db_prefix' => '',
            'create_database' => $createDb,
            'site_name' => $siteName,
            'site_description' => $siteDesc,
            'site_url' => $siteUrl,
            'timezone' => $timezone,
            'admin_name' => $adminName,
            'admin_email' => $adminEmail,
            'admin_password' => $adminPassword,
        ];
    }

    private function displayBanner(): void
    {
        $this->newLine();
        $this->line('  ╔══════════════════════════════════════╗');
        $this->line('  ║       🎨 ArtisanCMS Installer        ║');
        $this->line('  ║         Version 1.0.0                ║');
        $this->line('  ╚══════════════════════════════════════╝');
        $this->newLine();
    }
}
```

---

## Pages React Inertia pour le Wizard

### Structure des fichiers

```
resources/js/pages/Install/
├── Stack.tsx          # Étape 1 : Choix du stack (Laravel / Next.js)
├── Language.tsx        # Étape 2 : Sélection langue
├── Requirements.tsx   # Étape 3 : Prérequis serveur
├── Database.tsx       # Étape 4 : Config base de données
├── Site.tsx           # Étape 5 : Infos du site
├── Admin.tsx          # Étape 6 : Compte admin
├── Complete.tsx       # Résultat : succès
├── Error.tsx          # Résultat : erreur
└── components/
    ├── InstallLayout.tsx      # Layout partagé (stepper + logo)
    ├── StepIndicator.tsx      # Indicateur d'étapes (1/7, 2/7, etc.)
    ├── StackCard.tsx          # Carte de choix de stack (logo, features, badge)
    └── PasswordStrength.tsx   # Indicateur de force du mot de passe
```

### Layout d'installation (`InstallLayout.tsx`)

Le layout est minimaliste et centré, avec :
- Le logo ArtisanCMS en haut
- Un stepper horizontal montrant l'étape actuelle (1 à 6)
- Le contenu de l'étape au centre
- Le footer avec la version

```
┌─────────────────────────────────────────────┐
│                                              │
│              🎨 ArtisanCMS                  │
│                                              │
│   ●───●───●───○───○───○───○                  │
│   1   2   3   4   5   6   7                  │
│  Stack Langue Prérequis DB Site Admin Install│
│                                              │
│  ┌──────────────────────────────────┐        │
│  │                                  │        │
│  │     Contenu de l'étape           │        │
│  │     (formulaire)                 │        │
│  │                                  │        │
│  │                                  │        │
│  └──────────────────────────────────┘        │
│                                              │
│  [ ← Retour ]           [ Continuer → ]     │
│                                              │
│          ArtisanCMS v1.0.0                   │
└─────────────────────────────────────────────┘
```

### Composant StepIndicator

Composant React qui affiche la progression en 7 étapes :
- Étapes complétées : cercle plein bleu + trait bleu
- Étape courante : cercle plein bleu (pulsation)
- Étapes futures : cercle vide gris + trait gris

### Composant PasswordStrength

Composant React qui évalue la force du mot de passe en temps réel :
- **Faible** (rouge) : moins de 8 caractères
- **Moyen** (orange) : 8+ caractères, mais manque de diversité
- **Fort** (vert) : 8+ caractères, majuscules, minuscules, chiffres, spéciaux

Critères évalués :
1. Longueur >= 8
2. Contient une majuscule
3. Contient une minuscule
4. Contient un chiffre
5. Contient un caractère spécial

---

## Réinstallation et mode maintenance

### Réinstallation

Pour réinstaller ArtisanCMS :

**Via CLI** :
```bash
php artisan cms:install --force
```

**Via le web** : supprimer le fichier `storage/.installed`, puis accéder au site.

### Relation avec `php artisan migrate:fresh --seed`

La commande `migrate:fresh --seed` recrée toutes les tables et lance le `DatabaseSeeder`. Pour que cette commande reste fonctionnelle en développement, le `DatabaseSeeder` doit appeler le `CMSSeeder` qui contient les mêmes seeders que l'installeur :

```php
// database/seeders/DatabaseSeeder.php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CMSSeeder::class);
    }
}
```

Différence clé :
- `cms:install` → configuration interactive + seeders + fichier .installed
- `migrate:fresh --seed` → reset complet (dev uniquement) avec valeurs par défaut des seeders

---

## Config CMS (`config/cms.php`)

L'installeur s'appuie sur un fichier de configuration dédié :

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Version du CMS
    |--------------------------------------------------------------------------
    */
    'version' => '1.0.0',

    /*
    |--------------------------------------------------------------------------
    | Chemin du contenu
    |--------------------------------------------------------------------------
    | Dossier contenant les thèmes et plugins installés.
    */
    'content_path' => base_path('content'),

    /*
    |--------------------------------------------------------------------------
    | Thèmes
    |--------------------------------------------------------------------------
    */
    'themes' => [
        'path' => base_path('content/themes'),
        'default' => 'default',
    ],

    /*
    |--------------------------------------------------------------------------
    | Plugins
    |--------------------------------------------------------------------------
    */
    'plugins' => [
        'path' => base_path('content/plugins'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Media
    |--------------------------------------------------------------------------
    */
    'media' => [
        'disk' => 'public',
        'max_upload_size' => 10, // MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'webm'],
        'image_sizes' => [
            'sm' => 300,
            'md' => 768,
            'lg' => 1200,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Administration
    |--------------------------------------------------------------------------
    */
    'admin' => [
        'prefix' => 'admin',
        'middleware' => ['web', 'auth', 'verified'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'settings_ttl' => 3600, // 1 heure
        'theme_ttl' => 3600,
        'plugins_ttl' => 3600,
    ],
];
```

---

## Sécurité du wizard

### Protections appliquées

1. **Middleware `EnsureInstalled`** : bloque `/install` si déjà installé
2. **Pas d'authentification requise** : le wizard est accessible sans login (logique, puisqu'il n'y a pas encore de user)
3. **Rate limiting** : limiter les requêtes POST sur `/install/*` pour éviter les abus
4. **CSRF** : protection CSRF active sur toutes les étapes (géré nativement par Laravel/Inertia)
5. **Validation stricte** : Form Requests sur chaque étape
6. **Mot de passe hashé** : jamais stocké en clair, hashé avec `Hash::make()` (bcrypt par défaut)
7. **Session éphémère** : les données d'installation en session sont nettoyées après installation
8. **Fichier .installed** : la suppression de ce fichier est la seule façon de réaccéder au wizard

### En production

Après l'installation, il est recommandé de :
1. Vérifier que `storage/.installed` existe
2. Configurer le serveur web pour bloquer l'accès à `/install` (mesure additionnelle)
3. Supprimer la route `install` en production si souhaité (via config ou middleware)

---

## Résumé des fichiers à créer

```
app/
├── Http/
│   ├── Controllers/
│   │   └── InstallController.php           # Controller wizard 7 étapes
│   └── Middleware/
│       └── EnsureInstalled.php             # Middleware redirection /install
├── Services/
│   ├── InstallerService.php                # Service principal d'installation
│   ├── RequirementsChecker.php             # Vérification prérequis serveur (adapté au stack)
│   └── DatabaseConfigurator.php            # Test connexion DB + écriture .env
├── Console/
│   └── Commands/
│       └── CMSInstall.php                  # php artisan cms:install

config/
└── cms.php                                 # Configuration CMS

resources/js/pages/Install/
├── Stack.tsx                               # Étape 1 : Choix du stack
├── Language.tsx                             # Étape 2 : Langue
├── Requirements.tsx                        # Étape 3 : Prérequis
├── Database.tsx                            # Étape 4 : Base de données
├── Site.tsx                                # Étape 5 : Infos du site
├── Admin.tsx                               # Étape 6 : Compte admin
├── Complete.tsx                            # Succès
├── Error.tsx                               # Erreur
└── components/
    ├── InstallLayout.tsx                   # Layout wizard
    ├── StepIndicator.tsx                   # Stepper visuel (7 étapes)
    ├── StackCard.tsx                       # Carte de choix de stack
    └── PasswordStrength.tsx                # Force mot de passe

routes/
└── install.php                             # Routes du wizard (ou dans web.php)
```
