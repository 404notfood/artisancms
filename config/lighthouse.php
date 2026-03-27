<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Lighthouse GraphQL Configuration
|--------------------------------------------------------------------------
|
| Configuration pour le package nuwave/lighthouse.
| Installer avec : composer require nuwave/lighthouse
|
| Documentation : https://lighthouse-php.com
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Route Configuration
    |--------------------------------------------------------------------------
    |
    | URI et middleware pour l'endpoint GraphQL.
    | L'API est publique en lecture (pas d'auth requise pour les queries).
    |
    */

    'route' => [
        'uri' => '/graphql',
        'name' => 'graphql',
        'prefix' => '',
        'middleware' => [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Session\Middleware\StartSession::class,

            // Rate limiting pour protéger l'API GraphQL
            'throttle:60,1',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Schema Location
    |--------------------------------------------------------------------------
    */

    'schema_path' => base_path('graphql/schema.graphql'),

    /*
    |--------------------------------------------------------------------------
    | Schema Cache
    |--------------------------------------------------------------------------
    |
    | Activer le cache du schema en production pour de meilleures performances.
    | En dev, laisser désactivé pour le hot-reload.
    |
    */

    'schema_cache' => [
        'enable' => env('LIGHTHOUSE_SCHEMA_CACHE', false),
        'path' => base_path('bootstrap/cache/lighthouse-schema.php'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Namespaces
    |--------------------------------------------------------------------------
    |
    | Namespaces pour la résolution automatique des classes.
    |
    */

    'namespaces' => [
        'models' => ['App\\Models'],
        'queries' => ['App\\GraphQL\\Queries'],
        'mutations' => ['App\\GraphQL\\Mutations'],
        'subscriptions' => ['App\\GraphQL\\Subscriptions'],
        'interfaces' => ['App\\GraphQL\\Interfaces'],
        'unions' => ['App\\GraphQL\\Unions'],
        'scalars' => ['App\\GraphQL\\Scalars'],
        'directives' => ['App\\GraphQL\\Directives'],
        'validators' => ['App\\GraphQL\\Validators'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security
    |--------------------------------------------------------------------------
    |
    | Limites pour empêcher les queries abusives.
    | max_query_depth : profondeur max de nesting (ex: post.comments.replies.post...)
    | max_query_complexity : complexité max calculée par Lighthouse.
    |
    */

    'security' => [
        'max_query_depth' => 10,
        'max_query_complexity' => 100,
        'disable_introspection' => env('LIGHTHOUSE_DISABLE_INTROSPECTION', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    |
    | Nombre d'éléments par page par défaut et maximum.
    |
    */

    'pagination' => [
        'default_count' => 15,
        'max_count' => 100,
    ],

    /*
    |--------------------------------------------------------------------------
    | GraphQL Playground / GraphiQL
    |--------------------------------------------------------------------------
    |
    | Activer l'IDE GraphQL intégré (désactivé en production).
    | Accessible via GET /graphql
    |
    */

    'guard' => null,

    /*
    |--------------------------------------------------------------------------
    | Batched Queries
    |--------------------------------------------------------------------------
    |
    | Nombre max de queries dans un batch.
    |
    */

    'batched_queries' => true,

    /*
    |--------------------------------------------------------------------------
    | Transactional Mutations
    |--------------------------------------------------------------------------
    |
    | Encapsuler les mutations dans une transaction DB.
    |
    */

    'transactional_mutations' => true,

    /*
    |--------------------------------------------------------------------------
    | Field Middleware
    |--------------------------------------------------------------------------
    */

    'field_middleware' => [
        // Résolu au runtime par Lighthouse — références en string pour
        // éviter une erreur si le package n'est pas encore installé.
        'Nuwave\\Lighthouse\\Validation\\ValidateDirective',
        'Nuwave\\Lighthouse\\SoftDeletes\\TrashedDirective',
    ],

    /*
    |--------------------------------------------------------------------------
    | Global Middleware
    |--------------------------------------------------------------------------
    */

    'global_id_field' => 'id',

];
