# Git MCP Automation Workflow

_Sprint02-Task25 · November 8, 2025_

## 1. Purpose
Agents now rely on `scripts/mcp-branch.mjs` to create the per-task branches mandated in `docs/PROJECT_MANAGEMENT.md` without touching the local branch state. The script shells into the GitHub MCP server via `mcp-client`, applies staged/working-tree/patch changes, commits them with our standardized message, and (optionally) opens a draft pull request.

## 2. Prerequisites
- **Node.js 18+** (WSL users can invoke `"/mnt/c/Program Files/nodejs/node.exe"`).
- **npm/npx** accessible on the PATH so the script can spawn `@modelcontextprotocol/server-github`.
- **Environment variables:** `GITHUB_PAT` (preferred) or `GITHUB_PERSONAL_ACCESS_TOKEN`. These are populated at the Windows user level (see `docs/MCP_Credentials.md`). Export them in WSL shells before running `node`.
- **Clean base branch:** the script clones from `main` (override via `--base feature-branch` if needed).
- **Text-only changes:** GitHub’s MCP `push_files` endpoint cannot delete files or manipulate binary blobs yet. Break deletes/renames into manual clean-up commits.

## 3. CLI Overview
```bash
node scripts/mcp-branch.mjs <TaskID> [summary]
  --source staged|working      # default staged (uses the index)
  --apply patch.diff           # bypass local files by applying a patch in a temp clone
  --slug <slug>                # default is slugified summary
  --message "<custom>"         # default "${TaskID}: <summary> [MCP]"
  --create-pr                  # also call GitHub MCP create_pull_request
  --pr-title/--pr-body/...     # PR metadata (body accepts @path.txt)
  --dry-run                    # print plan without contacting MCP
  --reuse-branch               # skip errors when the branch already exists
```

### File sources
| Mode | When to use | Notes |
| --- | --- | --- |
| `--source staged` | Default. You already staged the exact Task diff. | Reads blobs via `git show :path`, so untracked files must be staged (`git add path`). |
| `--source working` | You want everything currently dirty/untracked in the working tree. | Uses `git diff HEAD` + `git ls-files --others`. Automatically skips duplicates. |
| `--apply patch.diff` | You exported a patch (e.g., from Cursor) and want to avoid touching the local tree. | Script clones `main` into a temp dir, runs `git apply patch.diff`, and then serializes changed files. |

### Outputs
- Always prints the `task/<TaskID>-<slug>` branch name, commit message, and the file list that will be serialized.
- Non-dry runs print a compare URL after `push_files`. Add `--create-pr` to log the PR URL.
- Errors (missing token, rename/delete attempt, GitHub API failures) bubble up with actionable text so the agent can copy/paste into the Agent Report.

## 4. Example Commands
```bash
# Stage-first flow with a dry-run log
git add docs/PROJECT_MANAGEMENT.md scripts/mcp-branch.mjs
node scripts/mcp-branch.mjs Sprint02-Task25 "Git MCP automation" --dry-run --source staged

# Commit staged files + open a draft PR
node scripts/mcp-branch.mjs Sprint02-Task25 "Git MCP automation" --create-pr --pr-draft

# Working-tree sweep (no staging) for a quick hotfix
node scripts/mcp-branch.mjs Sprint02-Task18 "Coupon copy tweak" --source working

# Apply a shared patch and push without touching local git state
node scripts/mcp-branch.mjs Sprint02-Task15 --apply ../patches/task15.diff --summary "Designer copy updates"
```

## 5. Quickstart Checklist (for prompts that say “call scripts/mcp-branch.sh …”)
1. `git status` and stage/unstage until only the current task’s files show as modified.
2. `node scripts/mcp-branch.mjs <TaskID> "<summary>" --dry-run --source staged` and paste the log into the Agent Report (verification evidence).
3. Re-run without `--dry-run` (add `--create-pr` if the branch needs a draft).
4. Copy the printed branch/compare (or PR) URL into `PROGRESS.md` before ending the run.

## 6. Limitations & Follow-ups
- No file deletions/renames yet (GitHub MCP lacks a `delete_file` tool). Use standard git for cleanup or follow up with a manual commit.
- Binary files are not supported—the script reads UTF-8 text. Compress binaries before pushing.
- MCP credentials failures usually stem from an empty `GITHUB_PAT`. Re-run `setx`/`export` per `docs/MCP_Credentials.md`.
- Keep `scripts/mcp-branch.mjs` in sync with MCP server updates (e.g., when GitHub adds delete support, expand the serializer and update this document).
