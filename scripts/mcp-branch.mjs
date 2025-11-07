#!/usr/bin/env node

import { MCPClient } from "mcp-client";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";

const infoPrefix = "[mcp-branch]";

function logInfo(message, extra) {
  if (extra) {
    console.log(`${infoPrefix} ${message}`, extra);
  } else {
    console.log(`${infoPrefix} ${message}`);
  }
}

function logError(message) {
  console.error(`${infoPrefix} ${message}`);
}

function printUsage(exitCode = 0) {
  const helpText = `
Usage:
  node scripts/mcp-branch.mjs <TaskID> [summary]

Options:
  --slug <slug>             Custom branch slug (defaults to sanitized summary or timestamp)
  --summary <text>          Summary used for commit/PR titles (falls back to positional summary)
  --source <mode>           File source: staged | working (default: staged)
  --apply <patch.diff>      Apply a unified diff to a clean clone before pushing
  --owner <owner>           Override repository owner (auto-detected from git remote)
  --repo <repo>             Override repository name (auto-detected from git remote)
  --base <branch>           Base branch name (default: main)
  --message <text>          Commit message override
  --slug-only               Print the generated branch name and exit
  --dry-run                 Skip MCP calls and print the plan
  --reuse-branch            Reuse an existing branch if it already exists
  --create-pr               Create a pull request after pushing
  --pr-title <text>         Override the pull request title
  --pr-body <path|text>     Pull request body (prefix with @ to read from file)
  --pr-draft                Create the pull request as a draft
  --open-link               Print the PR/compare URLs after completion
  --repo-root <path>        Repository root (defaults to current working directory)
  --help                    Show this help

Examples:
  node scripts/mcp-branch.mjs Sprint02-Task25 "Git MCP automation"
  node scripts/mcp-branch.mjs Sprint02-Task15 --apply patch.diff --summary "Design polish" --create-pr
`.trim();
  console.log(helpText);
  process.exit(exitCode);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "updates";
}

function parseArgs(argv) {
  const opts = {
    slug: null,
    summary: null,
    source: "staged",
    applyPath: null,
    owner: null,
    repo: null,
    base: "main",
    message: null,
    dryRun: false,
    reuseBranch: false,
    createPr: false,
    prTitle: null,
    prBody: null,
    prDraft: false,
    openLink: false,
    repoRoot: process.cwd(),
    help: false,
    slugOnly: false,
  };

  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    switch (arg) {
      case "--help":
        opts.help = true;
        break;
      case "--slug":
        opts.slug = argv[++i];
        break;
      case "--summary":
        opts.summary = argv[++i];
        break;
      case "--source":
        opts.source = argv[++i];
        break;
      case "--apply":
        opts.applyPath = argv[++i];
        break;
      case "--owner":
        opts.owner = argv[++i];
        break;
      case "--repo":
        opts.repo = argv[++i];
        break;
      case "--base":
        opts.base = argv[++i];
        break;
      case "--message":
        opts.message = argv[++i];
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--reuse-branch":
        opts.reuseBranch = true;
        break;
      case "--create-pr":
        opts.createPr = true;
        break;
      case "--pr-title":
        opts.prTitle = argv[++i];
        break;
      case "--pr-body":
        opts.prBody = argv[++i];
        break;
      case "--pr-draft":
        opts.prDraft = true;
        break;
      case "--open-link":
        opts.openLink = true;
        break;
      case "--repo-root":
        opts.repoRoot = argv[++i];
        break;
      case "--slug-only":
        opts.slugOnly = true;
        break;
      case "--use-working-tree":
        opts.source = "working";
        break;
      default:
        throw new Error(`Unknown flag: ${arg}`);
    }
  }

  if (opts.help) {
    printUsage(0);
  }

  if (!positional.length) {
    printUsage(1);
  }

  const [taskId, summaryFromPosition] = positional;
  opts.taskId = taskId;
  if (!opts.summary && summaryFromPosition) {
    opts.summary = summaryFromPosition;
  }
  return opts;
}

function runGit(args, options = {}) {
  const { cwd, trim = true, allowEmpty = false } = options;
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }

  if (!result.stdout && allowEmpty) {
    return "";
  }
  return trim ? result.stdout.trim() : result.stdout;
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function parseNameStatus(raw) {
  if (!raw) {
    return [];
  }

  const tokens = raw.split("\0");
  const items = [];
  for (let i = 0; i < tokens.length; ) {
    const status = tokens[i++];
    if (!status) {
      continue;
    }

    if (status.startsWith("R") || status.startsWith("C")) {
      const priorPath = tokens[i++];
      const newPath = tokens[i++];
      items.push({
        status,
        code: status[0],
        path: newPath,
        priorPath,
      });
    } else {
      const filePath = tokens[i++];
      items.push({
        status,
        code: status[0],
        path: filePath,
      });
    }
  }

  return items.filter((entry) => entry.path);
}

