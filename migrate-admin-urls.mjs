import fs from 'fs';
import path from 'path';

function walkDir(dir, pattern, results = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath, pattern, results);
        } else if (entry.name.endsWith(pattern)) {
            results.push(fullPath);
        }
    }
    return results;
}

const files = [
    ...walkDir('resources/js/Pages/Admin', '.tsx'),
    ...walkDir('resources/js/Components/admin', '.tsx'),
];

const exclude = ['AdminLayout', 'admin-navigation', 'SidebarNavItem', 'command-palette',
    'Account\\Edit', 'Account/Edit', 'ProfileTab', 'SecurityTab', 'DangerTab', 'Settings\\Index', 'Settings/Index'];

let count = 0;
for (const f of files) {
    const normalized = f.replace(/\\/g, '/');
    if (exclude.some(ex => normalized.includes(ex.replace(/\\/g, '/')))) continue;

    let content = fs.readFileSync(f, 'utf8');

    if (!content.includes('"/admin/') && !content.includes("'/admin/")) continue;
    if (content.includes('adminPrefix') && content.includes('const prefix')) continue;

    const original = content;

    // Find default export function
    const match = content.match(/export default function \w+\([^)]*\)\s*\{/);
    if (!match) {
        console.log('SKIP: ' + f);
        continue;
    }

    const insertIdx = match.index + match[0].length;
    const prefixCode = "\n    const { cms } = usePage<SharedProps>().props;\n    const prefix = cms?.adminPrefix ?? 'admin';";
    content = content.slice(0, insertIdx) + prefixCode + content.slice(insertIdx);

    // Replace href="/admin/xxx"  ->  href={`/${prefix}/xxx`}
    content = content.replace(/href="\/admin\/([^"]+)"/g, 'href={`/${prefix}/$1`}');
    content = content.replace(/href="\/admin"/g, 'href={`/${prefix}`}');

    // Replace router.visit('/admin/xxx' -> router.visit(`/${prefix}/xxx`
    content = content.replace(/router\.visit\('\/admin\/([^']+)'/g, 'router.visit(`/${prefix}/$1`');
    content = content.replace(/router\.visit\('\/admin'/g, 'router.visit(`/${prefix}`');

    // Replace form.put/post/delete('/admin/xxx'
    content = content.replace(/form\.(put|post|delete)\('\/admin\/([^']+)'/g, 'form.$1(`/${prefix}/$2`');

    // Replace router.post/delete('/admin/xxx'
    content = content.replace(/router\.(post|delete)\('\/admin\/([^']+)'/g, 'router.$1(`/${prefix}/$2`');

    // Replace fetch('/admin/xxx'
    content = content.replace(/fetch\('\/admin\/([^']+)'/g, 'fetch(`/${prefix}/$1`');

    // Replace remaining '/admin/xxx' string literals
    content = content.replace(/'\/admin\/([^']+)'/g, '`/${prefix}/$1`');

    if (content !== original) {
        fs.writeFileSync(f, content, 'utf8');
        count++;
        console.log('UPDATED: ' + f);
    }
}
console.log('\nTotal: ' + count);
