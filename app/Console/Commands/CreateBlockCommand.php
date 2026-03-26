<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Block;
use Illuminate\Console\Command;

class CreateBlockCommand extends Command
{
    protected $signature = 'cms:block:create {slug? : The block slug (kebab-case)}';

    protected $description = 'Créer un nouveau bloc pour le page builder (renderer TSX + settings TSX + enregistrement DB)';

    public function handle(): int
    {
        $this->components->info('🧱 Création d\'un nouveau bloc page builder');
        $this->newLine();

        $slug = $this->argument('slug') ?? $this->ask('Slug du bloc (kebab-case)', 'mon-bloc');

        if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
            $this->components->error('Slug invalide. Utilisez le format kebab-case.');
            return self::FAILURE;
        }

        if (Block::where('slug', $slug)->exists()) {
            $this->components->error("Le bloc « {$slug} » existe déjà en base de données.");
            return self::FAILURE;
        }

        $name = $this->ask('Nom du bloc', ucwords(str_replace('-', ' ', $slug)));
        $category = $this->choice('Catégorie', ['content', 'layout', 'media', 'data', 'interactive', 'marketing'], 0);
        $icon = $this->ask('Icône Lucide (ex: Box, Star, Image, Layout)', 'Box');

        // ─── Props ───────────────────────────────────────
        $this->newLine();
        $this->components->info('Propriétés du bloc :');
        $this->line('  Définissez les props configurables (vide pour terminer).');

        $props = [];
        while (true) {
            $propName = $this->ask('  Nom de la propriété (camelCase)');
            if (empty($propName)) {
                break;
            }

            $propType = $this->choice('  Type', ['string', 'number', 'boolean', 'color', 'select', 'richtext', 'image'], 0);
            $propLabel = $this->ask('  Label', ucfirst($propName));
            $propDefault = $this->ask('  Valeur par défaut', '');

            $options = [];
            if ($propType === 'select') {
                $optionsStr = $this->ask('  Options (séparées par des virgules)');
                $options = array_map('trim', explode(',', $optionsStr));
            }

            $props[$propName] = [
                'type' => $propType,
                'label' => $propLabel,
                'default' => $this->castDefault($propType, $propDefault),
                'options' => $options ?: null,
            ];
        }

        // ─── Has children ────────────────────────────────
        $hasChildren = $this->confirm('Ce bloc peut contenir des blocs enfants (container) ?', false);

        // ─── Confirmation ────────────────────────────────
        $this->newLine();
        $this->components->info('Récapitulatif :');
        $this->components->twoColumnDetail('Bloc', "{$name} ({$slug})");
        $this->components->twoColumnDetail('Catégorie', $category);
        $this->components->twoColumnDetail('Icône', $icon);
        $this->components->twoColumnDetail('Propriétés', (string) count($props));
        $this->components->twoColumnDetail('Container', $hasChildren ? 'Oui' : 'Non');
        $this->newLine();

        if (!$this->confirm('Créer le bloc ?', true)) {
            return self::SUCCESS;
        }

        // ─── Generate files ──────────────────────────────
        $renderersDir = resource_path('js/Components/builder/blocks/renderers');
        $settingsDir = resource_path('js/Components/builder/blocks/settings');
        $pascal = str_replace(' ', '', ucwords(str_replace('-', ' ', $slug)));

        // Renderer TSX
        $this->generateRenderer($renderersDir, $slug, $pascal, $name, $props, $hasChildren);
        $this->components->twoColumnDetail('Renderer', "renderers/{$slug}-renderer.tsx");

        // Settings TSX
        $this->generateSettings($settingsDir, $slug, $pascal, $name, $props);
        $this->components->twoColumnDetail('Settings', "settings/{$slug}-settings.tsx");

        // Register in DB
        $schema = ['properties' => []];
        $defaults = [];
        foreach ($props as $key => $p) {
            $schemaType = match ($p['type']) {
                'number' => 'number',
                'boolean' => 'boolean',
                default => 'string',
            };
            $entry = ['type' => $schemaType, 'default' => $p['default']];
            if ($p['type'] === 'select' && !empty($p['options'])) {
                $entry['enum'] = $p['options'];
            }
            $schema['properties'][$key] = $entry;
            $defaults[$key] = $p['default'];
        }

        Block::create([
            'slug' => $slug,
            'name' => $name,
            'category' => $category,
            'icon' => strtolower($icon),
            'schema' => $schema,
            'default_props' => $defaults,
            'is_core' => false,
            'source' => 'custom',
        ]);

