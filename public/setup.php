<?php
/**
 * ArtisanCMS Pre-Installer (Standalone)
 *
 * This file runs BEFORE Laravel is bootstrapped.
 * It installs Composer dependencies, builds frontend assets,
 * and prepares the environment for the Laravel install wizard.
 *
 * Usage: Upload all files to server, then visit /setup.php
 * After setup completes, you'll be redirected to /install
 */

// Prevent timeout for long operations
set_time_limit(600);
ini_set('max_execution_time', '600');

// Base paths
define('BASE_PATH', dirname(__DIR__));
define('VENDOR_PATH', BASE_PATH . '/vendor');
define('ENV_FILE', BASE_PATH . '/.env');
define('ENV_EXAMPLE', BASE_PATH . '/.env.example');
define('INSTALLED_FILE', BASE_PATH . '/storage/.installed');

/**
 * Check if shell execution functions are available
 */
function canExecShell(): bool {
    $disabled = array_map('trim', explode(',', ini_get('disable_functions') ?: ''));
    return function_exists('shell_exec') && !in_array('shell_exec', $disabled);
}

/**
 * Enrich PATH with common dev environment paths (Laragon, XAMPP, MAMP, WAMP, nvm, etc.)
 * This is needed because web servers (Apache/Nginx) often don't inherit the user's PATH.
 */
function enrichPath(): void {
    static $enriched = false;
    if ($enriched) return;
    $enriched = true;

    $currentPath = getenv('PATH') ?: '';
    $extraPaths = [];

    if (DIRECTORY_SEPARATOR === '\\') {
        // ─── Windows ───
        // Auto-detect Laragon base from current PHP binary or project path
        $phpDir = dirname(PHP_BINARY);
        // Laragon: PHP is in laragon/bin/php/phpX.Y.Z/
        $laragonBase = null;
        if (preg_match('#^(.+[/\\\\]laragon)[/\\\\]bin[/\\\\]#i', $phpDir, $m)) {
            $laragonBase = $m[1];
        } elseif (preg_match('#^(.+[/\\\\]laragon)[/\\\\]www[/\\\\]#i', BASE_PATH, $m)) {
            $laragonBase = $m[1];
        }

        if ($laragonBase) {
            // Scan Laragon bin directories dynamically
            $binDir = $laragonBase . '\\bin';
            // Composer
            if (is_dir($binDir . '\\composer')) {
                $extraPaths[] = $binDir . '\\composer';
            }
            // Node.js — find the latest version directory
            $nodeDir = $binDir . '\\nodejs';
            if (is_dir($nodeDir)) {
                $nodeDirs = glob($nodeDir . '\\node-v*', GLOB_ONLYDIR);
                if ($nodeDirs) {
                    // Sort descending to get latest version first
                    usort($nodeDirs, fn($a, $b) => version_compare(
                        preg_replace('/.*node-v?/i', '', $b),
                        preg_replace('/.*node-v?/i', '', $a)
                    ));
                    $extraPaths[] = $nodeDirs[0];
                }
            }
            // Git
            if (is_dir($binDir . '\\git\\bin')) {
                $extraPaths[] = $binDir . '\\git\\bin';
            }
        }

        // Common Windows paths for composer/node
        $programFiles = getenv('ProgramFiles') ?: 'C:\\Program Files';
        $programFilesX86 = getenv('ProgramFiles(x86)') ?: 'C:\\Program Files (x86)';
        $appData = getenv('APPDATA') ?: '';
        $localAppData = getenv('LOCALAPPDATA') ?: '';
        $userProfile = getenv('USERPROFILE') ?: '';

        $windowsPaths = [
            // Node.js standard installs
            $programFiles . '\\nodejs',
            $programFilesX86 . '\\nodejs',
            // nvm-windows
            $appData . '\\nvm',
            // Composer global
            $appData . '\\Composer\\vendor\\bin',
            // npm global
            $appData . '\\npm',
            // XAMPP
            'C:\\xampp\\php',
            // WAMP
            'C:\\wamp64\\bin\\php\\php8.2',
            'C:\\wamp64\\bin\\php\\php8.3',
            'C:\\wamp64\\bin\\php\\php8.4',
            // fnm
            $localAppData . '\\fnm_multishells',
            // Volta
            $userProfile . '\\.volta\\bin',
        ];

        foreach ($windowsPaths as $p) {
            if ($p && is_dir($p)) {
                $extraPaths[] = $p;
            }
        }

        // nvm-windows: find active node version
        $nvmDir = getenv('NVM_HOME') ?: ($appData . '\\nvm');
        if (is_dir($nvmDir)) {
            $nvmNodeDirs = glob($nvmDir . '\\v*', GLOB_ONLYDIR);
            if ($nvmNodeDirs) {
                usort($nvmNodeDirs, fn($a, $b) => version_compare(
                    preg_replace('/.*v/i', '', $b),
                    preg_replace('/.*v/i', '', $a)
                ));
                $extraPaths[] = $nvmNodeDirs[0];
            }
        }
    } else {
        // ─── Linux / macOS ───
        $home = getenv('HOME') ?: ('/home/' . (getenv('USER') ?: 'www-data'));

        $unixPaths = [
            '/usr/local/bin',
            '/usr/bin',
            '/usr/local/sbin',
            '/opt/homebrew/bin',          // macOS Homebrew ARM
            '/usr/local/opt/node/bin',    // macOS Homebrew Intel
            $home . '/.nvm/current/bin',  // nvm
            $home . '/.volta/bin',        // Volta
            $home . '/.fnm/aliases/default/bin', // fnm
            $home . '/.composer/vendor/bin',
            $home . '/.config/composer/vendor/bin',
            '/opt/plesk/node/20/bin',     // Plesk
            '/opt/cpanel/ea-nodejs20/bin', // cPanel
        ];

        // nvm: try to find the default node
        $nvmDir = getenv('NVM_DIR') ?: ($home . '/.nvm');
        $nvmDefault = $nvmDir . '/alias/default';
        if (file_exists($nvmDefault)) {
            $defaultVersion = trim(file_get_contents($nvmDefault));
            $nvmNodePath = $nvmDir . '/versions/node/v' . ltrim($defaultVersion, 'v') . '/bin';
            if (is_dir($nvmNodePath)) {
                $unixPaths[] = $nvmNodePath;
            }
        }

        // MAMP
        if (is_dir('/Applications/MAMP/bin')) {
            $unixPaths[] = '/Applications/MAMP/bin/php/php8.2/bin';
            $unixPaths[] = '/Applications/MAMP/bin/php/php8.3/bin';
        }

        foreach ($unixPaths as $p) {
            if (is_dir($p)) {
                $extraPaths[] = $p;
            }
        }
    }

    if (!empty($extraPaths)) {
        $separator = DIRECTORY_SEPARATOR === '\\' ? ';' : ':';
        $newPath = implode($separator, $extraPaths) . $separator . $currentPath;
        putenv("PATH={$newPath}");
        // Also set for proc_open if used later
        $_ENV['PATH'] = $newPath;
    }
}

