# Blueprint 15 - Déploiement & CI/CD

## Vue d'ensemble
Ce document couvre le déploiement d'ArtisanCMS en production, la configuration Docker pour le développement, et le pipeline CI/CD avec GitHub Actions.

---

## 1. Environnements

| Environnement | Usage | Driver cache | Debug | HTTPS |
|---------------|-------|-------------|-------|-------|
| **local** | Développement (Laragon) | file | true | non |
| **testing** | Tests automatisés | array | false | non |
| **staging** | Recette client | redis | false | oui |
| **production** | Site en ligne | redis | false | oui |

---

## 2. Docker Compose (développement)

Pour les développeurs qui n'utilisent pas Laragon, un setup Docker est fourni.

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - .:/var/www/html
      - /var/www/html/vendor
      - /var/www/html/node_modules
    environment:
      - APP_ENV=local
      - DB_CONNECTION=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_DATABASE=artisan_cms
      - DB_USERNAME=artisan
      - DB_PASSWORD=secret
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "php artisan serve --host=0.0.0.0 --port=8000"

  vite:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - .:/var/www/html
      - /var/www/html/node_modules
    command: npm run dev -- --host 0.0.0.0
    depends_on:
      - app

  db:
    image: mariadb:11
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=artisan_cms
      - MYSQL_USER=artisan
      - MYSQL_PASSWORD=secret
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:
```

```dockerfile
# docker/Dockerfile
FROM php:8.2-cli

# Extensions PHP
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /var/www/html

# Copier les dépendances
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader

COPY package.json package-lock.json ./
RUN npm ci

# Copier le reste du code
COPY . .

RUN composer dump-autoload --optimize
RUN npm run build
```

```bash
# Commandes Docker
docker compose up -d              # Démarrer
docker compose exec app bash      # Shell dans le conteneur
docker compose exec app php artisan migrate  # Migrations
docker compose down               # Arrêter
```

---

## 3. Script de déploiement production

```bash
#!/bin/bash
# deploy.sh — Script de déploiement sur un serveur Linux

set -e

APP_DIR="/var/www/artisan-cms"
BRANCH="main"

echo "🚀 Déploiement ArtisanCMS..."

cd $APP_DIR

# 1. Maintenance mode
php artisan down --retry=60

# 2. Pull les dernières modifications
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 3. Dépendances PHP
composer install --no-dev --optimize-autoloader --no-interaction

# 4. Dépendances Node et build
npm ci --production=false
npm run build

# 5. Migrations
php artisan migrate --force

# 6. Cache (optimisation production)
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 7. Vider le cache CMS
php artisan cms:cache:clear

# 8. Permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 9. Restart des workers (si queue utilisée)
# php artisan queue:restart

# 10. Sortir du mode maintenance
php artisan up

echo "✅ Déploiement terminé !"
```

---

## 4. Configuration Nginx (production)

```nginx
# /etc/nginx/sites-available/artisan-cms
server {
    listen 80;
    listen [::]:80;
    server_name artisancms.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name artisancms.example.com;

    root /var/www/artisan-cms/public;
    index index.php;

    # SSL (Let's Encrypt via Certbot)
    ssl_certificate /etc/letsencrypt/live/artisancms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artisancms.example.com/privkey.pem;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Assets statiques (cache long)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Vite build assets
    location /build/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Storage (media uploads)
    location /storage/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # Laravel
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Bloquer les fichiers sensibles
    location ~ /\.(?!well-known) {
        deny all;
    }

    location ~ /(vendor|node_modules|storage/app|storage/framework|storage/logs) {
        deny all;
    }
}
```

---

## 5. GitHub Actions CI/CD

### Pipeline de tests (sur chaque PR)

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  php-tests:
    name: PHP Tests
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: artisan_cms_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, pdo_mysql, gd, bcmath
          coverage: xdebug

      - name: Install Composer dependencies
        run: composer install --no-interaction --prefer-dist

      - name: Copy .env
        run: cp .env.example .env && php artisan key:generate

      - name: Run migrations
        run: php artisan migrate --force
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: artisan_cms_test
          DB_USERNAME: root
          DB_PASSWORD: root

      - name: Run PHPUnit
        run: php artisan test --coverage --min=70
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: artisan_cms_test
          DB_USERNAME: root
          DB_PASSWORD: root

  js-tests:
    name: JS Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Vitest
        run: npm test -- --coverage

      - name: Build
        run: npm run build

  lint:
    name: Linting
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'

      - name: Install dependencies
        run: composer install --no-interaction

      - name: PHP CS Fixer (dry run)
        run: vendor/bin/php-cs-fixer fix --dry-run --diff

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install JS dependencies
        run: npm ci

      - name: ESLint
        run: npx eslint resources/js/ packages/ --ext .ts,.tsx

      - name: TypeScript check
        run: npx tsc --noEmit
```

### Pipeline de déploiement (sur push main)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to production
    runs-on: ubuntu-latest
    needs: [php-tests, js-tests]  # Attend que les tests passent

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /var/www/artisan-cms
            bash deploy.sh
```

---

## 6. Variables d'environnement par contexte

### .env.example (template)
```env
APP_NAME=ArtisanCMS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=artisan_cms
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# CMS
CMS_CACHE_DRIVER=file

# Mail (optionnel)
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@artisancms.dev

# Stripe (optionnel, plugin e-commerce)
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
```

### Production
```env
APP_ENV=production
APP_DEBUG=false
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
CMS_CACHE_DRIVER=redis
```

---

## 7. Checklist de déploiement

### Avant le premier déploiement
- [ ] Serveur avec PHP 8.2+, Nginx, MySQL/MariaDB, Redis
- [ ] Certificat SSL (Let's Encrypt / Certbot)
- [ ] Utilisateur système dédié (pas root)
- [ ] Clé SSH pour GitHub Actions
- [ ] `.env` configuré sur le serveur (pas dans le repo)
- [ ] `storage/` et `bootstrap/cache/` avec les bonnes permissions
- [ ] Cron pour le scheduler Laravel : `* * * * * php /path/artisan schedule:run`

### À chaque déploiement
- [ ] Tests passent (CI)
- [ ] Build frontend réussi
- [ ] Migrations exécutées
- [ ] Cache recompilé
- [ ] Cache CMS vidé

### Monitoring
- [ ] Logs Laravel accessibles (`storage/logs/`)
- [ ] Alertes sur les erreurs 500 (Sentry, Bugsnag, ou log monitoring)
- [ ] Métriques de performance (optionnel : Laravel Telescope en staging)

---

## 8. Hébergement recommandé

### Pour les clients (sites vitrine / PME)

| Solution | Prix | Avantages |
|----------|------|-----------|
| **VPS** (Hetzner, OVH, DigitalOcean) | 5-20€/mois | Contrôle total, bon rapport qualité/prix |
| **Laravel Forge** | 12$/mois + VPS | Déploiement automatisé, SSL, monitoring |
| **Ploi.io** | 8$/mois + VPS | Alternative à Forge, interface simple |

### Pour le développement

| Solution | Prix | Avantages |
|----------|------|-----------|
| **Laragon** (Windows) | Gratuit | Déjà en place, simple, rapide |
| **Docker** | Gratuit | Cross-platform, reproductible |
| **Laravel Herd** (Mac) | Gratuit | Si migration vers Mac |
