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

// ─── Already installed? Redirect to site ───
if (file_exists(INSTALLED_FILE)) {
    header('Location: /');
    exit;
}

// ─── Handle AJAX step execution ───
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
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

    // Composer
    $composerPath = findComposer();
    $checks[] = ['name' => 'Composer', 'value' => $composerPath ?: 'Non trouvé', 'ok' => (bool) $composerPath, 'required' => true];
    if (!$composerPath) $allPassed = false;

    // Node.js & npm — detect via shell or check if deps are already installed
    if (canExecShell()) {
        $nodeVersion = trim(shell_exec('node --version 2>/dev/null 2>NUL') ?? '');
        $nodeOk = !empty($nodeVersion);
        $checks[] = ['name' => 'Node.js 20+', 'value' => $nodeVersion ?: 'Non trouvé', 'ok' => $nodeOk, 'required' => true];
        if (!$nodeOk) $allPassed = false;

        $npmVersion = trim(shell_exec('npm --version 2>/dev/null 2>NUL') ?? '');
        $npmOk = !empty($npmVersion);
        $checks[] = ['name' => 'npm', 'value' => $npmVersion ? "v{$npmVersion}" : 'Non trouvé', 'ok' => $npmOk, 'required' => true];
        if (!$npmOk) $allPassed = false;
    } else {
        // shell_exec disabled — check if node_modules and build already exist
        $nodeModulesExist = is_dir(BASE_PATH . '/node_modules');
        $buildExists = file_exists(BASE_PATH . '/public/build/.vite/manifest.json') || file_exists(BASE_PATH . '/public/build/manifest.json');
        $checks[] = ['name' => 'Node.js / npm', 'value' => $nodeModulesExist ? 'node_modules présent' : 'shell_exec désactivé — lancez npm install en SSH', 'ok' => $nodeModulesExist, 'required' => true];
        if (!$nodeModulesExist) $allPassed = false;
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
    // If vendor already exists, composer is not strictly needed right now
    if (is_dir(VENDOR_PATH) && file_exists(VENDOR_PATH . '/autoload.php')) {
        return 'already-installed';
    }

    if (!canExecShell()) {
        // Can't detect composer without shell — check if vendor exists
        return null;
    }

    // Check common paths
    $paths = ['composer', 'composer.phar', '/usr/local/bin/composer', '/usr/bin/composer'];
    foreach ($paths as $path) {
        $output = shell_exec("{$path} --version 2>/dev/null 2>NUL");
        if ($output && str_contains($output, 'Composer')) {
            return $path;
        }
    }
    // Check if composer.phar exists in project root
    if (file_exists(BASE_PATH . '/composer.phar')) {
        return 'php ' . BASE_PATH . '/composer.phar';
    }
    return null;
}

function runComposer(): array {
    if (is_dir(VENDOR_PATH) && file_exists(VENDOR_PATH . '/autoload.php')) {
        return ['success' => true, 'message' => 'Les dépendances Composer sont déjà installées.'];
    }

    if (!canExecShell()) {
        return ['success' => false, 'message' => "shell_exec est désactivé sur ce serveur.\nExécutez manuellement en SSH :\ncd " . BASE_PATH . " && composer install --no-dev --optimize-autoloader"];
    }

    $composer = findComposer();
    if (!$composer) {
        return ['success' => false, 'message' => 'Composer non trouvé sur le serveur.'];
    }

    $cmd = "cd " . escapeshellarg(BASE_PATH) . " && {$composer} install --no-dev --optimize-autoloader --no-interaction 2>&1";
    $output = shell_exec($cmd);

    if (!file_exists(VENDOR_PATH . '/autoload.php')) {
        return ['success' => false, 'message' => "Composer install a échoué.\n" . ($output ?? '')];
    }

    return ['success' => true, 'message' => 'Dépendances Composer installées.', 'output' => $output];
}

