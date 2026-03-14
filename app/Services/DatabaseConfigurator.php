<?php

declare(strict_types=1);

namespace App\Services;

use PDO;
use PDOException;

class DatabaseConfigurator
{
    public function testConnection(array $config): array
    {
        try {
            $dsn = "mysql:host={$config['db_host']};port={$config['db_port']}";
            $pdo = new PDO($dsn, $config['db_username'], $config['db_password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);

            $version = $pdo->query('SELECT VERSION()')->fetchColumn();

            $dbName = $config['db_database'];
            $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$dbName]);
            $dbExists = $stmt->fetchColumn();

            if (!$dbExists) {
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
            if (preg_match("/^{$key}=.*/m", $envContent)) {
                $envContent = preg_replace(
                    "/^{$key}=.*/m",
                    "{$key}={$value}",
                    $envContent
                );
            } else {
                $envContent .= "\n{$key}={$value}";
            }
        }

        if (!empty($config['db_prefix'])) {
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