async function readStagedFile(repoRoot, filePath) {
  const result = spawnSync("git", ["show", `:${filePath}`], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    const details = result.stderr.trim() || result.stdout.trim();
    throw new Error(`Unable to read staged file ${filePath}: ${details}`);
  }

  return result.stdout;
}

async function collectFromStaged(repoRoot) {
  const diffOutput = runGit(["diff", "--cached", "--name-status", "-z"], {
    cwd: repoRoot,
    trim: false,
    allowEmpty: true,
  });
  const entries = parseNameStatus(diffOutput);

  const files = [];
  for (const entry of entries) {
    if (entry.code === "D") {
      throw new Error(
        `File deletion detected (${entry.path}). The GitHub MCP 'push_files' API cannot delete files yet.`,
      );
    }
    if (entry.code === "R" || entry.code === "C") {
      throw new Error(
        `Rename/copy detected (${entry.priorPath} -> ${entry.path}). Please split the change into delete + add before running this tool.`,
      );
    }
    const content = await readStagedFile(repoRoot, entry.path);
    files.push({
      path: normalizePath(entry.path),
      content,
    });
  }

  return files;
}

async function loadWorkingTreeFiles(repoRoot) {
  const diffOutput = runGit(["diff", "--name-status", "-z", "HEAD"], {
    cwd: repoRoot,
    trim: false,
    allowEmpty: true,
  });
  const trackedEntries = parseNameStatus(diffOutput);
  const untrackedRaw = runGit(
    ["ls-files", "--others", "--exclude-standard", "-z"],
    { cwd: repoRoot, trim: false, allowEmpty: true },
  );
  const untrackedEntries = untrackedRaw
    ? untrackedRaw
        .split("\0")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((filePath) => ({
          code: "A",
          path: filePath,
        }))
    : [];

  const combined = [...trackedEntries, ...untrackedEntries];
  const seen = new Set();
  const files = [];

  for (const entry of combined) {
    if (!entry.path) {
      continue;
    }
    if (entry.code === "D") {
      throw new Error(
        `File deletion detected (${entry.path}). Deleting files is not supported yet.`,
      );
    }
    if (entry.code === "R" || entry.code === "C") {
      throw new Error(
        `Rename/copy detected (${entry.priorPath} -> ${entry.path}). Split the change manually before running.`,
      );
    }
    const normalized = normalizePath(entry.path);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    const content = await fs.readFile(path.join(repoRoot, entry.path), "utf8");
    files.push({
      path: normalized,
      content,
    });
  }

  return files;
}

async function collectFromPatch(repoRoot, patchPath, baseBranch) {
  const absolutePatch = path.isAbsolute(patchPath)
    ? patchPath
    : path.join(repoRoot, patchPath);
  await fs.access(absolutePatch);

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "snapcase-mcp-branch-"),
  );
  const cloneDir = path.join(tmpDir, "repo");
  try {
    runGit(
      [
        "clone",
        "--branch",
        baseBranch,
        "--single-branch",
        "--quiet",
        ".",
        cloneDir,
      ],
      { cwd: repoRoot },
    );
    runGit(["apply", "--allow-empty", absolutePatch], { cwd: cloneDir });
    return loadWorkingTreeFiles(cloneDir);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function gatherFiles(options) {
  if (options.applyPath) {
    logInfo("Collecting files from patch", options.applyPath);
    return collectFromPatch(options.repoRoot, options.applyPath, options.base);
  }
  if (options.source === "working") {
    logInfo("Collecting files from working tree");
    return loadWorkingTreeFiles(options.repoRoot);
  }
  logInfo("Collecting files from staged index");
  return collectFromStaged(options.repoRoot);
}

function detectRepoInfo(repoRoot, ownerOverride, repoOverride) {
  if (ownerOverride && repoOverride) {
    return { owner: ownerOverride, repo: repoOverride };
  }

  const remote = runGit(["config", "--get", "remote.origin.url"], {
    cwd: repoRoot,
  });

  let owner = ownerOverride;
  let repo = repoOverride;

  if (remote.startsWith("git@")) {
    const match = remote.match(/:(.+?)\/(.+?)(\.git)?$/);
    if (match) {
      owner = owner || match[1];
      repo = repo || match[2];
    }
  } else if (remote.startsWith("https://") || remote.startsWith("http://")) {
    const parts = remote.split("/");
    owner = owner || parts[parts.length - 2];
    const repoPart = parts[parts.length - 1];
    repo = repo || repoPart.replace(/\.git$/, "");
  }

  if (!owner || !repo) {
    throw new Error(
      "Unable to determine repository owner/name. Please pass --owner and --repo.",
    );
  }

  return { owner, repo };
}

async function loadPrBody(prBodyOption, repoRoot) {
  if (!prBodyOption) {
    return null;
  }
  if (prBodyOption.startsWith("@")) {
    const filePath = prBodyOption.slice(1);
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(repoRoot, filePath);
    return fs.readFile(absolutePath, "utf8");
  }
  return prBodyOption;
}

async function connectGitHub(token) {
  const client = new MCPClient({
    name: "SnapCase Git Automation",
    version: "1.0.0",
  });

  await client.connect({
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      ...process.env,
      GITHUB_PERSONAL_ACCESS_TOKEN: token,
    },
  });
  return client;
}

