import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
const publish = path.join(root, '.deploy');
const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
const auth = ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential'];
const run = (...args) => execFileSync('git', [...auth, ...args], { cwd: publish, env, stdio: 'inherit' });
const read = (cwd, ...args) => execFileSync('git', [...auth, ...args], { cwd, env, encoding: 'utf8' }).trim();
const check = (...args) => spawnSync('git', [...auth, ...args], { cwd: publish, env, encoding: 'utf8' });

if (!existsSync(path.join(dist, 'index.html'))) throw new Error('Build the game before deploying.');
const origin = read(root, 'remote', 'get-url', 'origin');
if (!/^https:\/\/github\.com\/[^/]+\/[^/]+(?:\.git)?$/.test(origin)) throw new Error('Deployment requires an HTTPS GitHub origin and an authenticated GitHub CLI.');

if (!existsSync(path.join(publish, '.git'))) {
  mkdirSync(publish, { recursive: true });
  run('init', '--initial-branch=gh-pages');
  run('remote', 'add', 'origin', origin);
  const remote = check('ls-remote', '--exit-code', '--heads', 'origin', 'gh-pages');
  if (remote.status === 0) {
    run('fetch', '--depth=1', 'origin', 'gh-pages');
    run('checkout', '-B', 'gh-pages', 'FETCH_HEAD');
  } else if (remote.status !== 2) throw new Error(remote.stderr || 'Unable to check the deployment branch.');
} else {
  if (read(publish, 'remote', 'get-url', 'origin') !== origin || read(publish, 'branch', '--show-current') !== 'gh-pages') throw new Error('The generated .deploy repository does not match this project.');
  const remote = check('ls-remote', '--exit-code', '--heads', 'origin', 'gh-pages');
  if (remote.status === 0) run('pull', '--ff-only', 'origin', 'gh-pages');
  else if (remote.status !== 2) throw new Error(remote.stderr || 'Unable to check the deployment branch.');
}

// Only replace generated hashed assets; never remove either repository root.
const oldAssets = path.join(publish, 'assets');
if (existsSync(oldAssets)) rmSync(oldAssets, { recursive: true });
cpSync(dist, publish, { recursive: true });
run('add', '--all');
const changes = check('diff', '--cached', '--quiet');
if (changes.status === 1) {
  run('commit', '-m', 'Publish Vesper browser game', '-m', 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>');
} else if (changes.status !== 0) throw new Error(changes.stderr || 'Unable to inspect deployment changes.');
run('push', '--set-upstream', 'origin', 'gh-pages');
console.log('Published the static game to gh-pages. GitHub Pages may take a minute to update.');
