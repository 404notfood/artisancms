# Distribution et mises à jour ArtisanCMS

Le code du registre et du client est intégré. La distribution publique nécessite un serveur de registre accessible en HTTPS et des releases publiées dans votre dépôt GitHub.

## Serveur de distribution

Installez une instance de cette version sur le serveur qui servira le registre. Les métadonnées sont conservées dans `storage/app/private/registry`, à sauvegarder et à conserver entre les déploiements. Aucune nouvelle table n'est nécessaire.

Configurez `CMS_REGISTRY_API_KEY` avec un secret aléatoire propre à ce serveur. Cette clé sert uniquement à publier des releases ; les sites clients n'en ont pas besoin. Ne la commitez jamais.

Endpoints publics :

- `GET /api/v1/version` : dernière version publiée du cœur, lien et empreinte.
- `POST /api/v1/check-updates` : comparaison des versions du CMS, des thèmes et des plugins.
- `GET /api/v1/catalog` : catalogue des extensions présentes sur le serveur.
- `GET /api/v1/plugins/{slug}/download` et `/api/v1/themes/{slug}/download` : redirection vers l'archive de la dernière release de l'extension.

La publication utilise `POST /api/internal/releases` avec `Authorization: Bearer <clé>`. Le corps JSON contient `type` (`cms`, `plugin` ou `theme`), `version` stable au format `X.Y.Z`, `tag`, `download_url` HTTPS et `checksum_sha256`. Le champ `slug` est obligatoire pour un thème ou plugin. `changelog`, `php_required` (version PHP minimale) et `urgent` sont facultatifs.

Le registre ne télécharge ni n'exécute les archives lors de leur enregistrement. Seules les versions publiées sont annoncées comme mises à jour. Les versions sont comparées numériquement : `1.10.0` est plus récente que `1.2.0`.

## Publication GitHub du cœur

Dans les secrets GitHub Actions du dépôt, configurez :

- `REGISTRY_URL` : origine du serveur, sans `/api/v1`, par exemple `https://distribution.example.com`.
- `REGISTRY_API_KEY` : même secret que `CMS_REGISTRY_API_KEY` du serveur.

Pour chaque release :

1. Faites correspondre `VERSION` et `config/cms.php`, puis mettez à jour `CHANGELOG.md`.
2. Publiez un tag `vX.Y.Z` correspondant exactement à `VERSION`.
3. Le workflow installe les dépendances de production, compile le frontend et publie un ZIP et son SHA-256 sur GitHub Releases.
4. Le workflow enregistre la version, l'URL et le SHA-256 auprès du registre. Si les secrets ne sont pas configurés, il indique que cette notification est ignorée. Une erreur HTTP d'un registre configuré fait échouer l'étape de notification.

Les anciennes archives `.tar.gz` ne sont pas installées par ce nouveau circuit. Publiez une release ZIP pour les installations automatiques. L'archive doit embarquer `vendor` et `public/build` : aucun Composer ni Node.js n'est nécessaire sur le site client pendant l'installation.

## Sites clients

Configurez dans leur `.env` :

```dotenv
CMS_REGISTRY_URL=https://distribution.example.com/api/v1
CMS_GITHUB_REPO=votre-compte/votre-depot
CMS_PHP_BINARY=php
CMS_AUTO_UPDATE=disabled
CMS_AUTO_UPDATE_PLUGINS=false
CMS_AUTO_UPDATE_THEMES=false
```

`CMS_PHP_BINARY` doit désigner le PHP CLI disponible au serveur web. Sous Laragon, utilisez au besoin le chemin absolu du `php.exe` de la version active. Il faut l'extension PHP `zip`, un PHP compatible avec les dépendances de la release, un accès HTTPS sortant, la possibilité d'exécuter le PHP CLI et les droits d'écriture sur les fichiers du cœur et `storage`. La sauvegarde de base utilise le service existant pour MySQL/MariaDB.

Après une modification de configuration, exécutez `php artisan config:clear`.

Le bouton **Mises à jour → Mettre à jour le CMS** installe la dernière version publiée. La commande `php artisan cms:update` effectue la même opération. Les mises à jour des extensions ont leur propre bouton et peuvent être lancées ensemble ; le cœur est installé séparément pour que la requête suivante charge les nouvelles dépendances PHP.

Le client utilise le registre en priorité. Si celui-ci est indisponible, il consulte les releases GitHub publiques du dépôt configuré. Le ZIP et son fichier `.sha256` doivent tous deux être publiés. Les dépôts privés nécessitent un téléchargement HTTPS accessible au client ; aucun jeton GitHub privé n'est ajouté automatiquement aux requêtes.

## Sauvegardes et restauration

Avant toute modification du cœur, le client vérifie le SHA-256, la structure du ZIP, l'identité du CMS, la version et la compatibilité PHP. Il refuse les chemins sortant de l'archive et les liens symboliques.

Le site passe temporairement en maintenance Laravel. Le système crée ensuite :

- une sauvegarde de base dans le module **Sauvegardes** ;
- une copie des fichiers du cœur dans `storage/app/updates/backups/core_<identifiant>` ;
- une entrée dans l'historique des mises à jour.

Les dossiers `content`, `storage`, les uploads publics et `.env` sont préservés. Les dossiers du cœur gérés (`app`, `config`, `resources`, `routes`, `vendor`, etc.) sont remplacés : les modifications manuelles dans ces dossiers seront écrasées.

Les migrations et le nettoyage des caches sont exécutés dans un nouveau processus PHP. En cas d'échec, les fichiers précédents sont restaurés ; si des migrations ont commencé, la sauvegarde de base est également restaurée. Si cette récupération échoue, le site reste en maintenance et le message d'erreur indique une restauration incomplète. Conservez les sauvegardes pour intervenir avant de lancer `php artisan up`.

Le bouton de retour arrière du cœur est proposé pour une mise à jour terminée sans changement de migrations, et uniquement en remontant depuis la dernière mise à jour installée. Il restaure les fichiers sans écraser les contenus créés depuis. Si le schéma de la base a changé, il faut une restauration complète : remettre les fichiers de la sauvegarde du cœur et restaurer la sauvegarde de base associée depuis le module Sauvegardes ou les outils d'exploitation. Cette opération remet les données à la date de sauvegarde ; elle ne se lance pas silencieusement depuis le bouton de retour arrière.

Un verrou de fichier empêche deux mises à jour ou restaurations de s'exécuter en parallèle, même pendant le nettoyage des caches.

## Automatisation

Les préférences de la page Mises à jour sont utilisées par `php artisan cms:auto-update`. Les mises à jour automatiques du cœur sont désactivées par défaut. Le mode `minor` autorise les versions qui ne changent pas le numéro majeur ; `all` autorise toutes les releases stables plus récentes.

Le planificateur prévoit une vérification à 03:00 et les installations automatiques à 04:00, dans le fuseau de l'application. Sur l'hébergement, configurez une tâche cron qui exécute `php artisan schedule:run` chaque minute. Après une mise à jour du cœur, les extensions sont traitées lors d'une prochaine exécution, avec les nouvelles dépendances PHP.