function setupEnv(): array {
    if (file_exists(ENV_FILE)) {
        // Check if it has at least APP_KEY defined (even if empty)
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

    return ['success' => true, 'message' => 'Fichier .env créé depuis .env.example.'];
}

function generateKey(): array {
    if (!file_exists(VENDOR_PATH . '/autoload.php')) {
        return ['success' => false, 'message' => 'Installez Composer d\'abord.'];
    }

    // Check if key already exists and is not empty
    if (file_exists(ENV_FILE)) {
        $env = file_get_contents(ENV_FILE);
        if (preg_match('/^APP_KEY=base64:.{30,}/m', $env)) {
            return ['success' => true, 'message' => 'APP_KEY déjà générée.'];
        }
    }

    if (!canExecShell()) {
        // Generate key in pure PHP without shell_exec
        $key = 'base64:' . base64_encode(random_bytes(32));
        if (file_exists(ENV_FILE)) {
            $env = file_get_contents(ENV_FILE);
            if (str_contains($env, 'APP_KEY=')) {
                $env = preg_replace('/^APP_KEY=.*$/m', "APP_KEY={$key}", $env);
            } else {
                $env .= "\nAPP_KEY={$key}\n";
            }
            file_put_contents(ENV_FILE, $env);
            return ['success' => true, 'message' => 'Clé APP_KEY générée (PHP natif).'];
        }
        return ['success' => false, 'message' => 'Fichier .env introuvable.'];
    }

    $cmd = "cd " . escapeshellarg(BASE_PATH) . " && php artisan key:generate --force 2>&1";
    $output = shell_exec($cmd);

    // Verify key was generated
    $env = file_get_contents(ENV_FILE);
    if (!preg_match('/^APP_KEY=base64:.{30,}/m', $env)) {
        return ['success' => false, 'message' => "Génération de clé échouée.\n" . ($output ?? '')];
    }

    return ['success' => true, 'message' => 'Clé APP_KEY générée.'];
}

function runNpm(): array {
    if (is_dir(BASE_PATH . '/node_modules') && file_exists(BASE_PATH . '/node_modules/.package-lock.json')) {
        return ['success' => true, 'message' => 'Les dépendances npm sont déjà installées.'];
    }

    if (!canExecShell()) {
        return ['success' => false, 'message' => "shell_exec est désactivé sur ce serveur.\nExécutez manuellement en SSH :\ncd " . BASE_PATH . " && npm install"];
    }

    $cmd = "cd " . escapeshellarg(BASE_PATH) . " && npm install 2>&1";
    $output = shell_exec($cmd);

    if (!is_dir(BASE_PATH . '/node_modules')) {
        return ['success' => false, 'message' => "npm install a échoué.\n" . ($output ?? '')];
    }

    return ['success' => true, 'message' => 'Dépendances npm installées.', 'output' => $output];
}

function runBuild(): array {
    // Check if build already exists
    $manifestPath = BASE_PATH . '/public/build/.vite/manifest.json';
    $altManifestPath = BASE_PATH . '/public/build/manifest.json';
    if (file_exists($manifestPath) || file_exists($altManifestPath)) {
        return ['success' => true, 'message' => 'Le build frontend existe déjà.'];
    }

    if (!canExecShell()) {
        return ['success' => false, 'message' => "shell_exec est désactivé sur ce serveur.\nExécutez manuellement en SSH :\ncd " . BASE_PATH . " && npm run build"];
    }

    $cmd = "cd " . escapeshellarg(BASE_PATH) . " && npm run build 2>&1";
    $output = shell_exec($cmd);

    if (!file_exists($manifestPath) && !file_exists($altManifestPath)) {
        return ['success' => false, 'message' => "npm run build a échoué.\n" . ($output ?? '')];
    }

    return ['success' => true, 'message' => 'Build frontend terminé.', 'output' => $output];
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

    // Create .gitignore in storage dirs if missing
    $gitignore = BASE_PATH . '/storage/framework/sessions/.gitignore';
    if (!file_exists($gitignore)) {
        file_put_contents($gitignore, "*\n!.gitignore\n");
    }

    return ['success' => true, 'message' => $created > 0 ? "{$created} dossiers créés." : 'Tous les dossiers existent déjà.'];
}

function fixPermissions(): array {
    // On Linux/Unix, fix permissions. On Windows, skip.
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

    // .env must be writable
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
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .container {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,.1), 0 10px 40px rgba(0,0,0,.06);
            max-width: 640px;
            width: 100%;
            padding: 3rem;
        }

        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo h1 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1e293b;
        }

        .logo h1 span { color: #6366f1; }

        .logo p {
            color: #64748b;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }

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
            transition: background 0.2s;
        }

        .step:last-child { border-bottom: none; }
        .step.running { background: #eef2ff; }
        .step.done { background: #f0fdf4; }
        .step.error { background: #fef2f2; }

        .step-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            flex-shrink: 0;
        }

        .step.pending .step-icon { background: #e2e8f0; color: #94a3b8; }
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
            font-size: 0.8rem;
            color: #94a3b8;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 1rem;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #818cf8);
            border-radius: 3px;
            transition: width 0.5s ease;
            width: 0%;
        }

        .progress-text {
            text-align: right;
            font-size: 0.8rem;
            color: #64748b;
            margin-bottom: 1.5rem;
        }

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
        }

        .btn-primary {
            background: #6366f1;
            color: #fff;
        }

        .btn-primary:hover { background: #4f46e5; }
        .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }

        .btn-success {
            background: #22c55e;
            color: #fff;
        }

        .btn-success:hover { background: #16a34a; }

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
            font-size: 0.85rem;
            color: #166534;
            text-align: center;
        }

        .actions { display: flex; gap: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Artisan<span>CMS</span></h1>
            <p>Configuration initiale du serveur</p>
        </div>

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
            <a href="/install" class="btn btn-success" id="continueBtn" style="display:none;text-decoration:none;">
                Continuer l'installation &rarr;
            </a>
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
            if (status === 'done') iconEl.textContent = '✓';
            else if (status === 'error') iconEl.textContent = '✕';
            else if (status === 'running') iconEl.textContent = '⟳';
        }

        function updateProgress(step, total) {
            const pct = Math.round((step / total) * 100);
            document.getElementById('progressFill').style.width = pct + '%';
            document.getElementById('progressText').textContent = pct + '%';
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

            return await response.json();
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
                    const result = await runStep(step);

                    if (result.success) {
                        setStepStatus(step, 'done', result.message);
                    } else {
                        setStepStatus(step, 'error', result.message);

                        let errorHtml = `<strong>${result.message}</strong>`;
                        if (result.output) {
                            errorHtml += `<pre>${escapeHtml(result.output)}</pre>`;
                        }

                        // Special handling for check step - show details
                        if (step === 'check' && result.checks) {
                            const failed = result.checks.filter(c => !c.ok);
                            if (failed.length > 0) {
                                errorHtml += '<pre>' + failed.map(c => `✕ ${c.name}: ${c.value}`).join('\n') + '</pre>';
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
            document.getElementById('successBox').innerHTML = '✓ Configuration terminée ! Le serveur est prêt pour l\'installation d\'ArtisanCMS.';
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
