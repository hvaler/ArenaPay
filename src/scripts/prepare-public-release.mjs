import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const valueAfter = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

if (args.has('--help')) {
  console.log(`Uso:
  node src/scripts/prepare-public-release.mjs [--target RUTA] [--apply] [--no-fetch]

Sin --apply solo muestra el plan. El script nunca crea commits ni hace push.`);
  process.exit(0);
}

const source = resolve(valueAfter('--source') ?? process.cwd());
const target = resolve(valueAfter('--target') ?? resolve(source, '..', 'ArenaPay-Public-Seed'));
const apply = args.has('--apply');
const fetchRemotes = !args.has('--no-fetch');

const git = (cwd, ...gitArgs) =>
  execFileSync('git', ['-C', cwd, ...gitArgs], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const normalizeRemote = (url) => url.replace(/\\/g, '/').replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sourceRoot = resolve(git(source, 'rev-parse', '--show-toplevel'));
const targetRoot = resolve(git(target, 'rev-parse', '--show-toplevel'));

assert(
  normalizeRemote(git(sourceRoot, 'remote', 'get-url', 'origin')).endsWith('github.com/hvaler/arenapay-dev'),
  'El origen de desarrollo debe ser hvaler/ArenaPay-Dev.',
);
assert(
  normalizeRemote(git(targetRoot, 'remote', 'get-url', 'origin')).endsWith('github.com/hvaler/arenapay'),
  'El clon público debe apuntar a hvaler/ArenaPay.',
);
assert(git(sourceRoot, 'branch', '--show-current') === 'main', 'Publica únicamente desde main de ArenaPay-Dev.');
assert(git(targetRoot, 'branch', '--show-current') === 'main', 'El clon público debe estar en main.');
assert(git(sourceRoot, 'status', '--porcelain') === '', 'ArenaPay-Dev tiene cambios sin commit. Confírmalos antes de preparar la publicación.');
assert(git(targetRoot, 'status', '--porcelain') === '', 'El clon público tiene cambios pendientes. Revísalos antes de continuar.');

if (fetchRemotes) {
  execFileSync('git', ['-C', sourceRoot, 'fetch', '--quiet', 'origin', 'main'], { stdio: 'inherit' });
  assert(
    git(sourceRoot, 'rev-parse', 'HEAD') === git(sourceRoot, 'rev-parse', 'origin/main'),
    'ArenaPay-Dev no coincide con origin/main. Envía o integra los cambios privados antes de publicar.',
  );
  execFileSync('git', ['-C', targetRoot, 'fetch', '--quiet', 'origin', 'main'], { stdio: 'inherit' });
  assert(
    git(targetRoot, 'rev-parse', 'HEAD') === git(targetRoot, 'rev-parse', 'origin/main'),
    'El clon público no coincide con origin/main. Actualízalo antes de preparar otra versión.',
  );
}

const splitNull = (value) => value.split('\0').filter(Boolean);
const sourceFiles = splitNull(execFileSync('git', ['-C', sourceRoot, 'ls-files', '-z'], { encoding: 'utf8' }));
const targetFiles = splitNull(execFileSync('git', ['-C', targetRoot, 'ls-files', '-z'], { encoding: 'utf8' }));
const sourceSet = new Set(sourceFiles);
const targetSet = new Set(targetFiles);

const forbiddenName = /(^|\/)(\.env(?!\.example$)|\.dev\.vars|\.vercel|credentials[^/]*\.json|id_rsa|[^/]+\.(pem|p12|pfx|key))$/i;
const forbiddenContent = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(^|[^A-Z2-7])S[A-Z2-7]{55}([^A-Z2-7]|$)/,
];
const violations = [];

for (const relative of sourceFiles) {
  if (forbiddenName.test(relative)) violations.push(`${relative}: nombre reservado para secretos`);
  const body = await readFile(resolve(sourceRoot, relative));
  if (body.length <= 5_000_000 && !body.includes(0)) {
    const text = body.toString('utf8');
    if (forbiddenContent.some((pattern) => pattern.test(text))) {
      violations.push(`${relative}: patrón de clave privada o semilla secreta`);
    }
  }
}
assert(violations.length === 0, `Publicación bloqueada por contenido sensible:\n${violations.join('\n')}`);

const digest = async (path) => {
  const body = await readFile(path);
  const normalized = body.includes(0) ? body : Buffer.from(body.toString('utf8').replace(/\r\n/g, '\n'));
  return createHash('sha256').update(normalized).digest('hex');
};
const added = [];
const modified = [];
const deleted = targetFiles.filter((file) => !sourceSet.has(file));

for (const relative of sourceFiles) {
  if (!targetSet.has(relative)) {
    added.push(relative);
    continue;
  }
  if ((await digest(resolve(sourceRoot, relative))) !== (await digest(resolve(targetRoot, relative)))) {
    modified.push(relative);
  }
}

console.log(`Origen privado: ${sourceRoot}`);
console.log(`Clon público:   ${targetRoot}`);
console.log(`Plan: ${added.length} añadidos, ${modified.length} modificados, ${deleted.length} eliminados.`);
for (const [label, files] of [['A', added], ['M', modified], ['D', deleted]]) {
  for (const file of files) console.log(`${label} ${file}`);
}

if (!apply) {
  console.log('Vista previa terminada. Repite con --apply para preparar el clon público.');
  process.exit(0);
}

for (const relative of deleted) await rm(resolve(targetRoot, relative), { force: true });
for (const relative of [...added, ...modified]) {
  const destination = resolve(targetRoot, relative);
  assert(destination.startsWith(`${targetRoot}${sep}`), `Ruta de destino no válida: ${relative}`);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(sourceRoot, relative), destination);
}

console.log('\nClon público preparado; no se ha creado ningún commit ni se ha hecho push.');
console.log(git(targetRoot, 'status', '--short') || 'Sin diferencias.');