/**
 * Find the full path to a binary by searching the enriched PATH and common locations.
 * Caches results to avoid repeated filesystem scans.
 */
function findBinary(string $name): ?string {
    static $cache = [];
    if (isset($cache[$name])) return $cache[$name];

    $extraPaths = getExtraPaths();
    $isWin = DIRECTORY_SEPARATOR === '\\';
    $extensions = $isWin ? ['.bat', '.cmd', '.exe', ''] : [''];

    foreach ($extraPaths as $dir) {
        foreach ($extensions as $ext) {
            $fullPath = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name . $ext;
            if (file_exists($fullPath) && is_file($fullPath)) {
                $cache[$name] = $fullPath;
                return $fullPath;
            }
        }
    }

    // Fallback: try bare command (might be in system PATH)
    if (canExecShell()) {
        $nullRedirect = $isWin ? '2>NUL' : '2>/dev/null';
        $whereCmd = $isWin ? "where {$name} {$nullRedirect}" : "which {$name} {$nullRedirect}";
        $result = trim(@shell_exec($whereCmd) ?? '');
        if ($result) {
            // On Windows, 'where' may return multiple lines — take the first
            $firstLine = explode("\n", $result)[0];
            $firstLine = trim($firstLine);
            if (file_exists($firstLine)) {
                $cache[$name] = $firstLine;
                return $firstLine;
            }
        }
    }

    $cache[$name] = null;
    return null;
}

/**
 * Get extra PATH directories (cached).
 */
function getExtraPaths(): array {
    static $paths = null;
    if ($paths !== null) return $paths;

    $paths = [];

    if (DIRECTORY_SEPARATOR === '\\') {
        // ─── Windows ───
        $phpDir = dirname(PHP_BINARY);
        $laragonBase = null;
        if (preg_match('#^(.+[/\\\\]laragon)[/\\\\]bin[/\\\\]#i', $phpDir, $m)) {
            $laragonBase = $m[1];
        } elseif (preg_match('#^(.+[/\\\\]laragon)[/\\\\]www[/\\\\]#i', BASE_PATH, $m)) {
            $laragonBase = $m[1];
        }

        if ($laragonBase) {
            $binDir = $laragonBase . '\\bin';
            if (is_dir($binDir . '\\composer')) {
                $paths[] = $binDir . '\\composer';
            }
            $nodeDir = $binDir . '\\nodejs';
            if (is_dir($nodeDir)) {
                $nodeDirs = glob($nodeDir . '\\node-v*', GLOB_ONLYDIR);
                if ($nodeDirs) {
                    usort($nodeDirs, fn($a, $b) => version_compare(
                        preg_replace('/.*node-v?/i', '', $b),
                        preg_replace('/.*node-v?/i', '', $a)
                    ));
                    $paths[] = $nodeDirs[0];
                }
            }
        }

        $programFiles = getenv('ProgramFiles') ?: 'C:\\Program Files';
        $appData = getenv('APPDATA') ?: '';

        $windowsPaths = [
            $programFiles . '\\nodejs',
            $appData . '\\Composer\\vendor\\bin',
            $appData . '\\npm',
            'C:\\xampp\\php',
            'C:\\wamp64\\bin\\php\\php8.2',
            'C:\\wamp64\\bin\\php\\php8.3',
            'C:\\wamp64\\bin\\php\\php8.4',
        ];

        foreach ($windowsPaths as $p) {
            if ($p && is_dir($p)) $paths[] = $p;
        }
    } else {
        // ─── Linux / macOS ───
        $home = getenv('HOME') ?: '/root';
        $unixPaths = [
            '/usr/local/bin', '/usr/bin', '/usr/local/sbin',
            '/opt/homebrew/bin',
            $home . '/.nvm/current/bin',
            $home . '/.volta/bin',
            $home . '/.composer/vendor/bin',
            $home . '/.config/composer/vendor/bin',
            '/opt/plesk/node/20/bin',
            '/opt/cpanel/ea-nodejs20/bin',
        ];

        // nvm: find default version
        $nvmDir = getenv('NVM_DIR') ?: ($home . '/.nvm');
        if (is_dir($nvmDir . '/versions/node')) {
            $nvmVersions = glob($nvmDir . '/versions/node/v*', GLOB_ONLYDIR);
            if ($nvmVersions) {
                usort($nvmVersions, fn($a, $b) => version_compare(
                    preg_replace('/.*v/i', '', $b),
                    preg_replace('/.*v/i', '', $a)
                ));
                $unixPaths[] = $nvmVersions[0] . '/bin';
            }
        }

        foreach ($unixPaths as $p) {
            if (is_dir($p)) $paths[] = $p;
        }
    }

    // Also add current system PATH directories
    $systemPath = getenv('PATH') ?: '';
    $separator = DIRECTORY_SEPARATOR === '\\' ? ';' : ':';
    foreach (explode($separator, $systemPath) as $p) {
        $p = trim($p);
        if ($p && is_dir($p)) $paths[] = $p;
    }

    $paths = array_unique($paths);
    return $paths;
}

// Enrich PATH early so shell_exec commands can also find binaries
if (canExecShell()) {
    enrichPath();
}

// ─── Already installed? Redirect to site ───
if (file_exists(INSTALLED_FILE)) {
    header('Location: /');
    exit;
}

// ─── Setup already completed? Rename self and redirect to install wizard ───
if (file_exists(BASE_PATH . '/storage/.setup_done')) {
    // Rename setup.php so it no longer intercepts requests
    $self = __FILE__;
    $renamed = dirname($self) . '/setup.php.done';
    @rename($self, $renamed);
    header('Location: /install');
    exit;
}

// ─── Synchronous command execution ───

/**
 * Run a shell command synchronously and return its output.
 * Used as primary execution method — faster and more reliable than async on local dev.
 */
function runSyncCommand(string $cmd): array {
    $output = [];
    $exitCode = -1;

    exec($cmd, $output, $exitCode);

    $outputStr = implode("\n", $output);
    return [
        'success' => $exitCode === 0,
        'exit_code' => $exitCode,
        'output' => substr($outputStr, -1000),
    ];
}

// ─── Async task helpers for long-running commands ───
define('SETUP_TEMP_DIR', BASE_PATH . '/storage/framework/cache');

/**
 * Get the path for an async task's status/log file.
 */
function getAsyncFile(string $step, string $type): string {
    return SETUP_TEMP_DIR . "/setup_{$step}.{$type}";
}

/**
 * Launch a shell command in the background and track it via lock/log files.
 * Returns immediately. Use checkAsyncStatus() to poll for completion.
 */
