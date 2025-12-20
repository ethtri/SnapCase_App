#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import readline from 'node:readline';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_SCOPE = 'snapcase';
const DEFAULT_ALLOWED_BRANCHES = ['main', 'task/Sprint04-Task21-summary-hotfix'];

function parseArgs(argv) {
  const args = {
    target: null,
    scope: DEFAULT_SCOPE,
    dryRun: false,
    allowBranches: [],
    yes: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--target' && argv[i + 1]) {
      args.target = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--target=')) {
      args.target = arg.split('=')[1];
      continue;
    }

    if (arg === '--scope' && argv[i + 1]) {
      args.scope = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--scope=')) {
      args.scope = arg.split('=')[1];
      continue;
    }

    if (arg === '--allow-branch' && argv[i + 1]) {
      args.allowBranches.push(argv[i + 1]);
      i += 1;
      continue;
    }

    if (arg.startsWith('--allow-branch=')) {
      args.allowBranches.push(arg.split('=')[1]);
      continue;
    }

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg === '--yes') {
      args.yes = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  if (!args.target) {
    printUsage('Missing required --target <deploy-url> argument.');
    process.exit(1);
  }

  return args;
}

function printUsage(error) {
  if (error) {
    console.error(`\n${error}\n`);
  }

  console.log(`Usage: node scripts/alias-dev.mjs --target <deploy-url> [--scope snapcase] [--dry-run] [--allow-branch <name>] [--yes]

Options:
  --target <deploy-url>   Required. The preview/prod URL to promote (e.g., https://example.vercel.app).
  --scope <team>          Vercel scope/team. Defaults to "${DEFAULT_SCOPE}".
  --dry-run               Run all checks and print commands without creating the alias.
  --allow-branch <name>   Treat the provided branch as sponsor-approved (may be passed multiple times).
  --yes                   Auto-confirm the Screen 1/2 baseline prompt.
`);
}

function runCommand(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: opts.stdio ?? 'pipe',
    encoding: 'utf-8',
    shell: opts.shell ?? process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function ensureCleanGit() {
  const status = runCommand('git', ['status', '--porcelain']);
  if (status.status !== 0) {
    throw new Error(`git status failed: ${status.stderr || status.stdout}`);
  }

  if (status.stdout.trim().length > 0) {
    throw new Error('Working tree is not clean. Please commit or stash changes before aliasing.');
  }
}

function currentBranch() {
  const branch = runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch.status !== 0) {
    throw new Error(`Unable to read current branch: ${branch.stderr || branch.stdout}`);
  }

  return branch.stdout.trim();
}

function assertAllowedBranch(branch, allowBranches) {
  const allowed = new Set([...DEFAULT_ALLOWED_BRANCHES, ...allowBranches]);
  if (!allowed.has(branch)) {
    throw new Error(
      `Branch "${branch}" is not allowed for dev alias. Use main or pass --allow-branch <sponsor-approved-branch>.`
    );
  }
}

function normalizeTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  const withoutTrailingSlash = withoutProtocol.replace(/\/+$/, '');

  if (!withoutTrailingSlash.endsWith('.vercel.app')) {
    throw new Error('Target must be a vercel.app deployment URL.');
  }

  if (withoutTrailingSlash === 'dev.snapcase.ai') {
    throw new Error('Target cannot be dev.snapcase.ai. Pass the preview/prod deployment URL instead.');
  }

  return withoutTrailingSlash;
}

function fetchCurrentDevTarget(scope) {
  const inspect = runCommand('vercel', ['inspect', 'dev.snapcase.ai', '--scope', scope]);
  if (inspect.status !== 0) {
    throw new Error(`Failed to inspect dev.snapcase.ai: ${inspect.stderr || inspect.stdout}`);
  }

  const output = `${inspect.stdout}\n${inspect.stderr}`.trim();
  const match = output.match(/url\s+https?:\/\/([^\s]+)/i);
  if (!match) {
    throw new Error(`Could not parse current dev target from inspect output:\n${output}`);
  }

  return match[1];
}

