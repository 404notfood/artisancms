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

    return ['success' => true, 'message' => 'Permissions configurées.'];
}

// ─── Check if everything is already ready → redirect to /install ───
$vendorReady = file_exists(VENDOR_PATH . '/autoload.php');
$envReady = file_exists(ENV_FILE);
$buildReady = file_exists(BASE_PATH . '/public/build/.vite/manifest.json') || file_exists(BASE_PATH . '/public/build/manifest.json');

if ($vendorReady && $envReady && $buildReady && !file_exists(INSTALLED_FILE)) {
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
    <title>ArtisanCMS - Configuration initiale</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: #f8fafc;
            color: #1e293b;
            min-height: 100vh;
            display: flex;
        }

        /* Sidebar */
        .sidebar {
            width: 280px;
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
            color: #fff;
            display: flex;
            flex-direction: column;
            padding: 2rem 1.5rem;
        }

        @media (max-width: 768px) {
            .sidebar { display: none; }
            body { flex-direction: column; }
        }

        .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 2rem;
        }

        .sidebar-logo-icon {
            width: 40px;
            height: 40px;
            background: #6366f1;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.1rem;
        }

        .sidebar-logo-text h1 {
            font-size: 1.1rem;
            font-weight: 700;
        }

        .sidebar-logo-text h1 span { color: #818cf8; }

        .sidebar-logo-text p {
            font-size: 0.75rem;
            color: #64748b;
        }

        .sidebar-info {
            margin-top: auto;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 12px 16px;
        }

        .sidebar-info p {
            font-size: 0.75rem;
            color: #64748b;
        }

        .sidebar-desc {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .sidebar-desc h2 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: #e2e8f0;
        }

        .sidebar-desc p {
            font-size: 0.85rem;
            color: #94a3b8;
            line-height: 1.6;
        }

        /* Main content */
        .main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .container {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 8px 30px rgba(0,0,0,.04);
            border: 1px solid #e2e8f0;
            max-width: 640px;
            width: 100%;
            overflow: hidden;
        }

        .container-header {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 1.5rem 2rem;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .container-header-icon {
            width: 48px;
            height: 48px;
            background: #e0e7ff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }

        .container-header h2 {
            font-size: 1.15rem;
            font-weight: 700;
            color: #1e293b;
        }

        .container-header p {
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 2px;
        }

        .container-body {
            padding: 2rem;
        }

        /* Mobile header */
        .mobile-header {
            display: none;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 1.5rem;
            align-items: center;
            gap: 8px;
        }

        @media (max-width: 768px) {
            .mobile-header { display: flex; }
        }

        .mobile-header-icon {
            width: 32px;
            height: 32px;
            background: #6366f1;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
            color: #fff;
        }

        .mobile-header span {
            font-weight: 700;
            color: #1e293b;
        }

        .mobile-header span em {
            color: #6366f1;
            font-style: normal;
        }

        /* Steps */
        .steps {
            list-style: none;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 1.5rem;
        }

        .step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 18px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.9rem;
            transition: background 0.3s;
        }

        .step:last-child { border-bottom: none; }
        .step.running { background: #eef2ff; }
        .step.done { background: #f0fdf4; }
        .step.error { background: #fef2f2; }

        .step-icon {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            flex-shrink: 0;
            font-weight: 600;
            transition: all 0.3s;
        }

        .step.pending .step-icon { background: #f1f5f9; color: #94a3b8; }
        .step.running .step-icon { background: #6366f1; color: #fff; animation: pulse 1.5s infinite; }
        .step.done .step-icon { background: #22c55e; color: #fff; }
        .step.error .step-icon { background: #ef4444; color: #fff; }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .step-label { flex: 1; font-weight: 500; }
        .step.pending .step-label { color: #94a3b8; }
        .step.running .step-label { color: #4338ca; }
        .step.done .step-label { color: #15803d; }
        .step.error .step-label { color: #dc2626; }

        .step-detail {
            font-size: 0.78rem;
            color: #94a3b8;
        }

        /* Progress */
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #818cf8);
            border-radius: 4px;
            transition: width 0.5s ease;
            width: 0%;
        }

        .progress-text {
            text-align: right;
            font-size: 0.8rem;
            color: #6366f1;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 28px;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
            text-decoration: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: #fff;
        }

        .btn-primary:hover { background: linear-gradient(135deg, #4f46e5, #4338ca); }
        .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }

        .btn-success {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #fff;
        }

        .btn-success:hover { background: linear-gradient(135deg, #16a34a, #15803d); }

        /* Messages */
        .error-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 1rem;
            font-size: 0.85rem;
            color: #991b1b;
        }

        .error-box pre {
            margin-top: 8px;
            background: #fff;
            padding: 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            overflow-x: auto;
            white-space: pre-wrap;
            max-height: 150px;
            overflow-y: auto;
        }

        .success-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            color: #166534;
            text-align: center;
            font-weight: 500;
        }

        .actions { display: flex; gap: 10px; }
    </style>
</head>
<body>
    <!-- Mobile header -->
    <div class="mobile-header">
        <div class="mobile-header-icon">A</div>
        <span>Artisan<em>CMS</em></span>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-logo">
            <div class="sidebar-logo-icon">A</div>
            <div class="sidebar-logo-text">
                <h1>Artisan<span>CMS</span></h1>
                <p>Configuration serveur</p>
            </div>
        </div>

        <div class="sidebar-desc">
            <h2>Préparation du serveur</h2>
            <p>
                Cette étape installe les dépendances nécessaires au fonctionnement d'ArtisanCMS
                (Composer, npm, build des assets).
            </p>
            <p style="margin-top: 1rem;">
                Une fois terminé, vous serez redirigé vers l'assistant d'installation pour configurer
                votre base de données et créer votre compte administrateur.
            </p>
        </div>

        <div class="sidebar-info">
            <p>&copy; <?= date('Y') ?> ArtisanCMS</p>
        </div>
    </aside>

    <!-- Main -->
    <div class="main">
        <div class="container">
            <div class="container-header">
                <div class="container-header-icon">&#9881;</div>
                <div>
                    <h2>Configuration initiale</h2>
                    <p>Installation des dépendances et préparation de l'environnement</p>
                </div>
            </div>

            <div class="container-body">
                <ul class="steps" id="stepsList">
                    <li class="step pending" data-step="check">
                        <div class="step-icon">1</div>
                        <span class="step-label">Vérification des prérequis</span>
                        <span class="step-detail"></span>
                    </li>
                    <li class="step pending" data-step="directories">
                        <div class="step-icon">2</div>
                        <span class="step-label">Création des dossiers</span>
                        <span class="step-detail"></span>
                    </li>
                    <li class="step pending" data-step="composer">
                        <div class="step-icon">3</div>
                        <span class="step-label">Installation Composer</span>
                        <span class="step-detail"></span>
                    </li>
                    <li class="step pending" data-step="env">
                        <div class="step-icon">4</div>
                        <span class="step-label">Configuration .env</span>
                        <span class="step-detail"></span>
                    </li>
                    <li class="step pending" data-step="key">
                        <div class="step-icon">5</div>
                        <span class="step-label">Génération APP_KEY</span>
                        <span class="step-detail"></span>
                    </li>
                    <li class="step pending" data-step="npm">
                        <div class="step-icon">6</div>
                        <span class="step-label">Installation npm</span>
                        <span class="step-detail"></span>
                    </li>
                    <li class="step pending" data-step="build">
                        <div class="step-icon">7</div>
                        <span class="step-label">Build frontend (Vite)</span>
                        <span class="step-detail"></span>
                    </li>
                    <li class="step pending" data-step="permissions">
                        <div class="step-icon">8</div>
                        <span class="step-label">Permissions fichiers</span>
                        <span class="step-detail"></span>
                    </li>
                </ul>

                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">0%</div>

                <div id="errorBox" class="error-box" style="display:none;"></div>
                <div id="successBox" class="success-box" style="display:none;"></div>

                <div class="actions">
                    <button class="btn btn-primary" id="startBtn" onclick="startSetup()">
                        Lancer la configuration
                    </button>
                    <a href="/install" class="btn btn-success" id="continueBtn" style="display:none;">
                        Continuer l'installation &rarr;
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        const steps = ['check', 'directories', 'composer', 'env', 'key', 'npm', 'build', 'permissions'];
        let currentStep = 0;

        function setStepStatus(stepName, status, detail) {
            const el = document.querySelector(`[data-step="${stepName}"]`);
            if (!el) return;
            el.className = `step ${status}`;
            if (detail) {
                el.querySelector('.step-detail').textContent = detail;
            }
            const iconEl = el.querySelector('.step-icon');
            if (status === 'done') iconEl.innerHTML = '&#10003;';
            else if (status === 'error') iconEl.innerHTML = '&#10005;';
            else if (status === 'running') iconEl.innerHTML = '&#8987;';
        }

        function updateProgress(step, total) {
            const pct = Math.round((step / total) * 100);
            document.getElementById('progressFill').style.width = pct + '%';
            document.getElementById('progressText').textContent = pct + '%';
        }

        // Steps that run asynchronously (long operations)
        const asyncSteps = ['composer', 'npm', 'build'];

        async function safeJsonParse(response) {
            const text = await response.text();
            if (!text || !text.trim()) {
                return null; // Empty response — will trigger retry
            }
            try {
                return JSON.parse(text);
            } catch (e) {
                return null;
            }
        }

        async function runStep(stepName) {
            const formData = new FormData();
            formData.append('action', stepName);

            const response = await fetch('setup.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await safeJsonParse(response);
            if (data === null) {
                // Empty response — retry once after a short delay
                await sleep(1000);
                const retry = await fetch('setup.php', { method: 'POST', body: formData });
                const retryData = await safeJsonParse(retry);
                if (retryData === null) {
                    throw new Error('Le serveur a renvoyé une réponse vide. Réessayez.');
                }
                return retryData;
            }
            return data;
        }

        async function pollStatus(stepName) {
            const formData = new FormData();
            formData.append('action', 'status');
            formData.append('step', stepName);

            const response = await fetch('setup.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await safeJsonParse(response);
            if (data === null) {
                // Empty response during polling — treat as still running
                return { success: true, status: 'running', message: 'En attente de réponse...' };
            }
            return data;
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Run a step. For async steps (composer/npm/build), poll until done.
         */
        async function executeStep(stepName) {
            const result = await runStep(stepName);

            // If this is an async step and it's running, poll until done
            if (asyncSteps.includes(stepName) && result.success && result.status === 'running') {
                let pollResult = result;
                while (pollResult.success && pollResult.status === 'running') {
                    await sleep(3000); // Poll every 3 seconds
                    pollResult = await pollStatus(stepName);
                }
                return pollResult;
            }

            return result;
        }

        async function startSetup() {
            const startBtn = document.getElementById('startBtn');
            startBtn.disabled = true;
            startBtn.textContent = 'Configuration en cours...';
            document.getElementById('errorBox').style.display = 'none';

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                setStepStatus(step, 'running');
                updateProgress(i, steps.length);

                try {
                    const result = await executeStep(step);

                    if (result.success) {
                        setStepStatus(step, 'done', result.message);
                    } else {
                        setStepStatus(step, 'error', result.message);

                        let errorHtml = `<strong>${escapeHtml(result.message)}</strong>`;
                        if (result.output) {
                            errorHtml += `<pre>${escapeHtml(result.output)}</pre>`;
                        }

                        if (step === 'check' && result.checks) {
                            const failed = result.checks.filter(c => !c.ok);
                            if (failed.length > 0) {
                                errorHtml += '<pre>' + failed.map(c => `\u2715 ${c.name}: ${c.value}`).join('\n') + '</pre>';
                            }
                        }

                        document.getElementById('errorBox').innerHTML = errorHtml;
                        document.getElementById('errorBox').style.display = 'block';
                        startBtn.textContent = 'Réessayer';
                        startBtn.disabled = false;
                        startBtn.onclick = () => { location.reload(); };
                        return;
                    }
                } catch (err) {
                    setStepStatus(step, 'error', err.message);
                    document.getElementById('errorBox').innerHTML = `<strong>Erreur réseau :</strong> ${escapeHtml(err.message)}`;
                    document.getElementById('errorBox').style.display = 'block';
                    startBtn.textContent = 'Réessayer';
                    startBtn.disabled = false;
                    startBtn.onclick = () => { location.reload(); };
                    return;
                }
            }

            updateProgress(steps.length, steps.length);
            document.getElementById('successBox').textContent = '\u2713 Configuration terminée ! Le serveur est prêt.';
            document.getElementById('successBox').style.display = 'block';
            startBtn.style.display = 'none';
            document.getElementById('continueBtn').style.display = 'flex';
        }

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    </script>
</body>
</html>