function launchAsync(string $step, string $cmd, callable $successCheck): array {
    $lockFile = getAsyncFile($step, 'lock');
    $logFile = getAsyncFile($step, 'log');

    // Ensure temp directory exists
    if (!is_dir(SETUP_TEMP_DIR)) {
        @mkdir(SETUP_TEMP_DIR, 0755, true);
    }

    // Already running?
    if (file_exists($lockFile)) {
        return checkAsyncStatus($step, $successCheck);
    }

    // Create lock file
    file_put_contents($lockFile, date('Y-m-d H:i:s'));

    // Clean previous log
    if (file_exists($logFile)) {
        @unlink($logFile);
    }

    // Launch in background
    if (DIRECTORY_SEPARATOR === '\\') {
        // Windows: write a temporary .bat script that runs the command,
        // captures output, then deletes the lock file and itself.
        // Include enriched PATH so the background process can find composer/node/npm/git.
        $batFile = SETUP_TEMP_DIR . "/setup_{$step}.bat";
        $logWin = str_replace('/', '\\', $logFile);
        $lockWin = str_replace('/', '\\', $lockFile);
        $batWin = str_replace('/', '\\', $batFile);

        $batContent = "@echo off\r\n";
        // Inject the enriched PATH into the .bat environment
        $enrichedPath = getenv('PATH') ?: '';
        if ($enrichedPath) {
            $batContent .= "set \"PATH={$enrichedPath}\"\r\n";
        }
        $batContent .= "{$cmd} > \"{$logWin}\" 2>&1\r\n";
        $batContent .= "del \"{$lockWin}\" 2>nul\r\n";
        $batContent .= "del \"{$batWin}\" 2>nul\r\n";

        file_put_contents($batFile, $batContent);

        // Use WScript.Shell via a .vbs to truly detach the process.
        // popen("start /B ...") inherits PHP's stdout/stderr handles, causing
        // empty HTTP responses on subsequent requests (race condition).
        // WScript.Shell.Run with vbHide (0) and async (False) avoids this.
        $wshScript = SETUP_TEMP_DIR . "/setup_{$step}.vbs";
        $batWinEsc = str_replace('"', '""', $batWin);
        $wshContent = "Set oShell = CreateObject(\"WScript.Shell\")\r\n";
        $wshContent .= "oShell.Run \"cmd /c \"\"\" & \"{$batWinEsc}\" & \"\"\"\", 0, False\r\n";
        file_put_contents($wshScript, $wshContent);

        $vbsWin = str_replace('/', '\\', $wshScript);
        // Launch the VBS via wscript — detached from PHP process.
        // Use shell_exec with output redirected to NUL to avoid inheriting handles.
        @shell_exec("start \"\" /B wscript //nologo \"{$vbsWin}\" > NUL 2>&1");
    } else {
        // Unix: nohup + &
        $bgCmd = "({$cmd}) > " . escapeshellarg($logFile) . " 2>&1; rm -f " . escapeshellarg($lockFile) . " &";
        shell_exec($bgCmd);
    }

    return ['success' => true, 'status' => 'running', 'message' => 'Opération lancée en arrière-plan...'];
}

/**
 * Check the status of an async task.
 */
function checkAsyncStatus(string $step, callable $successCheck): array {
    $lockFile = getAsyncFile($step, 'lock');
    $logFile = getAsyncFile($step, 'log');

    // Still running
    if (file_exists($lockFile)) {
        // Check if the lock file is stale (older than 10 minutes)
        $lockAge = time() - filemtime($lockFile);
        if ($lockAge > 600) {
            @unlink($lockFile);
            $output = file_exists($logFile) ? substr(file_get_contents($logFile), -500) : '';
            return ['success' => false, 'message' => "Timeout (>10min). Vérifiez votre terminal.\n" . $output];
        }
        return ['success' => true, 'status' => 'running', 'message' => 'En cours d\'exécution...'];
    }

    // Finished — check if it succeeded
    if ($successCheck()) {
        @unlink($logFile);
        return ['success' => true, 'status' => 'done', 'message' => 'Installation terminée.'];
    }

    // Failed
    $output = file_exists($logFile) ? substr(file_get_contents($logFile), -500) : 'Aucune sortie disponible.';
    @unlink($logFile);
    return ['success' => false, 'message' => "Échec.\n" . $output];
}

// ─── Handle AJAX step execution ───
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // Extend timeout for long operations (composer install, npm install, build)
    set_time_limit(600);
    ini_set('max_execution_time', '600');

    header('Content-Type: application/json');

    $action = $_POST['action'];
    $result = ['success' => false, 'message' => 'Action inconnue'];

    try {
        switch ($action) {
            case 'check':
                $result = checkRequirements();
                break;
            case 'composer':
                $result = runComposer();
                break;
            case 'env':
                $result = setupEnv();
                break;
            case 'key':
                $result = generateKey();
                break;
            case 'npm':
                $result = runNpm();
                break;
            case 'build':
                $result = runBuild();
                break;
            case 'directories':
                $result = createDirectories();
                break;
            case 'permissions':
                $result = fixPermissions();
                break;
            case 'selfremove':
                // Rename setup.php so it stops intercepting requests
                $self = __FILE__;
                $renamed = dirname($self) . '/setup.php.done';
                $ok = @rename($self, $renamed);
                $result = ['success' => $ok, 'message' => $ok ? 'setup.php desactive.' : 'Impossible de renommer setup.php'];
                break;
            case 'status':
                // Poll async task status
                $step = $_POST['step'] ?? '';
                $checks = [
                    'composer' => fn() => file_exists(VENDOR_PATH . '/autoload.php'),
                    'npm' => fn() => is_dir(BASE_PATH . '/node_modules'),
                    'build' => fn() => file_exists(BASE_PATH . '/public/build/.vite/manifest.json') || file_exists(BASE_PATH . '/public/build/manifest.json'),
                ];
                if (isset($checks[$step])) {
                    $result = checkAsyncStatus($step, $checks[$step]);
                } else {
                    $result = ['success' => false, 'message' => "Étape inconnue: {$step}"];
                }
                break;
        }
    } catch (Throwable $e) {
        $result = ['success' => false, 'message' => $e->getMessage()];
    }

    echo json_encode($result);
    exit;
}

