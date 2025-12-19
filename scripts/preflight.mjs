import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const allowedFlags = new Set(["--allow-main", "--full"]);
const unknownFlags = args.filter((arg) => !allowedFlags.has(arg));

if (unknownFlags.length > 0) {
  console.error(`Unknown flag(s): ${unknownFlags.join(", ")}`);
  console.error("Usage: node scripts/preflight.mjs [--allow-main] [--full]");
  process.exit(1);
}

const allowMain = args.includes("--allow-main");
const runFull = args.includes("--full");

const results = [];
const nextSteps = new Set();

function run(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, { encoding: "utf8", ...options });
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? "").toString(),
    stderr: (result.stderr ?? "").toString(),
  };
}

function addResult(name, status, detail, steps = []) {
  results.push({ name, status, detail });
  if (status === "FAIL") {
    steps.forEach((step) => nextSteps.add(step));
  }
}

function parseWorktrees(output) {
  const worktrees = [];
  let current = null;
  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    if (line.startsWith("worktree ")) {
      if (current) {
        worktrees.push(current);
      }
      current = { path: line.slice("worktree ".length).trim() };
      continue;
    }
    if (line.startsWith("branch ") && current) {
      current.branch = line.slice("branch ".length).trim();
    }
  }
  if (current) {
    worktrees.push(current);
  }
  return worktrees;
}

function resolveGitPath(worktreePath, gitPath) {
  const result = run("git", ["-C", worktreePath, "rev-parse", "--git-path", gitPath]);
  if (!result.ok) {
    return null;
  }
  const value = result.stdout.trim();
  if (!value) {
    return null;
  }
  return path.isAbsolute(value) ? value : path.join(worktreePath, value);
}

const worktreeResult = run("git", ["worktree", "list", "--porcelain"]);
let worktrees = [];

if (!worktreeResult.ok) {
  const detail = worktreeResult.stderr.trim() || "git worktree list failed.";
  const steps = ["Fix the git worktree list failure and rerun preflight."];
  addResult("Worktree count", "FAIL", `Unable to evaluate (${detail})`, steps);
  addResult("OneDrive paths", "FAIL", "Unable to evaluate (worktree list failed).", steps);
  addResult("Clean worktrees", "FAIL", "Unable to evaluate (worktree list failed).", steps);
  addResult(
    "In-progress git operations",
    "FAIL",
    "Unable to evaluate (worktree list failed).",
    steps
  );
} else {
  worktrees = parseWorktrees(worktreeResult.stdout);

  const countOk = worktrees.length <= 3;
  addResult(
    "Worktree count",
    countOk ? "PASS" : "FAIL",
    `found ${worktrees.length} (max 3)`,
    countOk ? [] : ["Remove extra worktrees with `git worktree remove` or `git worktree prune`."]
  );

  const oneDriveWorktrees = worktrees.filter((worktree) =>
    worktree.path.toLowerCase().includes("onedrive")
  );
  addResult(
    "OneDrive paths",
    oneDriveWorktrees.length === 0 ? "PASS" : "FAIL",
    oneDriveWorktrees.length === 0
      ? "none detected"
      : `move these worktrees: ${oneDriveWorktrees.map((wt) => wt.path).join(", ")}`,
    oneDriveWorktrees.length === 0
      ? []
      : ["Move worktrees out of OneDrive (e.g., under `C:\\Repos`)."]
  );

  const dirtyWorktrees = [];
  for (const worktree of worktrees) {
    const statusResult = run("git", ["-C", worktree.path, "status", "--porcelain"]);
    if (!statusResult.ok) {
      dirtyWorktrees.push(`${worktree.path} (status failed)`);
      continue;
    }
    const trimmed = statusResult.stdout.trim();
    if (trimmed) {
      const count = trimmed.split(/\r?\n/).length;
      dirtyWorktrees.push(`${worktree.path} (${count} change${count === 1 ? "" : "s"})`);
    }
  }
  addResult(
    "Clean worktrees",
    dirtyWorktrees.length === 0 ? "PASS" : "FAIL",
    dirtyWorktrees.length === 0
      ? "all clean"
      : `dirty worktrees: ${dirtyWorktrees.join(", ")}`,
    dirtyWorktrees.length === 0
      ? []
      : ["Commit, stash, or clean the worktree(s) listed above."]
  );

  const inProgressWorktrees = [];
  const inProgressMarkers = [
    { gitPath: "rebase-apply", label: "rebase" },
    { gitPath: "rebase-merge", label: "rebase" },
    { gitPath: "MERGE_HEAD", label: "merge" },
    { gitPath: "CHERRY_PICK_HEAD", label: "cherry-pick" },
    { gitPath: "REVERT_HEAD", label: "revert" },
  ];
  for (const worktree of worktrees) {
    const states = new Set();
    for (const marker of inProgressMarkers) {
      const resolved = resolveGitPath(worktree.path, marker.gitPath);
      if (resolved && existsSync(resolved)) {
        states.add(marker.label);
      }
    }
    if (states.size > 0) {
      inProgressWorktrees.push(`${worktree.path} (${Array.from(states).join(", ")})`);
    }
  }
  addResult(
    "In-progress git operations",
    inProgressWorktrees.length === 0 ? "PASS" : "FAIL",
    inProgressWorktrees.length === 0
      ? "none detected"
      : `finish or abort: ${inProgressWorktrees.join(", ")}`,
    inProgressWorktrees.length === 0
      ? []
      : ["Finish or abort the in-progress git operation(s) before continuing."]
  );
}

