import { readFileSync, existsSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const source = join(root, '.env.backend.production');
const dest = join(root, 'dist', 'api', '.env');

if (!existsSync(source)) {
  console.error('✗ Bundling backend env FAILED: .env.backend.production not found at');
  console.error('  ' + source);
  console.error('  It is gitignored, so it must be created locally first.');
  console.error('  Copy .env.example, fill in production DB/SMTP/OpenRouter values, save as .env.backend.production.');
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, readFileSync(source));
console.log('✓ Bundled backend env → dist/api/.env');

console.log('\n📦 dist/ is complete and ready to upload to htdocs/:');
const distDir = join(root, 'dist');
for (const entry of readdirSync(distDir)) {
  let isDir = false;
  try {
    isDir = statSync(join(distDir, entry)).isDirectory();
  } catch {}
  console.log('   dist/' + entry + (isDir ? '/' : ''));
}
