import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const workerSrc = join(root, 'chat-worker', 'worker.js');
const knowledgeFile = join(root, 'chat-worker', 'knowledge.json');
const outFile = join(root, 'dist', 'chat-worker.js');

if (!existsSync(workerSrc)) {
  console.error('✗ chat-worker/worker.js not found');
  process.exit(1);
}

let knowledge = [];
if (existsSync(knowledgeFile)) {
  try {
    const parsed = JSON.parse(readFileSync(knowledgeFile, 'utf8'));
    knowledge = parsed.chunks || [];
  } catch (e) {
    console.error('✗ chat-worker/knowledge.json is invalid JSON: ' + e.message);
    process.exit(1);
  }
} else {
  console.warn('⚠ chat-worker/knowledge.json not found — bundling an EMPTY knowledge base.');
  console.warn('  Run "npm run chat:export:prod" first so the chat can answer from your portfolio.');
}

const source = readFileSync(workerSrc, 'utf8');
const marker = '"__KNOWLEDGE_JSON__"';
if (!source.includes(marker)) {
  console.error('✗ worker.js does not contain the knowledge marker ' + marker);
  process.exit(1);
}

const bundled = source.split(marker).join(JSON.stringify(knowledge));

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, bundled);
console.log(`✓ Bundled chat worker → ${outFile} (${knowledge.length} knowledge chunks)`);
console.log('  Paste this file into the Cloudflare Workers dashboard and add the');
console.log('  OPENROUTER_API_KEY secret.');