// ─── Requirement checks ───
function checkRequirements(): array {
    $checks = [];
    $allPassed = true;

    // PHP version
    $phpOk = version_compare(PHP_VERSION, '8.2.0', '>=');
    $checks[] = ['name' => 'PHP 8.2+', 'value' => PHP_VERSION, 'ok' => $phpOk, 'required' => true];
    if (!$phpOk) $allPassed = false;

    // Extensions
    $requiredExts = ['pdo', 'pdo_mysql', 'openssl', 'mbstring', 'tokenizer', 'xml', 'ctype', 'json', 'bcmath', 'fileinfo', 'curl'];
    foreach ($requiredExts as $ext) {
        $loaded = extension_loaded($ext);
        $checks[] = ['name' => "ext-{$ext}", 'value' => $loaded ? 'OK' : 'Manquant', 'ok' => $loaded, 'required' => true];
        if (!$loaded) $allPassed = false;
    }

    // GD or Imagick
    $hasGd = extension_loaded('gd');
    $hasImagick = extension_loaded('imagick');
    $checks[] = ['name' => 'GD ou Imagick', 'value' => $hasGd ? 'GD' : ($hasImagick ? 'Imagick' : 'Manquant'), 'ok' => $hasGd || $hasImagick, 'required' => true];
    if (!$hasGd && !$hasImagick) $allPassed = false;

    // Composer — not a hard requirement for the check step
    // It will be verified and used in the 'composer' step
    $composerPath = findComposer();
    $vendorExists = is_dir(VENDOR_PATH) && file_exists(VENDOR_PATH . '/autoload.php');
    $composerOk = (bool) $composerPath || $vendorExists;
    $composerValue = $vendorExists ? 'vendor/ présent' : ($composerPath ?: 'Non trouvé (sera cherché à l\'étape suivante)');
    $checks[] = ['name' => 'Composer', 'value' => $composerValue, 'ok' => $composerOk, 'required' => false];

    // Node.js & npm — not a hard requirement for the check step
    // They will be verified and used in the 'npm' and 'build' steps
    $nullRedirect = DIRECTORY_SEPARATOR === '\\' ? '2>NUL' : '2>/dev/null';
    $nodeModulesExist = is_dir(BASE_PATH . '/node_modules');
    $buildExists = file_exists(BASE_PATH . '/public/build/.vite/manifest.json') || file_exists(BASE_PATH . '/public/build/manifest.json');

    if (canExecShell()) {
        $nodeBin = findBinary('node');
        $nodeVersion = '';
        if ($nodeBin) {
            $nodeVersion = trim(@shell_exec(escapeshellarg($nodeBin) . " --version {$nullRedirect}") ?? '');
        }
        if (empty($nodeVersion)) {
            $nodeVersion = trim(@shell_exec("node --version {$nullRedirect}") ?? '');
        }
        $nodeOk = !empty($nodeVersion) || $nodeModulesExist || $buildExists;
        $nodeValue = $nodeVersion ?: ($nodeModulesExist ? 'node_modules présent' : 'Non trouvé');
        $checks[] = ['name' => 'Node.js 20+', 'value' => $nodeValue, 'ok' => $nodeOk, 'required' => false];

        $npmBin = findBinary('npm');
        $npmVersion = '';
        if ($npmBin) {
            if (DIRECTORY_SEPARATOR === '\\') {
                $npmVersion = trim(@shell_exec("cmd /c " . escapeshellarg($npmBin) . " --version {$nullRedirect}") ?? '');
            } else {
                $npmVersion = trim(@shell_exec(escapeshellarg($npmBin) . " --version {$nullRedirect}") ?? '');
            }
        }
        if (empty($npmVersion)) {
            $npmVersion = trim(@shell_exec("npm --version {$nullRedirect}") ?? '');
        }
        $npmOk = !empty($npmVersion) || $nodeModulesExist || $buildExists;
        $npmValue = $npmVersion ? "v{$npmVersion}" : ($nodeModulesExist ? 'node_modules présent' : 'Non trouvé');
        $checks[] = ['name' => 'npm', 'value' => $npmValue, 'ok' => $npmOk, 'required' => false];
    } else {
        $checks[] = ['name' => 'Node.js / npm', 'value' => $nodeModulesExist ? 'node_modules présent' : ($buildExists ? 'Build présent' : 'shell_exec désactivé'), 'ok' => $nodeModulesExist || $buildExists, 'required' => false];
    }

    // Writable directories
    $writables = ['storage', 'bootstrap/cache', 'content'];
    foreach ($writables as $dir) {
        $path = BASE_PATH . '/' . $dir;
        $writable = is_dir($path) ? is_writable($path) : is_writable(dirname($path));
        $checks[] = ['name' => "{$dir}/ (écriture)", 'value' => $writable ? 'OK' : 'Non accessible', 'ok' => $writable, 'required' => true];
        if (!$writable) $allPassed = false;
    }

    return ['success' => $allPassed, 'checks' => $checks, 'message' => $allPassed ? 'Tous les prérequis sont satisfaits.' : 'Certains prérequis ne sont pas satisfaits.'];
}

function findComposer(): ?string {
    if (is_dir(VENDOR_PATH) && file_exists(VENDOR_PATH . '/autoload.php')) {
        return 'already-installed';
    }

    if (!canExecShell()) {
        return null;
    }

    // Check if composer.phar exists in project root
    if (file_exists(BASE_PATH . '/composer.phar')) {
        return 'phar';
    }

    // Try to find a composer.phar next to a composer.bat/.cmd (Laragon, etc.)
    $composerBin = findBinary('composer');
    if ($composerBin) {
        // If it's a .bat/.cmd, look for the .phar in the same directory
        if (DIRECTORY_SEPARATOR === '\\' && preg_match('/\.(bat|cmd)$/i', $composerBin)) {
            $pharPath = dirname($composerBin) . '\\composer.phar';
            if (file_exists($pharPath)) {
                return $pharPath; // Return the .phar directly — more reliable under web server
            }
        }
        return $composerBin;
    }

    return null;
}

/**
 * Build a PATH prefix for shell commands, including all extra paths for binaries.
 * This is critical for web server PHP (php-cgi) which has a minimal PATH.
 */
function buildPathPrefix(): string {
    $paths = getExtraPaths();
    if (empty($paths)) return '';

    if (DIRECTORY_SEPARATOR === '\\') {
        $pathStr = implode(';', $paths);
        return "set \"PATH={$pathStr};%PATH%\" && ";
    }

    $pathStr = implode(':', $paths);
    return "PATH=\"{$pathStr}:\$PATH\" ";
}

/**
 * Build the shell command to run composer with the given arguments.
 * If $noRedirect is true, omit the trailing 2>&1 (used when the caller handles redirection).
 */
function getComposerCommand(string $composerPath, string $args, bool $noRedirect = false): string {
    $basePath = escapeshellarg(BASE_PATH);
    $suffix = $noRedirect ? '' : ' 2>&1';
    $pathPrefix = buildPathPrefix();

    // Resolve PHP binary — prefer php.exe over php-cgi.exe for CLI commands
    $phpBin = PHP_BINARY;
    if (DIRECTORY_SEPARATOR === '\\') {
        // If running under php-cgi, find the corresponding php.exe
        $phpDir = dirname($phpBin);
        $phpExe = $phpDir . '\\php.exe';
        if (str_contains(strtolower($phpBin), 'php-cgi') && file_exists($phpExe)) {
            $phpBin = $phpExe;
        }
    }
    $phpBinEsc = escapeshellarg($phpBin);

    // If the composer path is a .phar file, use PHP to execute it directly
    if ($composerPath === 'phar') {
        $pharPath = escapeshellarg(BASE_PATH . '/composer.phar');
        return "cd {$basePath} && {$pathPrefix}{$phpBinEsc} {$pharPath} {$args}{$suffix}";
    }

    if (preg_match('/\.phar$/i', $composerPath)) {
        $pharPath = escapeshellarg($composerPath);
        return "cd {$basePath} && {$pathPrefix}{$phpBinEsc} {$pharPath} {$args}{$suffix}";
    }

    if (DIRECTORY_SEPARATOR === '\\' && preg_match('/\.(bat|cmd)$/i', $composerPath)) {
        // Windows .bat/.cmd files need cmd /c — but also need PATH enrichment
        return "cd {$basePath} && {$pathPrefix}cmd /c " . escapeshellarg($composerPath) . " {$args}{$suffix}";
    }

    return "cd {$basePath} && {$pathPrefix}" . escapeshellarg($composerPath) . " {$args}{$suffix}";
}

