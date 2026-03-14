# ─── Stage 1: Node.js build ───────────────────────────────────────────────────
FROM node:20-alpine AS node-builder

WORKDIR /app

COPY package*.json ./
COPY packages/ ./packages/

RUN npm ci

COPY resources/ ./resources/
COPY vite.config.ts tsconfig.json tailwind.config.ts ./

RUN npm run build

# ─── Stage 2: PHP / Laravel ───────────────────────────────────────────────────
FROM php:8.2-fpm-alpine AS php-base

# System deps
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    curl \
    git \
    unzip \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        gd \
        zip \
        intl \
        opcache \
        pcntl \
        bcmath

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM php-base AS production

# Copy application
COPY --chown=www-data:www-data . .

# Copy built assets from node stage
COPY --from=node-builder --chown=www-data:www-data /app/public/build ./public/build

# Install PHP deps (no dev)
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-progress \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Permissions
RUN mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# PHP config
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

USER www-data

EXPOSE 9000

CMD ["php-fpm"]