const branchResult = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
if (!branchResult.ok) {
  addResult(
    "Current branch",
    "FAIL",
    branchResult.stderr.trim() || "Unable to resolve current branch.",
    ["Checkout a task branch (`task/SprintNN-TaskXX-<slug>`) and rerun preflight."]
  );
} else {
  const branch = branchResult.stdout.trim();
  const taskBranchPattern = /^task\/Sprint\d{2}-Task\d{2,}-/;
  if (branch === "HEAD") {
    addResult(
      "Current branch",
      "FAIL",
      "detached HEAD state",
      ["Checkout a task branch (`task/SprintNN-TaskXX-<slug>`) and rerun preflight."]
    );
  } else if (branch === "main") {
    addResult(
      "Current branch",
      allowMain ? "PASS" : "FAIL",
      allowMain ? "main (allowed via --allow-main)" : "main not allowed without --allow-main",
      allowMain
        ? []
        : ["Switch to a task branch or rerun with `--allow-main` for ops work."]
    );
  } else if (taskBranchPattern.test(branch)) {
    addResult("Current branch", "PASS", branch);
  } else {
    addResult(
      "Current branch",
      "FAIL",
      `unexpected branch: ${branch}`,
      ["Switch to `task/SprintNN-TaskXX-<slug>` or rerun from the correct branch."]
    );
  }
}

if (runFull) {
  console.log("Running full checks: npm run lint, npm run build");
  const lintResult = spawnSync("npm", ["run", "lint"], { stdio: "inherit" });
  addResult(
    "Lint",
    lintResult.status === 0 ? "PASS" : "FAIL",
    lintResult.status === 0 ? "npm run lint" : "npm run lint failed",
    lintResult.status === 0 ? [] : ["Fix lint errors and rerun `npm run preflight --full`."]
  );

  const buildResult = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
  addResult(
    "Build",
    buildResult.status === 0 ? "PASS" : "FAIL",
    buildResult.status === 0 ? "npm run build" : "npm run build failed",
    buildResult.status === 0 ? [] : ["Fix build errors and rerun `npm run preflight --full`."]
  );
} else {
  addResult(
    "Full checks",
    "SKIP",
    "use --full to run npm run lint and npm run build"
  );
}

const failed = results.some((result) => result.status === "FAIL");

console.log("Preflight results:");
for (const result of results) {
  const detail = result.detail ? ` - ${result.detail}` : "";
  console.log(`- ${result.name}: ${result.status}${detail}`);
}

if (nextSteps.size > 0) {
  console.log("Next steps:");
  let index = 1;
  for (const step of nextSteps) {
    console.log(`${index}) ${step}`);
    index += 1;
  }
}

console.log(`Overall: ${failed ? "FAIL" : "PASS"}`);
process.exitCode = failed ? 1 : 0;