function runComposer(): array {
    if (is_dir(VENDOR_PATH) && file_exists(VENDOR_PATH . '/autoload.php')) {
        return ['success' => true, 'status' => 'done', 'message' => 'Les dépendances Composer sont déjà installées.'];
    }

    $manualCmd = "cd " . BASE_PATH . "\ncomposer install --no-dev --optimize-autoloader";

    if (!canExecShell()) {
        return ['success' => false, 'message' => "shell_exec est désactivé.\nExécutez en terminal/SSH :\n{$manualCmd}\nPuis rafraîchissez cette page."];
    }

    $composer = findComposer();
    if (!$composer || $composer === 'already-installed') {
        if ($composer === 'already-installed') {
            return ['success' => true, 'status' => 'done', 'message' => 'Les dépendances Composer sont déjà installées.'];
        }
        return ['success' => false, 'message' => "Composer non trouvé.\nExécutez dans votre terminal :\n{$manualCmd}\nPuis rafraîchissez cette page."];
    }

    // Launch async — composer install can take several minutes
    $cmd = getComposerCommand($composer, 'install --no-dev --optimize-autoloader --no-interaction', true);
    $successCheck = fn() => file_exists(VENDOR_PATH . '/autoload.php');
    $result = launchAsync('composer', $cmd, $successCheck);

    if (!$result['success'] && ($result['status'] ?? '') !== 'running') {
        $hint = DIRECTORY_SEPARATOR === '\\' ? 'Ouvrez le Terminal Laragon (ou CMD/PowerShell)' : 'Connectez-vous en SSH';
        $result['message'] .= "\n\n{$hint} et exécutez :\n{$manualCmd}\nPuis cliquez sur Réessayer.";
    }

    return $result;
}

function setupEnv(): array {
    if (file_exists(ENV_FILE)) {
        $content = file_get_contents(ENV_FILE);
        if (str_contains($content, 'APP_KEY=')) {
            return ['success' => true, 'message' => 'Le fichier .env existe déjà.'];
        }
    }

    if (!file_exists(ENV_EXAMPLE)) {
        return ['success' => false, 'message' => 'Le fichier .env.example est introuvable.'];
    }

    if (!copy(ENV_EXAMPLE, ENV_FILE)) {
        return ['success' => false, 'message' => 'Impossible de copier .env.example vers .env'];
    }

    $env = file_get_contents(ENV_FILE);
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
    $appUrl = "{$scheme}://{$host}";
    $env = preg_replace('/^APP_URL=.*$/m', "APP_URL={$appUrl}", $env);
    $env = preg_replace('/^APP_ENV=.*$/m', 'APP_ENV=production', $env);
    $env = preg_replace('/^APP_DEBUG=.*$/m', 'APP_DEBUG=false', $env);
    file_put_contents(ENV_FILE, $env);

    return ['success' => true, 'message' => "Fichier .env créé (APP_URL={$appUrl})."];
}

function generateKey(): array {
    if (file_exists(ENV_FILE)) {
        $env = file_get_contents(ENV_FILE);
        if (preg_match('/^APP_KEY=base64:.{30,}/m', $env)) {
            return ['success' => true, 'message' => 'APP_KEY déjà générée.'];
        }
    }

    if (!file_exists(ENV_FILE)) {
        return ['success' => false, 'message' => 'Fichier .env introuvable.'];
    }

    // Generate APP_KEY natively in PHP — more reliable than exec (php-fpm/php-cgi can't run artisan)
    $key = 'base64:' . base64_encode(random_bytes(32));
    $env = file_get_contents(ENV_FILE);
    if (str_contains($env, 'APP_KEY=')) {
        $env = preg_replace('/^APP_KEY=.*$/m', "APP_KEY={$key}", $env);
    } else {
        $env .= "\nAPP_KEY={$key}\n";
    }
    file_put_contents(ENV_FILE, $env);

    // Verify
    $env = file_get_contents(ENV_FILE);
    if (!preg_match('/^APP_KEY=base64:.{30,}/m', $env)) {
        return ['success' => false, 'message' => 'Échec de l\'écriture de APP_KEY dans .env.'];
    }

    return ['success' => true, 'message' => 'Clé APP_KEY générée.'];
}

/**
 * Build a shell command for npm (handles .cmd on Windows).
 * If $noRedirect is true, omit the trailing 2>&1 (used when the caller handles redirection).
 */
function getNpmCommand(string $args, bool $noRedirect = false): string {
    $basePath = escapeshellarg(BASE_PATH);
    $npmBin = findBinary('npm');
    $suffix = $noRedirect ? '' : ' 2>&1';
    $pathPrefix = buildPathPrefix();

    if (DIRECTORY_SEPARATOR === '\\') {
        // On Windows, npm is a .cmd file — must use cmd /c
        if ($npmBin) {
            return "cd {$basePath} && {$pathPrefix}cmd /c " . escapeshellarg($npmBin) . " {$args}{$suffix}";
        }
        return "cd {$basePath} && {$pathPrefix}cmd /c npm {$args}{$suffix}";
    }

    if ($npmBin) {
        return "cd {$basePath} && {$pathPrefix}" . escapeshellarg($npmBin) . " {$args}{$suffix}";
    }
    return "cd {$basePath} && {$pathPrefix}npm {$args}{$suffix}";
}

function runNpm(): array {
    if (is_dir(BASE_PATH . '/node_modules') && file_exists(BASE_PATH . '/node_modules/.package-lock.json')) {
        return ['success' => true, 'status' => 'done', 'message' => 'Les dépendances npm sont déjà installées.'];
    }

    $manualCmd = "cd " . BASE_PATH . "\nnpm install";

    if (!canExecShell()) {
        return ['success' => false, 'message' => "shell_exec est désactivé.\nExécutez en terminal/SSH :\n{$manualCmd}\nPuis rafraîchissez cette page."];
    }

    // Launch async — npm install can take several minutes
    $cmd = getNpmCommand('install', true);
    $successCheck = fn() => is_dir(BASE_PATH . '/node_modules');
    $result = launchAsync('npm', $cmd, $successCheck);

    if (!$result['success'] && ($result['status'] ?? '') !== 'running') {
        $hint = DIRECTORY_SEPARATOR === '\\' ? 'Ouvrez le Terminal Laragon (ou CMD/PowerShell)' : 'Connectez-vous en SSH';
        $result['message'] .= "\n\n{$hint} et exécutez :\n{$manualCmd}\nPuis cliquez sur Réessayer.";
    }

    return $result;
}

