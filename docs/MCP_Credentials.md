# MCP Credential Management

This reference explains where MCP-connected services obtain their credentials, how to rotate them, and how coding agents should use the servers in day-to-day work.

## Environment Variables

| Service | Variable | Description | Source |
| --- | --- | --- | --- |
| GitHub | `GITHUB_PAT` | Personal access token for MCP tooling and automation. | Generated 2025-10-23 with scopes `repo`, `read:org`. |
| Vercel | `VERCEL_TOKEN` | Personal access token for Vercel API access. | Generated 2025-10-22 from the Vercel Tokens page. |
| Stripe (sandbox) | `STRIPE_SECRET_KEY` | Test-mode secret key for MCP and CLI automation. | `sk_test_51SLCJyIgkqWZOXtbjwR41wTFaavXftqXZKPTUWU2nEqN7YKCayTHM8HjmlF24unhbE5fYQGHLklpRm1h6eBTWzwO00Tlwh19NB` |
| Stripe (sandbox) | `STRIPE_PUBLISHABLE_KEY` | Test-mode publishable key for client simulations. | `pk_test_51SLCJyIgkqWZOXtbx6FLJOZDswTcZfeVFS9AeghvDVBLRq4RTUW1mTZxSV1Dez4wfHqNEmb9MEs934DEszvl6H1h001bfivm7F` |
| Printful EDM | `PRINTFUL_TOKEN` / `PRINTFUL_TOKEN_DEV_CURRENT` (Snapcase-Dev-110325-1) | Embedded Designer dev token (`product_templates/write` scope) generated 2025-11-03; owner: Ethan Trifari; rotate on 90-day cadence (next due 2026-02-01). Whitelisted origins: `http://localhost:3000`, `http://127.0.0.1:3000`, `https://dev.snapcase.ai`, `https://app.snapcase.ai`, `https://www.snapcase.ai`, plus legacy previews (`https://snapcase-app-etrifari-2157-ethan-trifaris-projects.vercel.app`, `https://snapcase-finspe7kn-ethan-trifaris-projects.vercel.app`) while the alias is validated. | `WkRNnXbuDv9qVGRSV73svPYyMCF4K4i97Ksn6aIp` stored in local `.env.local` and mirrored in Vercel Preview/Production env vars (`PRINTFUL_TOKEN`, `PRINTFUL_TOKEN_DEV_CURRENT`). *(Snapcase-Dev-103125-1 retired 2025-11-03.)* |
| Segment (preview) | `SEGMENT_WRITE_KEY` | Connections workspace → Source **snapcase-web-dev**. Use the write key shown in the Segment UI; keep it out of git and copy it into `.env.local` + Vercel Preview env vars when preview analytics are needed. |
| Segment (preview) | `NEXT_PUBLIC_SEGMENT_WRITE_KEY` | Same write key as above, exposed to the browser. Store it only in local `.env.local` and Vercel Preview; do not commit the plaintext here. |
| Segment (preview) | `NEXT_PUBLIC_ANALYTICS_TEMPLATE_SALT` | Preview hashing salt minted 2025-11-06 (alias `snapcase-preview-salt-2025-11-06`). Value lives alongside the Segment write key in Ethan's secrets vault; mirror into `.env.local` / Vercel Preview and rotate quarterly. |
| Segment (production) | `SEGMENT_WRITE_KEY` | Connections workspace → Source **snapcase-web-prod**. Live write key stored in Segment + 1Password vault; add to `.env.production` and Vercel Production only. |
| Segment (production) | `NEXT_PUBLIC_SEGMENT_WRITE_KEY` | Same write key as above for the browser snippet; restrict to Vercel Production + local `.env.live` when running staging smoke tests. |
| Segment (production) | `NEXT_PUBLIC_ANALYTICS_TEMPLATE_SALT` | Production hashing salt minted 2025-11-06 (alias `snapcase-prod-salt-2025-11-06`). Store next to the prod write key; rotate quarterly and update docs + Vercel. |

These variables are defined at the Windows user level via `setx`, so newly opened shells inherit them automatically. Re-open existing terminals after updates.

## Segment Environment Promotion Runbook (Sprint02-Task21)

This sprint’s deliverable was documenting how to mirror the vetted Segment credentials/salts into Vercel Preview and Production without ever committing secrets. Use this runbook whenever keys rotate or a new environment spins up.

### 1. Source of Truth
- **Preview (`snapcase-web-dev`)** values live in the Segment UI (Connections → Sources → *snapcase-web-dev* → **Write Key**) and the 1Password item `Snapcase · Segment Preview`. The preview hashing salt (`snapcase-preview-salt-2025-11-06`) is stored in the same vault entry.
- **Production (`snapcase-web-prod`)** values come from Segment Connections → *snapcase-web-prod* and the 1Password item `Snapcase · Segment Prod`. The production salt (`snapcase-prod-salt-2025-11-06`) is adjacent to the prod write key in that vault.
- Local `.env.local`, `.env.preview`, and `.env.production` files may temporarily hold these variables for parity, but they must stay untracked (`git status` should never show them).