function runAndRequire(label, cmd, args) {
  console.log(`\n> ${label}`);
  const result = runCommand(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${label} failed (exit ${result.status}).`);
  }
}

async function confirmBaseline(yesFlag) {
  const reminder = [
    'Screen 1/2 visual check:',
    '- Compare design vs. the approved baseline (Task21) before promoting dev.',
    '- Confirm checkout/thank-you still match the approved build.',
  ].join('\n');

  console.log(`\n${reminder}`);

  if (yesFlag) {
    console.log('Baseline confirmation accepted via --yes.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question('Type "yes" to continue: ', resolve));
  rl.close();

  if (answer.trim().toLowerCase() !== 'yes') {
    throw new Error('Baseline check not confirmed. Aborting.');
  }
}

function updateProgressMd(target, rollbackTarget) {
  const progressPath = join(process.cwd(), 'PROGRESS.md');
  let content = readFileSync(progressPath, 'utf8');

  // Update "Last Updated" date
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  content = content.replace(
    /\*\*Last Updated\*\*: .*/,
    `**Last Updated**: ${today}`
  );

  // Update dev alias line in Current Blockers section
  const aliasLineRegex = /(- Dev alias: dev\.snapcase\.ai points to )[^\s]+( \(rollback: )[^\s]+(; verified )[^)]+(\)\.)/;
  if (aliasLineRegex.test(content)) {
    const verifiedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    content = content.replace(
      aliasLineRegex,
      `$1${target} ($2${rollbackTarget} ($3${verifiedDate})$4`
    );
  } else {
    // If pattern doesn't match, try to find and update the blockers section
    const blockersRegex = /(### Current Blockers\n\n)(- Dev alias: dev\.snapcase\.ai points to )[^\s]+( \(rollback: )[^\s]+(; verified )[^)]+(\)\.)/;
    if (blockersRegex.test(content)) {
      const verifiedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
      content = content.replace(
        blockersRegex,
        `$1$2${target} ($3${rollbackTarget} ($4${verifiedDate})$5`
      );
    } else {
      console.warn('Warning: Could not find dev alias line in PROGRESS.md to update.');
      return;
    }
  }

  writeFileSync(progressPath, content, 'utf8');
  console.log('✓ Updated PROGRESS.md with new alias state and date');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = normalizeTarget(args.target);

  console.log(`\nScope: ${args.scope}`);
  console.log(`Requested target: ${target}`);

  const currentTarget = fetchCurrentDevTarget(args.scope);
  const rollback = `vercel alias set ${currentTarget} dev.snapcase.ai --scope ${args.scope}`;

  console.log(`Current dev target: ${currentTarget}`);
  console.log(`Rollback command: ${rollback}`);

  ensureCleanGit();

  const branch = currentBranch();
  console.log(`On branch: ${branch}`);
  assertAllowedBranch(branch, args.allowBranches);

  runAndRequire('npm run lint', 'npm', ['run', 'lint']);
  runAndRequire('npm run build', 'npm', ['run', 'build']);

  await confirmBaseline(args.yes);

  const aliasArgs = [
    'alias',
    'set',
    target,
    'dev.snapcase.ai',
    '--scope',
    args.scope,
  ];

  if (args.dryRun) {
    console.log('\nDry run: skipping alias set. Command would be:');
    console.log(`vercel ${aliasArgs.join(' ')}`);
  } else {
    runAndRequire('vercel alias set', 'vercel', aliasArgs);
    // Auto-update PROGRESS.md after successful alias change
    try {
      updateProgressMd(target, currentTarget);
    } catch (error) {
      console.warn(`\nWarning: Failed to auto-update PROGRESS.md: ${error.message}`);
      console.warn('Please manually update PROGRESS.md with the new alias state.');
    }
  }

  console.log('\nAlias recap:');
  console.log(`- Target: ${target}`);
  console.log(`- Rollback: ${rollback}`);
  console.log(`- Lint/build: run in-script`);
  console.log(`- Mode: ${args.dryRun ? 'dry-run (alias not changed)' : 'alias applied'}`);
}

main().catch((error) => {
  console.error(`\nError: ${error.message || error}`);
  process.exit(1);
});