function runBuild(): array {
    $manifestPath = BASE_PATH . '/public/build/.vite/manifest.json';
    $altManifestPath = BASE_PATH . '/public/build/manifest.json';
    if (file_exists($manifestPath) || file_exists($altManifestPath)) {
        return ['success' => true, 'status' => 'done', 'message' => 'Le build frontend existe déjà.'];
    }

    $manualCmd = "cd " . BASE_PATH . "\nnpm run build";

    if (!canExecShell()) {
        return ['success' => false, 'message' => "shell_exec est désactivé.\nExécutez en terminal/SSH :\n{$manualCmd}\nPuis rafraîchissez cette page."];
    }

    // Launch async — build can take a while
    $cmd = getNpmCommand('run build', true);
    $successCheck = fn() => file_exists($manifestPath) || file_exists($altManifestPath);
    $result = launchAsync('build', $cmd, $successCheck);

    if (!$result['success'] && ($result['status'] ?? '') !== 'running') {
        $hint = DIRECTORY_SEPARATOR === '\\' ? 'Ouvrez le Terminal Laragon (ou CMD/PowerShell)' : 'Connectez-vous en SSH';
        $result['message'] .= "\n\n{$hint} et exécutez :\n{$manualCmd}\nPuis cliquez sur Réessayer.";
    }

    return $result;
}

function createDirectories(): array {
    $dirs = [
        BASE_PATH . '/storage/framework/sessions',
        BASE_PATH . '/storage/framework/views',
        BASE_PATH . '/storage/framework/cache/data',
        BASE_PATH . '/storage/logs',
        BASE_PATH . '/storage/app/public/media',
        BASE_PATH . '/bootstrap/cache',
        BASE_PATH . '/content/themes',
        BASE_PATH . '/content/plugins',
    ];

    $created = 0;
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true)) {
                return ['success' => false, 'message' => "Impossible de créer : {$dir}"];
            }
            $created++;
        }
    }

    $gitignore = BASE_PATH . '/storage/framework/sessions/.gitignore';
    if (!file_exists($gitignore)) {
        file_put_contents($gitignore, "*\n!.gitignore\n");
    }

    return ['success' => true, 'message' => $created > 0 ? "{$created} dossiers créés." : 'Tous les dossiers existent déjà.'];
}

function fixPermissions(): array {
    if (DIRECTORY_SEPARATOR === '\\') {
        return ['success' => true, 'message' => 'Windows détecté — permissions ignorées.'];
    }

    $paths = [
        BASE_PATH . '/storage' => '775',
        BASE_PATH . '/bootstrap/cache' => '775',
        BASE_PATH . '/content' => '775',
    ];

    if (canExecShell()) {
        foreach ($paths as $path => $perms) {
            if (is_dir($path)) {
                shell_exec("chmod -R {$perms} " . escapeshellarg($path) . " 2>/dev/null");
            }
        }
    }

    if (file_exists(ENV_FILE)) {
        chmod(ENV_FILE, 0664);
    }

    // Mark setup as completed so setup.php redirects to /install on next visit
    @file_put_contents(BASE_PATH . '/storage/.setup_done', date('Y-m-d H:i:s'));

    return ['success' => true, 'message' => 'Permissions configurées.'];
}

// ─── Check if everything is already ready → redirect to /install ───
$vendorReady = file_exists(VENDOR_PATH . '/autoload.php');
$envReady = file_exists(ENV_FILE);
$buildReady = file_exists(BASE_PATH . '/public/build/.vite/manifest.json') || file_exists(BASE_PATH . '/public/build/manifest.json');

if ($vendorReady && $envReady && $buildReady && !file_exists(INSTALLED_FILE)) {
    // Rename setup.php so it no longer intercepts requests
    $self = __FILE__;
    $renamed = dirname($self) . '/setup.php.done';
    @rename($self, $renamed);
    header('Location: /install');
    exit;
}