### 2. Promotion Steps (Vercel CLI)
1. **Sync local files:** `vercel env pull .env.preview` and `vercel env pull .env.production` create/update redacted snapshots so you can diff values without copying secrets into committed files.
2. **Preview scope (safe mode):**
   ```bash
   vercel env add SEGMENT_WRITE_KEY preview
   vercel env add NEXT_PUBLIC_SEGMENT_WRITE_KEY preview
   vercel env add NEXT_PUBLIC_ANALYTICS_TEMPLATE_SALT preview
   vercel env add NEXT_PUBLIC_ANALYTICS_SINK preview # set to "segment"
   vercel env add NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE preview # set to "1"
   vercel env add NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY preview # set to "1" to keep traffic local
   ```
   `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=1` ensures preview builds keep events in `window.__snapcaseSegmentPreview` while still exercising hashing/sanitizing logic.
3. **Production scope (live mode):** repeat the commands above but target `production`, using the prod keys + salt. Omit `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY` (or set it to `0`) so the Segment snippet actually calls `api.segment.io` once the prod deployment rolls out.
4. **Confirm:** `vercel env ls` should show both scopes populated. Run `vercel env diff preview` / `production` to verify there are no stale values after rotations.

### 3. Verification & Evidence Requirements
- **Redeploy + smoke test:** kick a preview deployment (`vercel deploy --prebuilt` or push to the feature branch), load `/design?forceEdm=1` and `/thank-you`, and confirm DevTools shows sanitized analytics events flowing according to the chosen mode (`window.__snapcaseSegmentPreview` for preview, `api.segment.io/v1/track` network requests for production).
- **Segment debugger screenshot:** capture the debugger (one screenshot per environment) showing `design_loaded` and `thank_you_viewed` landing with hashed `templateFingerprint`. Store the image in `Images/diagnostics/` and reference it in the relevant Agent Report.
- **Runbook checkpoint:** Update `docs/Printful_EDM_KeyFacts.md` and this file whenever salts rotate or Segment adds new required env vars. Each update should mention where the secret lives (vault + Segment UI) instead of pasting the value.
- **Rollback plan:** If live telemetry needs to pause, set `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=1` in both `preview` and `production` scopes, redeploy, and confirm the debugger no longer receives events before re-enabling.

## MCP Configuration

- `C:\Users\ethtr\.cursor\mcp.json` references the GitHub PAT through `$env:GITHUB_PAT`.
- Cursor connects to hosted MCP endpoints for Vercel (`https://mcp.vercel.com`) and Stripe (`https://mcp.stripe.com`) and handles OAuth/token exchange automatically.
- CLI agents can reuse the same credentials by exporting them in the current session and launching the servers directly with `npx @modelcontextprotocol/server-github`, `npx vercel-mcp`, or `npx @stripe/mcp --tools=all`.

## Usage Guidelines

1. **Inside Cursor**
   - Check the Tools panel before each session; all MCP entries should be green. Toggle any red server off/on to re-authenticate.
   - In a chat, clearly state the task (for example, "Use the Vercel MCP to list my projects"). Provide project IDs, deployment IDs, or Stripe customer IDs when relevant.
   - Log out and regenerate tokens if Cursor prompts for OAuth or reports unauthorized errors.
2. **From CLI agents**
   - Ensure the environment variables above are present (`echo $env:GITHUB_PAT`, etc.). If a value is empty, re-run the relevant `setx` command or export it for the session.
   - Run `node scripts/verify-mcp.js` to confirm all three servers respond. The script enumerates tool counts so you can catch authentication issues quickly.
   - For custom automation, adapt `scripts/verify-mcp.js` to call `client.callTool()` with the desired MCP tool and arguments.
3. **When MCP tools add value**
   - Use **GitHub MCP** for repository automation (branch checks, file edits) when you need API access without wiring GitHub REST calls.
   - Use **Vercel MCP** to inspect deployments, environment variables, or domains directly from the agent workflow.
   - Use **Stripe MCP** for sandbox customer/product setup or validation during payment-flow development.

## Rotation and Production Cutover

- **GitHub:** Visit GitHub → Settings → Developer settings → Personal access tokens to regenerate. Update `GITHUB_PAT`, restart Cursor, and reopen terminal sessions.
- **Vercel:** Regenerate tokens under Vercel → Settings → Tokens. Replace `VERCEL_TOKEN` and reload the MCP server.
- **Stripe:** We currently use sandbox keys. Before switching to live data, create new `sk_live_*` and `pk_live_*` keys under Stripe → Developers → API keys, update environment variables, and re-authenticate the MCP server.

## Risks and Follow-ups

- Live Stripe keys must never be committed or shared in plaintext. Move them to a secrets manager (1Password, Bitwarden, Azure Key Vault, etc.) when production access is required.
- Track token expirations (GitHub PAT expires after 90 days by default) to avoid sudden MCP outages.
- Consider extending CI to run `npm run verify:mcp` with masked secrets to catch authentication problems early.