async function callTool(client, name, args) {
  const response = await client.callTool({ name, arguments: args });
  const textEntry = response?.content?.find((item) => item.type === "text");
  if (!textEntry) {
    return null;
  }
  try {
    return JSON.parse(textEntry.text);
  } catch {
    return textEntry.text;
  }
}

function ensureToken() {
  const token =
    process.env.GITHUB_PAT || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Missing GITHUB_PAT. Export it in your shell or set GITHUB_PERSONAL_ACCESS_TOKEN.",
    );
  }
  return token;
}

function buildCommitMessage(taskId, summary, providedMessage) {
  if (providedMessage) {
    return providedMessage;
  }
  const trimmedSummary = (summary || "Updates").trim();
  return `${taskId}: ${trimmedSummary} [MCP]`;
}

function buildBranchName(taskId, slug) {
  return `task/${taskId}-${slug}`;
}

function buildCompareUrl(owner, repo, base, branch) {
  return `https://github.com/${owner}/${repo}/compare/${encodeURIComponent(
    base,
  )}...${encodeURIComponent(branch)}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allowedSources = new Set(["staged", "working"]);
  if (args.source && !allowedSources.has(args.source)) {
    throw new Error(
      `Unknown --source option "${args.source}". Use "staged" or "working".`,
    );
  }
  const repoRoot = path.resolve(
    runGit(["rev-parse", "--show-toplevel"], { cwd: args.repoRoot }),
  );
  const { owner, repo } = detectRepoInfo(repoRoot, args.owner, args.repo);
  const summaryText = args.summary || "Task updates";
  const slugCandidate = args.slug || slugify(summaryText);
  const branchSlug = slugCandidate || slugify("updates");
  const branchName = buildBranchName(args.taskId, branchSlug);

  if (args.slugOnly) {
    console.log(branchName);
    process.exit(0);
  }

  const files = await gatherFiles({
    source: args.applyPath ? "patch" : args.source,
    repoRoot,
    applyPath: args.applyPath,
    base: args.base,
  });

  if (!files.length) {
    throw new Error("No files detected. Stage or modify files before running.");
  }

  const commitMessage = buildCommitMessage(
    args.taskId,
    summaryText,
    args.message,
  );

  logInfo("Branch", branchName);
  logInfo("Commit message", commitMessage);
  logInfo("Files to push", files.map((file) => file.path));

  const compareUrl = buildCompareUrl(owner, repo, args.base, branchName);

  if (args.dryRun) {
    logInfo("Dry run: skipping MCP branch/push steps");
    if (args.openLink) {
      logInfo("Compare URL", compareUrl);
    }
    return;
  }

  const token = ensureToken();
  const client = await connectGitHub(token);

  try {
    try {
      await callTool(client, "create_branch", {
        owner,
        repo,
        branch: branchName,
        from_branch: args.base,
      });
      logInfo("Created branch via MCP", branchName);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error || "");
      if (
        args.reuseBranch &&
        message.toLowerCase().includes("already exists")
      ) {
        logInfo("Branch already exists; reusing as requested");
      } else {
        throw error;
      }
    }

    const pushResult = await callTool(client, "push_files", {
      owner,
      repo,
      branch: branchName,
      files,
      message: commitMessage,
    });
    logInfo("Push complete", pushResult?.object?.sha || "");
    logInfo("Compare URL", compareUrl);

    if (args.createPr) {
      const prTitle =
        args.prTitle || `${args.taskId}: ${summaryText.trim()} (MCP)`;
      const prBody =
        (await loadPrBody(args.prBody, repoRoot)) ||
        [
          `## Summary`,
          `- ${summaryText.trim()}`,
          "",
          `Generated via \`scripts/mcp-branch.mjs\`.`,
        ].join("\n");

      const prResponse = await callTool(client, "create_pull_request", {
        owner,
        repo,
        title: prTitle,
        body: prBody,
        head: branchName,
        base: args.base,
        draft: args.prDraft,
      });

      logInfo("Pull request created", prResponse?.html_url || "");
      if (args.openLink && prResponse?.html_url) {
        logInfo("PR URL", prResponse.html_url);
      }
    } else if (args.openLink) {
      logInfo("Compare URL", compareUrl);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(message);
  process.exit(1);
});