// ─── HTML Interface ───
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ArtisanCMS - On construit votre site !</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
            --card-bg: rgba(255, 255, 255, 0.9);
            --card-border: rgba(99, 102, 241, 0.15);
            --card-shadow: 0 0 80px rgba(99, 102, 241, 0.08);
            --text: #1e293b;
            --text-muted: #64748b;
            --text-subtle: #94a3b8;
            --step-pending-label: #94a3b8;
            --step-running-label: #6366f1;
            --step-running-quip: #6366f1;
            --step-running-bg: rgba(99, 102, 241, 0.08);
            --step-done-label: #16a34a;
            --step-done-quip: #16a34a;
            --step-done-bg: rgba(34, 197, 94, 0.08);
            --step-done-badge-bg: rgba(34, 197, 94, 0.15);
            --step-done-badge: #16a34a;
            --step-error-label: #dc2626;
            --step-error-bg: rgba(239, 68, 68, 0.08);
            --step-error-badge-bg: rgba(239, 68, 68, 0.15);
            --step-error-badge: #dc2626;
            --progress-bg: rgba(148, 163, 184, 0.2);
            --error-bg: rgba(239, 68, 68, 0.08);
            --error-border: rgba(239, 68, 68, 0.2);
            --error-text: #dc2626;
            --error-pre-bg: rgba(0,0,0,0.04);
            --error-pre-text: #64748b;
            --success-bg: rgba(34, 197, 94, 0.08);
            --success-border: rgba(34, 197, 94, 0.2);
            --success-msg: #16a34a;
            --success-sub: #22c55e;
            --footer: #94a3b8;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                --card-bg: rgba(30, 41, 59, 0.8);
                --card-border: rgba(99, 102, 241, 0.2);
                --card-shadow: 0 0 80px rgba(99, 102, 241, 0.1);
                --text: #e2e8f0;
                --text-muted: #94a3b8;
                --text-subtle: #64748b;
                --step-pending-label: #475569;
                --step-running-label: #a5b4fc;
                --step-running-quip: #818cf8;
                --step-running-bg: rgba(99, 102, 241, 0.1);
                --step-done-label: #86efac;
                --step-done-quip: #4ade80;
                --step-done-bg: rgba(34, 197, 94, 0.1);
                --step-done-badge-bg: rgba(34, 197, 94, 0.2);
                --step-done-badge: #4ade80;
                --step-error-label: #fca5a5;
                --step-error-bg: rgba(239, 68, 68, 0.1);
                --step-error-badge-bg: rgba(239, 68, 68, 0.2);
                --step-error-badge: #f87171;
                --progress-bg: rgba(71, 85, 105, 0.5);
                --error-bg: rgba(239, 68, 68, 0.1);
                --error-border: rgba(239, 68, 68, 0.3);
                --error-text: #fca5a5;
                --error-pre-bg: rgba(0,0,0,0.3);
                --error-pre-text: #94a3b8;
                --success-bg: rgba(34, 197, 94, 0.1);
                --success-border: rgba(34, 197, 94, 0.3);
                --success-msg: #86efac;
                --success-sub: #4ade80;
                --footer: #475569;
            }
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            max-width: 560px;
            width: 100%;
            overflow: hidden;
            box-shadow: var(--card-shadow);
        }

        .card-header {
            text-align: center;
            padding: 2.5rem 2rem 1.5rem;
        }

        .mascot {
            font-size: 4rem;
            margin-bottom: 0.5rem;
            display: inline-block;
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .card-header h1 {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.25rem;
        }

        .card-header p {
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        #subtitle { transition: opacity 0.3s; }

        .card-body { padding: 0 2rem 2rem; }

        .steps { list-style: none; margin-bottom: 1.5rem; }

        .step {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 6px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .step::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 12px;
            opacity: 0;
            transition: opacity 0.4s;
        }

        .step.running::before {
            background: var(--step-running-bg);
            opacity: 1;
        }

        .step.done::before {
            background: var(--step-done-bg);
            opacity: 1;
        }

        .step.error::before {
            background: var(--step-error-bg);
            opacity: 1;
        }

        .step-emoji {
            font-size: 1.4rem;
            width: 36px;
            text-align: center;
            position: relative;
            z-index: 1;
            transition: transform 0.3s;
        }

        .step.running .step-emoji { animation: wiggle 0.6s infinite; }
        .step.done .step-emoji { transform: scale(1.1); }

        @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-8deg); }
            75% { transform: rotate(8deg); }
        }

        .step-text { flex: 1; position: relative; z-index: 1; }

        .step-label {
            font-weight: 600;
            font-size: 0.88rem;
            transition: color 0.3s;
        }

        .step.pending .step-label { color: var(--step-pending-label); }
        .step.running .step-label { color: var(--step-running-label); }
        .step.done .step-label { color: var(--step-done-label); }
        .step.error .step-label { color: var(--step-error-label); }

        .step-quip {
            font-size: 0.75rem;
            color: var(--text-subtle);
            margin-top: 1px;
            font-style: italic;
        }

        .step.running .step-quip { color: var(--step-running-quip); }
        .step.done .step-quip { color: var(--step-done-quip); }

        .step-badge {
            position: relative;
            z-index: 1;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
        }

        .step.pending .step-badge { color: var(--step-pending-label); }
        .step.running .step-badge { color: var(--step-running-label); }
        .step.done .step-badge { background: var(--step-done-badge-bg); color: var(--step-done-badge); }
        .step.error .step-badge { background: var(--step-error-badge-bg); color: var(--step-error-badge); }

        .progress-wrap { margin-bottom: 1.5rem; }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--progress-bg);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #a78bfa, #c084fc);
            border-radius: 3px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            width: 0%;
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .progress-msg {
            text-align: center;
            font-size: 0.82rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            padding: 14px 28px;
            border: none;
            border-radius: 14px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
            color: #fff;
        }

        .btn-primary {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 30px rgba(99, 102, 241, 0.5); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-success {
            background: linear-gradient(135deg, #22c55e, #10b981);
            box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
        }

        .btn-success:hover { transform: translateY(-2px); box-shadow: 0 6px 30px rgba(34, 197, 94, 0.5); }

        .error-box {
            background: var(--error-bg);
            border: 1px solid var(--error-border);
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 1rem;
            font-size: 0.85rem;
            color: var(--error-text);
        }

        .error-box pre {
            margin-top: 8px;
            background: var(--error-pre-bg);
            padding: 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            overflow-x: auto;
            white-space: pre-wrap;
            max-height: 120px;
            overflow-y: auto;
            color: var(--error-pre-text);
        }

        .success-box {
            background: var(--success-bg);
            border: 1px solid var(--success-border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 1rem;
            text-align: center;
        }

        .success-box .big { font-size: 3rem; display: block; margin-bottom: 8px; }
        .success-box .msg { font-size: 1.05rem; font-weight: 700; color: var(--success-msg); }
        .success-box .sub { font-size: 0.85rem; color: var(--success-sub); margin-top: 6px; }

        .footer {
            text-align: center;
            padding: 1rem;
            font-size: 0.7rem;
            color: var(--footer);
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-header">
            <div class="mascot" id="mascot">&#127959;</div>
            <h1>ArtisanCMS</h1>
            <p id="subtitle">Nos artisans preparent votre nouveau chez-vous !</p>
        </div>

        <div class="card-body">
            <ul class="steps" id="stepsList">
                <li class="step pending" data-step="check">
                    <div class="step-emoji">&#128269;</div>
                    <div class="step-text">
                        <div class="step-label">Inspection du terrain</div>
                        <div class="step-quip">Le geometre sort son metre...</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
                <li class="step pending" data-step="directories">
                    <div class="step-emoji">&#128451;</div>
                    <div class="step-text">
                        <div class="step-label">Rangement du chantier</div>
                        <div class="step-quip">Chaque chose a sa place !</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
                <li class="step pending" data-step="composer">
                    <div class="step-emoji">&#128666;</div>
                    <div class="step-text">
                        <div class="step-label">Livraison des materiaux</div>
                        <div class="step-quip">Le camion fait bip bip bip en reculant...</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
                <li class="step pending" data-step="env">
                    <div class="step-emoji">&#128295;</div>
                    <div class="step-text">
                        <div class="step-label">Branchement de la plomberie</div>
                        <div class="step-quip">Gauche c'est le chaud, droite le froid</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
                <li class="step pending" data-step="key">
                    <div class="step-emoji">&#128272;</div>
                    <div class="step-text">
                        <div class="step-label">Fabrication des cles</div>
                        <div class="step-quip">Un double pour la belle-mere ? Non.</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
                <li class="step pending" data-step="npm">
                    <div class="step-emoji">&#127912;</div>
                    <div class="step-text">
                        <div class="step-label">Commande de la peinture</div>
                        <div class="step-quip">37 nuances de blanc au choix</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
                <li class="step pending" data-step="build">
                    <div class="step-emoji">&#128296;</div>
                    <div class="step-text">
                        <div class="step-label">Montage des murs</div>
                        <div class="step-quip">Attention, peinture fraiche !</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
                <li class="step pending" data-step="permissions">
                    <div class="step-emoji">&#129529;</div>
                    <div class="step-text">
                        <div class="step-label">Coup de balai final</div>
                        <div class="step-quip">On enleve les derniers cartons</div>
                    </div>
                    <span class="step-badge"></span>
                </li>
            </ul>

            <div class="progress-wrap">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-msg" id="progressMsg">Pret a construire ?</div>
            </div>

            <div id="errorBox" class="error-box" style="display:none;"></div>
            <div id="successBox" class="success-box" style="display:none;"></div>

            <button class="btn btn-primary" id="startBtn" onclick="startSetup()">
                &#128679; Lancer la construction !
            </button>
            <button class="btn btn-success" id="continueBtn" style="display:none;" onclick="goToInstall()">
                &#127968; Emmenager dans mon site &rarr;
            </button>
        </div>

        <div class="footer">&copy; <?= date('Y') ?> ArtisanCMS &mdash; Construit avec amour</div>
    </div>

    <script>
        const steps = ['check', 'directories', 'composer', 'env', 'key', 'npm', 'build', 'permissions'];

        const runningQuips = {
            check: 'Le geometre mesure, verifie, remesure...',
            directories: 'On scotche des etiquettes partout...',
            composer: 'Le camion decharge les briques et le ciment...',
            env: 'Le plombier cherche sa cle de 12...',
            key: 'Top secret, meme le serrurier ne sait pas...',
            npm: 'Le decorateur hesite entre 37 nuances...',
            build: 'Toc toc toc... les ouvriers sont au boulot !',
            permissions: 'Aspirateur, serpilliere, et voila !'
        };

        const doneQuips = {
            check: 'Terrain constructible, feu vert !',
            directories: 'Marie Kondo serait fiere',
            composer: 'Tout est decharge, rien de casse !',
            env: 'Zero fuite, bravo le plombier !',
            key: 'Coffre-fort ultra-securise',
            npm: 'Les pots de peinture sont la !',
            build: 'Solide comme un roc',
            permissions: 'Nickel chrome !'
        };

        const progressMsgs = [
            'On creuse les fondations...',
            'Les murs commencent a monter...',
            'On apercoit la forme de la maison !',
            'Le toit est presque pose...',
            'On installe la cuisine...',
            'Les rideaux sont accroches...',
            'On plante les fleurs dehors...',
            'Le facteur trouve la boite aux lettres !',
            'Les cles sont sur la porte !'
        ];

        const mascots = ['\u{1F3D7}', '\u{1F3D7}', '\u{1F69A}', '\u{1F527}', '\u{1F510}', '\u{1F3A8}', '\u{1F528}', '\u{1F9F9}', '\u{1F3E0}'];

        function setStepStatus(stepName, status) {
            const el = document.querySelector('[data-step="' + stepName + '"]');
            if (!el) return;
            el.className = 'step ' + status;
            const badge = el.querySelector('.step-badge');
            const quip = el.querySelector('.step-quip');

            if (status === 'running') {
                badge.textContent = '...';
                quip.textContent = runningQuips[stepName] || '';
            } else if (status === 'done') {
                badge.innerHTML = '&#10003;';
                quip.textContent = doneQuips[stepName] || 'OK !';
            } else if (status === 'error') {
                badge.innerHTML = '&#10005;';
            }
        }

        function updateProgress(step, total) {
            var pct = Math.round((step / total) * 100);
            document.getElementById('progressFill').style.width = pct + '%';
            var idx = Math.min(Math.floor((step / total) * progressMsgs.length), progressMsgs.length - 1);
            document.getElementById('progressMsg').textContent = pct + '% \u2014 ' + progressMsgs[idx];
            document.getElementById('mascot').textContent = mascots[Math.min(step, mascots.length - 1)];
        }

        var asyncSteps = ['composer', 'npm', 'build'];

        function safeJsonParse(response) {
            return response.text().then(function(text) {
                if (!text || !text.trim()) return null;
                try { return JSON.parse(text); } catch (e) { return null; }
            });
        }

        function runStep(stepName) {
            var formData = new FormData();
            formData.append('action', stepName);
            return fetch('setup.php', { method: 'POST', body: formData }).then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                return safeJsonParse(response);
            }).then(function(data) {
                if (data === null) {
                    return sleep(1000).then(function() {
                        var formData2 = new FormData();
                        formData2.append('action', stepName);
                        return fetch('setup.php', { method: 'POST', body: formData2 });
                    }).then(function(retry) {
                        return safeJsonParse(retry);
                    }).then(function(retryData) {
                        if (retryData === null) throw new Error('Reponse vide du serveur. Reessayez.');
                        return retryData;
                    });
                }
                return data;
            });
        }

        function pollStatus(stepName) {
            var formData = new FormData();
            formData.append('action', 'status');
            formData.append('step', stepName);
            return fetch('setup.php', { method: 'POST', body: formData }).then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return safeJsonParse(response);
            }).then(function(data) {
                if (data === null) return { success: true, status: 'running', message: 'Patience...' };
                return data;
            });
        }

        function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

        function executeStep(stepName) {
            return runStep(stepName).then(function(result) {
                if (asyncSteps.indexOf(stepName) !== -1 && result.success && result.status === 'running') {
                    function poll() {
                        return sleep(3000).then(function() {
                            return pollStatus(stepName);
                        }).then(function(pollResult) {
                            if (pollResult.success && pollResult.status === 'running') return poll();
                            return pollResult;
                        });
                    }
                    return poll();
                }
                return result;
            });
        }

        function startSetup() {
            var startBtn = document.getElementById('startBtn');
            startBtn.disabled = true;
            startBtn.innerHTML = '&#9203; Les artisans sont au boulot...';
            document.getElementById('subtitle').textContent = 'Chut... concentration !';
            document.getElementById('errorBox').style.display = 'none';

            var chain = Promise.resolve();
            steps.forEach(function(step, i) {
                chain = chain.then(function() {
                    setStepStatus(step, 'running');
                    updateProgress(i, steps.length);
                    return executeStep(step);
                }).then(function(result) {
                    if (result.success) {
                        setStepStatus(step, 'done');
                    } else {
                        setStepStatus(step, 'error');
                        var errorHtml = '<strong>&#128167; ' + escapeHtml(result.message) + '</strong>';
                        if (result.output) errorHtml += '<pre>' + escapeHtml(result.output) + '</pre>';
                        if (step === 'check' && result.checks) {
                            var failed = result.checks.filter(function(c) { return !c.ok; });
                            if (failed.length) errorHtml += '<pre>' + failed.map(function(c) { return '\u2715 ' + c.name + ': ' + c.value; }).join('\n') + '</pre>';
                        }
                        document.getElementById('errorBox').innerHTML = errorHtml;
                        document.getElementById('errorBox').style.display = 'block';
                        startBtn.innerHTML = '&#128679; On rappelle les ouvriers !';
                        startBtn.disabled = false;
                        startBtn.onclick = function() { location.reload(); };
                        document.getElementById('subtitle').textContent = 'Petit souci sur le chantier...';
                        return Promise.reject('stop');
                    }
                });
            });

            chain.then(function() {
                updateProgress(steps.length, steps.length);
                document.getElementById('mascot').textContent = '\u{1F389}';
                document.getElementById('mascot').style.fontSize = '5rem';
                document.getElementById('subtitle').textContent = '';
                document.getElementById('successBox').innerHTML = '<span class="big">&#127968;</span><div class="msg">Bienvenue chez vous !</div><div class="sub">La maison est prete. Il ne reste plus qu\'a choisir la deco et poser vos valises.</div>';
                document.getElementById('successBox').style.display = 'block';
                document.getElementById('progressMsg').textContent = '100% \u2014 Les cles sont sur la porte !';
                startBtn.style.display = 'none';
                document.getElementById('continueBtn').style.display = 'flex';
            }).catch(function(e) {
                if (e !== 'stop') {
                    document.getElementById('errorBox').innerHTML = '<strong>&#128167; Erreur : ' + escapeHtml(e.message || String(e)) + '</strong>';
                    document.getElementById('errorBox').style.display = 'block';
                    startBtn.innerHTML = '&#128679; Reessayer';
                    startBtn.disabled = false;
                    startBtn.onclick = function() { location.reload(); };
                }
            });
        }

        function escapeHtml(str) {
            var d = document.createElement('div');
            d.textContent = str;
            return d.innerHTML;
        }

        function goToInstall() {
            var btn = document.getElementById('continueBtn');
            btn.disabled = true;
            btn.textContent = 'Ouverture de la porte...';
            // Ask setup.php to rename itself, then redirect to /install
            var formData = new FormData();
            formData.append('action', 'selfremove');
            fetch('setup.php', { method: 'POST', body: formData }).finally(function() {
                window.location.href = '/install';
            });
        }
    </script>
</body>
</html>