        $this->components->twoColumnDetail('Base de données', 'Enregistré');

        $this->newLine();
        $this->components->info("✅ Bloc « {$name} » créé !");
        $this->newLine();
        $this->components->warn("Action requise : ajoutez les imports dans core-block-defs.ts :");
        $this->line("  import {$pascal}Renderer from './renderers/{$slug}-renderer';");
        $this->line("  import {$pascal}Settings from './settings/{$slug}-settings';");
        $this->newLine();
        $this->line("Puis ajoutez dans le tableau CORE_BLOCKS :");
        $this->line("  { slug: '{$slug}', label: '{$name}', icon: '{$icon}', category: '{$category}', renderer: {$pascal}Renderer, settings: {$pascal}Settings },");

        return self::SUCCESS;
    }

    private function generateRenderer(string $dir, string $slug, string $pascal, string $name, array $props, bool $hasChildren): void
    {
        $propsLines = [];
        foreach ($props as $key => $p) {
            $tsType = match ($p['type']) {
                'number' => 'number',
                'boolean' => 'boolean',
                default => 'string',
            };
            $default = json_encode($p['default']);
            $propsLines[] = "    const {$key} = (block.props.{$key} as {$tsType}) ?? {$default};";
        }
        $propsCode = implode("\n", $propsLines);

        $childrenSlot = $hasChildren
            ? "\n            {children && <div>{children}</div>}"
            : '';

        $content = <<<TSX
import type { BlockRendererProps } from '../block-registry';

export default function {$pascal}Renderer({ block, children }: BlockRendererProps) {
{$propsCode}

    return (
        <div className="w-full">{$childrenSlot}
            {/* {$name} — à personnaliser */}
        </div>
    );
}
TSX;

        file_put_contents("{$dir}/{$slug}-renderer.tsx", $content . "\n");
    }

    private function generateSettings(string $dir, string $slug, string $pascal, string $name, array $props): void
    {
        $fields = [];
        foreach ($props as $key => $p) {
            $label = $p['label'];
            $field = match ($p['type']) {
                'boolean' => <<<TSX
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={(block.props.{$key} as boolean) ?? false}
                    onChange={(e) => onUpdate({ {$key}: e.target.checked })}
                    className="rounded"
                />
                <label className="text-sm text-gray-700">{$label}</label>
            </div>
TSX,
                'number' => <<<TSX
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{$label}</label>
                <input
                    type="number"
                    value={(block.props.{$key} as number) ?? 0}
                    onChange={(e) => onUpdate({ {$key}: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>
TSX,
                'color' => <<<TSX
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{$label}</label>
                <input
                    type="color"
                    value={(block.props.{$key} as string) ?? '#000000'}
                    onChange={(e) => onUpdate({ {$key}: e.target.value })}
                    className="w-full h-10 border rounded cursor-pointer"
                />
            </div>
TSX,
                'select' => $this->generateSelectField($key, $p),
                'richtext', 'textarea' => <<<TSX
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{$label}</label>
                <textarea
                    value={(block.props.{$key} as string) ?? ''}
                    onChange={(e) => onUpdate({ {$key}: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={4}
                />
            </div>
TSX,
                default => <<<TSX
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{$label}</label>
                <input
                    type="text"
                    value={(block.props.{$key} as string) ?? ''}
                    onChange={(e) => onUpdate({ {$key}: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>
TSX,
            };
            $fields[] = $field;
        }

        $fieldsCode = implode("\n", $fields);

        $content = <<<TSX
import type { BlockSettingsProps } from '../block-registry';

export default function {$pascal}Settings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
{$fieldsCode}
        </div>
    );
}
TSX;

        file_put_contents("{$dir}/{$slug}-settings.tsx", $content . "\n");
    }

    private function generateSelectField(string $key, array $prop): string
    {
        $label = $prop['label'];
        $options = '';
        foreach ($prop['options'] ?? [] as $opt) {
            $options .= "\n                    <option value=\"{$opt}\">{$opt}</option>";
        }

        return <<<TSX
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{$label}</label>
                <select
                    value={(block.props.{$key} as string) ?? ''}
                    onChange={(e) => onUpdate({ {$key}: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >{$options}
                </select>
            </div>
TSX;
    }

    private function castDefault(string $type, string $value): mixed
    {
        return match ($type) {
            'number' => is_numeric($value) ? (float) $value : 0,
            'boolean' => in_array(strtolower($value), ['true', '1', 'yes', 'oui'], true),
            default => $value,
        };
    }
}
