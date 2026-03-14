#!/bin/bash
# deploy.sh - ArtisanCMS production deployment script

set -e

APP_DIR="/var/www/artisan-cms"
BRANCH="main"

echo "Deploying ArtisanCMS..."

cd $APP_DIR

# 1. Maintenance mode
php artisan down --retry=60

# 2. Pull latest changes
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 3. PHP dependencies
composer install --no-dev --optimize-autoloader --no-interaction

# 4. Node dependencies and build
npm ci --production=false
npm run build

# 5. Migrations
php artisan migrate --force

# 6. Cache optimization
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 7. Clear CMS cache
php artisan cms:cache:clear

# 8. Permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 9. Restart queue workers (if used)
# php artisan queue:restart

# 10. Exit maintenance mode
php artisan up

echo "Deployment complete!"
